import { Request, Response, NextFunction } from 'express';
import { GameService } from '../services/game.service.js';

const gameService = new GameService();

export class GameController {
  static async startSession(req: Request, res: Response, next: NextFunction) {
    try {
      const { IdUsuario, idUsuario, ModoJuego, modoJuego } = req.body;
      const user = IdUsuario || idUsuario;
      const mode = ModoJuego || modoJuego;

      const result = await gameService.startSession(user, mode);
      res.status(201).json({
        IdSesion: result.idSesion,
        VidasInicio: result.vidasInicio,
      });
    } catch (err) {
      next(err);
    }
  }

  static async finishSession(req: Request, res: Response, next: NextFunction) {
    try {
      const idSesion = parseInt(req.params.idSesion, 10);
      const {
        EstadoSesion,
        estadoSesion,
        VidasFinal,
        vidasFinal,
        PuntajeTotal,
        puntajeTotal,
        TiempoTotalSeg,
        tiempoTotalSeg,
      } = req.body;

      const result = await gameService.finishSession(idSesion, {
        estadoSesion: EstadoSesion || estadoSesion,
        vidasFinal: VidasFinal !== undefined ? VidasFinal : vidasFinal,
        puntajeTotal: PuntajeTotal || puntajeTotal,
        tiempoTotalSeg: TiempoTotalSeg || tiempoTotalSeg,
      });

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async gameOver(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        IdUsuario,
        idUsuario,
        IdSesion,
        idSesion,
        CausaMuerte,
        causaMuerte,
        ProgresoPerdido,
        progresoPerdido,
        MensajeFinal,
        mensajeFinal,
      } = req.body;

      const result = await gameService.recordGameOver(
        IdUsuario || idUsuario,
        IdSesion || idSesion,
        CausaMuerte || causaMuerte,
        ProgresoPerdido || progresoPerdido,
        MensajeFinal || mensajeFinal
      );

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async saveCardProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const { IdUsuario, idUsuario, IdFlashcard, idFlashcard, Acierto, acierto } = req.body;
      const result = await gameService.recordCardProgress(
        IdUsuario || idUsuario,
        IdFlashcard || idFlashcard,
        Acierto !== undefined ? Acierto : acierto
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async addPoints(req: Request, res: Response, next: NextFunction) {
    try {
      const { IdUsuario, idUsuario, Puntos, puntos, Fuente, fuente } = req.body;
      const result = await gameService.addPoints(
        IdUsuario || idUsuario,
        Puntos !== undefined ? Puntos : puntos,
        Fuente || fuente || 'FLASHCARDS'
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async evaluateAchievements(req: Request, res: Response, next: NextFunction) {
    try {
      const { IdUsuario, idUsuario } = req.body;
      const user = IdUsuario || idUsuario;
      const result = await gameService.evaluateAchievements(user);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const idUsuario = parseInt(req.params.idUsuario, 10);
      const stats = await gameService.getStats(idUsuario);
      res.status(200).json(stats);
    } catch (err) {
      next(err);
    }
  }

  static async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const idUsuario = parseInt(req.params.idUsuario, 10);
      const history = await gameService.getHistory(idUsuario);
      res.status(200).json(history);
    } catch (err) {
      next(err);
    }
  }

  static async getAchievements(req: Request, res: Response, next: NextFunction) {
    try {
      const idUsuario = parseInt(req.params.idUsuario, 10);
      const achievements = await gameService.getAchievements(idUsuario);
      res.status(200).json(achievements);
    } catch (err) {
      next(err);
    }
  }
}
