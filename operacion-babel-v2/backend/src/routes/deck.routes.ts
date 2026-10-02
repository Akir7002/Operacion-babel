import { Router } from 'express';
import { DeckController } from '../controllers/deck.controller.js';

const router = Router();

router.get('/mazos', DeckController.getDecks);
router.get('/mazos/:id/flashcards', DeckController.getFlashcards);
router.get('/frases/:idIdioma', DeckController.getFrases);

export default router;
