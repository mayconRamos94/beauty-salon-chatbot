const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// ── PROFESSIONAL ──────────────────────────────────
const Professional = sequelize.define('Professional', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, defaultValue: 'Cabeleireiro' }, // Cabeleireiro, Manicure, etc.
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
  avatarEmoji: { type: DataTypes.STRING, defaultValue: '💇' },
}, { tableName: 'professionals', timestamps: true });

// ── SERVICE ───────────────────────────────────────
const Service = sequelize.define('Service', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.STRING },
  durationMinutes: { type: DataTypes.INTEGER, allowNull: false },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  emoji: { type: DataTypes.STRING, defaultValue: '✂️' },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'services', timestamps: true });

// ── AVAILABILITY ─────────────────────────────────
// Disponibilidade semanal por profissional
const Availability = sequelize.define('Availability', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  professionalId: { type: DataTypes.UUID, allowNull: false },
  dayOfWeek: { type: DataTypes.INTEGER, allowNull: false }, // 0=Dom, 1=Seg, ..., 6=Sab
  startTime: { type: DataTypes.STRING, allowNull: false }, // "08:00"
  endTime: { type: DataTypes.STRING, allowNull: false },   // "18:00"
}, { tableName: 'availabilities', timestamps: false });

// ── CUSTOMER ──────────────────────────────────────
const Customer = sequelize.define('Customer', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  phone: { type: DataTypes.STRING, allowNull: false, unique: true }, // número WhatsApp
  name: { type: DataTypes.STRING },
  totalAppointments: { type: DataTypes.INTEGER, defaultValue: 0 },
  lastVisit: { type: DataTypes.DATE },
  notes: { type: DataTypes.TEXT },
}, { tableName: 'customers', timestamps: true });

// ── APPOINTMENT ───────────────────────────────────
const Appointment = sequelize.define('Appointment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  customerId: { type: DataTypes.UUID, allowNull: false },
  professionalId: { type: DataTypes.UUID, allowNull: false },
  serviceId: { type: DataTypes.UUID, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  startTime: { type: DataTypes.STRING, allowNull: false },
  endTime: { type: DataTypes.STRING, allowNull: false },
  status: {
    type: DataTypes.ENUM('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'),
    defaultValue: 'scheduled',
  },
  notes: { type: DataTypes.TEXT },
  bookedVia: { type: DataTypes.ENUM('whatsapp', 'panel', 'phone'), defaultValue: 'whatsapp' },
}, { tableName: 'appointments', timestamps: true });

// ── CONVERSATION ──────────────────────────────────
// Estado atual da conversa de cada cliente no chatbot
const Conversation = sequelize.define('Conversation', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  phone: { type: DataTypes.STRING, allowNull: false, unique: true },
  state: {
    // Estados do fluxo de conversa
    type: DataTypes.ENUM(
      'idle',              // Aguardando início
      'main_menu',         // Menu principal
      'selecting_service', // Escolhendo serviço
      'selecting_pro',     // Escolhendo profissional
      'selecting_date',    // Escolhendo data
      'selecting_time',    // Escolhendo horário
      'confirming',        // Confirmando agendamento
      'ai_chat',           // Conversa livre com IA
      'cancelling'         // Cancelando agendamento
    ),
    defaultValue: 'idle',
  },
  // Dados coletados durante o fluxo — persistidos entre mensagens
  context: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
  lastMessageAt: { type: DataTypes.DATE },
  // Após 30min sem resposta, reset automático
  expiresAt: { type: DataTypes.DATE },
}, { tableName: 'conversations', timestamps: true });

// ── ASSOCIATIONS ──────────────────────────────────
Professional.hasMany(Availability, { foreignKey: 'professionalId', as: 'availabilities' });
Availability.belongsTo(Professional, { foreignKey: 'professionalId' });

Professional.hasMany(Appointment, { foreignKey: 'professionalId', as: 'appointments' });
Appointment.belongsTo(Professional, { foreignKey: 'professionalId', as: 'professional' });

Service.hasMany(Appointment, { foreignKey: 'serviceId' });
Appointment.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });

Customer.hasMany(Appointment, { foreignKey: 'customerId', as: 'appointments' });
Appointment.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

module.exports = { sequelize, Professional, Service, Availability, Customer, Appointment, Conversation };
