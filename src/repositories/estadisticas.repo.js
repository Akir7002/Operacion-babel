// Repositorio de ESTADISTICAS y RACHA DIARIA.
const { query } = require('../db');

// ── Estadisticas ──
async function buscarPorUsuario(idUsuario) {
    const result = await query('SELECT * FROM estadisticas WHERE idusuario = $1', [idUsuario]);
    return result.rows[0] || null;
}

// Garantiza que exista la fila de estadisticas del usuario (usuarios creados
// antes de esta logica pueden no tenerla).
async function garantizarFila(idUsuario) {
    await query('INSERT INTO estadisticas (idusuario) VALUES ($1) ON CONFLICT DO NOTHING', [idUsuario]);
}

async function buscarConUsuario(idUsuario) {
    await garantizarFila(idUsuario);
    const result = await query(
        `SELECT e.*, u.puntostotales, u.rachadias
         FROM estadisticas e
         JOIN usuarios u ON u.idusuario = e.idusuario
         WHERE e.idusuario = $1`,
        [idUsuario]
    );
    return result.rows[0] || null;
}

async function incrementarSesiones(idUsuario) {
    await garantizarFila(idUsuario);
    await query(
        'UPDATE estadisticas SET totalsesiones = totalsesiones + 1, ultimaactualizacion = NOW() WHERE idusuario = $1',
        [idUsuario]
    );
}

async function incrementarSesionesPorSesion(idSesion) {
    await query(
        `UPDATE estadisticas
         SET totalsesiones = totalsesiones + 1, ultimaactualizacion = NOW()
         WHERE idusuario = (SELECT idusuario FROM sesionesentrenamiento WHERE idsesion = $1)`,
        [idSesion]
    );
}

async function incrementarGameOvers(idUsuario) {
    await garantizarFila(idUsuario);
    await query(
        'UPDATE estadisticas SET totalgameovers = totalgameovers + 1, ultimaactualizacion = NOW() WHERE idusuario = $1',
        [idUsuario]
    );
}

async function registrarVistaFlashcard(idUsuario, acierto) {
    await garantizarFila(idUsuario);
    await query(
        `UPDATE estadisticas
         SET totalflashcardsvistas = totalflashcardsvistas + 1,
             totalaciertos = totalaciertos + $2,
             totalfallos = totalfallos + $3,
             ultimaactualizacion = NOW()
         WHERE idusuario = $1`,
        [idUsuario, acierto ? 1 : 0, acierto ? 0 : 1]
    );
}

async function leerPrecisionYDominadas(idUsuario) {
    const result = await query(
        `SELECT
             CASE WHEN (totalaciertos + totalfallos) = 0 THEN 0
                  ELSE ROUND((totalaciertos::DECIMAL / (totalaciertos + totalfallos)) * 100, 2)
             END AS precision,
             (SELECT COUNT(*) FROM progresoflashcards WHERE idusuario = $1 AND dominada = true) AS dominadas
         FROM estadisticas WHERE idusuario = $1`,
        [idUsuario]
    );
    return result.rows[0] || null;
}

async function actualizarPrecisionYDominadas(idUsuario, precision, dominadas) {
    await query(
        'UPDATE estadisticas SET precisionpromedio = $2, palabrasdominadas = $3 WHERE idusuario = $1',
        [idUsuario, precision, dominadas]
    );
}

async function actualizarMejorRacha(idUsuario, racha) {
    await query('UPDATE estadisticas SET mejorracha = $2 WHERE idusuario = $1', [idUsuario, racha]);
}

async function actualizarNivelActual(idUsuario, nivel) {
    await query('UPDATE estadisticas SET nivelactual = $2 WHERE idusuario = $1', [idUsuario, nivel]);
}

// ── Racha diaria ──
async function buscarRachaDeHoy(idUsuario, fechaISO) {
    const result = await query(
        `SELECT idracha, entrenamientocompletado, puntosdeldia, flashcardsrevisadas
         FROM rachadiaria WHERE idusuario = $1 AND fecha = $2`,
        [idUsuario, fechaISO]
    );
    return result.rows[0] || null;
}

async function crearRacha(idUsuario, fechaISO, puntos, flashcardsRevisadas) {
    await query(
        `INSERT INTO rachadiaria (idusuario, fecha, entrenamientocompletado, puntosdeldia, flashcardsrevisadas)
         VALUES ($1, $2, true, $3, $4)`,
        [idUsuario, fechaISO, puntos, flashcardsRevisadas]
    );
}

async function actualizarRacha(idRacha, puntosDia, flashcardsRevisadas) {
    await query(
        `UPDATE rachadiaria
         SET puntosdeldia = $2,
             entrenamientocompletado = true,
             flashcardsrevisadas = flashcardsrevisadas + $3
         WHERE idracha = $1`,
        [idRacha, puntosDia, flashcardsRevisadas]
    );
}

async function contarDiasConsecutivos(idUsuario) {
    const result = await query(
        `SELECT COUNT(*) AS diasconsecutivos
         FROM (
             SELECT fecha FROM rachadiaria
             WHERE idusuario = $1 AND entrenamientocompletado = true
             ORDER BY fecha DESC
             LIMIT 365
         ) sub
         WHERE fecha >= CURRENT_DATE - INTERVAL '365 days'`,
        [idUsuario]
    );
    return result.rowCount > 0 ? Number(result.rows[0].diasconsecutivos) : 0;
}

module.exports = {
    buscarPorUsuario,
    buscarConUsuario,
    garantizarFila,
    incrementarSesiones,
    incrementarSesionesPorSesion,
    incrementarGameOvers,
    registrarVistaFlashcard,
    leerPrecisionYDominadas,
    actualizarPrecisionYDominadas,
    actualizarMejorRacha,
    actualizarNivelActual,
    buscarRachaDeHoy,
    crearRacha,
    actualizarRacha,
    contarDiasConsecutivos,
};
