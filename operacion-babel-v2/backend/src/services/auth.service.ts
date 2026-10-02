import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/user.repository.js';
import { ENV } from '../config/env.js';
import { TokenPayload } from '../types/index.js';

export class AuthService {
  private userRepo: UserRepository;

  constructor() {
    this.userRepo = new UserRepository();
  }

  async login(correoOrNombreClave: string, contrasena: string) {
    if (!correoOrNombreClave || !contrasena) {
      throw new Error('Credenciales incompletas.');
    }

    // Buscar por correo (frecuenciaContacto) o por NombreClave
    let user = await this.userRepo.findByContacto(correoOrNombreClave);
    if (!user) {
      user = await this.userRepo.findByNombreClave(correoOrNombreClave);
    }

    if (!user) {
      throw new Error('Credenciales inválidas.');
    }

    if (user.estadocuenta !== 'ACTIVA') {
      throw new Error('La cuenta táctica no se encuentra activa.');
    }

    // Verificación de contraseña: Soporta bcrypt y compatibilidad con SHA-256 legacy
    let isValidPassword = false;
    const storedHash = user.hashcontrasena || '';

    if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$')) {
      isValidPassword = await bcrypt.compare(contrasena, storedHash);
    } else {
      // Comparación legacy SHA-256
      const sha256Candidate = crypto.createHash('sha256').update(contrasena).digest('hex');
      isValidPassword = sha256Candidate.toLowerCase() === storedHash.toLowerCase();

      // Migración transparente a bcrypt
      if (isValidPassword) {
        const newBcryptHash = await bcrypt.hash(contrasena, 10);
        await this.userRepo.updatePasswordHash(user.idusuario, newBcryptHash);
      }
    }

    if (!isValidPassword) {
      throw new Error('Credenciales inválidas.');
    }

    await this.userRepo.updateUltimaConexion(user.idusuario);

    const payload: TokenPayload = {
      idUsuario: user.idusuario,
      nombreClave: user.nombreclave,
      idRango: user.idrango,
    };

    const token = jwt.sign(payload, ENV.JWT.SECRET, {
      expiresIn: ENV.JWT.EXPIRES_IN as any,
    });

    return {
      token,
      usuario: {
        IdUsuario: user.idusuario,
        NombreClave: user.nombreclave,
        IdRango: user.idrango,
        VidasActuales: user.vidasactuales ?? 5,
      },
    };
  }

  async registerRecluta(data: {
    nombre: string;
    contacto: string;
    contrasena: string;
    frenteAsignado?: string;
    fechaAlistamiento?: string;
  }) {
    if (!data.nombre || !data.contacto || !data.contrasena) {
      throw new Error('Nombre, contacto y contraseña son obligatorios.');
    }

    const existing = await this.userRepo.findByContacto(data.contacto);
    if (existing) {
      throw new Error('Ya existe un recluta registrado con este contacto/correo.');
    }

    const salt = await bcrypt.genSalt(10);
    const hashContrasena = await bcrypt.hash(data.contrasena, salt);

    // Generar nombre clave táctico
    const baseName = data.nombre
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, 10) || 'RECLUTA';
    const candidateName = `${baseName}-${Math.floor(Math.random() * 900) + 100}`;

    let idioma = 1; // Ruso por defecto
    const frente = (data.frenteAsignado || '').toLowerCase();
    if (frente.includes('oriental') || frente.includes('mandarin') || frente.includes('zh')) {
      idioma = 2; // Mandarín
    }

    return await this.userRepo.createReclutaTransaction({
      nombre: data.nombre,
      contacto: data.contacto,
      hashContrasena,
      idRango: 1, // Recluta
      fechaAlistamiento: data.fechaAlistamiento || null,
      frenteAsignado: data.frenteAsignado || 'Frente Oriental (Ruso)',
      nombreClave: candidateName,
      idiomaPreferido: idioma,
    });
  }

  async registerAdmin(data: {
    nombre: string;
    contacto: string;
    contrasena: string;
    securityKey: string;
  }) {
    if (data.securityKey !== ENV.BOOTSTRAP_ADMIN_KEY) {
      throw new Error('Clave maestra de autorización militar incorrecta.');
    }

    const salt = await bcrypt.genSalt(10);
    const hashContrasena = await bcrypt.hash(data.contrasena, salt);

    const baseName = data.nombre
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, 10) || 'OFICIAL';
    const candidateName = `OFC-${baseName}-${Math.floor(Math.random() * 90) + 10}`;

    return await this.userRepo.createReclutaTransaction({
      nombre: data.nombre,
      contacto: data.contacto,
      hashContrasena,
      idRango: 4, // Administrador / Intendente
      fechaAlistamiento: new Date().toISOString(),
      frenteAsignado: 'Cuartel General de Mando',
      nombreClave: candidateName,
      idiomaPreferido: 1,
    });
  }
}
