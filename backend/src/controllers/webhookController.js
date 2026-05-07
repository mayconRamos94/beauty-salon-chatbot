const { handleMessage } = require('../services/conversationEngine');

/**
 * Recebe eventos da Evolution API.
 * A Evolution API envia um POST para esta rota sempre que
 * uma nova mensagem chega no WhatsApp.
 */
async function webhookHandler(req, res) {
  // Responde 200 imediatamente — Evolution API não espera processamento
  res.status(200).json({ ok: true });

  try {
    const body = req.body;

    // Filtra apenas eventos de mensagem recebida
    if (body.event !== 'messages.upsert') return;

    const message = body.data;
    if (!message) return;

    // Ignora mensagens enviadas pelo próprio bot
    if (message.key?.fromMe) return;

    // Ignora mensagens de grupos
    const remoteJid = message.key?.remoteJid || '';
    if (remoteJid.includes('@g.us')) return;

    // Extrai telefone (remove @s.whatsapp.net)
    const phone = remoteJid.replace('@s.whatsapp.net', '').replace(/\D/g, '');
    if (!phone) return;

    // Extrai texto da mensagem
    const text =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      message.message?.buttonsResponseMessage?.selectedDisplayText ||
      message.message?.listResponseMessage?.title ||
      '';

    if (!text) return;

    // Processa a mensagem de forma assíncrona
    handleMessage(phone, text).catch(err => {
      console.error('[Webhook] Erro ao processar mensagem:', err.message);
    });

  } catch (err) {
    console.error('[Webhook] Erro no handler:', err.message);
  }
}

module.exports = { webhookHandler };
