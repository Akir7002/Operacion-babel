// Controllers de ADMINISTRADORES e INTENDENTES (acceso con clave de seguridad).
const usuarioRepo = require('../repositories/usuario.repo');
const alistamientoService = require('../services/alistamiento.service');
const security = require('../config/security');
const AppError = require('../errors/AppError');

function parseIdParam(value) {
    const id = Number.parseInt(value, 10);
    if (!Number.isFinite(id)) return null;
    return id;
}

function exigirClaveAdmin(securityKey) {
    if (!security.esClaveAdminValida(securityKey)) {
        throw new AppError('AUTH_CLAVE_INVALIDA');
    }
}

// POST /api/administradores/verificar-clave
// Validacion de clave SIN exponerla al cliente: el backend dice si/no.
async function verificarClave(req, res) {
    const { securityKey } = req.body || {};
    if (!security.esClaveAdminValida(securityKey)) {
        throw new AppError('AUTH_CLAVE_INVALIDA');
    }
    return res.status(200).json({ ok: true, valido: true, mensaje: 'Clave aceptada.' });
}

// POST /api/administradores
async function registrarAdministrador(req, res) {
    const { nombre, contacto, contrasena, securityKey } = req.body || {};

    if (!nombre || !contacto || !contrasena) {
        throw new AppError('USR_DATOS_FALTANTES', null, 'Faltan datos obligatorios para el administrador.');
    }
    exigirClaveAdmin(securityKey);

    const resultado = await alistamientoService.registrarUsuarioConRegistro({
        nombre, contacto, contrasena,
        idRango: 4,
        frenteAsignado: 'Acceso Administrativo',
        fechaAlistamiento: new Date(),
    });

    return res.status(201).json({
        mensaje: 'Administrador registrado.',
        datos: {
            IdUsuario: resultado.idUsuario,
            IdRango: 4,
            NombreClave: resultado.nombreClave,
            CodigoAlistamiento: resultado.codigoAlistamiento,
        },
    });
}

// DELETE /api/administradores/:idUsuario
async function eliminarAdministrador(req, res) {
    const idUsuario = parseIdParam(req.params.idUsuario);
    if (!idUsuario) throw new AppError('USR_ID_INVALIDO');

    exigirClaveAdmin(req.body?.securityKey);

    const eliminado = await usuarioRepo.eliminarAdministrador(idUsuario);
    if (!eliminado) {
        throw new AppError('USR_NO_ENCONTRADO', null, 'El administrador no existe o no tiene rango administrativo.');
    }

    return res.status(200).json({ mensaje: 'Administrador dado de baja correctamente.' });
}

// POST /api/intendentes
async function registrarIntendente(req, res) {
    const { nombre, contacto, claveSeguridad, contrasena } = req.body || {};

    if (!nombre || !contacto || !claveSeguridad || !contrasena) {
        throw new AppError('USR_DATOS_FALTANTES', null, 'Faltan datos obligatorios para el intendente.');
    }
    exigirClaveAdmin(claveSeguridad);

    const resultado = await alistamientoService.registrarUsuarioConRegistro({
        nombre, contacto, contrasena,
        idRango: 4,
        frenteAsignado: 'Acceso Intendente',
        fechaAlistamiento: new Date(),
    });

    return res.status(201).json({
        mensaje: 'Intendente registrado.',
        datos: {
            IdUsuario: resultado.idUsuario,
            IdRango: 4,
            NombreClave: resultado.nombreClave,
            CodigoAlistamiento: resultado.codigoAlistamiento,
        },
    });
}

module.exports = {
    verificarClave,
    registrarAdministrador,
    eliminarAdministrador,
    registrarIntendente,
};
