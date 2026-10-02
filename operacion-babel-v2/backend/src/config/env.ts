import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB: {
    USER: process.env.DB_USER || 'postgres',
    PASSWORD: process.env.DB_PASSWORD || '',
    HOST: process.env.DB_HOST || '127.0.0.1',
    PORT: parseInt(process.env.DB_PORT || '5432', 10),
    DATABASE: process.env.DB_DATABASE || 'operacionbabel',
  },
  JWT: {
    SECRET: process.env.JWT_SECRET || 'super_secreto_militar_operacion_babel_jwt_2026_key',
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  },
  BOOTSTRAP_ADMIN_KEY: process.env.BOOTSTRAP_ADMIN_KEY || 'Ak_Opb6202',
};
