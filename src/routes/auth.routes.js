// Router de autenticacion.
const express = require('express');
const router = express.Router();
const controller = require('../controllers/auth.controller');

router.post('/login', controller.login);
router.post('/recuperar-contrasena', controller.recuperarContrasena);
router.post('/restablecer-contrasena', controller.restablecerContrasena);

module.exports = router;
