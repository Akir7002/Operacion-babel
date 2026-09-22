// Servicio de PERFIL: arma la ficha del soldado (con datos avanzados simulados,
// fiel al comportamiento del backend original) y el historial de misiones.
const usuarioRepo = require('../repositories/usuario.repo');
const sesionRepo = require('../repositories/sesion.repo');
const AppError = require('../errors/AppError');

const RANGOS = {
    1: { nombre: 'Recluta', icono: 'bi-person-badge' },
    2: { nombre: 'Operador', icono: 'bi-crosshair' },
    3: { nombre: 'General', icono: 'bi-star-fill' },
};

function rangoDe(idRango) {
    return RANGOS[idRango] || RANGOS[1];
}

function siguienteRangoDe(idRango, puntosTotales) {
    return {
        nombre: idRango === 1 ? 'Operador' : (idRango === 2 ? 'General' : 'Comandante Supremo'),
        nivelRequerido: idRango === 1 ? 500 : 2000,
        puntosActuales: puntosTotales,
    };
}

// Logros e historial simulados para usuarios avanzados (comportamiento legado).
function logrosSimulados(esAvanzado) {
    return esAvanzado ? [
        { nombre: 'Primera Sangre', descripcion: 'Completar tu primera flashcard', icono: 'bi-droplet-fill', fecha: '2026-01-16', puntos: 10, secreto: 0, desbloqueado: 1 },
        { nombre: 'Superviviente', descripcion: 'Sobrevivir 7 dias consecutivos', icono: 'bi-tent-fill', fecha: '2026-01-22', puntos: 100, secreto: 0, desbloqueado: 1 },
        { nombre: 'Francotirador', descripcion: '10 aciertos seguidos sin fallos', icono: 'bi-bullseye', fecha: '2026-02-05', puntos: 50, secreto: 0, desbloqueado: 1 },
        { nombre: 'Maquina de Guerra', descripcion: 'Alcanzar 1000 puntos tacticos', icono: 'bi-lightning-fill', fecha: '2026-03-10', puntos: 200, secreto: 1, desbloqueado: 1 },
    ] : [
        { nombre: 'Primera Sangre', descripcion: 'Completar tu primera flashcard', icono: 'bi-droplet-fill', fecha: null, puntos: 10, secreto: 0, desbloqueado: 0 },
        { nombre: 'Superviviente', descripcion: 'Sobrevivir 7 dias consecutivos', icono: 'bi-tent-fill', fecha: null, puntos: 100, secreto: 0, desbloqueado: 0 },
    ];
}

function historialSimulado(esAvanzado) {
    return esAvanzado ? [
        { titulo: 'Ascenso a Rango Elite', fecha: '2026-05-30 18:00', puntos: 500, tipo: 'INFILTRACION' },
        { titulo: 'Dominio de Vocabulario Ruso', fecha: '2026-05-28 14:30', puntos: 150, tipo: 'FLASHCARDS' },
    ] : [];
}

function estadisticasSimuladas(esAvanzado, idRango) {
    return esAvanzado ? {
        totalFlashcardsVistas: 450,
        totalAciertos: 410,
        totalFallos: 40,
        totalSesiones: 56,
        mejorRacha: 24,
        tiempoTotalEntrenamiento: 1200,
        precisionPromedio: 91.1,
        nivelActual: idRango,
        palabrasDominadas: 250,
    } : {
        totalFlashcardsVistas: 0,
        totalAciertos: 0,
        totalFallos: 0,
        totalSesiones: 0,
        mejorRacha: 0,
        tiempoTotalEntrenamiento: 0,
        precisionPromedio: 0,
        nivelActual: idRango,
        palabrasDominadas: 0,
    };
}

async function armarPerfil(idUsuario) {
    const user = await usuarioRepo.buscarDatosPerfil(idUsuario);
    if (!user) {
        throw new AppError('USR_NO_ENCONTRADO');
    }

    const { nombre, icono } = rangoDe(user.idrango);
    const esAvanzado = user.puntostotales > 1000;

    return {
        usuario: {
            nombreClave: user.nombreclave,
            idRango: user.idrango,
            rango: nombre,
            rangoIcono: icono,
            vidasActuales: user.vidasactuales,
            rachaDias: esAvanzado ? 24 : 1,
            puntosTotales: user.puntostotales,
            idiomaPreferido: user.frenteasignado?.includes('Este') ? 'Ruso' : 'Chino',
            estadoCuenta: user.estadocuenta,
            fechaRegistro: user.fechaalistamiento,
            frenteAsignado: user.frenteasignado,
        },
        estadisticas: estadisticasSimuladas(esAvanzado, user.idrango),
        logros: logrosSimulados(esAvanzado),
        historial: historialSimulado(esAvanzado),
        siguienteRango: siguienteRangoDe(user.idrango, user.puntostotales),
    };
}

async function obtenerHistorial(idUsuario) {
    const [gameOvers, sesiones] = await Promise.all([
        sesionRepo.listarHistorialGameOver(idUsuario),
        sesionRepo.listarSesionesCompletadas(idUsuario),
    ]);

    return [...gameOvers, ...sesiones]
        .filter((e) => e.fecha)
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .slice(0, 20);
}

module.exports = { armarPerfil, obtenerHistorial };
