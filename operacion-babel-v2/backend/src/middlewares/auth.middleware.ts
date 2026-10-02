import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { TokenPayload } from '../types/index.js';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.split(' ')[1] 
    : null;

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Acceso no autorizado: Token militar no provisto.',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT.SECRET) as TokenPayload;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({
      success: false,
      error: 'Token inválido o expirado. Permiso de seguridad denegado.',
    });
  }
};
