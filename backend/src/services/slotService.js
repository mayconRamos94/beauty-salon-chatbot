const { Appointment, Availability } = require('../models');
const { Op } = require('sequelize');
const { format, addMinutes, parse, isAfter, addDays, startOfDay } = require('date-fns');
const { ptBR } = require('date-fns/locale');

/**
 * Retorna os próximos 5 dias com disponibilidade para um profissional
 */
async function getAvailableDates(professionalId, daysAhead = 14) {
  const availabilities = await Availability.findAll({ where: { professionalId } });
  if (!availabilities.length) return [];

  const workingDays = new Set(availabilities.map(a => a.dayOfWeek));
  const dates = [];
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  cursor = addDays(cursor, 1); // começa amanhã

  let checked = 0;
  while (dates.length < 7 && checked < daysAhead) {
    const dow = cursor.getDay();
    if (workingDays.has(dow)) {
      dates.push({
        date: format(cursor, 'yyyy-MM-dd'),
        label: format(cursor, "EEEE, dd/MM", { locale: ptBR }),
        dayOfWeek: dow,
      });
    }
    cursor = addDays(cursor, 1);
    checked++;
  }

  return dates;
}

/**
 * Retorna os horários disponíveis para um profissional em uma data
 */
async function getAvailableSlots(professionalId, date, durationMinutes) {
  const dayOfWeek = new Date(date + 'T12:00:00').getDay();

  // Busca disponibilidades do dia
  const availabilities = await Availability.findAll({
    where: { professionalId, dayOfWeek },
  });
  if (!availabilities.length) return [];

  // Busca agendamentos existentes no dia
  const existing = await Appointment.findAll({
    where: {
      professionalId,
      date,
      status: { [Op.notIn]: ['cancelled', 'no_show'] },
    },
  });

  const slots = [];
  const now = new Date();

  for (const avail of availabilities) {
    let cursor = parse(avail.startTime, 'HH:mm', new Date(date + 'T00:00:00'));
    const blockEnd = parse(avail.endTime, 'HH:mm', new Date(date + 'T00:00:00'));

    while (isAfter(blockEnd, addMinutes(cursor, durationMinutes)) ||
           blockEnd.getTime() === addMinutes(cursor, durationMinutes).getTime()) {

      const slotEnd = addMinutes(cursor, durationMinutes);
      const startStr = format(cursor, 'HH:mm');
      const endStr = format(slotEnd, 'HH:mm');

      // Verifica se slot está no passado (com 1h de antecedência mínima)
      const slotDateTime = new Date(`${date}T${startStr}:00`);
      const isPast = slotDateTime <= addMinutes(now, 60);

      // Verifica conflito com agendamentos existentes
      const isOccupied = existing.some(appt => {
        const apptStart = appt.startTime;
        const apptEnd = appt.endTime;
        return startStr < apptEnd && endStr > apptStart;
      });

      if (!isPast && !isOccupied) {
        slots.push({ startTime: startStr, endTime: endStr });
      }

      cursor = addMinutes(cursor, durationMinutes);
    }
  }

  return slots;
}

/**
 * Verifica conflito antes de salvar agendamento
 */
async function hasConflict(professionalId, date, startTime, endTime, excludeId = null) {
  const where = {
    professionalId,
    date,
    status: { [Op.notIn]: ['cancelled', 'no_show'] },
    startTime: { [Op.lt]: endTime },
    endTime: { [Op.gt]: startTime },
  };
  if (excludeId) where.id = { [Op.ne]: excludeId };

  const count = await Appointment.count({ where });
  return count > 0;
}

/**
 * Formata lista de slots para exibir no WhatsApp
 */
function formatSlotsMessage(slots) {
  if (!slots.length) return null;
  const lines = ['⏰ *Horários disponíveis:*\n'];
  slots.forEach((slot, i) => {
    lines.push(`${i + 1}️⃣ ${slot.startTime}`);
  });
  lines.push('\n_Digite o número do horário desejado_');
  return lines.join('\n');
}

/**
 * Formata lista de datas para exibir no WhatsApp
 */
function formatDatesMessage(dates) {
  if (!dates.length) return null;
  const lines = ['📅 *Datas disponíveis:*\n'];
  dates.forEach((d, i) => {
    lines.push(`${i + 1}️⃣ ${d.label.charAt(0).toUpperCase() + d.label.slice(1)}`);
  });
  lines.push('\n_Digite o número da data desejada_');
  return lines.join('\n');
}

module.exports = { getAvailableDates, getAvailableSlots, hasConflict, formatSlotsMessage, formatDatesMessage };
