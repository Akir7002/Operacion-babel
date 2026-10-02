import { Request, Response, NextFunction } from 'express';
import { DeckService } from '../services/deck.service.js';

const deckService = new DeckService();

export class DeckController {
  static async getDecks(_req: Request, res: Response, next: NextFunction) {
    try {
      const decks = await deckService.getAllDecks();
      // Compatibilidad con frontend legacy devolviendo array directo
      res.status(200).json(decks);
    } catch (err) {
      next(err);
    }
  }

  static async getFlashcards(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const cards = await deckService.getFlashcardsByDeck(id);
      res.status(200).json(cards);
    } catch (err) {
      next(err);
    }
  }

  static async getFrases(req: Request, res: Response, next: NextFunction) {
    try {
      const idIdioma = parseInt(req.params.idIdioma, 10);
      const frases = await deckService.getFrases(idIdioma);
      res.status(200).json(frases);
    } catch (err) {
      next(err);
    }
  }
}
