// Servicio de AUTENTICACION: login, recuperacion y restablecimiento de contrasena.
const crypto = require('crypto');
const usuarioRepo = require('../repositories/usuario.repo');
const registroRepo = require('../repositories/registro.repo');
const alistamientoService = require('./alistamiento.service');
const AppError = require('../errors/AppError');

// Tokens de recuperacion en memoria (simulados), igual que el backend original.
const recoveryTokens = new Map();
const TOKEN_TTL_MS = 15 * 60 * 1000;

function esCuentaActiva(usuario) {
    return usuario && usuario.estadocuenta === 'ACTIVA';
}

async function login({ correo, contrasena }) {
    if (!correo || !contrasena) {
        throw new AppError('AUTH_CREDENCIALES_INCOMPLETAS');
    }

    const hashContrasena = alistamientoService.hashearContrasena(contrasena);
    const usuario = await usuarioRepo.buscarPorCredenciales(correo, hashContrasena);

    if (!usuario) {
        throw new AppError('AUTH_CREDENCIALES_INVALIDAS');
    }
    if (!esCuentaActiva(usuario)) {
        throw new AppError('AUTH_CUENTA_INACTIVA');
    }

    await usuarioRepo.actualizarUltimaConexion(usuario.idusuario);

    return {
        mensaje: 'Acceso concedido.',
        usuario: {
            IdUsuario: usuario.idusuario,
            NombreClave: usuario.nombreclave,
            IdRango: usuario.idrango,
        },
    };
}

async function solicitarRecuperacion({ correo }) {
    if (!correo) {
        throw new AppError('AUTH_CREDENCIALES_INCOMPLETAS', null, 'Ingresa tu correo electronico.');
    }

    const usuario = await registroRepo.buscarPorCorreoActivo(correo);
    if (!usuario) {
        throw new AppError('USR_CORREO_NO_EXISTE');
    }

    const token = crypto.randomBytes(32).toString('hex');
    recoveryTokens.set(token, {
        idUsuario: usuario.idusuario,
        nombreClave: usuario.nombreclave,
        expira: Date.now() + TOKEN_TTL_MS,
    });

    console.log('\n═══ RECUPERACION DE CONTRASENA ═══');
    console.log(`Usuario: ${usuario.nombreclave}`);
    console.log(`Correo: ${correo}`);
    console.log(`Token: ${token}`);
    console.log('Expira en 15 minutos.\n');

    return {
        mensaje: 'Se genero un token de recuperacion.',
        token,
        nombreClave: usuario.nombreclave,
    };
}

async function restablecerContrasena({ token, nuevaContrasena }) {
    if (!token || !nuevaContrasena) {
        throw new AppError('AUTH_CREDENCIALES_INCOMPLETAS', null, 'Token y nueva contrasena son requeridos.');
    }
    if (nuevaContrasena.length < 4) {
        throw new AppError('USR_PASSWORD_CORTA');
    }

    const datos = recoveryTokens.get(token);
    if (!datos) {
        throw new AppError('AUTH_TOKEN_INVALIDO');
    }
    if (Date.now() > datos.expira) {
        recoveryTokens.delete(token);
        throw new AppError('AUTH_TOKEN_EXPIRADO');
    }

    const hashContrasena = alistamientoService.hashearContrasena(nuevaContrasena);
    await usuarioRepo.actualizarPassword(datos.idUsuario, hashContrasena);
    recoveryTokens.delete(token);

    return {
        mensaje: 'Contrasena actualizada correctamente.',
        nombreClave: datos.nombreClave,
    };
}

module.exports = { login, solicitarRecuperacion, restablecerContrasena };
