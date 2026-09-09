import { Router } from 'express';
import { approvalController } from '../controllers/approvalController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Strictly protect approvals queue and actions
router.use(authMiddleware);

router.get('/', (req, res) => approvalController.listPending(req, res));
router.get('/history', (req, res) => approvalController.listHistory(req, res));
router.post('/:id/approve', (req, res) => approvalController.approve(req, res));
router.patch('/:id', (req, res) => approvalController.update(req, res));
router.post('/:id/reject', (req, res) => approvalController.reject(req, res));

export default router;
