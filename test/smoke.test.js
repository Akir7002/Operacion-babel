// Test de humo de la API de Operacion Babel.
// Uso: node test/smoke.test.js   (requiere el servidor corriendo y PostgreSQL activo)
// Verifica que la capa de rutas/controllers/services responda con los
// codigos internos BBL-* y el formato { ok, codigo, error } en los fallos.

const API = 'http://localhost:3000/api';

let pasados = 0;
let fallidos = 0;

async function llamar(metodo, ruta, cuerpo) {
    const opciones = { method: metodo, headers: { 'Content-Type': 'application/json' } };
    if (cuerpo) opciones.body = JSON.stringify(cuerpo);
    try {
        const res = await fetch(`${API}${ruta}`, opciones);
        let datos = null;
        try { datos = await res.json(); } catch (e) { /* CSV u otro formato */ }
        return { status: res.status, datos };
    } catch (e) {
        return { status: 0, datos: null, sinServidor: true };
    }
}

function verificar(nombre, condicion, extra = '') {
    if (condicion) {
        pasados += 1;
        console.log(`  [PASS] ${nombre}`);
    } else {
        fallidos += 1;
        console.log(`  [FAIL] ${nombre} ${extra}`);
    }
}

(async () => {
    console.log('═══ SMOKE TEST Operacion Babel ═══\n');

    // 0. Servidor arriba
    const ping = await llamar('GET', '/mazos');
    if (ping.sinServidor) {
        console.error('El servidor no responde en http://localhost:3000. Arrancalo con: node index.js');
        process.exit(1);
    }

    // 1. Contenido publico
    console.log('— Contenido —');
    const mazos = await llamar('GET', '/mazos');
    verificar('GET /mazos responde 200 con array', mazos.status === 200 && Array.isArray(mazos.datos));

    const flash = await llamar('GET', '/mazos/1/flashcards');
    verificar('GET /mazos/1/flashcards responde 200 con array', flash.status === 200 && Array.isArray(flash.datos));

    const frases = await llamar('GET', '/frases/1');
    verificar('GET /frases/1 responde 200 (columna tiempolimiteseg OK)', frases.status === 200 && Array.isArray(frases.datos));

    const frasesZh = await llamar('GET', '/frases/2');
    verificar('GET /frases/2 responde 200', frasesZh.status === 200 && Array.isArray(frasesZh.datos));

    // 2. Errores catalogados
    console.log('— Codigos de error BBL-* —');
    const loginMal = await llamar('POST', '/login', { Correo: 'no@existe.com', Contrasena: 'xxxx' });
    verificar('login falso -> 401 BBL-AUTH-002',
        loginMal.status === 401 && loginMal.datos?.codigo === 'BBL-AUTH-002',
        `(dio ${loginMal.status} ${loginMal.datos?.codigo})`);

    const claveMal = await llamar('POST', '/administradores/verificar-clave', { securityKey: 'incorrecta' });
    verificar('clave admin falsa -> 403 BBL-AUTH-004',
        claveMal.status === 403 && claveMal.datos?.codigo === 'BBL-AUTH-004',
        `(dio ${claveMal.status} ${claveMal.datos?.codigo})`);

    const claveBien = await llamar('POST', '/administradores/verificar-clave', { securityKey: process.env.ADMIN_SECURITY_KEY || 'Ak_Opb6202' });
    verificar('clave admin correcta -> 200 valido', claveBien.status === 200 && claveBien.datos?.valido === true);

    const ruta404 = await llamar('GET', '/ruta-que-no-existe');
    verificar('ruta inexistente -> 404 con codigo', ruta404.status === 404 && Boolean(ruta404.datos?.codigo));

    const reclutaMalo = await llamar('POST', '/reclutas', { nombre: '', contacto: '' });
    verificar('recluta incompleto -> 400 BBL-USR-005',
        reclutaMalo.status === 400 && reclutaMalo.datos?.codigo === 'BBL-USR-005',
        `(dio ${reclutaMalo.status} ${reclutaMalo.datos?.codigo})`);

    const fechaMala = await llamar('POST', '/reclutas', { nombre: 'T', contacto: 't@t.co', contrasena: '1234', fecha: '99/99/9999', frente: 'Frente Este (Русский)' });
    verificar('fecha invalida -> 400 BBL-VAL-001',
        fechaMala.status === 400 && fechaMala.datos?.codigo === 'BBL-VAL-001',
        `(dio ${fechaMala.status} ${fechaMala.datos?.codigo})`);

    // 3. Flujo de juego (usa el primer usuario activo)
    console.log('— Flujo de juego —');
    const activos = await llamar('GET', '/usuarios/activos');
    verificar('GET /usuarios/activos responde 200', activos.status === 200 && Array.isArray(activos.datos));

    if (Array.isArray(activos.datos) && activos.datos.length > 0) {
        const idUsuario = activos.datos[activos.datos.length - 1].IdUsuario; // el mas nuevo

        const sesion = await llamar('POST', '/sesiones', { IdUsuario: idUsuario, ModoJuego: 'TEST_SMOKE' });
        verificar('POST /sesiones crea sesion', sesion.status === 201 && Boolean(sesion.datos?.IdSesion));

        const progreso = await llamar('POST', '/flashcards/progreso', { IdUsuario: idUsuario, IdFlashcard: 1, Acierto: true });
        verificar('POST /flashcards/progreso registra', progreso.status === 200 && progreso.datos?.acierto === true);

        const puntos = await llamar('POST', '/puntos', { IdUsuario: idUsuario, Puntos: 1, Fuente: 'TEST_SMOKE' });
        verificar('POST /puntos registra con racha', puntos.status === 200 && puntos.datos?.puntosOtorgados === 1);

        const logros = await llamar('POST', '/logros/evaluar', { IdUsuario: idUsuario });
        verificar('POST /logros/evaluar responde 200 con array', logros.status === 200 && Array.isArray(logros.datos?.nuevosLogros));

        const listaLogros = await llamar('GET', `/logros/${idUsuario}`);
        verificar('GET /logros/:id responde 200 (tabla usuariologros OK)', listaLogros.status === 200 && Array.isArray(listaLogros.datos));

        const perfil = await llamar('GET', `/perfil/${idUsuario}`);
        verificar('GET /perfil/:id responde 200 con estructura', perfil.status === 200 && Boolean(perfil.datos?.usuario));

        const historial = await llamar('GET', `/perfil/${idUsuario}/historial`);
        verificar('GET /perfil/:id/historial responde 200', historial.status === 200);

        const stats = await llamar('GET', `/estadisticas/${idUsuario}`);
        verificar('GET /estadisticas/:id responde 200', stats.status === 200 && Boolean(stats.datos));

        if (sesion.datos?.IdSesion) {
            const fin = await llamar('PUT', `/sesiones/${sesion.datos.IdSesion}/finalizar`, { EstadoSesion: 'COMPLETADA', PuntajeTotal: 1, TiempoTotalSeg: 5 });
            verificar('PUT /sesiones/:id/finalizar responde 200', fin.status === 200);
        }
    } else {
        console.log('  [SKIP] sin usuarios activos en la BD para probar el flujo');
    }

    console.log(`\n═══ RESULTADO: ${pasados} PASS / ${fallidos} FAIL ═══`);
    process.exit(fallidos > 0 ? 1 : 0);
})();
