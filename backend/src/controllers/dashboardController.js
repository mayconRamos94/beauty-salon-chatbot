const { Appointment, Professional, Service, Customer, Conversation } = require('../models');
const { getInstanceStatus } = require('../services/evolutionApi');
const { Op } = require('sequelize');
const { format } = require('date-fns');
const { ptBR } = require('date-fns/locale');

const INCLUDE_ALL = [
  { model: Professional, as: 'professional', attributes: ['id', 'name', 'role', 'avatarEmoji'] },
  { model: Service, as: 'service', attributes: ['id', 'name', 'price', 'durationMinutes', 'emoji'] },
  { model: Customer, as: 'customer', attributes: ['id', 'name', 'phone'] },
];

// GET /api/dashboard
async function getDashboard(req, res) {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');

    const [todayCount, scheduledTotal, totalCustomers, whatsappStatus, todayAppointments] = await Promise.all([
      Appointment.count({ where: { date: today, status: { [Op.ne]: 'cancelled' } } }),
      Appointment.count({ where: { status: ['scheduled', 'confirmed'] } }),
      Customer.count(),
      getInstanceStatus(),
      Appointment.findAll({
        where: { date: today, status: { [Op.ne]: 'cancelled' } },
        include: INCLUDE_ALL,
        order: [['startTime', 'ASC']],
      }),
    ]);

    const viaWhatsapp = await Appointment.count({
      where: { date: today, bookedVia: 'whatsapp', status: { [Op.ne]: 'cancelled' } },
    });

    res.json({
      stats: { todayCount, scheduledTotal, totalCustomers, viaWhatsapp },
      whatsappStatus: whatsappStatus?.state || 'unknown',
      todayAppointments,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/appointments?date=yyyy-MM-dd
async function getAppointments(req, res) {
  try {
    const { date, status, professionalId } = req.query;
    const where = {};
    if (date) where.date = date;
    if (status) where.status = status;
    if (professionalId) where.professionalId = professionalId;

    const appointments = await Appointment.findAll({
      where,
      include: INCLUDE_ALL,
      order: [['date', 'ASC'], ['startTime', 'ASC']],
    });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// PATCH /api/appointments/:id/status
async function updateStatus(req, res) {
  try {
    const appt = await Appointment.findByPk(req.params.id);
    if (!appt) return res.status(404).json({ error: 'Agendamento não encontrado' });
    await appt.update({ status: req.body.status });
    res.json(appt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/professionals
async function getProfessionals(req, res) {
  try {
    const profs = await Professional.findAll({
      where: { active: true },
      include: [{ association: 'availabilities' }],
    });
    res.json(profs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/services
async function getServices(req, res) {
  try {
    const services = await Service.findAll({ where: { active: true } });
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/customers
async function getCustomers(req, res) {
  try {
    const { search } = req.query;
    const where = search
      ? { [Op.or]: [
          { name: { [Op.iLike]: `%${search}%` } },
          { phone: { [Op.like]: `%${search}%` } },
        ]}
      : {};
    const customers = await Customer.findAll({
      where,
      order: [['totalAppointments', 'DESC']],
      limit: 50,
    });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/whatsapp/status
async function getWhatsappStatus(req, res) {
  try {
    const status = await getInstanceStatus();
    res.json(status);
  } catch {
    res.json({ state: 'disconnected' });
  }
}

module.exports = { getDashboard, getAppointments, updateStatus, getProfessionals, getServices, getCustomers, getWhatsappStatus };
