import { GameRepository } from '../repositories/game.repository.js';

export class GameService {
  private gameRepo: GameRepository;

  constructor() {
    this.gameRepo = new GameRepository();
  }

  async startSession(idUsuario: number, modoJuego: string = 'FLASHCARDS') {
    const vidas = await this.gameRepo.getUserLives(idUsuario);
    if (vidas === null) {
      throw new Error('Usuario militar no encontrado.');
    }
    const idSesion = await this.gameRepo.createSesion(idUsuario, vidas, modoJuego);
    return { idSesion, vidasInicio: vidas };
  }

  async finishSession(
    idSesion: number,
    data: {
      estadoSesion?: string;
      vidasFinal?: number | null;
      puntajeTotal?: number;
      tiempoTotalSeg?: number;
    }
  ) {
    if (!idSesion) throw new Error('Id de sesión inválido.');
    await this.gameRepo.finalizarSesion(
      idSesion,
      data.estadoSesion || 'COMPLETADA',
      data.vidasFinal ?? null,
      data.puntajeTotal || 0,
      data.tiempoTotalSeg || 0
    );
    return { mensaje: 'Sesión táctica finalizada exitosamente.' };
  }

  async recordGameOver(
    idUsuario: number,
    idSesion: number | null,
    causaMuerte: string = 'Vidas agotadas',
    progresoPerdido: number = 0,
    mensajeFinal: string = 'Misión fallida'
  ) {
    if (!idUsuario) throw new Error('Id de usuario requerido.');
    await this.gameRepo.registrarGameOver(idUsuario, idSesion, causaMuerte, progresoPerdido, mensajeFinal);
    return { mensaje: 'Baja en combate registrada (Game Over).' };
  }

  async recordCardProgress(idUsuario: number, idFlashcard: number, acierto: boolean) {
    if (!idUsuario || !idFlashcard) {
      throw new Error('IdUsuario e IdFlashcard son requeridos.');
    }
    await this.gameRepo.guardarProgresoFlashcard(idUsuario, idFlashcard, acierto);
    return { mensaje: 'Progreso de inteligencia memorística registrado.' };
  }

  async addPoints(idUsuario: number, puntos: number, fuente: string = 'FLASHCARDS') {
    if (!idUsuario) throw new Error('Id de usuario requerido.');
    const result = await this.gameRepo.actualizarPuntos(idUsuario, puntos || 0, fuente);
    const nuevosLogros = await this.gameRepo.evaluarLogros(idUsuario);
    return { ...result, nuevosLogros };
  }

  async evaluateAchievements(idUsuario: number) {
    if (!idUsuario) throw new Error('Id de usuario requerido.');
    const nuevosLogros = await this.gameRepo.evaluarLogros(idUsuario);
    return { nuevosLogros };
  }

  async getStats(idUsuario: number) {
    if (!idUsuario) throw new Error('Id de usuario requerido.');
    return await this.gameRepo.getEstadisticas(idUsuario);
  }

  async getHistory(idUsuario: number) {
    if (!idUsuario) throw new Error('Id de usuario requerido.');
    return await this.gameRepo.getHistorialSesiones(idUsuario);
  }

  async getAchievements(idUsuario: number) {
    if (!idUsuario) throw new Error('Id de usuario requerido.');
    return await this.gameRepo.getLogros(idUsuario);
  }
}
