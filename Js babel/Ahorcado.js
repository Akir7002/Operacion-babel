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
    juegoTerminado: false
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    inicializarSidebar();
    inicializarTeclado();
    inicializarModales();
    inicializarScrollBehavior();
    iniciarNivel();
});

/* ═══════════════════════════════════════════════════════════════
   SIDEBAR - IGUAL QUE BABELHOME (con body.sidebar-active)
   ═══════════════════════════════════════════════════════════════ */
function inicializarSidebar() {
    const menuBtn = document.getElementById('menuBtn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (!menuBtn || !sidebar || !overlay) {
        return;
    }

    menuBtn.style.cursor = 'pointer';
    menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.classList.toggle('sidebar-active', sidebar.classList.contains('active'));
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        document.body.classList.remove('sidebar-active');
    });
}

/* ═══════════════════════════════════════════════════════════════
   SCROLL BEHAVIOR - IGUAL QUE BABELHOME (IntersectionObserver)
   ═══════════════════════════════════════════════════════════════ */
function inicializarScrollBehavior() {
    const heroSection = document.querySelector('.page-hero');
    const missionSection = document.querySelector('.page-mission');
    const footerElement = document.querySelector('footer');
    const scrollTopButton = document.getElementById('scrollTopButton');
    const header = document.querySelector('header');
    const sectionVisibility = {
        mission: false,
        footer: false,
    };

    function updateTopButtonVisibility() {
        document.body.classList.toggle('show-top-btn', sectionVisibility.mission || sectionVisibility.footer);
    }

    const heroObserver = new IntersectionObserver((entries) => {
        const [entry] = entries;
        document.body.classList.toggle('header-hidden', !entry.isIntersecting);
    }, {
        threshold: 0.55,
    });

    const sectionObserver = new IntersectionObserver((entries) => {
        const [entry] = entries;
        sectionVisibility.mission = entry.isIntersecting;
        updateTopButtonVisibility();
    }, {
        threshold: 0.25,
    });

    const footerObserver = new IntersectionObserver((entries) => {
        const [entry] = entries;
        document.body.classList.toggle('footer-mode', entry.isIntersecting);
        sectionVisibility.footer = entry.isIntersecting;
        updateTopButtonVisibility();
    }, {
        threshold: 0.18,
    });

    if (heroSection) {
        heroObserver.observe(heroSection);
    }

    if (missionSection) {
        sectionObserver.observe(missionSection);
    }

    if (footerElement) {
        footerObserver.observe(footerElement);
    }

    if (scrollTopButton) {
        scrollTopButton.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    window.addEventListener('load', () => {
        if (header) {
            document.body.classList.remove('header-hidden');
        }
    });
}

// ═══════════════════════════════════════════════════════════════
// INICIAR NIVEL
// ═══════════════════════════════════════════════════════════════
function iniciarNivel() {
    const nivelData = palabrasData[gameState.nivel];
    if (!nivelData) {
        misionCompletada();
        return;
    }

    const palabraObj = nivelData[Math.floor(Math.random() * nivelData.length)];
    gameState.palabraActual = palabraObj.palabra;
    gameState.pistaActual = palabraObj.pista;
    gameState.idiomaActual = palabraObj.idioma;
    gameState.letrasAdivinadas = [];
    gameState.letrasUsadas = [];
    gameState.errores = 0;
    gameState.juegoTerminado = false;

    resetearAhorcado();

    document.getElementById('hintText').textContent = gameState.pistaActual;
    document.getElementById('nivelActual').textContent = gameState.nivel + 1;
    document.getElementById('prisonerStatus').textContent = 'SANO';
    document.getElementById('prisonerStatus').className = 'status-value';

    generarSlotsPalabra();
    resetearTeclado();
    actualizarLetrasUsadas();
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

    const rows = [
        ['Й','Ц','У','К','Е','Н','Г','Ш','Щ','З','Х','Ъ'],
        ['Ф','Ы','В','А','П','Р','О','Л','Д','Ж','Э'],
        ['Я','Ч','С','М','И','Т','Ь','Б','Ю']
    ];

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

    const keyElement = document.querySelector(`.key[data-char="${letra}"]`);
    const letraEncontrada = gameState.palabraActual.includes(letra);

    if (letraEncontrada) {
        gameState.letrasAdivinadas.push(letra);
        if (keyElement) keyElement.classList.add('correct');
        revelarLetras(letra);
        activarEfectoExito();

        if (verificarVictoria()) {
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

    gameState.letrasUsadas.forEach(letra => {
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
    gameState.palabrasCompletadas++;
    gameState.racha++;

    if (gameState.racha > gameState.mejorRacha) {
        gameState.mejorRacha = gameState.racha;
    }

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
    gameState.nivel = 0;
    gameState.vidas = 6;
    gameState.palabrasCompletadas = 0;
    gameState.racha = 0;
    gameState.mejorRacha = 0;
    gameState.juegoTerminado = false;

    document.getElementById('gameOverModal').classList.remove('active');
    document.getElementById('palabrasCompletadas').textContent = '0';
    document.getElementById('rachaActual').textContent = '0';

    iniciarNivel();
}

// ═══════════════════════════════════════════════════════════════
// TECLADO FÍSICO
// ═══════════════════════════════════════════════════════════════
document.addEventListener('keydown', (e) => {
    if (gameState.juegoTerminado) return;

    const letra = e.key.toUpperCase();
    const letrasValidas = 'ЙЦУКЕНГШЩЗХЪФЫВАПРОЛДЖЭЯЧСМИТЬБЮ';

    if (letrasValidas.includes(letra)) {
        intentarLetra(letra);
    }
});