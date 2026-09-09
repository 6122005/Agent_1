import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Apply dedicated auth limiter
router.use(authLimiter);

router.get('/google', (req, res) => authController.googleAuth(req, res));
router.get('/google/callback', (req, res) => authController.googleCallback(req, res));
router.get('/me', authMiddleware, (req, res) => authController.me(req, res));
router.post('/logout', authMiddleware, (req, res) => authController.logout(req, res));

export default router;
