// Repositorio de REGISTROS DE ALISTAMIENTO.
const { query } = require('../db');

async function insertarRegistro(client, { idUsuario, nombre, contacto, fechaAlistamiento, frenteAsignado }) {
    const result = await client.query(
        `INSERT INTO registrosalistamiento (
            idusuario, nombrecompleto, frecuenciacontacto, fechaalistamiento, frenteasignado, estadoaprobacion
         )
         VALUES ($1, $2, $3, $4, $5, true)
         RETURNING idregistro`,
        [idUsuario, nombre, contacto, fechaAlistamiento || new Date(), frenteAsignado]
    );
    return result.rows[0].idregistro;
}

async function guardarCodigoAlistamiento(client, idRegistro, codigoAlistamiento) {
    await client.query(
        'UPDATE registrosalistamiento SET codigoalistamiento = $1 WHERE idregistro = $2',
        [codigoAlistamiento, idRegistro]
    );
}

async function buscarPorCorreoActivo(correo) {
    const result = await query(
        `SELECT u.idusuario, u.nombreclave
         FROM usuarios u
         JOIN registrosalistamiento r ON u.idusuario = r.idusuario
         WHERE r.frecuenciacontacto = $1 AND u.estadocuenta = 'ACTIVA'`,
        [correo]
    );
    return result.rows[0] || null;
}

async function listarParaExportarReclutas() {
    let result;
    try {
        result = await query('SELECT * FROM vista_estadisticasreclutas ORDER BY puntostotales DESC');
    } catch (e) {
        result = await query(`
            SELECT
                u.idusuario AS "IdUsuario", u.nombreclave AS "NombreClave",
                CASE WHEN u.idrango=1 THEN 'Recluta' WHEN u.idrango=2 THEN 'Operador' ELSE 'General' END AS "RangoMilitar",
                u.puntostotales AS "PuntosTotales", u.vidasactuales AS "VidasActuales",
                'Desconocido' AS "FrenteAsignado", 'Desconocido' AS "FechaAlistamiento"
            FROM usuarios u ORDER BY puntostotales DESC
        `);
    }
    return result.rows;
}

module.exports = {
    insertarRegistro,
    guardarCodigoAlistamiento,
    buscarPorCorreoActivo,
    listarParaExportarReclutas,
};
