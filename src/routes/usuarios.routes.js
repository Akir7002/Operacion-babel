// Router de usuarios, reclutas, intendentes y exportaciones.
const express = require('express');
const router = express.Router();
const controller = require('../controllers/usuarios.controller');

router.get('/usuarios/activos', controller.listarActivos);
router.get('/intendentes/activos', controller.listarIntendentes);
router.get('/exportar/intendentes', controller.exportarIntendentes);
router.get('/exportar/reclutas', controller.exportarReclutas);
router.post('/reclutas', controller.registrarRecluta);
router.delete('/usuarios/:idUsuario', controller.darDeBajaUsuario);
router.post('/usuarios/:idUsuario/regenerar-vidas', controller.regenerarVidas);
router.get('/estadisticas/:idUsuario', controller.obtenerEstadisticas);

module.exports = router;
