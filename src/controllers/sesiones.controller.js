// Controllers de SESIONES, GAME OVER, PROGRESO (SM-2), PUNTOS y LOGROS.
const usuarioRepo = require('../repositories/usuario.repo');
const sesionRepo = require('../repositories/sesion.repo');
const estadisticasRepo = require('../repositories/estadisticas.repo');
const logroConfigRepo = require('../repositories/logroConfig.repo');
const progresoService = require('../services/progreso.service');
const puntosService = require('../services/puntos.service');
const AppError = require('../errors/AppError');

function parseIdParam(value) {
    const id = Number.parseInt(value, 10);
    if (!Number.isFinite(id)) return null;
    return id;
}

// POST /api/sesiones
async function crearSesion(req, res) {
    const { IdUsuario, ModoJuego } = req.body || {};
    if (!IdUsuario) throw new AppError('USR_ID_INVALIDO', null, 'IdUsuario requerido.');

    const usuario = await usuarioRepo.buscarVidasActuales(IdUsuario);
    if (!usuario) throw new AppError('USR_NO_ENCONTRADO');

    const idSesion = await sesionRepo.crearSesion({
        idUsuario: IdUsuario,
        vidasInicio: usuario.vidasactuales,
        modoJuego: ModoJuego || 'FLASHCARDS',
    });

    return res.status(201).json({ IdSesion: idSesion, VidasInicio: usuario.vidasactuales });
}

// PUT /api/sesiones/:idSesion/finalizar
async function finalizarSesion(req, res) {
    const idSesion = parseIdParam(req.params.idSesion);
    if (!idSesion) throw new AppError('VAL_ID_INVALIDO', null, 'Id de sesion invalido.');

    const { EstadoSesion, VidasFinal, PuntajeTotal, TiempoTotalSeg } = req.body || {};

    await sesionRepo.finalizarSesion(idSesion, {
        estadoSesion: EstadoSesion || 'COMPLETADA',
        vidasFinal: VidasFinal ?? null,
        puntajeTotal: PuntajeTotal ?? 0,
        tiempoTotalSeg: TiempoTotalSeg ?? 0,
    });

    await estadisticasRepo.incrementarSesionesPorSesion(idSesion);

    return res.status(200).json({ mensaje: 'Sesion finalizada.' });
}

// POST /api/game-over
async function registrarGameOver(req, res) {
    const { IdUsuario, IdSesion, CausaMuerte, ProgresoPerdido, MensajeFinal } = req.body || {};
    if (!IdUsuario) throw new AppError('USR_ID_INVALIDO', null, 'IdUsuario requerido.');

    await sesionRepo.registrarGameOver({
        idUsuario: IdUsuario,
        idSesion: IdSesion || null,
        causaMuerte: CausaMuerte || 'Vidas agotadas',
        progresoPerdido: ProgresoPerdido || 0,
        mensajeFinal: MensajeFinal || 'Mision fallida',
    });

    await estadisticasRepo.incrementarGameOvers(IdUsuario);

    if (IdSesion) {
        await sesionRepo.marcarSesionGameOver(IdSesion);
    }

    return res.status(201).json({ mensaje: 'Game over registrado.' });
}

// POST /api/flashcards/progreso
async function registrarProgresoFlashcard(req, res) {
    const { IdUsuario, IdFlashcard, Acierto } = req.body || {};
    if (!IdUsuario || !IdFlashcard) {
        throw new AppError('USR_DATOS_FALTANTES', null, 'IdUsuario e IdFlashcard requeridos.');
    }

    await progresoService.registrarAvance({ idUsuario: IdUsuario, idFlashcard: IdFlashcard, acierto: !!Acierto });

    return res.status(200).json({ mensaje: 'Progreso registrado.', acierto: !!Acierto });
}

// POST /api/puntos
async function registrarPuntos(req, res) {
    const { IdUsuario, Puntos, Fuente } = req.body || {};
    puntosService.validarPeticionPuntos({ idUsuario: IdUsuario, puntos: Puntos });

    const resultado = await puntosService.registrarPuntos({ idUsuario: IdUsuario, puntos: Puntos, fuente: Fuente });

    return res.status(200).json({ mensaje: 'Puntos registrados.', ...resultado });
}

// POST /api/logros/evaluar
async function evaluarLogros(req, res) {
    const { IdUsuario } = req.body || {};
    if (!IdUsuario) throw new AppError('USR_ID_INVALIDO', null, 'IdUsuario requerido.');

    const nuevosLogros = await puntosService.evaluarLogros(IdUsuario);
    return res.status(200).json({ nuevosLogros });
}

// GET /api/logros/:idUsuario
async function listarLogros(req, res) {
    const idUsuario = parseIdParam(req.params.idUsuario);
    if (!idUsuario) throw new AppError('USR_ID_INVALIDO');

    const logros = await logroConfigRepo.listarLogrosDeUsuario(idUsuario);
    return res.status(200).json(logros);
}

module.exports = {
    crearSesion,
    finalizarSesion,
    registrarGameOver,
    registrarProgresoFlashcard,
    registrarPuntos,
    evaluarLogros,
    listarLogros,
};
