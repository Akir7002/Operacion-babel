// Servicio de PROGRESO FLASHCARDS: algoritmo SM-2 (repeticion espaciada).
const sesionRepo = require('../repositories/sesion.repo');
const estadisticasRepo = require('../repositories/estadisticas.repo');

const DIA_MS = 86400000;

// Ejecuta el algoritmo SM-2 sobre el progreso de una flashcard y lo persiste.
async function registrarAvance({ idUsuario, idFlashcard, acierto }) {
    const calidad = acierto ? 5 : 0;
    const existente = await sesionRepo.buscarProgreso(idUsuario, idFlashcard);

    if (!existente) {
        const proximaRevision = new Date(Date.now() + (calidad >= 3 ? 1 : 0.007) * DIA_MS);
        await sesionRepo.crearProgreso(idUsuario, idFlashcard, { acierto, calidad, proximaRevision });
    } else {
        const nuevaVista = existente.vecesvista + 1;
        const nuevaAcertada = existente.vecesacertada + (acierto ? 1 : 0);
        const nuevaFallada = existente.vecesfallada + (acierto ? 0 : 1);

        const q = calidad;
        let n = existente.nivelconfianza;
        let ef = 2.5;

        if (q >= 3) {
            if (n === 0) { ef = 2.5; n = 1; }
            else if (n === 1) { n = 6; }
            else { n = Math.round(n * ef); }
        } else {
            n = 0;
        }

        ef = Math.max(1.3, ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

        const intervaloDias = n <= 1 ? 0.007 : (q >= 3 ? n / 1440 : 0.007);
        const proximaRevision = new Date(Date.now() + intervaloDias * DIA_MS);
        const dominada = nuevaAcertada >= 3 && (nuevaAcertada / nuevaVista) >= 0.75;

        await sesionRepo.actualizarProgreso(idUsuario, idFlashcard, {
            vecesVista: nuevaVista,
            vecesAcertada: nuevaAcertada,
            vecesFallada: nuevaFallada,
            nivelConfianza: n,
            proximaRevision,
            dominada,
        });
    }

    await estadisticasRepo.registrarVistaFlashcard(idUsuario, acierto);

    const precision = await estadisticasRepo.leerPrecisionYDominadas(idUsuario);
    if (precision) {
        await estadisticasRepo.actualizarPrecisionYDominadas(idUsuario, precision.precision, precision.dominadas);
    }
}

module.exports = { registrarAvance };
