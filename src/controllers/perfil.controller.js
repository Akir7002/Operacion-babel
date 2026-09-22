// Controllers de PERFIL y CONFIGURACION DE USUARIO.
// Handlers delgados: validan parametros, delegan en service/repsoitorios y responden.
const perfilService = require('../services/perfil.service');
const logroConfigRepo = require('../repositories/logroConfig.repo');
const AppError = require('../errors/AppError');

function parseIdParam(value) {
    const id = Number.parseInt(value, 10);
    if (!Number.isFinite(id)) return null;
    return id;
}

// GET /api/perfil/:idUsuario
async function obtenerPerfil(req, res) {
    const idUsuario = parseIdParam(req.params.idUsuario);
    if (!idUsuario) throw new AppError('USR_ID_INVALIDO');

    const perfil = await perfilService.armarPerfil(idUsuario);
    return res.status(200).json(perfil);
}

// GET /api/perfil/:idUsuario/historial
async function obtenerHistorial(req, res) {
    const idUsuario = parseIdParam(req.params.idUsuario);
    if (!idUsuario) throw new AppError('USR_ID_INVALIDO');

    const historial = await perfilService.obtenerHistorial(idUsuario);
    return res.status(200).json(historial);
}

// GET /api/configuracion/:idUsuario
async function obtenerConfiguracion(req, res) {
    const idUsuario = parseIdParam(req.params.idUsuario);
    if (!idUsuario) throw new AppError('USR_ID_INVALIDO');

    const config = await logroConfigRepo.buscarConfiguracion(idUsuario);
    if (!config) {
        return res.status(200).json({ TemaVisual: 'oscuro', VolumenGeneral: 100, NotificacionesHabilitadas: true, ModoDaltonico: false });
    }
    return res.status(200).json(config);
}

// PUT /api/configuracion/:idUsuario (upsert)
async function actualizarConfiguracion(req, res) {
    const idUsuario = parseIdParam(req.params.idUsuario);
    if (!idUsuario) throw new AppError('USR_ID_INVALIDO');

    const { TemaVisual, VolumenGeneral, NotificacionesHabilitadas, NotificacionesActivadas, ModoDaltonico, AnimacionesReducidas } = req.body || {};
    const valores = {
        temaVisual: TemaVisual || 'oscuro',
        volumenGeneral: VolumenGeneral ?? 100,
        notificaciones: NotificacionesHabilitadas ?? NotificacionesActivadas ?? true,
        modoDaltonico: ModoDaltonico ?? false,
        animacionesReducidas: AnimacionesReducidas ?? false,
    };

    const existe = await logroConfigRepo.existeConfiguracion(idUsuario);
    if (!existe) {
        await logroConfigRepo.insertarConfiguracion(idUsuario, valores);
    } else {
        await logroConfigRepo.actualizarConfiguracion(idUsuario, valores);
    }

    return res.status(200).json({ mensaje: 'Configuracion actualizada' });
}

module.exports = { obtenerPerfil, obtenerHistorial, obtenerConfiguracion, actualizarConfiguracion };