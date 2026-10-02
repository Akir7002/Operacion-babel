import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service.js';

const userService = new UserService();

export class UserController {
  static async getActiveUsers(_req: Request, res: Response, next: NextFunction) {
    try {
      const users = await userService.getActiveUsers(false);
      res.status(200).json(users);
    } catch (err) {
      next(err);
    }
  }

  static async getActiveIntendentes(_req: Request, res: Response, next: NextFunction) {
    try {
      const users = await userService.getActiveUsers(true);
      res.status(200).json(users);
    } catch (err) {
      next(err);
    }
  }

  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const idUsuario = parseInt(req.params.idUsuario, 10);
      const profile = await userService.getProfile(idUsuario);
      res.status(200).json(profile);
    } catch (err) {
      next(err);
    }
  }

  static async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const idUsuario = parseInt(req.params.idUsuario, 10);
      const result = await userService.deleteUser(idUsuario);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const idUsuario = parseInt(req.params.idUsuario, 10);
      const config = await userService.getConfig(idUsuario);
      res.status(200).json(config);
    } catch (err) {
      next(err);
    }
  }

  static async updateConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const idUsuario = parseInt(req.params.idUsuario, 10);
      const { ModoDaltonico, modoDaltonico, AnimacionesReducidas, animacionesReducidas } = req.body;
      const daltonico = ModoDaltonico !== undefined ? ModoDaltonico : modoDaltonico;
      const reducidas = AnimacionesReducidas !== undefined ? AnimacionesReducidas : animacionesReducidas;

      const result = await userService.updateConfig(idUsuario, !!daltonico, !!reducidas);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async regenerateLives(req: Request, res: Response, next: NextFunction) {
    try {
      const idUsuario = parseInt(req.params.idUsuario, 10);
      const result = await userService.regenerateLives(idUsuario);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}
