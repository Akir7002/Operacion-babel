/* ═══════════════════════════════════════════════════════════════
   MAZOS.JS - Controlador de la Armería de Mazos
   Gestión de datos, filtros, y navegación a flashcards
   ═══════════════════════════════════════════════════════════════ */

// Datos de mazos (simulando respuesta de base de datos)
const mazosData = [
    {
        id: 1,
        nombre: "Vocabulario Básico RU",
        descripcion: "Palabras esenciales para supervivencia en territorio ruso",
        idioma: "ru",
        idiomaNombre: "Ruso",
        categoria: "General",
        nivel: 1,
        nivelNombre: "Clasificado",
        icono: "bi bi-journal",
        totalFlashcards: 25,
        completadas: 12,
        color: "#4a7c59"
    },
    {
        id: 2,
        nombre: "Arsenal Militar RU",
        descripcion: "Terminología táctica y de armamento en cirílico",
        idioma: "ru",
        idiomaNombre: "Ruso",
        categoria: "Militar",
        nivel: 2,
        nivelNombre: "Secreto",
        icono: "bi bi-crosshair2",
        totalFlashcards: 30,
        completadas: 5,
        color: "#d4a017"
    },
    {
        id: 3,
        nombre: "Supervivencia Urbana RU",
        descripcion: "Frases críticas para operaciones encubiertas",
        idioma: "ru",
        idiomaNombre: "Ruso",
        categoria: "Supervivencia",
        nivel: 3,
        nivelNombre: "Ultra Secreto",
        icono: "bi bi-shield",
        totalFlashcards: 20,
        completadas: 0,
        color: "#8b0000"
    },
    {
        id: 4,
        nombre: "Hanzi Fundamentales",
        descripcion: "Caracteres básicos del mandarín para reconocimiento",
        idioma: "zh",
        idiomaNombre: "Mandarín",
        categoria: "General",
        nivel: 1,
        nivelNombre: "Clasificado",
        icono: "bi bi-book",
        totalFlashcards: 40,
        completadas: 28,
        color: "#4a7c59"
    },
    {
        id: 5,
        nombre: "Código Rojo ZH",
        descripcion: "Vocabulario de contrainteligencia en chino mandarín",
        idioma: "zh",
        idiomaNombre: "Mandarín",
        categoria: "Contrainteligencia",
        nivel: 2,
        nivelNombre: "Secreto",
        icono: "bi bi-eye",
        totalFlashcards: 35,
        completadas: 15,
        color: "#d4a017"
    },
    {
        id: 6,
        nombre: "Slang de Campo ZH",
        descripcion: "Expresiones coloquiales para infiltración profunda",
        idioma: "zh",
        idiomaNombre: "Mandarín",
        categoria: "Slang",
        nivel: 3,
        nivelNombre: "Ultra Secreto",
        icono: "bi bi-chat",
        totalFlashcards: 22,
        completadas: 22,
        color: "#8b0000"
    }
];

// Estado de la aplicación
let state = {
    mazos: [...mazosData],
    filtroIdioma: '',
    filtroNivel: '',
    mazoSeleccionado: null
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    inicializarSidebar();
    renderizarMazos();
    actualizarStats();
    inicializarFiltros();
    inicializarModal();
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

    // Actualizar vidas visuales
    actualizarVidas(5);
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

function actualizarVidas(vidas) {
    const lives = document.querySelectorAll('.life');
    lives.forEach((life, index) => {
        if (index < vidas) {
            life.classList.add('active');
        } else {
            life.classList.remove('active');
        }
    });
}

// ═══════════════════════════════════════════════════════════════
// RENDERIZADO DE MAZOS
// ═══════════════════════════════════════════════════════════════
function renderizarMazos() {
    const grid = document.getElementById('mazosGrid');
    const mazosFiltrados = filtrarMazos();

    grid.innerHTML = mazosFiltrados.map(mazo => crearCardMazo(mazo)).join('');

    // Agregar event listeners a las cards
    document.querySelectorAll('.mazo-card').forEach(card => {
        card.addEventListener('click', () => {
            const mazoId = parseInt(card.dataset.mazoId);
            seleccionarMazo(mazoId);
        });
    });
}

function crearCardMazo(mazo) {
    const progreso = Math.round((mazo.completadas / mazo.totalFlashcards) * 100);
    const completado = progreso === 100;

    return `
        <div class="mazo-card ${completado ? 'completed' : ''}" data-mazo-id="${mazo.id}">
            ${completado ? '<div class="mazo-completed-stamp">COMPLETADO</div>' : ''}
            <div class="mazo-classification ${mazo.nivelNombre.toLowerCase().replace(' ', '-')}">
                ${mazo.nivelNombre}
            </div>
            <div class="mazo-lang-badge ${mazo.idioma}">
                ${mazo.idioma === 'ru' ? '🇷🇺 RU' : '🇨🇳 ZH'}
            </div>
            <div class="mazo-content">
                <span class="mazo-icon"><i class="${mazo.icono}"></i></span>
                <h3 class="mazo-title">${mazo.nombre}</h3>
                <p class="mazo-description">${mazo.descripcion}</p>

                <div class="mazo-progress">
                    <div class="progress-label">
                        <span>PROGRESO TÁCTICO</span>
                        <span>${progreso}%</span>
                    </div>
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" style="width: ${progreso}%"></div>
                    </div>
                </div>

                <div class="mazo-stats">
                    <div class="mazo-stat">
                        <span class="mazo-stat-value">${mazo.totalFlashcards}</span>
                        <span class="mazo-stat-label">Fichas</span>
                    </div>
                    <div class="mazo-stat">
                        <span class="mazo-stat-value">${mazo.completadas}</span>
                        <span class="mazo-stat-label">Dominadas</span>
                    </div>
                    <div class="mazo-stat">
                        <span class="mazo-stat-value">${mazo.totalFlashcards - mazo.completadas}</span>
                        <span class="mazo-stat-label">Pendientes</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ═══════════════════════════════════════════════════════════════
// FILTROS
// ═══════════════════════════════════════════════════════════════
function inicializarFiltros() {
    const idiomaFilter = document.getElementById('idiomaFilter');
    const nivelFilter = document.getElementById('nivelFilter');

    idiomaFilter.addEventListener('change', (e) => {
        state.filtroIdioma = e.target.value;
        renderizarMazos();
    });

    nivelFilter.addEventListener('change', (e) => {
        state.filtroNivel = e.target.value;
        renderizarMazos();
    });
}

function filtrarMazos() {
    return state.mazos.filter(mazo => {
        const matchIdioma = !state.filtroIdioma || mazo.idioma === state.filtroIdioma;
        const matchNivel = !state.filtroNivel || mazo.nivel === parseInt(state.filtroNivel);
        return matchIdioma && matchNivel;
    });
}

// ═══════════════════════════════════════════════════════════════
// ESTADÍSTICAS
// ═══════════════════════════════════════════════════════════════
function actualizarStats() {
    const totalMazos = state.mazos.length;
    const totalFlashcards = state.mazos.reduce((sum, m) => sum + m.totalFlashcards, 0);

    document.getElementById('totalMazos').textContent = totalMazos;
    document.getElementById('totalFlashcards').textContent = totalFlashcards;
}

// ═══════════════════════════════════════════════════════════════
// MODAL DE MISIÓN
// ═══════════════════════════════════════════════════════════════
function inicializarModal() {
    const modal = document.getElementById('missionModal');
    const cancelBtn = document.getElementById('cancelMission');
    const confirmBtn = document.getElementById('confirmMission');

    cancelBtn.addEventListener('click', cerrarModal);
    confirmBtn.addEventListener('click', iniciarMision);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) cerrarModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') cerrarModal();
    });
}

function seleccionarMazo(mazoId) {
    const mazo = state.mazos.find(m => m.id === mazoId);
    if (!mazo) return;

    state.mazoSeleccionado = mazo;

    document.getElementById('modalMazoName').textContent = mazo.nombre;
    document.getElementById('modalFlashcardCount').textContent = mazo.totalFlashcards;
    document.getElementById('modalNivelName').textContent = mazo.nivelNombre;

    document.getElementById('missionModal').classList.add('active');
}

function cerrarModal() {
    document.getElementById('missionModal').classList.remove('active');
    state.mazoSeleccionado = null;
}

function iniciarMision() {
    if (!state.mazoSeleccionado) return;

    // Guardar mazo seleccionado en sessionStorage para la página de flashcards
    sessionStorage.setItem('mazoActivo', JSON.stringify(state.mazoSeleccionado));

    // Efecto de transición táctica
    const modal = document.getElementById('missionModal');
    modal.style.transition = 'opacity 0.2s ease';
    modal.style.opacity = '0';

    setTimeout(() => {
        window.location.href = 'flashcards.html';
    }, 300);
}
