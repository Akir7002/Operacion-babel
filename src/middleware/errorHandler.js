// Middleware central de errores: unifica TODAS las respuestas de fallo.
// Respuesta: { ok: false, codigo: 'BBL-XXX-NNN', error: 'mensaje humano', detalles?: '...' }
// El campo `error` se mantiene por compatibilidad con el frontend existente.
const AppError = require('../errors/AppError');
const CODIGOS = require('../errors/codes');

function esErrorDeBaseDeDatos(error) {
    return Boolean(error && typeof error.code === 'string' && error.code.startsWith('2'));
}

function errorHandler(error, req, res, next) { // eslint-disable-line no-unused-vars
    if (res.headersSent) {
        return next(error);
    }

    let appError;

    if (error instanceof AppError) {
        appError = error;
    } else if (esErrorDeBaseDeDatos(error)) {
        appError = new AppError('DB_ERROR', error.message);
    } else {
        appError = new AppError('GEN_INTERNO', error.message);
    }

    console.error(`[${appError.codigo}] ${req.method} ${req.originalUrl} -> ${appError.message}`, appError.detalles ? `| ${appError.detalles}` : '');

    return res.status(appError.httpStatus).json({
        ok: false,
        codigo: appError.codigo,
        error: appError.message,
        ...(appError.detalles ? { detalles: appError.detalles } : {}),
    });
}

// 404 para rutas API no existentes (debe registrarse DESPUES de las rutas, antes del errorHandler).
function rutaNoEncontrada(req, res) {
    return res.status(404).json({
        ok: false,
        codigo: CODIGOS.GEN_INTERNO.codigo,
        error: `Ruta no encontrada: ${req.method} ${req.path}`,
    });
}

module.exports = { errorHandler, rutaNoEncontrada };
