const { Professional, Service, Availability, Customer, Appointment, sequelize } = require('../models');
const { format, addDays, subDays } = require('date-fns');

async function seed() {
  const profCount = await Professional.count();
  if (profCount > 0) return; // já populado

  console.log('🌱 Populando dados do salão...');

  // ── PROFISSIONAIS ─────────────────────────────────
  const ana = await Professional.create({
    name: 'Ana Paula', role: 'Cabeleireira', avatarEmoji: '💇‍♀️',
  });
  const carlos = await Professional.create({
    name: 'Carlos Silva', role: 'Barbeiro', avatarEmoji: '💈',
  });
  const julia = await Professional.create({
    name: 'Julia Matos', role: 'Manicure/Pedicure', avatarEmoji: '💅',
  });

  // ── DISPONIBILIDADES (seg-sex 9h-19h, sab 9h-17h) ──
  const weekdays = [1, 2, 3, 4, 5]; // Seg-Sex
  for (const prof of [ana, carlos]) {
    for (const day of weekdays) {
      await Availability.create({ professionalId: prof.id, dayOfWeek: day, startTime: '09:00', endTime: '19:00' });
    }
    await Availability.create({ professionalId: prof.id, dayOfWeek: 6, startTime: '09:00', endTime: '17:00' });
  }
  for (const day of [1, 2, 3, 4, 5, 6]) {
    await Availability.create({ professionalId: julia.id, dayOfWeek: day, startTime: '09:00', endTime: '18:00' });
  }

  // ── SERVIÇOS ─────────────────────────────────────
  const corte = await Service.create({ name: 'Corte de Cabelo', description: 'Inclui lavagem e finalização', durationMinutes: 45, price: 65.00, emoji: '✂️' });
  const escova = await Service.create({ name: 'Escova Progressiva', description: 'Alisamento duradouro com BTX', durationMinutes: 180, price: 280.00, emoji: '✨' });
  const coloracao = await Service.create({ name: 'Coloração', description: 'Tintura completa com hidratação', durationMinutes: 120, price: 180.00, emoji: '🎨' });
  const hidratacao = await Service.create({ name: 'Hidratação', description: 'Tratamento intensivo para os fios', durationMinutes: 60, price: 80.00, emoji: '💧' });
  const barbearia = await Service.create({ name: 'Corte + Barba', description: 'Corte masculino com modelagem de barba', durationMinutes: 60, price: 75.00, emoji: '💈' });
  const manicure = await Service.create({ name: 'Manicure', description: 'Cutilagem completa com esmaltação', durationMinutes: 45, price: 45.00, emoji: '💅' });
  const pedicure = await Service.create({ name: 'Pedicure', description: 'Cutilagem de pés com esmaltação', durationMinutes: 60, price: 55.00, emoji: '🦶' });
  const combo = await Service.create({ name: 'Mani + Pedi', description: 'Manicure e pedicure juntos', durationMinutes: 100, price: 90.00, emoji: '💅' });

  // ── CLIENTES ─────────────────────────────────────
  const customers = await Promise.all([
    Customer.create({ phone: '11991112233', name: 'Fernanda Lima', totalAppointments: 8, lastVisit: subDays(new Date(), 14) }),
    Customer.create({ phone: '11992223344', name: 'Rodrigo Pereira', totalAppointments: 5, lastVisit: subDays(new Date(), 7) }),
    Customer.create({ phone: '11993334455', name: 'Mariana Souza', totalAppointments: 12, lastVisit: subDays(new Date(), 3) }),
    Customer.create({ phone: '11994445566', name: 'Lucas Oliveira', totalAppointments: 3, lastVisit: subDays(new Date(), 21) }),
    Customer.create({ phone: '11995556677', name: 'Beatriz Santos', totalAppointments: 6, lastVisit: subDays(new Date(), 10) }),
    Customer.create({ phone: '11996667788', name: 'Thiago Alves', totalAppointments: 9, lastVisit: subDays(new Date(), 5) }),
    Customer.create({ phone: '11997778899', name: 'Camila Rocha', totalAppointments: 4, lastVisit: subDays(new Date(), 18) }),
    Customer.create({ phone: '11998889900', name: 'Rafael Costa', totalAppointments: 7, lastVisit: subDays(new Date(), 8) }),
  ]);

  // ── AGENDAMENTOS ─────────────────────────────────
  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const lastWeek = format(subDays(new Date(), 7), 'yyyy-MM-dd');
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const in2days = format(addDays(new Date(), 2), 'yyyy-MM-dd');
  const in3days = format(addDays(new Date(), 3), 'yyyy-MM-dd');
  const in5days = format(addDays(new Date(), 5), 'yyyy-MM-dd');

  const appts = [
    // Concluídos (passado)
    [customers[0], ana, corte, lastWeek, '09:00', '09:45', 'completed', 'whatsapp'],
    [customers[2], ana, coloracao, lastWeek, '10:00', '12:00', 'completed', 'whatsapp'],
    [customers[1], carlos, barbearia, lastWeek, '14:00', '15:00', 'completed', 'whatsapp'],
    [customers[4], julia, combo, lastWeek, '11:00', '12:40', 'completed', 'whatsapp'],
    [customers[5], carlos, barbearia, yesterday, '09:00', '10:00', 'completed', 'whatsapp'],
    [customers[2], ana, hidratacao, yesterday, '14:00', '15:00', 'completed', 'panel'],
    [customers[6], julia, manicure, yesterday, '10:00', '10:45', 'completed', 'whatsapp'],

    // Hoje
    [customers[0], ana, escova, today, '09:00', '12:00', 'confirmed', 'whatsapp'],
    [customers[3], carlos, barbearia, today, '10:00', '11:00', 'scheduled', 'whatsapp'],
    [customers[4], julia, pedicure, today, '11:00', '12:00', 'scheduled', 'whatsapp'],
    [customers[7], ana, corte, today, '14:00', '14:45', 'scheduled', 'panel'],
    [customers[1], carlos, barbearia, today, '15:00', '16:00', 'confirmed', 'whatsapp'],

    // Futuros
    [customers[2], ana, coloracao, tomorrow, '09:00', '11:00', 'scheduled', 'whatsapp'],
    [customers[5], carlos, barbearia, tomorrow, '14:00', '15:00', 'scheduled', 'whatsapp'],
    [customers[6], julia, combo, tomorrow, '10:00', '11:40', 'scheduled', 'whatsapp'],
    [customers[0], ana, hidratacao, in2days, '09:00', '10:00', 'scheduled', 'whatsapp'],
    [customers[7], julia, manicure, in2days, '11:00', '11:45', 'scheduled', 'whatsapp'],
    [customers[3], carlos, barbearia, in3days, '09:00', '10:00', 'scheduled', 'whatsapp'],
    [customers[4], ana, escova, in5days, '09:00', '12:00', 'scheduled', 'whatsapp'],
    [customers[2], julia, pedicure, in5days, '13:00', '14:00', 'scheduled', 'panel'],
  ];

  for (const [cust, prof, svc, date, start, end, status, via] of appts) {
    await Appointment.create({
      customerId: cust.id,
      professionalId: prof.id,
      serviceId: svc.id,
      date,
      startTime: start,
      endTime: end,
      status,
      bookedVia: via,
    });
  }

  console.log(`✅ Seed concluído!`);
  console.log(`   👤 ${customers.length} clientes`);
  console.log(`   💇 ${appts.length} agendamentos (passados + hoje + futuros)`);
}

module.exports = { seed };
