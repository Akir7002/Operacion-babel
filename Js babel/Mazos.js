// Estado inicial de la aplicacion: filtros y mazo activo.
// Las llamadas HTTP se hacen a traves de window.BabelAPI (core/api.js).
let state = {
    mazos: [],
    filtroIdioma: '',
    filtroNivel: '',
    mazoSeleccionado: null
};
// Solicita el listado de mazos al backend.
async function obtenerMazosDesdeBD() {
    try {
        const data = await window.BabelAPI.listarMazos();
        state.mazos = data; // Guardamos los datos reales en el estado

        // Renderizamos la interfaz una vez lleguen los datos
        renderizarMazos();
        actualizarStats();

    } catch (error) {
        console.error('Error de inteligencia:', error.codigo || '', error.message);
        document.getElementById('mazosGrid').innerHTML =
            '<div style="text-align:center; padding: 40px; color: var(--military-red); width: 100%;">' +
            '<i class="bi bi-exclamation-triangle-fill fs-1"></i>' +
            '<h3>SIN CONEXIÓN AL SERVIDOR</h3>' +
            '<p>No se pudo cargar la armería de mazos.</p></div>';
    }
}

// Inicializacion principal de la pantalla de mazos.
document.addEventListener('DOMContentLoaded', () => {
    BabelUI.inicializarSidebar();
    BabelUI.aplicarAccesibilidad();
    BabelUI.actualizarVidas(5);

    obtenerMazosDesdeBD(); // Llamada a la API en lugar de renderizar estático
    inicializarFiltros();
    inicializarModal();
    BabelUI.inicializarScrollTop();
});

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

function estaNivelDesbloqueado(nivel) {
    if (nivel <= 1) return true;
    const nivelAnterior = nivel - 1;
    const mazosNivelAnterior = state.mazos.filter(m => m.nivel === nivelAnterior);
    if (mazosNivelAnterior.length === 0) return true;
    return mazosNivelAnterior.every(m =>
        m.totalFlashcards > 0 && m.completadas >= m.totalFlashcards
    );
}

function crearCardMazo(mazo) {
    const progreso = mazo.totalFlashcards > 0 ? Math.round((mazo.completadas / mazo.totalFlashcards) * 100) : 0;
    const completado = progreso === 100 && mazo.totalFlashcards > 0;
    const nivelNombre = mazo.nivelNombre || 'General';
    const nivelClase = nivelNombre.toLowerCase().replace(' ', '-');
    const bloqueado = !estaNivelDesbloqueado(mazo.nivel || 1);

    return `
        <div class="mazo-card ${completado ? 'completed' : ''} ${bloqueado ? 'locked' : ''}" data-mazo-id="${mazo.id}">
            ${completado ? '<div class="mazo-completed-stamp">COMPLETADO</div>' : ''}
            ${bloqueado ? '<div class="mazo-locked-stamp"><i class="bi bi-lock-fill"></i> BLOQUEADO</div>' : ''}
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

    // Verificar si el nivel esta desbloqueado
    const nivel = mazo.nivel || 1;
    if (nivel > 1) {
        const nivelAnterior = nivel - 1;
        const mazosNivelAnterior = state.mazos.filter(m => m.nivel === nivelAnterior);

        if (mazosNivelAnterior.length > 0) {
            const todosCompletados = mazosNivelAnterior.every(m =>
                m.totalFlashcards > 0 && m.completadas >= m.totalFlashcards
            );

            if (!todosCompletados) {
                const nombresNivel = { 1: 'Clasificado', 2: 'Secreto', 3: 'Ultra Secreto' };
                const faltantes = mazosNivelAnterior.filter(m =>
                    !(m.totalFlashcards > 0 && m.completadas >= m.totalFlashcards)
                );

                let msg = `NIVEL BLOQUEADO\n\n`;
                msg += `Debes completar todos los mazos "${nombresNivel[nivelAnterior]}" antes de acceder a "${nombresNivel[nivel]}".\n\n`;
                msg += `Mazos pendientes del nivel ${nivelAnterior}:\n`;
                faltantes.forEach(m => {
                    const prog = m.totalFlashcards > 0 ? Math.round((m.completadas / m.totalFlashcards) * 100) : 0;
                    msg += `  - ${m.nombre} (${prog}%)\n`;
                });

                window.alert(msg);
                return;
            }
        }
    }

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
