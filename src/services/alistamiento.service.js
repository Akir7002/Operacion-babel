// Servicio de ALISTAMIENTO: alta de reclutas, intendentes y administradores.
// Toda la transaccion (usuario + registro + estadisticas + configuracion) vive aqui.
const crypto = require('crypto');
const usuarioRepo = require('../repositories/usuario.repo');
const registroRepo = require('../repositories/registro.repo');
const estadisticasRepo = require('../repositories/estadisticas.repo');
const AppError = require('../errors/AppError');

function buildNombreClaveBase(nombreCompleto) {
    const normalized = (nombreCompleto || '')
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    const cleaned = normalized.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return cleaned.slice(0, 12) || 'RECLUTA';
}

async function generarNombreClave(client, nombreCompleto) {
    const base = buildNombreClaveBase(nombreCompleto);
    for (let i = 0; i < 6; i += 1) {
        const suffix = i === 0 ? '' : `-${String(Math.floor(Math.random() * 900) + 100)}`;
        const candidate = `${base}${suffix}`;
        if (!(await usuarioRepo.existeNombreClave(client, candidate))) {
            return candidate;
        }
    }
    return `${base}-${Date.now().toString().slice(-4)}`;
}

function resolveIdiomaPreferido(frenteAsignado) {
    if (!frenteAsignado) return null;
    const lower = frenteAsignado.toLowerCase();
    if (lower.includes('frente este') || lower.includes('ruso') || lower.includes('ru')) {
        return 1;
    }
    if (lower.includes('frente oriental') || lower.includes('mandarin') || lower.includes('zh')) {
        return 2;
    }
    return null;
}

function parseFechaAlistamiento(value) {
    if (!value) return null;
    const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return null;
    }
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function dayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    return Math.floor(diff / 86400000);
}

function generarCodigoAlistamiento(fechaBase, idRegistro) {
    const fecha = fechaBase instanceof Date ? fechaBase : new Date();
    const ordinal = String(dayOfYear(fecha)).padStart(3, '0');
    const correlativo = String(idRegistro).padStart(3, '0');
    return `AL-${ordinal}-${correlativo}`;
}

function hashearContrasena(contrasena) {
    return crypto.createHash('sha256').update(contrasena).digest('hex');
}

// Transaccion completa: usuarios -> registrosalistamiento -> estadisticas -> configuracionusuario.
async function registrarUsuarioConRegistro({ nombre, contacto, contrasena, idRango, fechaAlistamiento, frenteAsignado }) {
    const client = await usuarioRepo.abrirTransaccion();
    try {
        await client.query('BEGIN');

        const nombreClave = await generarNombreClave(client, nombre);
        const hashContrasena = hashearContrasena(contrasena);
        const idiomaPreferido = resolveIdiomaPreferido(frenteAsignado || contacto);

        const usuario = await usuarioRepo.insertarUsuario(client, { nombreClave, hashContrasena, idiomaPreferido, idRango });

        const idRegistro = await registroRepo.insertarRegistro(client, {
            idUsuario: usuario.idusuario,
            nombre, contacto,
            fechaAlistamiento,
            frenteAsignado,
        });

        const codigoAlistamiento = generarCodigoAlistamiento(new Date(), idRegistro);
        await registroRepo.guardarCodigoAlistamiento(client, idRegistro, codigoAlistamiento);

        await client.query(`INSERT INTO estadisticas (idusuario) VALUES ($1) ON CONFLICT DO NOTHING`, [usuario.idusuario]);
        await client.query(`INSERT INTO configuracionusuario (idusuario) VALUES ($1) ON CONFLICT DO NOTHING`, [usuario.idusuario]);

        await client.query('COMMIT');

        return { idUsuario: usuario.idusuario, nombreClave, codigoAlistamiento };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

// Validaciones de la fecha de alistamiento (dd/mm/aaaa, debe ser hoy).
async function validarFechaAlistamiento(fecha) {
    const fechaISO = parseFechaAlistamiento(fecha);
    if (!fechaISO) {
        throw new AppError('VAL_FECHA_INVALIDA');
    }
    const hoy = new Date();
    const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    if (fechaISO !== hoyStr) {
        throw new AppError('VAL_FECHA_NO_HOY');
    }
    return fechaISO;
}

module.exports = {
    registrarUsuarioConRegistro,
    validarFechaAlistamiento,
    hashearContrasena,
    generarCodigoAlistamiento,
};
