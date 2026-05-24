/* ═══════════════════════════════════════════════════════════════
   FLASHCARDS.JS - Motor de Entrenamiento Táctico
   Gestión de tarjetas rotativas, vidas, y progreso
   ═══════════════════════════════════════════════════════════════ */

// Datos de flashcards (simulando respuesta de BD)
const flashcardsData = {
    1: [ // Vocabulario Básico RU
        { id: 1, palabra: 'книга', pronunciacion: 'Kniga', traduccion: 'Libro', contexto: 'Objeto de lectura esencial en campo', categoria: 'General' },
        { id: 2, palabra: 'вода', pronunciacion: 'Voda', traduccion: 'Agua', contexto: 'Recurso vital para supervivencia', categoria: 'Supervivencia' },
        { id: 3, palabra: 'дом', pronunciacion: 'Dom', traduccion: 'Casa', contexto: 'Estructura de refugio táctico', categoria: 'General' },
        { id: 4, palabra: 'друг', pronunciacion: 'Drug', traduccion: 'Amigo', contexto: 'Aliado de confianza en operación', categoria: 'General' },
        { id: 5, palabra: 'солнце', pronunciacion: 'Solntse', traduccion: 'Sol', contexto: 'Referencia de orientación diurna', categoria: 'General' }
    ],
    2: [ // Arsenal Militar RU
        { id: 6, palabra: 'оружие', pronunciacion: 'Oruzhiye', traduccion: 'Arma', contexto: 'Equipamiento táctico de combate', categoria: 'Militar' },
        { id: 7, palabra: 'пистолет', pronunciacion: 'Pistolet', traduccion: 'Pistola', contexto: 'Arma de mano para defensa cercana', categoria: 'Militar' },
        { id: 8, palabra: 'нож', pronunciacion: 'Nozh', traduccion: 'Cuchillo', contexto: 'Herramienta multifunción de campo', categoria: 'Militar' },
        { id: 9, palabra: 'щит', pronunciacion: 'Shchit', traduccion: 'Escudo', contexto: 'Protección balística frontal', categoria: 'Militar' },
        { id: 10, palabra: 'граната', pronunciacion: 'Granata', traduccion: 'Granada', contexto: 'Explosivo táctico de fragmentación', categoria: 'Militar' }
    ],
    3: [ // Supervivencia Urbana RU
        { id: 11, palabra: 'опасность', pronunciacion: 'Opasnost', traduccion: 'Peligro', contexto: 'Señal de alerta inmediata', categoria: 'Supervivencia' },
        { id: 12, palabra: 'помощь', pronunciacion: 'Pomoshch', traduccion: 'Ayuda', contexto: 'Solicitud de refuerzos médicos', categoria: 'Supervivencia' },
        { id: 13, palabra: 'выход', pronunciacion: 'Vykhod', traduccion: 'Salida', contexto: 'Ruta de evacuación primaria', categoria: 'Supervivencia' },
        { id: 14, palabra: 'укрытие', pronunciacion: 'Ukrytiye', traduccion: 'Refugio', contexto: 'Posición defensiva temporal', categoria: 'Supervivencia' },
        { id: 15, palabra: 'врач', pronunciacion: 'Vrach', traduccion: 'Médico', contexto: 'Especialista en atención médica de campo', categoria: 'Supervivencia' }
    ],
    4: [ // Hanzi Fundamentales
        { id: 16, palabra: '书', pronunciacion: 'Shū', traduccion: 'Libro', contexto: 'Carácter básico de escritura', categoria: 'General' },
        { id: 17, palabra: '水', pronunciacion: 'Shuǐ', traduccion: 'Agua', contexto: 'Elemento esencial de supervivencia', categoria: 'Supervivencia' },
        { id: 18, palabra: '火', pronunciacion: 'Huǒ', traduccion: 'Fuego', contexto: 'Fuente de calor y señalización', categoria: 'Supervivencia' },
        { id: 19, palabra: '人', pronunciacion: 'Rén', traduccion: 'Persona', contexto: 'Referencia humana básica', categoria: 'General' },
        { id: 20, palabra: '大', pronunciacion: 'Dà', traduccion: 'Grande', contexto: 'Descriptor de tamaño táctico', categoria: 'General' }
    ],
    5: [ // Código Rojo ZH
        { id: 21, palabra: '武器', pronunciacion: 'Wǔqì', traduccion: 'Arma', contexto: 'Sistema de armamento identificado', categoria: 'Contrainteligencia' },
        { id: 22, palabra: '密码', pronunciacion: 'Mìmǎ', traduccion: 'Contraseña', contexto: 'Clave de acceso encriptada', categoria: 'Contrainteligencia' },
        { id: 23, palabra: '间谍', pronunciacion: 'Jiàndié', traduccion: 'Espía', contexto: 'Agente encubierto hostil', categoria: 'Contrainteligencia' },
        { id: 24, palabra: '情报', pronunciacion: 'Qíngbào', traduccion: 'Inteligencia', contexto: 'Datos clasificados de operación', categoria: 'Contrainteligencia' },
        { id: 25, palabra: '监视', pronunciacion: 'Jiānshì', traduccion: 'Vigilancia', contexto: 'Operación de observación continua', categoria: 'Contrainteligencia' }
    ],
    6: [ // Slang de Campo ZH
        { id: 26, palabra: '哥们儿', pronunciacion: 'Gēmenr', traduccion: 'Camarada', contexto: 'Término coloquial de camaradería', categoria: 'Slang' },
        { id: 27, palabra: '搞定', pronunciacion: 'Gǎodìng', traduccion: 'Resolver', contexto: 'Completar objetivo táctico', categoria: 'Slang' },
        { id: 28, palabra: '靠谱', pronunciacion: 'Kàopǔ', traduccion: 'Confiable', contexto: 'Evaluación de fiabilidad de aliado', categoria: 'Slang' }
    ]
};

// Estado del juego
let gameState = {
    mazo: null,
    flashcards: [],
    indiceActual: 0,
    vidas: 5,
    dominadas: 0,
    falladas: 0,
    volteada: false,
    completado: false
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    inicializarSidebar();
    cargarMazo();
    inicializarControles();
    inicializarModales();
    inicializarScrollTop();
});

// ═══════════════════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════════════════
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
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    });
}

function inicializarScrollTop() {
    const heroSection = document.querySelector('[data-hero]');
    const missionSection = document.querySelector('[data-mission]');
    const footerElement = document.querySelector('footer');
    const heroButton = document.getElementById('heroScrollButton');
    const scrollTopButton = document.getElementById('scrollTopButton');
    const header = document.querySelector('header');
    const sectionVisibility = {
        mission: false,
        footer: false,
    };

    function scrollToMission() {
        if (missionSection) {
            missionSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function scrollToTop() {
        if (heroSection) {
            heroSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

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

    if (heroButton) {
        heroButton.addEventListener('click', scrollToMission);
    }

    if (scrollTopButton) {
        scrollTopButton.addEventListener('click', scrollToTop);
    }

    window.scrollToMission = scrollToMission;
    window.scrollToTop = scrollToTop;
    window.addEventListener('load', () => {
        if (header) {
            header.classList.remove('header-hidden');
        }
    });
}

// ═══════════════════════════════════════════════════════════════
// CARGAR MAZO
// ═══════════════════════════════════════════════════════════════
function cargarMazo() {
    const mazoGuardado = sessionStorage.getItem('mazoActivo');

    if (!mazoGuardado) {
        // Si no hay mazo seleccionado, redirigir a mazos
        window.location.href = 'mazos.html';
        return;
    }

    gameState.mazo = JSON.parse(mazoGuardado);
    gameState.flashcards = [...(flashcardsData[gameState.mazo.id] || [])];

    // Mezclar flashcards aleatoriamente
    gameState.flashcards.sort(() => Math.random() - 0.5);

    // Actualizar UI
    document.getElementById('mazoNombre').textContent = gameState.mazo.nombre;
    document.getElementById('totalCards').textContent = gameState.flashcards.length;
    document.getElementById('currentCard').textContent = '1';
    document.getElementById('livesCount').textContent = gameState.vidas;

    actualizarContadores();
    mostrarFlashcardActual();
}

// ═══════════════════════════════════════════════════════════════
// MOSTRAR FLASHCARD
// ═══════════════════════════════════════════════════════════════
function mostrarFlashcardActual() {
    const flashcard = gameState.flashcards[gameState.indiceActual];
    if (!flashcard) return;

    const isRuso = gameState.mazo.idioma === 'ru';

    // Actualizar cara frontal
    document.getElementById('idiomaBadge').textContent = isRuso ? 'RU' : 'ZH';
    document.getElementById('cardIcon').textContent = gameState.mazo.icono;
    document.getElementById('cardWord').textContent = flashcard.palabra;
    document.getElementById('difficultyTag').textContent = gameState.mazo.nivelNombre.toUpperCase();

    // Actualizar cara trasera
    document.getElementById('cardTranslation').textContent = flashcard.traduccion;
    document.getElementById('cardPronunciation').textContent = flashcard.pronunciacion;
    document.getElementById('cardContext').textContent = flashcard.contexto;
    document.getElementById('categoryTag').textContent = flashcard.categoria;

    // Resetear volteo
    const card = document.getElementById('flashcard');
    card.classList.remove('flipped');
    gameState.volteada = false;

    // Actualizar progreso
    actualizarProgreso();
}

function actualizarProgreso() {
    const progreso = ((gameState.indiceActual + 1) / gameState.flashcards.length) * 100;
    document.getElementById('progressFill').style.width = progreso + '%';
    document.getElementById('currentCard').textContent = gameState.indiceActual + 1;
}

function actualizarContadores() {
    document.getElementById('countDominadas').textContent = gameState.dominadas;
    document.getElementById('countPendientes').textContent = gameState.flashcards.length - gameState.indiceActual;
    document.getElementById('countFalladas').textContent = gameState.falladas;
    document.getElementById('livesCount').textContent = gameState.vidas;
}

// ═══════════════════════════════════════════════════════════════
// CONTROLES
// ═══════════════════════════════════════════════════════════════
function inicializarControles() {
    const btnFlip = document.getElementById('btnFlip');
    const btnFail = document.getElementById('btnFail');
    const btnSuccess = document.getElementById('btnSuccess');
    const flashcard = document.getElementById('flashcard');

    // Voltear tarjeta
    btnFlip.addEventListener('click', voltearTarjeta);
    flashcard.addEventListener('click', voltearTarjeta);

    // Marcar como fallada
    btnFail.addEventListener('click', () => {
        if (!gameState.volteada) voltearTarjeta();
        setTimeout(() => marcarFallo(), 400);
    });

    // Marcar como dominada
    btnSuccess.addEventListener('click', () => {
        if (!gameState.volteada) voltearTarjeta();
        setTimeout(() => marcarExito(), 400);
    });

    // Teclado
    document.addEventListener('keydown', (e) => {
        if (gameState.completado) return;

        switch(e.key) {
            case ' ':
            case 'ArrowUp':
            case 'ArrowDown':
                e.preventDefault();
                voltearTarjeta();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                if (!gameState.volteada) voltearTarjeta();
                setTimeout(() => marcarFallo(), 400);
                break;
            case 'ArrowRight':
                e.preventDefault();
                if (!gameState.volteada) voltearTarjeta();
                setTimeout(() => marcarExito(), 400);
                break;
        }
    });
}

function voltearTarjeta() {
    const card = document.getElementById('flashcard');
    card.classList.toggle('flipped');
    gameState.volteada = !gameState.volteada;
}

function marcarExito() {
    gameState.dominadas++;
    avanzarFlashcard();
}

function marcarFallo() {
    gameState.falladas++;
    gameState.vidas--;

    // Efecto de daño visual
    activarEfectoDanio();

    actualizarContadores();

    if (gameState.vidas <= 0) {
        gameOver();
        return;
    }

    // La flashcard fallada vuelve al final para repasar
    const flashcardActual = gameState.flashcards[gameState.indiceActual];
    gameState.flashcards.push(flashcardActual);

    avanzarFlashcard();
}

function avanzarFlashcard() {
    gameState.indiceActual++;

    if (gameState.indiceActual >= gameState.flashcards.length) {
        misionCompletada();
        return;
    }

    // Transición suave
    const container = document.getElementById('flashcardContainer');
    container.style.opacity = '0';
    container.style.transform = 'translateX(-30px)';

    setTimeout(() => {
        mostrarFlashcardActual();
        actualizarContadores();
        container.style.opacity = '1';
        container.style.transform = 'translateX(0)';
    }, 300);
}

// ═══════════════════════════════════════════════════════════════
// EFECTOS VISUALES
// ═══════════════════════════════════════════════════════════════
function activarEfectoDanio() {
    const effect = document.getElementById('damageEffect');
    const card = document.getElementById('flashcard');

    effect.classList.add('active');
    card.classList.add('shake');

    setTimeout(() => {
        effect.classList.remove('active');
        card.classList.remove('shake');
    }, 500);
}

// ═══════════════════════════════════════════════════════════════
// GAME OVER
// ═══════════════════════════════════════════════════════════════
function gameOver() {
    gameState.completado = true;

    document.getElementById('goDominadas').textContent = gameState.dominadas;
    document.getElementById('goFalladas').textContent = gameState.falladas;

    document.getElementById('gameOverModal').classList.add('active');
}

// ═══════════════════════════════════════════════════════════════
// MISIÓN COMPLETADA
// ═══════════════════════════════════════════════════════════════
function misionCompletada() {
    gameState.completado = true;

    const precision = gameState.flashcards.length > 0 
        ? Math.round((gameState.dominadas / gameState.flashcards.length) * 100) 
        : 0;

    document.getElementById('vicPrecision').textContent = precision + '%';
    document.getElementById('vicVidas').textContent = gameState.vidas;

    document.getElementById('victoryModal').classList.add('active');
}

// ═══════════════════════════════════════════════════════════════
// MODALES
// ═══════════════════════════════════════════════════════════════
function inicializarModales() {
    // Game Over
    document.getElementById('btnRetry').addEventListener('click', () => {
        reiniciarMision();
    });

    document.getElementById('btnExit').addEventListener('click', () => {
        window.location.href = 'mazos.html';
    });

    // Victoria
    document.getElementById('btnVictoryExit').addEventListener('click', () => {
        window.location.href = 'mazos.html';
    });
}

function reiniciarMision() {
    gameState.indiceActual = 0;
    gameState.vidas = 5;
    gameState.dominadas = 0;
    gameState.falladas = 0;
    gameState.volteada = false;
    gameState.completado = false;

    // Mezclar de nuevo
    gameState.flashcards.sort(() => Math.random() - 0.5);

    document.getElementById('gameOverModal').classList.remove('active');

    actualizarContadores();
    actualizarProgreso();
    mostrarFlashcardActual();
}
