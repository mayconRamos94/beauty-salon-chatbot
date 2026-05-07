const OpenAI = require('openai');

let openai;
try {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
} catch {
  console.warn('[OpenAI] Client não inicializado — verifique OPENAI_API_KEY');
}

// Contexto do salão injetado no system prompt
const buildSystemPrompt = (salonInfo) => `
Você é a assistente virtual do ${salonInfo.name || 'Salão'}, um salão de beleza.
Responda de forma simpática, direta e em português brasileiro informal (tutear).
Use emojis com moderação. Respostas curtas — máximo 3 linhas.

INFORMAÇÕES DO SALÃO:
- Nome: ${salonInfo.name || 'Salão'}
- Endereço: ${salonInfo.address || 'Não informado'}
- Telefone: ${salonInfo.phone || 'Não informado'}
- Instagram: ${salonInfo.instagram || 'Não informado'}

SERVIÇOS E PREÇOS:
${salonInfo.services?.map(s => `- ${s.name}: R$ ${Number(s.price).toFixed(2)} (${s.durationMinutes}min)`).join('\n') || '- Consulte pelo menu'}

REGRAS IMPORTANTES:
- Para AGENDAR, diga ao cliente para digitar "agendar" ou "1" no menu principal
- Para CANCELAR, diga ao cliente para digitar "cancelar"
- NÃO agende, cancele ou consulte horários — apenas o sistema de fluxo faz isso
- Se não souber a resposta, diga que vai verificar e peça para entrar em contato pelo telefone
- Não invente informações que não estão nas instruções acima
`;

/**
 * Decide se a mensagem deve ser tratada pela IA ou pelo fluxo estruturado
 *
 * Palavras-chave que ativam o fluxo estruturado:
 * - Números (1, 2, 3...)
 * - Palavras de comando (agendar, cancelar, menu, voltar, oi, olá, etc.)
 */
function shouldUseFlow(message) {
  const text = message.trim().toLowerCase();

  // Número puro → sempre é seleção de menu
  if (/^\d+$/.test(text)) return true;

  // Comandos conhecidos
  const commands = [
    'oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite',
    'menu', 'início', 'inicio', 'voltar', 'cancelar', 'agendar',
    'agendamentos', 'meus horários', 'meu horario',
    'sim', 'não', 'nao', 'confirmar', 'ok', 'certo',
  ];

  return commands.some(cmd => text.includes(cmd));
}

/**
 * Responde perguntas livres via IA
 */
async function answerFreeQuestion(message, salonInfo) {
  if (!openai) {
    return 'Desculpe, não consegui processar sua mensagem agora. Digite *menu* para ver as opções! 😊';
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',  // rápido e barato — ideal para chatbot
      max_tokens: 150,
      temperature: 0.7,
      messages: [
        { role: 'system', content: buildSystemPrompt(salonInfo) },
        { role: 'user', content: message },
      ],
    });

    return completion.choices[0]?.message?.content || 'Não entendi sua mensagem. Digite *menu* para ver as opções! 😊';

  } catch (err) {
    console.error('[OpenAI] Erro:', err.message);
    return 'Que pergunta interessante! 😊 Para mais informações, ligue para ' +
           (salonInfo.phone || 'nosso telefone') + ' ou digita *menu* pra ver as opções.';
  }
}

/**
 * Classifica a intenção da mensagem quando fora de qualquer fluxo
 */
async function classifyIntent(message) {
  if (!openai) return 'unknown';

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 10,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: `Classifique a mensagem em UMA palavra: "agendar", "cancelar", "preco", "horario", "localizacao", "saudacao", "outro".
Responda APENAS com a palavra, sem pontuação.`,
        },
        { role: 'user', content: message },
      ],
    });

    return completion.choices[0]?.message?.content?.trim().toLowerCase() || 'outro';
  } catch {
    return 'outro';
  }
}

module.exports = { shouldUseFlow, answerFreeQuestion, classifyIntent };
