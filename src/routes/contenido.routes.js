// Router de contenido: mazos, flashcards y frases del ahorcado.
const express = require('express');
const router = express.Router();
const controller = require('../controllers/contenido.controller');

router.get('/mazos', controller.listarMazos);
router.get('/mazos/:id/flashcards', controller.listarFlashcards);
router.get('/frases/:idIdioma', controller.listarFrases);

module.exports = router;
