import { Router } from 'express';
import authRoutes from './auth.routes.js';
import deckRoutes from './deck.routes.js';
import gameRoutes from './game.routes.js';
import userRoutes from './user.routes.js';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OPERATIONAL',
    service: 'Operacion Babel Tactical API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Modular route registration
router.use('/', authRoutes);
router.use('/', deckRoutes);
router.use('/', gameRoutes);
router.use('/', userRoutes);

export default router;
