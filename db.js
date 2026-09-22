const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_DATABASE,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

pool.on('connect', () => {
    console.log('Conexion tactica a OperacionBabel establecida en puerto', process.env.DB_PORT);
});

pool.on('error', (err) => {
    console.error('Error inesperado en el pool de PostgreSQL:', err.message);
});

// Ejecuta una query con parametros posicionales ($1, $2, ...).
// values: array de valores en orden.
const query = async (text, values = []) => {
    const result = await pool.query(text, values);
    return result;
};

// Abre un cliente dedicado para transacciones.
// Debes llamar client.release() al terminar.
const getClient = async () => {
    const client = await pool.connect();
    return client;
};

const getPool = () => pool;

module.exports = { query, getClient, getPool };
