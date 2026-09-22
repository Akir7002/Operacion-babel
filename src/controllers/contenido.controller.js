// Controllers de CONTENIDO: mazos, flashcards y frases del ahorcado.
const contenidoRepo = require('../repositories/contenido.repo');
const AppError = require('../errors/AppError');

function parseIdParam(value) {
    const id = Number.parseInt(value, 10);
    if (!Number.isFinite(id)) return null;
    return id;
}

// GET /api/mazos
async function listarMazos(req, res) {
    const mazos = await contenidoRepo.listarMazos();
    return res.status(200).json(mazos);
}

// GET /api/mazos/:id/flashcards
async function listarFlashcards(req, res) {
    const idMazo = parseIdParam(req.params.id);
    if (!idMazo) throw new AppError('VAL_ID_INVALIDO', null, 'Id de mazo invalido.');

    const flashcards = await contenidoRepo.listarFlashcardsPorMazo(idMazo);
    return res.status(200).json(flashcards);
}

// GET /api/frases/:idIdioma
async function listarFrases(req, res) {
    const idIdioma = parseIdParam(req.params.idIdioma);
    if (!idIdioma) throw new AppError('VAL_ID_INVALIDO', null, 'Id de idioma invalido.');

    const frases = await contenidoRepo.listarFrasesPorIdioma(idIdioma);
    return res.status(200).json(frases);
}

module.exports = { listarMazos, listarFlashcards, listarFrases };
