import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { ENV } from './env.js';

const pool = new Pool({
  user: ENV.DB.USER,
  password: ENV.DB.PASSWORD,
  host: ENV.DB.HOST,
  port: ENV.DB.PORT,
  database: ENV.DB.DATABASE,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('connect', () => {
  console.log(`[Babel HQ] Conexión táctica a PostgreSQL en puerto ${ENV.DB.PORT}`);
});

pool.on('error', (err: Error) => {
  console.error('[Babel HQ Error] Falla crítica en el pool de PostgreSQL:', err.message);
});

export const query = async <T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  const start = Date.now();
  const res = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  if (ENV.NODE_ENV === 'development') {
    // Log queries in dev mode if needed
  }
  return res;
};

export const getClient = async (): Promise<PoolClient> => {
  return await pool.connect();
};

export const getPool = (): Pool => pool;
