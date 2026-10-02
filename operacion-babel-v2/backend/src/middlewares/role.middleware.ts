import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware.js';

export const requireRank = (minRank: number) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const userRank = req.user?.idRango || 0;

    if (userRank < minRank) {
      res.status(403).json({
        success: false,
        error: `Nivel de seguridad insuficiente. Requiere Rango militar ${minRank} o superior.`,
      });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRank(4); // Rango 4+ es Oficial/Administrador
