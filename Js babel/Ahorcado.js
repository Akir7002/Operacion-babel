/* ═══════════════════════════════════════════════════════════════
   AHORCADO.JS - Modo Infiltración de Operación Babel
   ═══════════════════════════════════════════════════════════════ */

// Banco de palabras por nivel
const palabrasData = [
    // Nivel 1 - Clasificado (Fácil)
    [
        { palabra: 'КНИГА', pista: 'Objeto de lectura esencial en campo', idioma: 'ru' },
        { palabra: 'ВОДА', pista: 'Recurso vital para supervivencia', idioma: 'ru' },
        { palabra: 'ДОМ', pista: 'Estructura de refugio táctico', idioma: 'ru' },
        { palabra: '书', pista: 'Carácter de objeto de lectura', idioma: 'zh' },
        { palabra: '水', pista: 'Carácter de recurso vital', idioma: 'zh' },
        { palabra: '人', pista: 'Carácter de ser humano', idioma: 'zh' }
    ],
    // Nivel 2 - Secreto (Medio)
    [
        { palabra: 'ОРУЖИЕ', pista: 'Equipamiento táctico de combate', idioma: 'ru' },
        { palabra: 'ЩИТ', pista: 'Protección balística frontal', idioma: 'ru' },
        { palabra: 'ВРАЧ', pista: 'Especialista médico de campo', idioma: 'ru' },
        { palabra: '武器', pista: 'Sistema de armamento', idioma: 'zh' },
        { palabra: '密码', pista: 'Clave de acceso encriptada', idioma: 'zh' },
        { palabra: '医生', pista: 'Profesional de la medicina', idioma: 'zh' }
    ],
    // Nivel 3 - Ultra Secreto (Difícil)
    [
        { palabra: 'ОПАСНОСТЬ', pista: 'Señal de alerta inmediata', idioma: 'ru' },
        { palabra: 'УКРЫТИЕ', pista: 'Posición defensiva temporal', idioma: 'ru' },
        { palabra: 'ПИСТОЛЕТ', pista: 'Arma de mano para defensa cercana', idioma: 'ru' },
        { palabra: '间谍', pista: 'Agente encubierto hostil', idioma: 'zh' },
        { palabra: '监视', pista: 'Operación de observación continua', idioma: 'zh' },
        { palabra: '情报', pista: 'Datos clasificados de operación', idioma: 'zh' }
    ]
];

const partesAhorcado = [
    'part-head',
    'part-body', 
    'part-arm-left',
    'part-arm-right',
    'part-leg-left',
    'part-leg-right'
];

let gameState = {
    nivel: 0,
    idiomaSeleccionado: 'ru',
    palabraActual: '',
    pistaActual: '',
    idiomaActual: 'ru',
    letrasAdivinadas: [],
    letrasUsadas: [],
    errores: 0,
    vidas: 6,
    palabrasCompletadas: 0,
    racha: 0,
    mejorRacha: 0,
    juegoTerminado: false,
    idSesion: null,
    inicioTiempo: Date.now(),
    timerInterval: null,
    tiempoRestante: 0,
    intentosNivel: 0,
    frasesDB: { ru: [], zh: [] },
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    BabelUI.inicializarSidebar({ usaClaseEnBody: true });
    BabelUI.aplicarAccesibilidad();
    inicializarIdioma();
    inicializarTeclado();
    inicializarModales();
    BabelUI.inicializarScrollBehavior();

    cargarFrasesDB().then(() => iniciarNivel());
    crearSesion();
});

function inicializarIdioma() {
    const btnRu = document.getElementById('btnLangRu');
    const btnZh = document.getElementById('btnLangZh');
    
    if (btnRu && btnZh) {
        btnRu.addEventListener('click', () => {
            if (gameState.idiomaSeleccionado !== 'ru') {
                gameState.idiomaSeleccionado = 'ru';
                btnRu.classList.add('active');
                btnZh.classList.remove('active');
                btnRu.style.borderColor = 'var(--terminal-amber)';
                btnRu.style.color = 'var(--terminal-amber)';
                btnZh.style.borderColor = '#555';
                btnZh.style.color = '#555';
                inicializarTeclado();
                reiniciarJuego();
            }
        });

        btnZh.addEventListener('click', () => {
            if (gameState.idiomaSeleccionado !== 'zh') {
                gameState.idiomaSeleccionado = 'zh';
                btnZh.classList.add('active');
                btnRu.classList.remove('active');
                btnZh.style.borderColor = 'var(--terminal-amber)';
                btnZh.style.color = 'var(--terminal-amber)';
                btnRu.style.borderColor = '#555';
                btnRu.style.color = '#555';
                inicializarTeclado();
                reiniciarJuego();
            }
        });
    }
}

// ═══════════════════════════════════════════════════════════════
// CARGAR FRASES DESDE LA BASE DE DATOS (via window.BabelAPI)
// ═══════════════════════════════════════════════════════════════
async function cargarFrasesDB() {
    try {
        const [frasesRu, frasesZh] = await Promise.all([
            window.BabelAPI.listarFrases(1).catch(() => []),
            window.BabelAPI.listarFrases(2).catch(() => [])
        ]);
        gameState.frasesDB.ru = frasesRu || [];
        gameState.frasesDB.zh = frasesZh || [];
        console.log(`Frases cargadas: RU=${gameState.frasesDB.ru.length}, ZH=${gameState.frasesDB.zh.length}`);
    } catch (e) {
        console.warn('No se pudieron cargar frases de BD, usando banco local:', e);
    }
}

// ═══════════════════════════════════════════════════════════════
// SESION DE ENTRENAMIENTO
// ═══════════════════════════════════════════════════════════════
async function crearSesion() {
    const userId = BabelUI.obtenerIdUsuario();
    if (!userId) return;
    try {
        const data = await window.BabelAPI.crearSesion(userId, 'AHORCADO');
        if (data && data.IdSesion) {
            gameState.idSesion = data.IdSesion;
        }
    } catch (e) { console.warn('No se pudo crear sesion:', e.codigo || '', e.message); }
    gameState.inicioTiempo = Date.now();
}

// ═══════════════════════════════════════════════════════════════
// TEMPORIZADOR POR NIVEL
// ═══════════════════════════════════════════════════════════════
function iniciarTemporizador(segundos) {
    clearInterval(gameState.timerInterval);
    gameState.tiempoRestante = segundos;

    const timerEl = document.getElementById('timerDisplay');
    function actualizarTimer() {
        if (gameState.juegoTerminado || gameState.tiempoRestante <= 0) {
            clearInterval(gameState.timerInterval);
            if (gameState.tiempoRestante <= 0 && !gameState.juegoTerminado) {
                gameState.juegoTerminado = true;
                setTimeout(() => gameOver(), 500);
            }
            return;
        }
        gameState.tiempoRestante--;
        if (timerEl) {
            const min = Math.floor(gameState.tiempoRestante / 60);
            const seg = gameState.tiempoRestante % 60;
            timerEl.textContent = `${min}:${String(seg).padStart(2, '0')}`;
            if (gameState.tiempoRestante <= 10) timerEl.classList.add('critical');
            else timerEl.classList.remove('critical');
        }
    }
    actualizarTimer();
    gameState.timerInterval = setInterval(actualizarTimer, 1000);
}

// ═══════════════════════════════════════════════════════════════
// SINCRONIZAR PUNTOS CON EL SERVIDOR
// ═══════════════════════════════════════════════════════════════
async function sincronizarPuntos(puntos, fuente) {
    const userId = BabelUI.obtenerIdUsuario();
    if (!userId) return;
    try {
        await window.BabelAPI.registrarPuntos(userId, puntos, fuente);
    } catch (e) { console.warn('Error sincronizando puntos:', e.codigo || '', e.message); }
}

async function finalizarSesion(estado, vidasFinal, puntaje, tiempoSeg) {
    if (!gameState.idSesion) return;
    try {
        await window.BabelAPI.finalizarSesion(gameState.idSesion, {
            EstadoSesion: estado,
            VidasFinal: vidasFinal,
            PuntajeTotal: puntaje,
            TiempoTotalSeg: tiempoSeg
        });
    } catch (e) { console.warn('Error finalizando sesion:', e.codigo || '', e.message); }
}

// ═══════════════════════════════════════════════════════════════
// INICIAR NIVEL
// ═══════════════════════════════════════════════════════════════
function iniciarNivel() {
    let palabraObj = null;

    // Intentar usar frases de la BD primero
    const frasesNivel = gameState.frasesDB[gameState.idiomaSeleccionado];
    if (frasesNivel && frasesNivel.length > 0) {
        const nivelMap = { 0: 'Clasificado', 1: 'Secreto', 2: 'Ultra Secreto' };
        const nivelNombre = nivelMap[gameState.nivel] || 'Clasificado';
        const frasesFiltradas = frasesNivel.filter(f => !f.nivel || f.nivel === nivelNombre);
        const fuente = frasesFiltradas.length > 0 ? frasesFiltradas : frasesNivel;
        if (fuente.length > 0) {
            const frase = fuente[Math.floor(Math.random() * fuente.length)];
            const palabra = (frase.frase || frase.traduccion || '').toUpperCase().replace(/[^A-ZА-ЯЁ\u4e00-\u9fff\s]/g, '');
            if (palabra.length >= 2) {
                palabraObj = {
                    palabra: palabra,
                    pista: frase.pista || frase.traduccion || 'Pista no disponible',
                    idioma: gameState.idiomaSeleccionado,
                };
            }
        }
    }

    // Fallback al banco local
    if (!palabraObj) {
        const nivelData = palabrasData[gameState.nivel];
        if (!nivelData) {
            misionCompletada();
            return;
        }
        const palabrasFiltradas = nivelData.filter(p => p.idioma === gameState.idiomaSeleccionado);
        palabraObj = palabrasFiltradas[Math.floor(Math.random() * palabrasFiltradas.length)];
    }

    gameState.palabraActual = palabraObj.palabra;
    gameState.pistaActual = palabraObj.pista;
    gameState.idiomaActual = palabraObj.idioma;
    gameState.letrasAdivinadas = [];
    gameState.letrasUsadas = [];
    gameState.errores = 0;
    gameState.juegoTerminado = false;
    gameState.intentosNivel = 0;

    resetearAhorcado();

    console.log("Asignando pista:", gameState.pistaActual);
    document.getElementById('hintText').innerHTML = `<strong>${gameState.pistaActual}</strong>`;
    document.getElementById('nivelActual').textContent = gameState.nivel + 1;
    document.getElementById('prisonerStatus').textContent = 'SANO';
    document.getElementById('prisonerStatus').className = 'status-value';

    generarSlotsPalabra();
    resetearTeclado();
    actualizarLetrasUsadas();

    // Temporizador: 90s nivel 1, 60s nivel 2, 45s nivel 3
    const tiempoNivel = [90, 60, 45][gameState.nivel] || 60;
    iniciarTemporizador(tiempoNivel);
}

function resetearAhorcado() {
    partesAhorcado.forEach(partId => {
        const part = document.getElementById(partId);
        if (part) part.classList.remove('visible');
    });
}

// ═══════════════════════════════════════════════════════════════
// GENERAR SLOTS DE PALABRA - CORREGIDO: espacios visibles
// ═══════════════════════════════════════════════════════════════
function generarSlotsPalabra() {
    const container = document.getElementById('wordDisplay');
    if (!container) return;
    container.innerHTML = '';

    for (let i = 0; i < gameState.palabraActual.length; i++) {
        const char = gameState.palabraActual[i];
        const slot = document.createElement('div');
        slot.className = 'letter-slot';
        slot.dataset.index = i;
        slot.dataset.char = char;

        if (char === ' ') {
            slot.classList.add('space');
            slot.innerHTML = '&nbsp;';
        } else {
            slot.classList.add('hidden-letter');
        }

        container.appendChild(slot);
    }
}

// ═══════════════════════════════════════════════════════════════
// TECLADO VIRTUAL
// ═══════════════════════════════════════════════════════════════
function inicializarTeclado() {
    const keyboard = document.getElementById('keyboard');

    let rows = [];
    if (gameState.idiomaSeleccionado === 'ru') {
        rows = [
            ['Й','Ц','У','К','Е','Н','Г','Ш','Щ','З','Х','Ъ'],
            ['Ф','Ы','В','А','П','Р','О','Л','Д','Ж','Э'],
            ['Я','Ч','С','М','И','Т','Ь','Б','Ю']
        ];
    } else {
        rows = [
            ['书','水','人','武','器','密','码','医','生','间'],
            ['谍','监','视','情','报','木','火','土','金','日'],
            ['月','车','马','手','口','心','目','门','山','川']
        ];
    }

    keyboard.innerHTML = '';

    rows.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'keyboard-row';

        row.forEach(char => {
            const key = document.createElement('button');
            key.className = 'key';
            key.textContent = char;
            key.dataset.char = char;
            key.addEventListener('click', () => intentarLetra(char));
            rowDiv.appendChild(key);
        });

        keyboard.appendChild(rowDiv);
    });
}

function resetearTeclado() {
    document.querySelectorAll('.key').forEach(key => {
        key.classList.remove('used', 'correct');
    });
}

// ═══════════════════════════════════════════════════════════════
// INTENTAR LETRA
// ═══════════════════════════════════════════════════════════════
function intentarLetra(letra) {
    if (gameState.juegoTerminado) return;
    if (gameState.letrasUsadas.includes(letra)) return;

    gameState.letrasUsadas.push(letra);
    gameState.intentosNivel++;

    const keyElement = document.querySelector(`.key[data-char="${letra}"]`);
    const letraEncontrada = gameState.palabraActual.includes(letra);

    if (letraEncontrada) {
        gameState.letrasAdivinadas.push(letra);
        if (keyElement) keyElement.classList.add('correct');
        revelarLetras(letra);
        activarEfectoExito();

        if (verificarVictoria()) {
            gameState.juegoTerminado = true;
            setTimeout(() => nivelCompletado(), 800);
        }
    } else {
        if (keyElement) keyElement.classList.add('used');
        gameState.errores++;
        gameState.vidas--;
        dibujarParteAhorcado();
        activarEfectoDanio();
        actualizarEstadoPrisionero();

        if (gameState.vidas <= 0) {
            gameState.juegoTerminado = true;
            setTimeout(() => gameOver(), 800);
        }
    }

    actualizarLetrasUsadas();
}

function revelarLetras(letra) {
    const slots = document.querySelectorAll('.letter-slot');
    slots.forEach(slot => {
        if (slot.dataset.char === letra) {
            slot.textContent = letra;
            slot.classList.add('revealed');
            slot.classList.remove('hidden-letter');
        }
    });
}

function verificarVictoria() {
    const slots = document.querySelectorAll('.letter-slot:not(.space)');
    return Array.from(slots).every(slot => slot.classList.contains('revealed'));
}

// ═══════════════════════════════════════════════════════════════
// DIBUJAR AHORCADO
// ═══════════════════════════════════════════════════════════════
function dibujarParteAhorcado() {
    const partIndex = gameState.errores - 1;
    if (partIndex >= 0 && partIndex < partesAhorcado.length) {
        const partId = partesAhorcado[partIndex];
        const part = document.getElementById(partId);
        if (part) {
            part.classList.add('visible');
            part.style.animation = 'none';
            setTimeout(() => {
                part.style.animation = '';
            }, 10);
        }
    }
}

function actualizarEstadoPrisionero() {
    const status = document.getElementById('prisonerStatus');
    const errores = gameState.errores;

    if (errores <= 2) {
        status.textContent = 'SANO';
        status.className = 'status-value';
    } else if (errores <= 4) {
        status.textContent = 'HERIDO';
        status.className = 'status-value danger';
    } else {
        status.textContent = 'CRÍTICO';
        status.className = 'status-value critical';
    }
}

// ═══════════════════════════════════════════════════════════════
// LETRAS USADAS
// ═══════════════════════════════════════════════════════════════
function actualizarLetrasUsadas() {
    const container = document.getElementById('usedChars');
    container.innerHTML = '';

    // Solo mostrar las letras usadas que NO están en la palabra (errores reales)
    const letrasFallidas = gameState.letrasUsadas.filter(letra => !gameState.palabraActual.includes(letra));

    letrasFallidas.forEach(letra => {
        const charDiv = document.createElement('div');
        charDiv.className = 'used-char';
        charDiv.textContent = letra;
        container.appendChild(charDiv);
    });
}

// ═══════════════════════════════════════════════════════════════
// EFECTOS VISUALES
// ═══════════════════════════════════════════════════════════════
function activarEfectoDanio() {
    const overlay = document.getElementById('damageOverlay');
    overlay.classList.add('active');
    setTimeout(() => overlay.classList.remove('active'), 500);

    const panel = document.querySelector('.game-panel');
    panel.style.animation = 'shake 0.5s ease';
    setTimeout(() => panel.style.animation = '', 500);
}

function activarEfectoExito() {
    const overlay = document.getElementById('successOverlay');
    overlay.classList.add('active');
    setTimeout(() => overlay.classList.remove('active'), 500);
}

// ═══════════════════════════════════════════════════════════════
// NIVEL COMPLETADO
// ═══════════════════════════════════════════════════════════════
function nivelCompletado() {
    gameState.juegoTerminado = true;
    clearInterval(gameState.timerInterval);
    gameState.palabrasCompletadas++;
    gameState.racha++;
    gameState.intentosNivel++;

    if (gameState.racha > gameState.mejorRacha) {
        gameState.mejorRacha = gameState.racha;
    }

    const puntosGanados = 50 + (gameState.vidas * 10) + (gameState.tiempoRestante * 2);
    sincronizarPuntos(puntosGanados, 'AHORCADO');
    BabelUI.evaluarLogros();

    document.getElementById('palabrasCompletadas').textContent = gameState.palabrasCompletadas;
    document.getElementById('rachaActual').textContent = gameState.racha;
    document.getElementById('lvlVidas').textContent = gameState.vidas;
    document.getElementById('lvlRacha').textContent = gameState.racha;

    document.getElementById('levelModal').classList.add('active');
}

// ═══════════════════════════════════════════════════════════════
// GAME OVER
// ═══════════════════════════════════════════════════════════════
function gameOver() {
    gameState.juegoTerminado = true;
    clearInterval(gameState.timerInterval);
    gameState.racha = 0;

    const slots = document.querySelectorAll('.letter-slot');
    slots.forEach(slot => {
        if (!slot.classList.contains('revealed') && !slot.classList.contains('space')) {
            slot.textContent = slot.dataset.char;
            slot.style.color = 'var(--military-red)';
            slot.style.borderBottomColor = 'var(--military-red)';
            slot.classList.remove('hidden-letter');
        }
    });

    // Sincronizar game over con el servidor
    const userId = BabelUI.obtenerIdUsuario();
    if (userId) {
        const tiempoSeg = Math.floor((Date.now() - gameState.inicioTiempo) / 1000);
        window.BabelAPI.registrarGameOver({
            IdUsuario: userId,
            IdSesion: gameState.idSesion,
            CausaMuerte: 'Vidas agotadas en infiltracion',
            ProgresoPerdido: gameState.palabrasCompletadas,
            MensajeFinal: `Palabras: ${gameState.palabrasCompletadas}, Mejor racha: ${gameState.mejorRacha}`
        }).catch(() => {});
        finalizarSesion('GAME_OVER', 0, gameState.palabrasCompletadas * 50, tiempoSeg).catch(() => {});
        BabelUI.evaluarLogros().catch(() => {});
    }

    setTimeout(() => {
        document.getElementById('finalNivel').textContent = gameState.nivel + 1;
        document.getElementById('finalPalabras').textContent = gameState.palabrasCompletadas;
        document.getElementById('finalRacha').textContent = gameState.mejorRacha;
        document.getElementById('gameOverModal').classList.add('active');
    }, 1500);
}

// ═══════════════════════════════════════════════════════════════
// MODALES
// ═══════════════════════════════════════════════════════════════
function inicializarModales() {
    document.getElementById('btnNextLevel').addEventListener('click', () => {
        document.getElementById('levelModal').classList.remove('active');
        gameState.nivel++;

        if (gameState.nivel % 3 === 0 && gameState.vidas < 6) {
            gameState.vidas++;
        }

        iniciarNivel();
    });

    document.getElementById('btnRetry').addEventListener('click', () => {
        reiniciarJuego();
    });

    document.getElementById('btnExit').addEventListener('click', () => {
        window.location.href = 'mazos.html';
    });
}

function reiniciarJuego() {
    clearInterval(gameState.timerInterval);
    gameState.nivel = 0;
    gameState.vidas = 6;
    gameState.palabrasCompletadas = 0;
    gameState.racha = 0;
    gameState.mejorRacha = 0;
    gameState.juegoTerminado = false;

    document.getElementById('gameOverModal').classList.remove('active');
    document.getElementById('palabrasCompletadas').textContent = '0';
    document.getElementById('rachaActual').textContent = '0';

    crearSesion();
    iniciarNivel();
}

// ═══════════════════════════════════════════════════════════════
// TECLADO FÍSICO
// ═══════════════════════════════════════════════════════════════
document.addEventListener('keydown', (e) => {
    if (gameState.juegoTerminado) return;

    const letra = e.key.toUpperCase();
    let letrasValidas = '';

    if (gameState.idiomaSeleccionado === 'ru') {
        letrasValidas = 'ЙЦУКЕНГШЩЗХЪФЫВАПРОЛДЖЭЯЧСМИТЬБЮ';
    } else {
        letrasValidas = '书水人武器密码医生间谍监视情报木火土金日月车马手口心目门山川';
    }

    if (letrasValidas.includes(letra)) {
        intentarLetra(letra);
    }
});