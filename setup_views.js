// Script de mantenimiento para crear o actualizar vistas SQL.
const { getConnection } = require('./db');

async function createViews() {
    try {
        const pool = await getConnection();
        console.log('Conexión a la base de datos exitosa.');

        // Vista principal con estado y progreso de reclutas.
        const query1 = `
        CREATE OR ALTER VIEW Vista_EstadisticasReclutas AS
        SELECT 
            U.IdUsuario,
            U.NombreClave,
            CASE 
                WHEN U.IdRango = 1 THEN 'Recluta'
                WHEN U.IdRango = 2 THEN 'Operador'
                WHEN U.IdRango = 3 THEN 'General'
                ELSE 'Desconocido'
            END AS RangoMilitar,
            U.PuntosTotales,
            U.VidasActuales,
            ISNULL(R.FrenteAsignado, 'No Asignado') AS FrenteAsignado,
            ISNULL(CONVERT(VARCHAR, R.FechaAlistamiento, 120), 'Sin Registro') AS FechaAlistamiento,
            U.EstadoCuenta
        FROM 
            Usuarios U
        LEFT JOIN 
            RegistrosAlistamiento R ON U.IdUsuario = R.IdUsuario;
        `;

        await pool.request().query(query1);
        console.log('Vista_EstadisticasReclutas creada o actualizada.');

        // Vista de ranking para mostrar a los agentes con mejor puntuacion.
        const query2 = `
        CREATE OR ALTER VIEW Vista_TopAgentes AS
        SELECT TOP 100
            U.NombreClave,
            U.PuntosTotales,
            CASE 
                WHEN U.IdRango = 1 THEN 'Recluta'
                WHEN U.IdRango = 2 THEN 'Operador'
                WHEN U.IdRango = 3 THEN 'General'
                ELSE 'Desconocido'
            END AS RangoMilitar,
            R.FrenteAsignado
        FROM 
            Usuarios U
        LEFT JOIN 
            RegistrosAlistamiento R ON U.IdUsuario = R.IdUsuario
        WHERE 
            U.EstadoCuenta = 'ACTIVO'
        ORDER BY 
            U.PuntosTotales DESC;
        `;

        await pool.request().query(query2);
        console.log('Vista_TopAgentes creada o actualizada.');
        
        console.log('¡Todas las vistas se han implementado correctamente en la base de datos!');
        process.exit(0);
    } catch (error) {
        console.error('Error al crear las vistas:', error);
        process.exit(1);
    }
}

createViews();
