// Configuracion de seguridad del backend.
// La clave de acceso administrativo vive SOLO aqui (o mejor, en .env).
// Nunca debe exponerse al frontend.
const ADMIN_SECURITY_KEY = process.env.ADMIN_SECURITY_KEY || 'Ak_Opb6202';

function esClaveAdminValida(clave) {
    return String(clave || '').trim() === ADMIN_SECURITY_KEY;
}

module.exports = { ADMIN_SECURITY_KEY, esClaveAdminValida };
