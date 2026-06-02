// Estado inicial de la aplicacion: filtros y mazo activo.
let state = {
    mazos: [],
    filtroIdioma: '',
    filtroNivel: '',
    mazoSeleccionado: null
};
// Solicita el listado de mazos al backend.
async function obtenerMazosDesdeBD() {
    try {
        const response = await fetch('http://localhost:3000/api/mazos');
        
        if (!response.ok) {
            throw new Error('Fallo al contactar el Cuartel General');
        }
        
        const data = await response.json();
        state.mazos = data; // Guardamos los datos reales en el estado
        
        // Renderizamos la interfaz una vez lleguen los datos
        renderizarMazos();
        actualizarStats();
        
    } catch (error) {
        console.error('Error de inteligencia:', error);
        document.getElementById('mazosGrid').innerHTML = 
            '<div style="text-align:center; padding: 40px; color: var(--military-red); width: 100%;">' +
            '<i class="bi bi-exclamation-triangle-fill fs-1"></i>' +
            '<h3>SIN CONEXIÓN AL SERVIDOR</h3>' +
            '<p>No se pudo cargar la armería de mazos.</p></div>';
    }
}

// Inicializacion principal de la pantalla de mazos.
document.addEventListener('DOMContentLoaded', () => {
    inicializarSidebar();
    obtenerMazosDesdeBD(); // Llamada a la API en lugar de renderizar estático
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

    // Actualizar vidas visuales.
    actualizarVidas(5);
}

// Seccion de scroll superior y comportamiento del header.
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

    // Lleva al area principal de entrenamiento.
    function scrollToMission() {
        if (missionSection) {
            missionSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // Devuelve el usuario al inicio del panel.
    function scrollToTop() {
        if (heroSection) {
            heroSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Cambia la visibilidad del boton flotante segun el scroll.
    function updateTopButtonVisibility() {
        document.body.classList.toggle('show-top-btn', sectionVisibility.mission || sectionVisibility.footer);
    }

    // Oculta el header cuando el hero sale de la vista.
    const heroObserver = new IntersectionObserver((entries) => {
        const [entry] = entries;
        document.body.classList.toggle('header-hidden', !entry.isIntersecting);
    }, {
        threshold: 0.55,
    });

    // Activa la ayuda de vuelta arriba en la zona de contenido.
    const sectionObserver = new IntersectionObserver((entries) => {
        const [entry] = entries;
        sectionVisibility.mission = entry.isIntersecting;
        updateTopButtonVisibility();
    }, {
        threshold: 0.25,
    });

    // Marca el modo de pie de pagina cuando corresponde.
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

    if (mazosFiltrados.length === 0) {
        grid.innerHTML = '<div style="text-align:center; padding: 40px; color: #888; width: 100%;">' +
            '<i class="bi bi-stack fs-1"></i>' +
            '<h3>NO HAY MAZOS DISPONIBLES</h3>' +
            '<p>Actualmente no se ha configurado la armería en la Base de Datos.</p></div>';
        return;
    }

    grid.innerHTML = mazosFiltrados.map(mazo => crearCardMazo(mazo)).join('');

    // Agregar event listeners a las cards.
    document.querySelectorAll('.mazo-card').forEach(card => {
        card.addEventListener('click', () => {
            const mazoId = parseInt(card.dataset.mazoId);
            seleccionarMazo(mazoId);
        });
    });
}

function crearCardMazo(mazo) {
    const progreso = mazo.totalFlashcards > 0 ? Math.round((mazo.completadas / mazo.totalFlashcards) * 100) : 0;
    const completado = progreso === 100 && mazo.totalFlashcards > 0;
    const nivelNombre = mazo.nivelNombre || 'General';
    const nivelClase = nivelNombre.toLowerCase().replace(' ', '-');

    return `
        <div class="mazo-card ${completado ? 'completed' : ''}" data-mazo-id="${mazo.id}">
            ${completado ? '<div class="mazo-completed-stamp">COMPLETADO</div>' : ''}
            <div class="mazo-classification ${nivelClase}">
                ${nivelNombre}
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
        const matchIdioma = !state.filtroIdioma || mazo.idioma.toLowerCase() === state.filtroIdioma.toLowerCase();
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
