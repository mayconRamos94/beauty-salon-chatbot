const axios = require('axios');

const client = axios.create({
  baseURL: process.env.EVOLUTION_API_URL || 'http://localhost:8080',
  headers: {
    'apikey': process.env.EVOLUTION_API_KEY,
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

const INSTANCE = process.env.EVOLUTION_INSTANCE || 'salao-principal';

/**
 * Envia mensagem de texto simples
 */
async function sendText(phone, text) {
  try {
    const { data } = await client.post(`/message/sendText/${INSTANCE}`, {
      number: formatPhone(phone),
      text,
    });
    return data;
  } catch (err) {
    console.error('[EvolutionAPI] Erro ao enviar texto:', err.response?.data || err.message);
    throw err;
  }
}

/**
 * Envia lista de opções (botões de texto numerados)
 * Evolution API gratuita não tem botões interativos,
 * então usamos texto formatado com emojis como "botões visuais"
 */
async function sendMenu(phone, title, options) {
  const lines = [`*${title}*\n`];
  options.forEach((opt, i) => {
    lines.push(`${i + 1}️⃣ ${opt}`);
  });
  lines.push('\n_Digite o número da opção desejada_');
  return sendText(phone, lines.join('\n'));
}

/**
 * Envia confirmação de agendamento formatada
 */
async function sendConfirmation(phone, appointment) {
  const msg = [
    '✅ *Agendamento confirmado!*\n',
    `📅 Data: *${appointment.dateFormatted}*`,
    `⏰ Horário: *${appointment.startTime}*`,
    `✂️ Serviço: *${appointment.serviceName}*`,
    `👤 Profissional: *${appointment.professionalName}*`,
    `💰 Valor: *R$ ${appointment.price}*`,
    `⏱️ Duração: *${appointment.duration} minutos*\n`,
    `📍 ${process.env.SALON_ADDRESS || 'Nosso endereço'}`,
    `\n_Para cancelar, envie *cancelar* a qualquer momento._`,
  ].join('\n');

  return sendText(phone, msg);
}

/**
 * Registra webhook na Evolution API para receber mensagens
 */
async function registerWebhook(webhookUrl) {
  try {
    await client.post(`/webhook/set/${INSTANCE}`, {
      webhook: {
        enabled: true,
        url: `${webhookUrl}/webhook/whatsapp`,
        webhookByEvents: false,
        webhookBase64: false,
        events: ['MESSAGES_UPSERT'],
      },
    });
    console.log('✅ Webhook registrado:', webhookUrl);
  } catch (err) {
    console.warn('[EvolutionAPI] Webhook não registrado (normal em dev):', err.message);
  }
}

/**
 * Verifica status da instância
 */
async function getInstanceStatus() {
  try {
    const { data } = await client.get(`/instance/connectionState/${INSTANCE}`);
    return data;
  } catch {
    return { state: 'disconnected' };
  }
}

/**
 * Formata número para padrão Evolution API
 * Aceita: 11999998888, +5511999998888, 5511999998888
 */
function formatPhone(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('55')) return `${digits}@s.whatsapp.net`;
  return `55${digits}@s.whatsapp.net`;
}

module.exports = { sendText, sendMenu, sendConfirmation, registerWebhook, getInstanceStatus, formatPhone };
