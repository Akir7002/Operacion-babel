const sql = require('mssql');
require('dotenv').config();

const dbSettings = {
    server: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT, 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: false, 
        trustServerCertificate: true,
    },
};

const getConnection = async () => {
    try {
        const pool = await sql.connect(dbSettings);
        console.log('Conexión táctica a OperacionBabel establecida.');
        return pool;
    } catch (error) {
        console.error('Fallo crítico en la conexión a la base de datos:', error);
        throw error;
    }
};

module.exports = { sql, getConnection };