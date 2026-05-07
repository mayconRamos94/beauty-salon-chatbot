require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { sequelize } = require('./models');
const routes = require('./routes');
const { registerWebhook } = require('./services/evolutionApi');

const app = express();
const PORT = process.env.PORT || 3000;

// ── MIDDLEWARE ────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// ── ROUTES ────────────────────────────────────────
app.use(routes);

// ── 404 ───────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Rota não encontrada: ${req.method} ${req.path}` });
});

// ── ERROR HANDLER ─────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ error: err.message || 'Erro interno' });
});

// ── START ─────────────────────────────────────────
async function start() {
  try {
    await sequelize.authenticate();
    console.log('✅ Banco conectado');

    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('✅ Modelos sincronizados');

    // Seed automático em dev/demo
    if (process.env.NODE_ENV !== 'production' || process.env.DEMO_SEED === 'true') {
      const { seed } = require('./seeds/seed');
      await seed();
    }

    app.listen(PORT, async () => {
      console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);

      // Registra webhook na Evolution API se URL pública configurada
      if (process.env.WEBHOOK_URL) {
        await registerWebhook(process.env.WEBHOOK_URL);
      } else {
        console.log('ℹ️  WEBHOOK_URL não configurada — use ngrok em desenvolvimento');
        console.log('   ngrok http 3000  →  copie a URL →  WEBHOOK_URL=https://xxxx.ngrok.io');
      }
    });

  } catch (err) {
    console.error('❌ Erro ao iniciar:', err.message);
    process.exit(1);
  }
}

start();
