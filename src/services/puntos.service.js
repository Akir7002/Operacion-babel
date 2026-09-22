// Servicio de PUNTOS/XP: racha diaria, ascensos de rango y evaluacion de logros.
const usuarioRepo = require('../repositories/usuario.repo');
const estadisticasRepo = require('../repositories/estadisticas.repo');
const logroConfigRepo = require('../repositories/logroConfig.repo');
const AppError = require('../errors/AppError');

const UMBRAL_OPERADOR = 500;
const UMBRAL_GENERAL = 2000;

// Condiciones de desbloqueo por codigo de logro (fuente de verdad en logros.codigocondicion).
// NOTA: codigos reales de la BD: FLASH_1, RACHA_7, STREAK_10, FRASE_5.
const CONDICIONES_LOGROS = {
    FLASH_1: (s) => s.totalflashcardsvistas >= 1,
    RACHA_7: (s) => s.rachadias >= 7,
    STREAK_10: (s) => s.mejorracha >= 10,
    FRASE_5: (s) => s.totalsesiones >= 5,
};

// Registra puntos, actualiza racha diaria y evalua ascenso de rango.
// Devuelve { puntosOtorgados, rachaDias, ascenso }.
async function registrarPuntos({ idUsuario, puntos, fuente }) {
    await usuarioRepo.sumarPuntos(idUsuario, puntos);

    const hoy = new Date().toISOString().slice(0, 10);
    const rachaDeHoy = await estadisticasRepo.buscarRachaDeHoy(idUsuario, hoy);

    if (!rachaDeHoy) {
        await estadisticasRepo.crearRacha(idUsuario, hoy, puntos, fuente === 'FLASHCARDS' ? 1 : 0);
    } else {
        await estadisticasRepo.actualizarRacha(rachaDeHoy.idracha, rachaDeHoy.puntosdeldia + puntos, fuente === 'FLASHCARDS' ? 1 : 0);
    }

    const diasConsecutivos = await estadisticasRepo.contarDiasConsecutivos(idUsuario);
    await usuarioRepo.actualizarRachaDias(idUsuario, diasConsecutivos);

    const stats = await estadisticasRepo.buscarPorUsuario(idUsuario);
    if (stats && diasConsecutivos > stats.mejorracha) {
        await estadisticasRepo.actualizarMejorRacha(idUsuario, diasConsecutivos);
    }

    const usuario = await usuarioRepo.buscarPuntosYRango(idUsuario);
    let ascenso = null;

    if (usuario) {
        const { puntostotales, idrango } = usuario;
        let nuevoIdRango = idrango;
        if (puntostotales >= UMBRAL_GENERAL && idrango < 3) nuevoIdRango = 3;
        else if (puntostotales >= UMBRAL_OPERADOR && idrango < 2) nuevoIdRango = 2;

        if (nuevoIdRango > idrango) {
            await usuarioRepo.actualizarRango(idUsuario, nuevoIdRango);
            ascenso = { IdRango: nuevoIdRango, Nombre: nuevoIdRango === 2 ? 'Operador' : 'General' };
        }

        await estadisticasRepo.actualizarNivelActual(idUsuario, nuevoIdRango);
    }

    return { puntosOtorgados: puntos, rachaDias: diasConsecutivos, ascenso };
}

// Evalua todos los logros no desbloqueados contra las estadisticas reales.
async function evaluarLogros(idUsuario) {
    const stats = await estadisticasRepo.buscarConUsuario(idUsuario);
    if (!stats) return [];

    const logros = await logroConfigRepo.listarLogros();
    const desbloqueados = [];

    for (const logro of logros) {
        if (await logroConfigRepo.tieneLogro(idUsuario, logro.idlogro)) continue;

        const cumpleCondicion = CONDICIONES_LOGROS[logro.codigocondicion];
        if (!cumpleCondicion || !cumpleCondicion(stats)) continue;

        await logroConfigRepo.otorgarLogro(idUsuario, logro.idlogro);
        if (logro.puntosrecompensa > 0) {
            await usuarioRepo.sumarPuntos(idUsuario, logro.puntosrecompensa);
        }
        desbloqueados.push({
            IdLogro: logro.idlogro,
            Nombre: logro.nombrelogro,
            Descripcion: logro.descripcion,
            Puntos: logro.puntosrecompensa,
        });
    }

    return desbloqueados;
}

function validarPeticionPuntos({ idUsuario, puntos }) {
    if (!idUsuario || !puntos) {
        throw new AppError('USR_DATOS_FALTANTES', null, 'IdUsuario y Puntos requeridos.');
    }
}

module.exports = { registrarPuntos, evaluarLogros, validarPeticionPuntos };
