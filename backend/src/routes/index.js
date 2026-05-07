const express = require('express');
const { webhookHandler } = require('../controllers/webhookController');
const ctrl = require('../controllers/dashboardController');

const router = express.Router();

// Webhook — recebe mensagens do WhatsApp via Evolution API
router.post('/webhook/whatsapp', webhookHandler);

// Dashboard API
router.get('/api/dashboard', ctrl.getDashboard);
router.get('/api/appointments', ctrl.getAppointments);
router.patch('/api/appointments/:id/status', ctrl.updateStatus);
router.get('/api/professionals', ctrl.getProfessionals);
router.get('/api/services', ctrl.getServices);
router.get('/api/customers', ctrl.getCustomers);
router.get('/api/whatsapp/status', ctrl.getWhatsappStatus);

// Health
router.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

module.exports = router;
