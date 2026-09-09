import { Router } from 'express';
import { assistantController } from '../controllers/assistantController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Strictly protect all assistant interactions
router.use(authMiddleware);

router.post('/chat', (req, res) => assistantController.chat(req, res));
router.get('/calendar', (req, res) => assistantController.getCalendarEvents(req, res));
router.get('/tasks', (req, res) => assistantController.getTasks(req, res));
router.get('/leads', (req, res) => assistantController.getCRMLeads(req, res));

export default router;
