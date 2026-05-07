const { Sequelize } = require('sequelize');

let sequelize;

if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production'
        ? { require: true, rejectUnauthorized: false }
        : false,
    },
  });
} else {
  // Desenvolvimento sem PostgreSQL: usa H2-style in-memory via Sequelize
  sequelize = new Sequelize('ai_salon_chatbot', 'postgres', 'postgres', {
    host: 'localhost',
    dialect: 'postgres',
    logging: false,
  });
  console.warn('[DB] DATABASE_URL não configurada. Configure PostgreSQL ou use Railway.');
}

module.exports = sequelize;
