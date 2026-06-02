/* ═══════════════════════════════════════════════════════════════
    FLASHCARDS.JS - Motor de Entrenamiento Táctico
    Gestion de tarjetas rotativas, vidas y progreso.
    ═══════════════════════════════════════════════════════════════ */
const API_BASE = 'http://localhost:3000/api';
// Datos de flashcards usados como respaldo local.
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

// Estado del juego de entrenamiento.
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

// ═══════════════════════════════════════════════════════════════
// PANTALLA DE CARGA
// ═══════════════════════════════════════════════════════════════
function mostrarPantallaDeUnidad(titulo, subtitulo) {
    let pantalla = document.getElementById('pantallaDeUnidad');
    
    if (!pantalla) {
        pantalla = document.createElement('div');
        pantalla.id = 'pantallaDeUnidad';
        pantalla.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #000;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            z-index: 9999;
            gap: 20px;
        `;
        document.body.appendChild(pantalla);
    }
    
    pantalla.innerHTML = `
        <div style="text-align: center; color: #fff; font-family: 'Courier New', monospace;">
            <div style="font-size: 48px; margin-bottom: 20px;">📡</div>
            <h2 style="font-size: 28px; letter-spacing: 3px; margin: 0;">${titulo}</h2>
            <p style="font-size: 14px; color: #888; letter-spacing: 2px; margin: 0;">${subtitulo}</p>
            <div style="margin-top: 20px; font-size: 16px; letter-spacing: 2px; color: #666;">
                . . .
            </div>
        </div>
    `;
    
    pantalla.style.display = 'flex';
}

function cerrarPantallaDeUnidad() {
    const pantalla = document.getElementById('pantallaDeUnidad');
    if (pantalla) {
        pantalla.style.display = 'none';
    }
}

// Inicializacion principal.
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
async function cargarMazo() {
    const mazoGuardado = sessionStorage.getItem('mazoActivo');

    if (!mazoGuardado) {
        // Si no hay mazo seleccionado, redirigir a mazos
        window.location.href = 'Mazos.html';
        return;
    }

    gameState.mazo = JSON.parse(mazoGuardado);
    
    // Mostrar pantalla de carga
    mostrarPantallaDeUnidad('Cargando', 'flashcards del servidor de inteligencia...');
    
    try {
        // Obtener flashcards de la API
        const response = await fetch(`${API_BASE}/mazos/${gameState.mazo.id}/flashcards`);
        
        if (!response.ok) {
            throw new Error('Fallo al cargar las flashcards');
        }
        
        const flashcards = await response.json();
        
        // Mapear datos de la API al formato esperado
        gameState.flashcards = flashcards.map((fc, index) => ({
            id: fc.id || index,
            palabra: fc.palabra || fc.pregunta,
            pronunciacion: fc.pronunciacion || '',
            traduccion: fc.respuesta || fc.traduccion,
            contexto: fc.respuesta,
            categoria: fc.tipo || 'General'
        }));
        
        // Mezclar flashcards aleatoriamente
        gameState.flashcards.sort(() => Math.random() - 0.5);
        
        // Cerrar pantalla de carga
        cerrarPantallaDeUnidad();
        
        // Actualizar UI
        document.getElementById('mazoNombre').textContent = gameState.mazo.nombre;
        document.getElementById('totalCards').textContent = gameState.flashcards.length;
        document.getElementById('currentCard').textContent = '1';

        actualizarContadores();
        mostrarFlashcardActual();
        
    } catch (error) {
        console.error('Error al cargar flashcards:', error);
        cerrarPantallaDeUnidad();
        
        // Mostrar error
        const mazoNombre = document.getElementById('mazoNombre');
        if (mazoNombre) {
            mazoNombre.innerHTML = '<i class="bi bi-exclamation-triangle-fill me-2" aria-hidden="true"></i>ERROR DE CONEXIÓN';
        }
        document.getElementById('totalCards').textContent = '0';
        
        // Mostrar modal de error
        setTimeout(() => {
            alert('No se pudieron cargar las flashcards. Regresando a mazos...');
            window.location.href = 'Mazos.html';
        }, 2000);
    }
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
    const countFalladasEl = document.getElementById('countFalladas');
    if (countFalladasEl) countFalladasEl.textContent = gameState.falladas;
    
    const livesCountEl = document.getElementById('livesCount');
    if (livesCountEl) livesCountEl.textContent = gameState.vidas;
    
    // Update visual hearts if they exist
    const lives = document.querySelectorAll('.life');
    if (lives.length > 0) {
        lives.forEach((life, index) => {
            if (index < gameState.vidas) {
                life.classList.add('active');
            } else {
                life.classList.remove('active');
            }
        });
    }
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
