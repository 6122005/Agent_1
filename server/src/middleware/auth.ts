import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
  tokenVersion?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Strict authentication middleware checking JWT from httpOnly cookie or Authorization header.
 * Enforces server-side tokenVersion revocation check to guarantee real logout invalidation.
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  let token: string | undefined = req.cookies?.assistant_session;

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: No active session found' });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthenticatedUser;

    // Server-side session verification via tokenVersion
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized: User account does not exist' });
      return;
    }

    if (decoded.tokenVersion !== undefined && user.tokenVersion !== decoded.tokenVersion) {
      res.status(401).json({ error: 'Unauthorized: Session has been revoked' });
      return;
    }

    req.user = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };

    next();
  } catch (err: any) {
    res.status(401).json({ error: 'Unauthorized: Session expired or invalid' });
  }
}
