export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: Record<string, any>;
}

export interface TokenPayload {
  idUsuario: number;
  nombreClave: string;
  idRango: number;
}

export interface User {
  idUsuario: number;
  nombreClave: string;
  idRango: number;
  nombreRango?: string;
  idIdiomaPreferido?: number | null;
  activo?: boolean;
}

export interface Deck {
  idMazo: number;
  titulo: string;
  descripcion: string;
  idIdioma: number;
  codigoIdioma?: string;
  nombreIdioma?: string;
  idNivel: number;
  nombreNivel?: string;
  totalTarjetas?: number;
}

export interface Flashcard {
  idFlashcard: number;
  idMazo: number;
  palabra: string;
  pronunciacion: string;
  traduccion: string;
  contextoUso: string;
  categoria?: string;
}

export interface GameSession {
  idSesion?: number;
  idUsuario: number;
  idTipoJuego: number; // 1: Flashcards, 2: Ahorcado
  idMazo?: number | null;
  puntajeObtenido?: number;
  aciertos?: number;
  errores?: number;
  completada?: boolean;
}

export interface UserStats {
  idUsuario: number;
  puntosTotales: number;
  nivelActual: number;
  tarjetasDominadas: number;
  partidasJugadas: number;
  partidasGanadas: number;
  rachaActual: number;
  mejorRacha: number;
}
