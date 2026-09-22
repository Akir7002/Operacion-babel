// Catalogo de codigos de error internos de Operacion Babel.
// Formato: BBL-<MODULO>-<NUMERO>. El frontend recibe { ok, codigo, error }.
const CODIGOS = Object.freeze({
    // AUTH - autenticacion y autorizacion
    AUTH_CREDENCIALES_INCOMPLETAS: { codigo: 'BBL-AUTH-001', http: 400, mensaje: 'Credenciales incompletas.' },
    AUTH_CREDENCIALES_INVALIDAS: { codigo: 'BBL-AUTH-002', http: 401, mensaje: 'Credenciales invalidas.' },
    AUTH_CUENTA_INACTIVA: { codigo: 'BBL-AUTH-003', http: 403, mensaje: 'La cuenta no esta activa.' },
    AUTH_CLAVE_INVALIDA: { codigo: 'BBL-AUTH-004', http: 403, mensaje: 'Clave de seguridad invalida.' },
    AUTH_TOKEN_INVALIDO: { codigo: 'BBL-AUTH-005', http: 400, mensaje: 'Token invalido.' },
    AUTH_TOKEN_EXPIRADO: { codigo: 'BBL-AUTH-006', http: 400, mensaje: 'Token expirado. Solicita uno nuevo.' },

    // USR - usuarios
    USR_NO_ENCONTRADO: { codigo: 'BBL-USR-001', http: 404, mensaje: 'Usuario no encontrado.' },
    USR_ID_INVALIDO: { codigo: 'BBL-USR-002', http: 400, mensaje: 'Id de usuario invalido.' },
    USR_YA_BAJA: { codigo: 'BBL-USR-003', http: 404, mensaje: 'El usuario no existe o ya no esta activo.' },
    USR_CORREO_NO_EXISTE: { codigo: 'BBL-USR-004', http: 404, mensaje: 'No se encontro una cuenta activa con ese correo.' },
    USR_DATOS_FALTANTES: { codigo: 'BBL-USR-005', http: 400, mensaje: 'Faltan datos obligatorios.' },
    USR_PASSWORD_CORTA: { codigo: 'BBL-USR-006', http: 400, mensaje: 'La contrasena debe tener al menos 4 caracteres.' },

    // VAL - validacion de payloads
    VAL_FECHA_INVALIDA: { codigo: 'BBL-VAL-001', http: 400, mensaje: 'Fecha invalida. Usa el formato dd/mm/aaaa.' },
    VAL_FECHA_NO_HOY: { codigo: 'BBL-VAL-002', http: 400, mensaje: 'La fecha de alistamiento debe ser el dia de hoy.' },
    VAL_ID_INVALIDO: { codigo: 'BBL-VAL-003', http: 400, mensaje: 'Id invalido.' },

    // MAZ - mazos y flashcards
    MAZ_NO_ENCONTRADO: { codigo: 'BBL-MAZ-001', http: 404, mensaje: 'Mazo inexistente.' },

    // SES - sesiones de entrenamiento
    SES_NO_ENCONTRADA: { codigo: 'BBL-SES-001', http: 404, mensaje: 'Sesion de juego no encontrada.' },

    // EXP - exportaciones
    EXP_SIN_DATOS: { codigo: 'BBL-EXP-001', http: 404, mensaje: 'No hay registros para exportar.' },

    // DB / GEN - infraestructura
    DB_ERROR: { codigo: 'BBL-DB-001', http: 500, mensaje: 'Fallo de base de datos.' },
    GEN_INTERNO: { codigo: 'BBL-GEN-001', http: 500, mensaje: 'Error interno del servidor.' },
});

module.exports = CODIGOS;
