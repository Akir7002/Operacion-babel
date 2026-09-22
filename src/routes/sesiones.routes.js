// Router de sesiones de entrenamiento, progreso SM-2, puntos y logros.
const express = require('express');
const router = express.Router();
const controller = require('../controllers/sesiones.controller');

router.post('/sesiones', controller.crearSesion);
router.put('/sesiones/:idSesion/finalizar', controller.finalizarSesion);
router.post('/game-over', controller.registrarGameOver);
router.post('/flashcards/progreso', controller.registrarProgresoFlashcard);
router.post('/puntos', controller.registrarPuntos);
router.post('/logros/evaluar', controller.evaluarLogros);
router.get('/logros/:idUsuario', controller.listarLogros);

module.exports = router;
