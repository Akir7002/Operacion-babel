// Repositorio de SESIONES DE ENTRENAMIENTO, GAME OVER y PROGRESO FLASHCARDS (SM-2).
const { query } = require('../db');

// ── Sesiones ──
async function crearSesion({ idUsuario, vidasInicio, modoJuego }) {
    const result = await query(
        `INSERT INTO sesionesentrenamiento (idusuario, vidasinicio, modojuego)
         VALUES ($1, $2, $3)
         RETURNING idsesion`,
        [idUsuario, vidasInicio, modoJuego]
    );
    return result.rows[0].idsesion;
}

async function finalizarSesion(idSesion, { estadoSesion, vidasFinal, puntajeTotal, tiempoTotalSeg }) {
    await query(
        `UPDATE sesionesentrenamiento
         SET fechafin = NOW(), estadoSesion = $2, vidasfinal = $3, puntajetotal = $4, tiempototalseg = $5
         WHERE idsesion = $1`,
        [idSesion, estadoSesion, vidasFinal, puntajeTotal, tiempoTotalSeg]
    );
}

async function marcarSesionGameOver(idSesion) {
    await query(
        `UPDATE sesionesentrenamiento SET estadoSesion = 'GAME_OVER', fechafin = NOW() WHERE idsesion = $1`,
        [idSesion]
    );
}

// ── Game over ──
async function registrarGameOver({ idUsuario, idSesion, causaMuerte, progresoPerdido, mensajeFinal }) {
    await query(
        `INSERT INTO historialgameover (idusuario, idsesion, causamuerte, progresoperdido, mensajefinal)
         VALUES ($1, $2, $3, $4, $5)`,
        [idUsuario, idSesion, causaMuerte, progresoPerdido, mensajeFinal]
    );
}

async function listarHistorialGameOver(idUsuario) {
    const result = await query(
        `SELECT
             'GAME_OVER' AS tipo,
             causamuerte AS titulo,
             fechagameover AS fecha,
             progresoperdido AS puntos,
             mensajefinal
         FROM historialgameover
         WHERE idusuario = $1
         ORDER BY fechagameover DESC
         LIMIT 20`,
        [idUsuario]
    );
    return result.rows;
}

async function listarSesionesCompletadas(idUsuario) {
    const result = await query(
        `SELECT
             'FLASHCARDS' AS tipo,
             modojuego AS titulo,
             fechafin AS fecha,
             puntajetotal AS puntos
         FROM sesionesentrenamiento
         WHERE idusuario = $1 AND estadosesion = 'COMPLETADA'
         ORDER BY fechafin DESC
         LIMIT 20`,
        [idUsuario]
    );
    return result.rows;
}

// ── Progreso de flashcards (SM-2) ──
async function buscarProgreso(idUsuario, idFlashcard) {
    const result = await query(
        `SELECT idprogreso, vecesvista, vecesacertada, vecesfallada, nivelconfianza
         FROM progresoflashcards
         WHERE idusuario = $1 AND idflashcard = $2`,
        [idUsuario, idFlashcard]
    );
    return result.rows[0] || null;
}

async function crearProgreso(idUsuario, idFlashcard, { acierto, calidad, proximaRevision }) {
    await query(
        `INSERT INTO progresoflashcards (idusuario, idflashcard, vecesvista, vecesacertada, vecesfallada, ultimarevision, nivelconfianza, proximarevision, dominada)
         VALUES ($1, $2, 1, $3, $4, NOW(), $5, $6, $7)`,
        [idUsuario, idFlashcard, acierto ? 1 : 0, acierto ? 0 : 1, calidad >= 3 ? 3 : 0, proximaRevision, calidad >= 4]
    );
}

async function actualizarProgreso(idUsuario, idFlashcard, { vecesVista, vecesAcertada, vecesFallada, nivelConfianza, proximaRevision, dominada }) {
    await query(
        `UPDATE progresoflashcards
         SET vecesvista = $3, vecesacertada = $4, vecesfallada = $5,
             ultimarevision = NOW(), nivelconfianza = $6, proximarevision = $7, dominada = $8
         WHERE idusuario = $1 AND idflashcard = $2`,
        [idUsuario, idFlashcard, vecesVista, vecesAcertada, vecesFallada, nivelConfianza, proximaRevision, dominada]
    );
}

module.exports = {
    crearSesion,
    finalizarSesion,
    marcarSesionGameOver,
    registrarGameOver,
    listarHistorialGameOver,
    listarSesionesCompletadas,
    buscarProgreso,
    crearProgreso,
    actualizarProgreso,
};
