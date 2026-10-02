import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';

const authService = new AuthService();

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { Correo, Contrasena, username, password } = req.body;
      const id = Correo || username;
      const pass = Contrasena || password;

      const result = await authService.login(id, pass);
      res.status(200).json({
        success: true,
        mensaje: 'Acceso concedido al Cuartel General.',
        ...result,
      });
    } catch (err: any) {
      res.status(401).json({
        success: false,
        error: err.message || 'Falla de autenticación.',
      });
    }
  }

  static async registerRecluta(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        nombre,
        contacto,
        contrasena,
        frenteAsignado,
        fechaAlistamiento,
        NombreCompleto,
        FrecuenciaContacto,
        Contrasena,
        FrenteAsignado,
        FechaAlistamiento,
      } = req.body;

      const result = await authService.registerRecluta({
        nombre: nombre || NombreCompleto,
        contacto: contacto || FrecuenciaContacto,
        contrasena: contrasena || Contrasena,
        frenteAsignado: frenteAsignado || FrenteAsignado,
        fechaAlistamiento: fechaAlistamiento || FechaAlistamiento,
      });

      res.status(201).json({
        success: true,
        mensaje: 'Recluta alistado con éxito.',
        data: result,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }

  static async registerAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        nombre,
        contacto,
        contrasena,
        securityKey,
        Nombre,
        Contacto,
        Contrasena,
        ClaveSeguridad,
      } = req.body;

      const result = await authService.registerAdmin({
        nombre: nombre || Nombre,
        contacto: contacto || Contacto,
        contrasena: contrasena || Contrasena,
        securityKey: securityKey || ClaveSeguridad,
      });

      res.status(201).json({
        success: true,
        mensaje: 'Oficial comandante acreditado exitosamente.',
        data: result,
      });
    } catch (err: any) {
      res.status(403).json({
        success: false,
        error: err.message,
      });
    }
  }
}
