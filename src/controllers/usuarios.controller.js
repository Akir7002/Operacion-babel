// Controllers de USUARIOS, RECLUTAS, INTENDENTES y EXPORTACIONES.
const usuarioRepo = require('../repositories/usuario.repo');
const registroRepo = require('../repositories/registro.repo');
const alistamientoService = require('../services/alistamiento.service');
const csvService = require('../services/csv.service');
const AppError = require('../errors/AppError');

function parseIdParam(value) {
    const id = Number.parseInt(value, 10);
    if (!Number.isFinite(id)) return null;
    return id;
}

// GET /api/usuarios/activos
async function listarActivos(req, res) {
    const usuarios = await usuarioRepo.listarActivos();
    return res.status(200).json(usuarios);
}

// GET /api/intendentes/activos
async function listarIntendentes(req, res) {
    const intendentes = await usuarioRepo.listarIntendentesActivos();
    return res.status(200).json(intendentes);
}

// GET /api/exportar/intendentes
async function exportarIntendentes(req, res) {
    const intendentes = await usuarioRepo.listarIntendentesParaExportar();
    if (intendentes.length === 0) {
        throw new AppError('EXP_SIN_DATOS', null, 'No hay intendentes activos para exportar.');
    }

    const csv = csvService.aCSV(intendentes, 'Expediente_Intendentes_Activos_Babel.csv');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${csv.nombreArchivo}"`);
    return res.status(200).send(csv.contenido);
}

// GET /api/exportar/reclutas
async function exportarReclutas(req, res) {
    const reclutas = await registroRepo.listarParaExportarReclutas();
    if (reclutas.length === 0) {
        throw new AppError('EXP_SIN_DATOS', null, 'No hay reclutas registrados.');
    }

    const csv = csvService.aCSV(reclutas, 'Expediente_Reclutas_Babel.csv');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${csv.nombreArchivo}"`);
    return res.status(200).send(csv.contenido);
}

// POST /api/reclutas
async function registrarRecluta(req, res) {
    const { nombre, contacto, fecha, frente, contrasena } = req.body || {};
    if (!nombre || !contacto || !fecha || !frente || !contrasena) {
        throw new AppError('USR_DATOS_FALTANTES');
    }

    const fechaISO = await alistamientoService.validarFechaAlistamiento(fecha);

    const resultado = await alistamientoService.registrarUsuarioConRegistro({
        nombre, contacto, contrasena,
        idRango: 1,
        fechaAlistamiento: new Date(`${fechaISO}T00:00:00`),
        frenteAsignado: frente,
    });

    return res.status(201).json({
        mensaje: 'Recluta registrado.',
        datos: {
            IdUsuario: resultado.idUsuario,
            IdRango: 1,
            NombreClave: resultado.nombreClave,
            CodigoAlistamiento: resultado.codigoAlistamiento,
        },
    });
}

// DELETE /api/usuarios/:idUsuario (baja logica)
async function darDeBajaUsuario(req, res) {
    const idUsuario = parseIdParam(req.params.idUsuario);
    if (!idUsuario) throw new AppError('USR_ID_INVALIDO');

    const dadoDeBaja = await usuarioRepo.darDeBaja(idUsuario);
    if (!dadoDeBaja) throw new AppError('USR_YA_BAJA');

    return res.status(200).json({ mensaje: 'Usuario dado de baja correctamente.' });
}

// POST /api/usuarios/:idUsuario/regenerar-vidas
async function regenerarVidas(req, res) {
    const idUsuario = parseIdParam(req.params.idUsuario);
    if (!idUsuario) throw new AppError('USR_ID_INVALIDO');

    const vidas = await usuarioRepo.regenerarVida(idUsuario);
    return res.status(200).json({ VidasActuales: vidas });
}

// GET /api/estadisticas/:idUsuario
async function obtenerEstadisticas(req, res) {
    const idUsuario = parseIdParam(req.params.idUsuario);
    if (!idUsuario) throw new AppError('USR_ID_INVALIDO');

    const estadisticasRepo = require('../repositories/estadisticas.repo');
    const stats = await estadisticasRepo.buscarPorUsuario(idUsuario);

    if (!stats) {
        return res.status(200).json({
            TotalFlashcardsVistas: 0, TotalAciertos: 0, TotalFallos: 0,
            TotalSesiones: 0, TotalGameOvers: 0, MejorRacha: 0,
            TiempoTotalEntrenamiento: 0, PrecisionPromedio: 0,
            PalabrasDominadas: 0, NivelActual: 1,
        });
    }

    return res.status(200).json(stats);
}

module.exports = {
    listarActivos,
    listarIntendentes,
    exportarIntendentes,
    exportarReclutas,
    registrarRecluta,
    darDeBajaUsuario,
    regenerarVidas,
    obtenerEstadisticas,
};
