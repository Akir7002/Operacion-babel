// Adaptador de la capa de datos: reutiliza el pool de PostgreSQL de db.js (raiz).
const { query, getClient, getPool } = require('../db');

module.exports = { query, getClient, getPool };
