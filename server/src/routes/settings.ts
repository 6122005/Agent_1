import { Router } from 'express';
import { settingsController } from '../controllers/settingsController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);
router.get('/', (req, res) => settingsController.getSettings(req, res));
router.put('/', (req, res) => settingsController.updateSettings(req, res));
router.post('/telegram-link', (req, res) => settingsController.generateTelegramLink(req, res));
router.post('/telegram-disconnect', (req, res) => settingsController.disconnectTelegram(req, res));

export default router;
