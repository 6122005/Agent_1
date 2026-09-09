import { Router } from 'express';
import { logsController } from '../controllers/logsController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);
router.get('/', (req, res) => logsController.getLogs(req, res));

export default router;
