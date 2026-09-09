import { Router } from 'express';
import { webhookController } from '../controllers/webhookController.js';
import { verifyTelegramWebhook, verifyWhatsAppWebhook } from '../middleware/webhookVerify.js';
import { webhookLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(webhookLimiter);

// Telegram Webhook
router.post('/telegram', verifyTelegramWebhook, (req, res) => webhookController.handleTelegram(req, res));

// WhatsApp Webhook (Meta GET challenge, POST message)
router.get('/whatsapp', verifyWhatsAppWebhook);
router.post('/whatsapp', verifyWhatsAppWebhook, (req, res) => webhookController.handleWhatsApp(req, res));

export default router;
