// Configuracion de la conexion SQL compartida por todo el proyecto.
const sql = require('mssql');
require('dotenv').config();

// Ajustes de la base de datos tomados desde variables de entorno.
const serverName = process.env.DB_SERVER || 'localhost';
const port = parseInt(process.env.DB_PORT, 10) || 1433;

const dbSettings = {
    server: serverName,
    port: port,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
};

// Abre o reutiliza el pool principal de SQL Server.
const getConnection = async () => {
    try {
        const pool = await sql.connect(dbSettings);
        console.log('Conexion tactica a OperacionBabel establecida en puerto', port);
        return pool;
    } catch (error) {
        console.error('Fallo critico en la conexion a la base de datos:', error);
        throw error;
    }
};

module.exports = { sql, getConnection };