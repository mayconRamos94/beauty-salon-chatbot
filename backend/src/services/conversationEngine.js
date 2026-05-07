const { Conversation, Customer, Professional, Service, Appointment } = require('../models');
const { sendText, sendMenu, sendConfirmation } = require('./evolutionApi');
const { getAvailableDates, getAvailableSlots, hasConflict, formatSlotsMessage, formatDatesMessage } = require('./slotService');
const { shouldUseFlow, answerFreeQuestion, classifyIntent } = require('./aiService');
const { format, addMinutes } = require('date-fns');
const { ptBR } = require('date-fns/locale');

const SALON = {
  name: process.env.SALON_NAME || 'Salão Bella Vista',
  address: process.env.SALON_ADDRESS || 'Rua das Flores, 123 - Centro',
  phone: process.env.SALON_PHONE || '11999998888',
  instagram: process.env.SALON_INSTAGRAM || '@salao',
};

// Expiração da conversa: 30 minutos sem resposta → reset
const CONVERSATION_TTL_MS = 30 * 60 * 1000;

/**
 * Ponto de entrada para cada mensagem recebida do WhatsApp.
 * Recupera ou cria a conversa, carrega o estado atual e roteia para o handler correto.
 */
async function handleMessage(phone, messageText) {
  const text = (messageText || '').trim();
  if (!text) return;

  console.log(`[Chat] ${phone} → "${text}"`);

  // Garante que o cliente existe
  let customer = await Customer.findOne({ where: { phone } });
  if (!customer) {
    customer = await Customer.create({ phone });
  }

  // Recupera ou cria conversa
  let conversation = await Conversation.findOne({ where: { phone } });
  if (!conversation) {
    conversation = await Conversation.create({ phone, state: 'idle', context: {} });
  }

  // Reseta se expirada
  const isExpired = conversation.expiresAt && new Date() > new Date(conversation.expiresAt);
  if (isExpired && conversation.state !== 'idle') {
    await conversation.update({ state: 'idle', context: {} });
  }

  // Atualiza TTL
  await conversation.update({
    lastMessageAt: new Date(),
    expiresAt: new Date(Date.now() + CONVERSATION_TTL_MS),
  });

  // Enriquece SALON com serviços do banco para o contexto da IA
  const services = await Service.findAll({ where: { active: true } });
  const salonWithServices = { ...SALON, services };

  // ── ROTEAMENTO POR ESTADO ────────────────────────
  switch (conversation.state) {
    case 'idle':
      return handleIdle(phone, text, conversation, customer);
    case 'main_menu':
      return handleMainMenu(phone, text, conversation, customer, salonWithServices);
    case 'selecting_service':
      return handleSelectService(phone, text, conversation, services);
    case 'selecting_pro':
      return handleSelectPro(phone, text, conversation);
    case 'selecting_date':
      return handleSelectDate(phone, text, conversation);
    case 'selecting_time':
      return handleSelectTime(phone, text, conversation);
    case 'confirming':
      return handleConfirm(phone, text, conversation, customer);
    case 'cancelling':
      return handleCancelling(phone, text, conversation, customer);
    case 'ai_chat':
      return handleAiChat(phone, text, conversation, salonWithServices);
    default:
      return handleIdle(phone, text, conversation, customer);
  }
}

// ── HANDLERS ─────────────────────────────────────

async function handleIdle(phone, text, conv, customer) {
  const greetings = ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'oii', 'hey'];
  const isGreeting = greetings.some(g => text.toLowerCase().includes(g));

  const name = customer.name ? `, ${customer.name.split(' ')[0]}` : '';
  const greeting = isGreeting
    ? `Olá${name}! 👋 Seja bem-vindo(a) ao *${SALON.name}*!`
    : `Olá${name}! 👋 Não entendi sua mensagem, mas posso te ajudar!`;

  await sendText(phone, greeting);
  await sendMainMenu(phone, conv);
}

async function sendMainMenu(phone, conv) {
  await conv.update({ state: 'main_menu', context: {} });
  await sendMenu(phone, `O que você deseja fazer?`, [
    '✂️ Agendar horário',
    '📋 Meus agendamentos',
    '💰 Serviços e preços',
    '📍 Endereço e horários',
    '💬 Falar com atendente',
  ]);
}

async function handleMainMenu(phone, text, conv, customer, salonWithServices) {
  const opt = parseInt(text);

  // Comandos globais funcionam em qualquer estado
  if (text.toLowerCase().includes('agendar') || opt === 1) {
    return startBookingFlow(phone, conv);
  }
  if (opt === 2 || text.toLowerCase().includes('agendamento')) {
    return showMyAppointments(phone, customer, conv);
  }
  if (opt === 3 || text.toLowerCase().includes('preço') || text.toLowerCase().includes('servic')) {
    return showServices(phone, conv);
  }
  if (opt === 4 || text.toLowerCase().includes('endereço') || text.toLowerCase().includes('horário')) {
    return showAddress(phone, conv);
  }
  if (opt === 5 || text.toLowerCase().includes('atendente')) {
    await sendText(phone, `📞 Certo! Vou te conectar com nosso atendimento.\n\nLigue ou mande mensagem para *${SALON.phone}* ou acesse nosso Instagram *${SALON.instagram}* 😊`);
    await conv.update({ state: 'idle' });
    return;
  }

  // Nenhuma opção reconhecida → IA responde
  if (!shouldUseFlow(text)) {
    const response = await answerFreeQuestion(text, salonWithServices);
    await sendText(phone, response);
    await sendText(phone, '_Digite *menu* a qualquer momento para voltar ao início_ 😊');
    return;
  }

  // Opção inválida
  await sendText(phone, '❓ Não entendi. Por favor, escolha uma das opções:');
  await sendMainMenu(phone, conv);
}

// ── FLUXO DE AGENDAMENTO ─────────────────────────

async function startBookingFlow(phone, conv) {
  const services = await Service.findAll({ where: { active: true }, order: [['name', 'ASC']] });
  if (!services.length) {
    await sendText(phone, '😔 Não há serviços disponíveis no momento. Ligue para ' + SALON.phone);
    return;
  }

  await conv.update({ state: 'selecting_service', context: {} });

  const options = services.map(s => `${s.emoji} ${s.name} — R$ ${Number(s.price).toFixed(2)} (${s.durationMinutes}min)`);
  await sendMenu(phone, '✂️ Qual serviço você deseja?', options);
}

async function handleSelectService(phone, text, conv, services) {
  if (isCancel(text)) return sendMainMenu(phone, conv);

  const idx = parseInt(text) - 1;
  if (isNaN(idx) || idx < 0 || idx >= services.length) {
    await sendText(phone, `❓ Por favor, escolha um número entre 1 e ${services.length}.`);
    return;
  }

  const service = services[idx];

  // Busca profissionais que oferecem este serviço (todos ativos por enquanto)
  const professionals = await Professional.findAll({ where: { active: true } });
  if (!professionals.length) {
    await sendText(phone, '😔 Não há profissionais disponíveis. Ligue para ' + SALON.phone);
    return;
  }

  await conv.update({
    state: 'selecting_pro',
    context: { serviceId: service.id, serviceName: service.name, servicePrice: service.price, serviceDuration: service.durationMinutes },
  });

  const options = professionals.map(p => `${p.avatarEmoji} ${p.name} — ${p.role}`);
  options.push('🔀 Sem preferência (primeiro disponível)');
  await sendMenu(phone, `${service.emoji} *${service.name}* selecionado!\n\nCom qual profissional você prefere?`, options);
}

async function handleSelectPro(phone, text, conv) {
  if (isCancel(text)) return sendMainMenu(phone, conv);

  const professionals = await Professional.findAll({ where: { active: true } });
  const idx = parseInt(text) - 1;
  const noPreference = idx === professionals.length; // última opção = sem preferência

  if (isNaN(idx) || idx < 0 || idx > professionals.length) {
    await sendText(phone, `❓ Escolha um número entre 1 e ${professionals.length + 1}.`);
    return;
  }

  const professional = noPreference ? professionals[0] : professionals[idx];
  const ctx = { ...conv.context, professionalId: professional.id, professionalName: professional.name };
  await conv.update({ state: 'selecting_date', context: ctx });

  // Busca datas disponíveis
  const dates = await getAvailableDates(professional.id);
  if (!dates.length) {
    await sendText(phone, `😔 *${professional.name}* não tem horários disponíveis nas próximas semanas.\n\nDigite *voltar* para escolher outro profissional.`);
    return;
  }

  const msg = formatDatesMessage(dates);
  await conv.update({ context: { ...ctx, availableDates: dates } });
  await sendText(phone, msg);
}

async function handleSelectDate(phone, text, conv) {
  if (isCancel(text)) return sendMainMenu(phone, conv);
  if (text.toLowerCase() === 'voltar') {
    await conv.update({ state: 'selecting_pro', context: { ...conv.context } });
    const professionals = await Professional.findAll({ where: { active: true } });
    const options = professionals.map(p => `${p.avatarEmoji} ${p.name} — ${p.role}`);
    options.push('🔀 Sem preferência');
    return sendMenu(phone, 'Com qual profissional você prefere?', options);
  }

  const dates = conv.context.availableDates || [];
  const idx = parseInt(text) - 1;

  if (isNaN(idx) || idx < 0 || idx >= dates.length) {
    await sendText(phone, `❓ Escolha um número entre 1 e ${dates.length}.`);
    return;
  }

  const selectedDate = dates[idx];
  const slots = await getAvailableSlots(conv.context.professionalId, selectedDate.date, conv.context.serviceDuration);

  if (!slots.length) {
    await sendText(phone, `😔 Sem horários disponíveis em *${selectedDate.label}*. Escolha outra data:`);
    const msg = formatDatesMessage(dates);
    await sendText(phone, msg);
    return;
  }

  const ctx = { ...conv.context, selectedDate: selectedDate.date, selectedDateLabel: selectedDate.label, availableSlots: slots };
  await conv.update({ state: 'selecting_time', context: ctx });

  const msg = formatSlotsMessage(slots);
  await sendText(phone, `📅 *${selectedDate.label.charAt(0).toUpperCase() + selectedDate.label.slice(1)}* selecionado!\n`);
  await sendText(phone, msg);
}

async function handleSelectTime(phone, text, conv) {
  if (isCancel(text)) return sendMainMenu(phone, conv);

  const slots = conv.context.availableSlots || [];
  const idx = parseInt(text) - 1;

  if (isNaN(idx) || idx < 0 || idx >= slots.length) {
    await sendText(phone, `❓ Escolha um número entre 1 e ${slots.length}.`);
    return;
  }

  const slot = slots[idx];
  const ctx = { ...conv.context, startTime: slot.startTime, endTime: slot.endTime };
  await conv.update({ state: 'confirming', context: ctx });

  // Exibe resumo para confirmação
  const dateLabel = ctx.selectedDateLabel?.charAt(0).toUpperCase() + ctx.selectedDateLabel?.slice(1);
  const msg = [
    '📋 *Resumo do agendamento:*\n',
    `✂️ Serviço: *${ctx.serviceName}*`,
    `👤 Profissional: *${ctx.professionalName}*`,
    `📅 Data: *${dateLabel}*`,
    `⏰ Horário: *${slot.startTime}*`,
    `💰 Valor: *R$ ${Number(ctx.servicePrice).toFixed(2)}*`,
    `⏱️ Duração: *${ctx.serviceDuration} minutos*\n`,
    'Confirmar agendamento?\n',
    '1️⃣ Sim, confirmar',
    '2️⃣ Não, cancelar',
  ].join('\n');

  await sendText(phone, msg);
}

async function handleConfirm(phone, text, conv, customer) {
  const opt = parseInt(text);
  const yes = opt === 1 || text.toLowerCase().includes('sim') || text.toLowerCase().includes('confirmar');
  const no = opt === 2 || text.toLowerCase().includes('não') || text.toLowerCase().includes('nao') || text.toLowerCase().includes('cancelar');

  if (!yes && !no) {
    await sendText(phone, 'Digite *1* para confirmar ou *2* para cancelar.');
    return;
  }

  if (no) {
    await sendText(phone, '❌ Agendamento cancelado. Que pena! Qualquer hora que quiser, é só chamar. 😊');
    await conv.update({ state: 'idle', context: {} });
    return;
  }

  // Verifica conflito de última hora
  const conflict = await hasConflict(
    conv.context.professionalId,
    conv.context.selectedDate,
    conv.context.startTime,
    conv.context.endTime
  );

  if (conflict) {
    await sendText(phone, '😔 Que azar! Esse horário acabou de ser reservado. Por favor, escolha outro:');
    const slots = await getAvailableSlots(conv.context.professionalId, conv.context.selectedDate, conv.context.serviceDuration);
    if (!slots.length) {
      await sendText(phone, 'Não há mais horários neste dia. Vamos escolher outra data?');
      await conv.update({ state: 'selecting_date' });
      const dates = await getAvailableDates(conv.context.professionalId);
      await sendText(phone, formatDatesMessage(dates));
      await conv.update({ context: { ...conv.context, availableDates: dates } });
      return;
    }
    await conv.update({ state: 'selecting_time', context: { ...conv.context, availableSlots: slots } });
    await sendText(phone, formatSlotsMessage(slots));
    return;
  }

  // Cria agendamento
  const appointment = await Appointment.create({
    customerId: customer.id,
    professionalId: conv.context.professionalId,
    serviceId: conv.context.serviceId,
    date: conv.context.selectedDate,
    startTime: conv.context.startTime,
    endTime: conv.context.endTime,
    status: 'scheduled',
    bookedVia: 'whatsapp',
  });

  // Atualiza stats do cliente
  await customer.update({
    totalAppointments: (customer.totalAppointments || 0) + 1,
    lastVisit: new Date(),
  });

  // Envia confirmação formatada
  await sendConfirmation(phone, {
    dateFormatted: conv.context.selectedDateLabel?.charAt(0).toUpperCase() + conv.context.selectedDateLabel?.slice(1),
    startTime: conv.context.startTime,
    serviceName: conv.context.serviceName,
    professionalName: conv.context.professionalName,
    price: Number(conv.context.servicePrice).toFixed(2),
    duration: conv.context.serviceDuration,
  });

  await conv.update({ state: 'idle', context: {} });
  console.log(`[Chat] Agendamento criado: ${appointment.id} — ${phone}`);
}

// ── HANDLERS AUXILIARES ───────────────────────────

async function showMyAppointments(phone, customer, conv) {
  const appointments = await Appointment.findAll({
    where: { customerId: customer.id, status: ['scheduled', 'confirmed'] },
    include: [
      { model: Professional, as: 'professional', attributes: ['name'] },
      { model: Service, as: 'service', attributes: ['name'] },
    ],
    order: [['date', 'ASC'], ['startTime', 'ASC']],
    limit: 5,
  });

  if (!appointments.length) {
    await sendText(phone, '📋 Você não tem agendamentos futuros. \n\nDigite *1* para agendar! 😊');
    await sendMainMenu(phone, conv);
    return;
  }

  const lines = ['📋 *Seus próximos agendamentos:*\n'];
  appointments.forEach((a, i) => {
    const dateObj = new Date(a.date + 'T12:00:00');
    const dateStr = format(dateObj, "dd/MM (EEEE)", { locale: ptBR });
    lines.push(`${i + 1}. ${dateStr} às ${a.startTime}`);
    lines.push(`   ${a.service?.name} com ${a.professional?.name}\n`);
  });
  lines.push('_Para cancelar, envie *cancelar*_');

  await sendText(phone, lines.join('\n'));
  await conv.update({ state: 'main_menu' });
}

async function showServices(phone, conv) {
  const services = await Service.findAll({ where: { active: true }, order: [['name', 'ASC']] });
  const lines = [`💰 *Serviços e preços — ${SALON.name}:*\n`];
  services.forEach(s => {
    lines.push(`${s.emoji} *${s.name}*`);
    if (s.description) lines.push(`   ${s.description}`);
    lines.push(`   R$ ${Number(s.price).toFixed(2)} · ${s.durationMinutes} minutos\n`);
  });
  lines.push('_Digite *1* para agendar ou *menu* para voltar_');
  await sendText(phone, lines.join('\n'));
  await conv.update({ state: 'main_menu' });
}

async function showAddress(phone, conv) {
  await sendText(phone, [
    `📍 *${SALON.name}*\n`,
    `📮 Endereço: ${SALON.address}`,
    `📞 Telefone: ${SALON.phone}`,
    `📸 Instagram: ${SALON.instagram}\n`,
    `🕐 *Horários de funcionamento:*`,
    `Segunda a Sexta: 09h às 19h`,
    `Sábado: 09h às 17h`,
    `Domingo: Fechado\n`,
    '_Digite *1* para agendar ou *menu* para voltar_',
  ].join('\n'));
  await conv.update({ state: 'main_menu' });
}

async function handleCancelling(phone, text, conv, customer) {
  await sendText(phone, '😔 Tudo bem! Caso mude de ideia, pode agendar a qualquer hora. Até logo! 👋');
  await conv.update({ state: 'idle', context: {} });
}

async function handleAiChat(phone, text, conv, salonWithServices) {
  if (isCancel(text) || text.toLowerCase() === 'menu') {
    return sendMainMenu(phone, conv);
  }
  const response = await answerFreeQuestion(text, salonWithServices);
  await sendText(phone, response);
  await sendText(phone, '_Digite *menu* para ver as opções_ 😊');
}

// ── UTILS ─────────────────────────────────────────

function isCancel(text) {
  const t = text.toLowerCase();
  return t === 'cancelar' || t === 'cancel' || t === 'sair' || t === 'exit';
}

// Comando global "menu" funciona em qualquer estado
async function checkGlobalCommands(phone, text, conv) {
  const t = text.toLowerCase().trim();
  if (t === 'menu' || t === 'início' || t === 'inicio' || t === 'voltar') {
    await sendMainMenu(phone, conv);
    return true;
  }
  return false;
}

module.exports = { handleMessage };
