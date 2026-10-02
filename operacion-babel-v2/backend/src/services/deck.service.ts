import { DeckRepository } from '../repositories/deck.repository.js';

export class DeckService {
  private deckRepo: DeckRepository;

  constructor() {
    this.deckRepo = new DeckRepository();
  }

  async getAllDecks() {
    return await this.deckRepo.findAllDecks();
  }

  async getFlashcardsByDeck(deckId: number) {
    if (!deckId || isNaN(deckId)) {
      throw new Error('Identificador de mazo inválido.');
    }
    return await this.deckRepo.findFlashcardsByDeckId(deckId);
  }

  async getFrases(idiomaId: number) {
    if (!idiomaId || isNaN(idiomaId)) {
      throw new Error('Identificador de idioma inválido.');
    }
    return await this.deckRepo.findFrasesByIdioma(idiomaId);
  }
}
