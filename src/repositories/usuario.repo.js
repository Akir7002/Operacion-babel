// Repositorio de USUARIOS: todo el SQL de la entidad usuarios vive aqui.
const { query, getClient } = require('../db');

// ── Lecturas ──
async function buscarPorCredenciales(correo, hashContrasena) {
    const result = await query(`
        SELECT u.idusuario, u.nombreclave, u.idrango, u.estadocuenta
        FROM usuarios u
        JOIN registrosalistamiento r ON u.idusuario = r.idusuario
        WHERE r.frecuenciacontacto = $1 AND u.hashcontrasena = $2
    `, [correo, hashContrasena]);
    return result.rows[0] || null;
}

async function buscarPorId(idUsuario) {
    const result = await query('SELECT * FROM usuarios WHERE idusuario = $1', [idUsuario]);
    return result.rows[0] || null;
}

async function buscarVidasActuales(idUsuario) {
    const result = await query('SELECT vidasactuales FROM usuarios WHERE idusuario = $1', [idUsuario]);
    return result.rows[0] || null;
}

async function buscarPuntosYRango(idUsuario) {
    const result = await query('SELECT puntostotales, idrango FROM usuarios WHERE idusuario = $1', [idUsuario]);
    return result.rows[0] || null;
}

async function buscarDatosPerfil(idUsuario) {
    const result = await query(`
        SELECT
            u.nombreclave, u.idrango, u.vidasactuales, u.puntostotales,
            u.estadocuenta, r.frenteasignado, r.fechaalistamiento
        FROM usuarios u
        LEFT JOIN registrosalistamiento r ON u.idusuario = r.idusuario
        WHERE u.idusuario = $1
    `, [idUsuario]);
    return result.rows[0] || null;
}

async function listarActivos() {
    const result = await query(`
        SELECT
            u.idusuario AS "IdUsuario",
            u.nombreclave AS "NombreClave",
            u.idrango AS "IdRango",
            COALESCE(rg.nombrerango, CASE WHEN u.idrango >= 4 THEN 'Administrador' ELSE 'Desconocido' END) AS "RangoMilitar",
            u.puntostotales AS "PuntosTotales",
            u.vidasactuales AS "VidasActuales",
            u.rachadias AS "RachaDias",
            u.estadocuenta AS "EstadoCuenta",
            u.fecharegistro AS "FechaRegistro",
            u.ultimaconexion AS "UltimaConexion",
            r.nombrecompleto AS "NombreCompleto",
            r.frecuenciacontacto AS "FrecuenciaContacto",
            r.fechaalistamiento AS "FechaAlistamiento",
            r.frenteasignado AS "FrenteAsignado",
            r.codigoalistamiento AS "CodigoAlistamiento",
            CASE WHEN u.idrango >= 4 THEN 1 ELSE 0 END AS "EsAdministrador"
        FROM usuarios u
        LEFT JOIN rangos rg ON rg.idrango = u.idrango
        LEFT JOIN registrosalistamiento r ON r.idusuario = u.idusuario
        WHERE u.estadocuenta = 'ACTIVA'
        ORDER BY CASE WHEN u.idrango >= 4 THEN 0 ELSE 1 END, u.idrango DESC, u.fecharegistro DESC
    `);
    return result.rows;
}

async function listarIntendentesActivos() {
    const result = await query(`
        SELECT
            u.idusuario AS "IdUsuario",
            u.nombreclave AS "NombreClave",
            u.idrango AS "IdRango",
            COALESCE(rg.nombrerango, CASE WHEN u.idrango >= 4 THEN 'Intendente' ELSE 'Desconocido' END) AS "RangoMilitar",
            u.puntostotales AS "PuntosTotales",
            u.vidasactuales AS "VidasActuales",
            u.rachadias AS "RachaDias",
            u.estadocuenta AS "EstadoCuenta",
            u.fecharegistro AS "FechaRegistro",
            u.ultimaconexion AS "UltimaConexion",
            r.nombrecompleto AS "NombreCompleto",
            r.frecuenciacontacto AS "FrecuenciaContacto",
            r.fechaalistamiento AS "FechaAlistamiento",
            r.frenteasignado AS "FrenteAsignado",
            r.codigoalistamiento AS "CodigoAlistamiento",
            CASE WHEN u.idrango >= 4 THEN 1 ELSE 0 END AS "EsAdministrador"
        FROM usuarios u
        LEFT JOIN rangos rg ON rg.idrango = u.idrango
        LEFT JOIN registrosalistamiento r ON r.idusuario = u.idusuario
        WHERE u.estadocuenta = 'ACTIVA' AND u.idrango >= 4
        ORDER BY u.idrango DESC, u.fecharegistro DESC
    `);
    return result.rows;
}

async function listarIntendentesParaExportar() {
    const result = await query(`
        SELECT
            u.idusuario AS "IdUsuario",
            u.nombreclave AS "NombreClave",
            COALESCE(rg.nombrerango, CASE WHEN u.idrango >= 4 THEN 'Intendente' ELSE 'Desconocido' END) AS "RangoMilitar",
            u.puntostotales AS "PuntosTotales",
            u.vidasactuales AS "VidasActuales",
            u.rachadias AS "RachaDias",
            u.estadocuenta AS "EstadoCuenta",
            u.fecharegistro AS "FechaRegistro",
            u.ultimaconexion AS "UltimaConexion",
            COALESCE(r.nombrecompleto, 'Sin nombre') AS "NombreCompleto",
            COALESCE(r.frecuenciacontacto, 'No registrado') AS "FrecuenciaContacto",
            COALESCE(TO_CHAR(r.fechaalistamiento, 'YYYY-MM-DD'), 'Sin registro') AS "FechaAlistamiento",
            COALESCE(r.frenteasignado, 'Sin asignar') AS "FrenteAsignado",
            COALESCE(r.codigoalistamiento, 'Sin codigo') AS "CodigoAlistamiento",
            CASE WHEN u.idrango >= 4 THEN 1 ELSE 0 END AS "EsAdministrador"
        FROM usuarios u
        LEFT JOIN rangos rg ON rg.idrango = u.idrango
        LEFT JOIN registrosalistamiento r ON r.idusuario = u.idusuario
        WHERE u.estadocuenta = 'ACTIVA' AND u.idrango >= 4
        ORDER BY u.idrango DESC, u.fecharegistro DESC
    `);
    return result.rows;
}

// ── Escrituras ──
async function actualizarUltimaConexion(idUsuario) {
    await query('UPDATE usuarios SET ultimaconexion = NOW() WHERE idusuario = $1', [idUsuario]);
}

async function actualizarPassword(idUsuario, hashContrasena) {
    await query('UPDATE usuarios SET hashcontrasena = $1 WHERE idusuario = $2', [hashContrasena, idUsuario]);
}

async function darDeBaja(idUsuario) {
    const result = await query(
        `UPDATE usuarios SET estadocuenta = 'BAJA'
         WHERE idusuario = $1 AND estadocuenta = 'ACTIVA'
         RETURNING idusuario`,
        [idUsuario]
    );
    return result.rowCount > 0;
}

async function eliminarAdministrador(idUsuario) {
    const result = await query(
        'DELETE FROM usuarios WHERE idusuario = $1 AND idrango >= 4 RETURNING idusuario',
        [idUsuario]
    );
    return result.rowCount > 0;
}

async function sumarPuntos(idUsuario, puntos) {
    await query('UPDATE usuarios SET puntostotales = puntostotales + $2 WHERE idusuario = $1', [idUsuario, puntos]);
}

async function actualizarRachaDias(idUsuario, diasConsecutivos) {
    await query('UPDATE usuarios SET rachadias = $2 WHERE idusuario = $1', [idUsuario, diasConsecutivos]);
}

async function actualizarRango(idUsuario, idRango) {
    await query('UPDATE usuarios SET idrango = $2 WHERE idusuario = $1', [idUsuario, idRango]);
}

async function regenerarVida(idUsuario) {
    await query('UPDATE usuarios SET vidasactuales = LEAST(vidasactuales + 1, 5) WHERE idusuario = $1', [idUsuario]);
    const result = await query('SELECT vidasactuales FROM usuarios WHERE idusuario = $1', [idUsuario]);
    return result.rows[0]?.vidasactuales ?? 5;
}

async function existeNombreClave(client, nombreClave) {
    const result = await client.query(
        'SELECT 1 AS existe FROM usuarios WHERE nombreclave = $1',
        [nombreClave]
    );
    return result.rowCount > 0;
}

async function insertarUsuario(client, { nombreClave, hashContrasena, idiomaPreferido, idRango }) {
    const result = await client.query(
        `INSERT INTO usuarios (nombreclave, hashcontrasena, ididiomapreferido, idrango)
         VALUES ($1, $2, $3, $4)
         RETURNING idusuario, nombreclave`,
        [nombreClave, hashContrasena, idiomaPreferido, idRango]
    );
    return result.rows[0];
}

// ── Transacciones (client dedicado) ──
function abrirTransaccion() {
    return getClient();
}

module.exports = {
    buscarPorCredenciales,
    buscarPorId,
    buscarVidasActuales,
    buscarPuntosYRango,
    buscarDatosPerfil,
    listarActivos,
    listarIntendentesActivos,
    listarIntendentesParaExportar,
    actualizarUltimaConexion,
    actualizarPassword,
    darDeBaja,
    eliminarAdministrador,
    sumarPuntos,
    actualizarRachaDias,
    actualizarRango,
    regenerarVida,
    existeNombreClave,
    insertarUsuario,
    abrirTransaccion,
};
