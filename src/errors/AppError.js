// Error de aplicacion con codigo interno BBL-*.
// Los controllers lanzan esto; el errorHandler central lo convierte en respuesta HTTP.
const CODIGOS = require('./codes');

class AppError extends Error {
    constructor(claveCatalogo, detalles = null, mensajeOverride = null) {
        const def = CODIGOS[claveCatalogo] || CODIGOS.GEN_INTERNO;
        super(mensajeOverride || def.mensaje);
        this.name = 'AppError';
        this.claveCatalogo = CODIGOS[claveCatalogo] ? claveCatalogo : 'GEN_INTERNO';
        this.codigo = def.codigo;
        this.httpStatus = def.http;
        this.detalles = detalles || undefined;
    }
}

module.exports = AppError;
