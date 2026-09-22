// Router de perfil, historial y configuracion de usuario.
const express = require('express');
const router = express.Router();
const controller = require('../controllers/perfil.controller');

router.get('/perfil/:idUsuario', controller.obtenerPerfil);
router.get('/perfil/:idUsuario/historial', controller.obtenerHistorial);
router.get('/configuracion/:idUsuario', controller.obtenerConfiguracion);
router.put('/configuracion/:idUsuario', controller.actualizarConfiguracion);

module.exports = router;