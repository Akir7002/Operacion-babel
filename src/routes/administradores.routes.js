// Router de administradores e intendentes (rutas protegidas por clave de seguridad).
const express = require('express');
const router = express.Router();
const controller = require('../controllers/administradores.controller');

// La clave se valida en el controller/service; nunca se envia al cliente.
router.post('/administradores/verificar-clave', controller.verificarClave);
router.post('/administradores', controller.registrarAdministrador);
router.delete('/administradores/:idUsuario', controller.eliminarAdministrador);
router.post('/intendentes', controller.registrarIntendente);

module.exports = router;
