import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';

export const createApp = () => {
  const app = express();

  // Global Middlewares
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Version 1
  app.use('/api/v1', apiRoutes);

  // Backward compatibility alias for legacy clients (/api/...)
  app.use('/api', apiRoutes);

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
