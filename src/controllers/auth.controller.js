// Controllers de AUTENTICACION.
const authService = require('../services/auth.service');

// POST /api/login
async function login(req, res) {
    const { Correo, Contrasena } = req.body || {};
    const resultado = await authService.login({ correo: Correo, contrasena: Contrasena });
    return res.status(200).json(resultado);
}

// POST /api/recuperar-contrasena
async function recuperarContrasena(req, res) {
    const resultado = await authService.solicitarRecuperacion({ correo: req.body?.Correo });
    return res.status(200).json(resultado);
}

// POST /api/restablecer-contrasena
async function restablecerContrasena(req, res) {
    const resultado = await authService.restablecerContrasena({
        token: req.body?.token,
        nuevaContrasena: req.body?.nuevaContrasena,
    });
    return res.status(200).json(resultado);
}

module.exports = { login, recuperarContrasena, restablecerContrasena };
