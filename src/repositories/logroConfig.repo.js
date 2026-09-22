// Repositorio de LOGROS y CONFIGURACION DE USUARIO.
const { query } = require('../db');

// ── Logros ──
async function listarLogros() {
    const result = await query('SELECT * FROM logros');
    return result.rows;
}

async function tieneLogro(idUsuario, idLogro) {
    const result = await query(
        'SELECT 1 FROM usuariologros WHERE idusuario = $1 AND idlogro = $2',
        [idUsuario, idLogro]
    );
    return result.rowCount > 0;
}

async function otorgarLogro(idUsuario, idLogro) {
    await query(
        'INSERT INTO usuariologros (idusuario, idlogro) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [idUsuario, idLogro]
    );
}

async function listarLogrosDeUsuario(idUsuario) {
    const result = await query(
        `SELECT
             l.idlogro,
             l.nombrelogro AS nombre,
             l.descripcion,
             l.icono,
             l.puntosrecompensa AS puntos,
             l.secreto,
             CASE WHEN ul.idusuario IS NOT NULL THEN true ELSE false END AS desbloqueado,
             ul.fechadesbloqueo AS fecha
        FROM logros l
        LEFT JOIN usuariologros ul ON ul.idlogro = l.idlogro AND ul.idusuario = $1
        ORDER BY ul.fechadesbloqueo DESC NULLS LAST, l.idlogro ASC`,
        [idUsuario]
    );
    return result.rows;
}

// ── Configuracion ──
async function buscarConfiguracion(idUsuario) {
    const result = await query(
        'SELECT temavisual, volumengeneral, notificacioneshabilitadas, notificacionesactivadas, mododaltonico, animacionesreducidas FROM configuracionusuario WHERE idusuario = $1',
        [idUsuario]
    );
    return result.rows[0] || null;
}

async function existeConfiguracion(idUsuario) {
    const result = await query('SELECT 1 FROM configuracionusuario WHERE idusuario = $1', [idUsuario]);
    return result.rowCount > 0;
}

async function insertarConfiguracion(idUsuario, valores) {
    await query(
        `INSERT INTO configuracionusuario (idusuario, temavisual, volumengeneral, notificacioneshabilitadas, mododaltonico, animacionesreducidas)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [idUsuario, valores.temaVisual, valores.volumenGeneral, valores.notificaciones, valores.modoDaltonico, valores.animacionesReducidas]
    );
}

async function actualizarConfiguracion(idUsuario, valores) {
    await query(
        `UPDATE configuracionusuario
         SET temavisual = $2, volumengeneral = $3, notificacioneshabilitadas = $4, mododaltonico = $5, animacionesreducidas = $6
         WHERE idusuario = $1`,
        [idUsuario, valores.temaVisual, valores.volumenGeneral, valores.notificaciones, valores.modoDaltonico, valores.animacionesReducidas]
    );
}

module.exports = {
    listarLogros,
    tieneLogro,
    otorgarLogro,
    listarLogrosDeUsuario,
    buscarConfiguracion,
    existeConfiguracion,
    insertarConfiguracion,
    actualizarConfiguracion,
};
