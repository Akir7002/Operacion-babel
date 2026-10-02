export interface User {
  IdUsuario: number;
  NombreClave: string;
  IdRango: number;
  RangoMilitar?: string;
  VidasActuales?: number;
  RachaDias?: number;
  PuntosTotales?: number;
}

export interface Deck {
  id: number;
  nombre: string;
  descripcion: string;
  idioma: string;
  idiomaNombre: string;
  categoria: string;
  nivel: number;
  nivelNombre: string;
  icono: string;
  totalFlashcards: number;
  completadas: number;
}

export interface Flashcard {
  id: number;
  orden: number;
  tipo: string;
  pregunta: string;
  respuesta: string;
  palabra: string;
  pronunciacion: string;
  traduccion: string;
  contexto: string;
  categoria?: string;
}

export interface UserStats {
  PuntosTotales: number;
  TotalTarjetasEstudiadas: number;
  TotalFlashcardsVistas?: number;
  TotalAciertos?: number;
  TotalFallos?: number;
  TotalSesiones: number;
  TotalGameOvers: number;
  TiempoEstudioTotalSeg?: number;
  TiempoTotalEntrenamiento?: number;
  PrecisionPromedio: number;
  PalabrasCompletadasAhorcado: number;
  MejorRachaAhorcado: number;
  MejorRacha?: number;
  PalabrasDominadas?: number;
  RachaDias?: number;
  NivelActual?: number;
  VidasActuales?: number;
}

export interface Achievement {
  IdLogro: number;
  NombreLogro: string;
  Descripcion: string;
  PuntosRecompensa: number;
  IconoMilitar: string;
  CodigoCondicion?: string;
  Secreto?: boolean;
  Desbloqueado: boolean;
  FechaDesbloqueo?: string;
}
