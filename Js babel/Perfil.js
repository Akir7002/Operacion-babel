document.addEventListener('DOMContentLoaded', () => {
    // ═══════════════════════════════════════════════════════════════
    // CONFIGURACIÓN DE API
    // Cambia esta URL a tu endpoint real cuando deployes el backend
    // ═══════════════════════════════════════════════════════════════
    const API_BASE = 'http://localhost:3000/api';
    const USER_ID = window.babelUser ? window.babelUser.idUsuario : 1;

    // Referencias DOM
    const menuBtn = document.getElementById('menuBtn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const scrollTopButton = document.getElementById('scrollTopButton');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // ═══════════════════════════════════════════════════════════════
    // INICIALIZAR SIDEBAR (Reutilizado de Babelhome.js)
    // ═══════════════════════════════════════════════════════════════
    if (menuBtn && sidebar && overlay) {
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

    // ═══════════════════════════════════════════════════════════════
    // TABS
    // ═══════════════════════════════════════════════════════════════
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`tab-${targetTab}`).classList.add('active');
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // SCROLL TOP
    // ═══════════════════════════════════════════════════════════════
    const profileMain = document.querySelector('.profile-main');
    const footerElement = document.querySelector('footer');

    const footerObserver = new IntersectionObserver((entries) => {
        const [entry] = entries;
        document.body.classList.toggle('footer-mode', entry.isIntersecting);
    }, { threshold: 0.18 });

    if (footerElement) footerObserver.observe(footerElement);

    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY > 400;
        document.body.classList.toggle('show-top-btn', scrolled);
    }, { passive: true });

    if (scrollTopButton) {
        scrollTopButton.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    function crearIconoBootstrap(iconClass, extraClasses = '') {
        const i = document.createElement('i');
        i.className = `bi ${iconClass || ''} ${extraClasses}`.trim();
        i.setAttribute('aria-hidden', 'true');
        return i;
    }

    function iconoRangoPorId(idRango) {
        switch (Number(idRango)) {
            case 1: return 'bi-star-fill';
            case 2: return 'bi-crosshair';
            case 3: return 'bi-shield-fill';
            default: return 'bi-person-badge-fill';
        }
    }

    function iconoLogro(logro) {
        if (logro && typeof logro.icono === 'string' && logro.icono.startsWith('bi-')) return logro.icono;
        switch (logro?.nombre) {
            case 'Primera Sangre': return 'bi-droplet-fill';
            case 'Superviviente': return 'bi-tent-fill';
            case 'Francotirador': return 'bi-bullseye';
            case 'Agente Encubierto': return 'bi-eye-fill';
            default: return 'bi-award-fill';
        }
    }

    function iconoHistorialPorTipo(tipo) {
        switch (tipo) {
            case 'GAME_OVER': return 'bi-skull-fill';
            case 'FLASHCARDS': return 'bi-journal-text';
            case 'INFILTRACION': return 'bi-shield-lock-fill';
            default: return 'bi-lightning-charge-fill';
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // CARGAR DATOS DEL PERFIL DESDE LA API
    // ═══════════════════════════════════════════════════════════════
    async function cargarPerfil() {
        try {
            const response = await fetch(`${API_BASE}/perfil/${USER_ID}`);
            if (!response.ok) throw new Error('Fallo al cargar perfil desde el servidor');
            
            const data = await response.json();

            renderizarPerfil(data);
        } catch (error) {
            console.error('Error al cargar perfil:', error);
            mostrarErrorCarga();
        }
    }

    function renderizarPerfil(data) {
        const u = data.usuario;
        const e = data.estadisticas;

        // Header
        document.getElementById('codename').textContent = u.nombreClave;
        const rankTitleEl = document.getElementById('rankTitle');
        rankTitleEl.textContent = `Rango: ${u.rango}`;
        rankTitleEl.appendChild(crearIconoBootstrap(u.rangoIcono || iconoRangoPorId(u.idRango), 'ms-2'));
        document.getElementById('frenteAsignado').textContent = `Frente: ${u.frenteAsignado || 'Sin asignar'}`;
        document.getElementById('fechaAlistamiento').textContent = `Alistamiento: ${formatearFecha(u.fechaRegistro)}`;
        document.getElementById('idiomaPreferido').textContent = `Idioma: ${u.idiomaPreferido}`;
        document.getElementById('estadoCuenta').textContent = u.estadoCuenta;
        
        // Sidebar sync
        document.getElementById('sidebarRank').textContent = u.rango;
        actualizarVidasSidebar(u.vidasActuales);

        // Stats
        document.getElementById('statFlashcards').textContent = e.palabrasDominadas;
        document.getElementById('statRacha').textContent = u.rachaDias;
        document.getElementById('statSesiones').textContent = e.totalSesiones;
        document.getElementById('statPrecision').textContent = Math.round(e.precisionPromedio) + '%';

        // Estadísticas detalladas
        document.getElementById('estTotalVistas').textContent = e.totalFlashcardsVistas;
        document.getElementById('estTotalAciertos').textContent = e.totalAciertos;
        document.getElementById('estTotalFallos').textContent = e.totalFallos;
        document.getElementById('estMejorRacha').textContent = e.mejorRacha;
        document.getElementById('estTiempoTotal').textContent = Math.floor(e.tiempoTotalEntrenamiento / 60) + 'h ' + (e.tiempoTotalEntrenamiento % 60) + 'm';
        document.getElementById('estNivelActual').textContent = e.nivelActual;

        // Progreso rango
        const progreso = Math.min(100, (data.siguienteRango.puntosActuales / data.siguienteRango.nivelRequerido) * 100);
        document.getElementById('progressText').textContent = `${data.siguienteRango.puntosActuales} / ${data.siguienteRango.nivelRequerido} XP`;
        document.getElementById('rankProgressBar').style.width = `${progreso}%`;
        document.getElementById('nextRankName').textContent = `Siguiente: ${data.siguienteRango.nombre}`;

        // Logros
        renderizarLogros(data.logros);

        // Historial
        renderizarHistorial(data.historial);
    }

    function actualizarVidasSidebar(vidas) {
        const lives = document.querySelectorAll('#sidebarLives .life');
        lives.forEach((life, index) => {
            life.classList.toggle('active', index < vidas);
        });
    }

    function renderizarLogros(logros) {
        const grid = document.getElementById('achievementsGrid');
        grid.innerHTML = '';

        logros.forEach(logro => {
            const card = document.createElement('div');
            card.className = `achievement-card ${!logro.desbloqueado ? 'locked' : ''} ${logro.secreto ? 'secret' : ''}`;

            const iconDiv = document.createElement('div');
            iconDiv.className = 'achievement-icon';
            iconDiv.appendChild(crearIconoBootstrap(iconoLogro(logro)));

            const nameDiv = document.createElement('div');
            nameDiv.className = 'achievement-name';
            nameDiv.textContent = logro.nombre;

            const descDiv = document.createElement('div');
            descDiv.className = 'achievement-desc';
            descDiv.textContent = logro.descripcion;

            const dateDiv = document.createElement('div');
            dateDiv.className = 'achievement-date';

            if (logro.desbloqueado) {
                const fechaStr = logro.fecha ? formatearFecha(logro.fecha) : 'Desbloqueado';
                dateDiv.appendChild(crearIconoBootstrap('bi-check2-circle', 'me-1'));
                dateDiv.appendChild(document.createTextNode(fechaStr));
            } else {
                dateDiv.appendChild(crearIconoBootstrap('bi-lock-fill', 'me-1'));
                dateDiv.appendChild(document.createTextNode(`Requiere: ${logro.puntos} XP`));
            }

            card.appendChild(iconDiv);
            card.appendChild(nameDiv);
            card.appendChild(descDiv);
            card.appendChild(dateDiv);
            grid.appendChild(card);
        });
    }

    function renderizarHistorial(historial) {
        const list = document.getElementById('historyList');
        list.innerHTML = '';

        if (historial.length === 0) {
            list.innerHTML = '<div class="history-item"><div class="history-info"><div class="history-title">Sin operaciones registradas</div></div></div>';
            return;
        }

        historial.forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';

            const infoDiv = document.createElement('div');
            infoDiv.className = 'history-info';

            const titleDiv = document.createElement('div');
            titleDiv.className = 'history-title';
            titleDiv.appendChild(crearIconoBootstrap(iconoHistorialPorTipo(item.tipo), 'me-2'));
            titleDiv.appendChild(document.createTextNode(item.titulo));

            const metaDiv = document.createElement('div');
            metaDiv.className = 'history-meta';
            metaDiv.textContent = `${formatearFecha(item.fecha)} • ${item.tipo}`;

            infoDiv.appendChild(titleDiv);
            infoDiv.appendChild(metaDiv);

            const puntosDiv = document.createElement('div');
            puntosDiv.className = `history-points ${item.puntos < 0 ? 'negative' : ''}`;
            puntosDiv.textContent = `${item.puntos > 0 ? '+' : ''}${item.puntos} XP`;

            div.appendChild(infoDiv);
            div.appendChild(puntosDiv);
            list.appendChild(div);
        });
    }

    function formatearFecha(fechaStr) {
        if (!fechaStr) return '--/--/----';
        const fecha = new Date(fechaStr);
        return fecha.toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function mostrarErrorCarga() {
        document.getElementById('codename').textContent = 'ERROR DE CONEXIÓN';
        document.querySelector('.profile-bio').innerHTML = '<div class="text-danger">No se pudo establecer enlace con la base de datos Operación Babel.</div>';
    }

    // Botón de configuración
    const configModal = new bootstrap.Modal(document.getElementById('configModal'));
    const btnConfig = document.getElementById('btnConfig');
    const configVolumen = document.getElementById('configVolumen');
    const volumenLabel = document.getElementById('volumenLabel');
    const configNotificaciones = document.getElementById('configNotificaciones');
    const configDaltonico = document.getElementById('configDaltonico');

    let isUpdatingConfig = false;

    btnConfig?.addEventListener('click', async () => {
        // Cargar desde API
        try {
            const res = await fetch(`${API_BASE}/configuracion/${USER_ID}`);
            if (res.ok) {
                const conf = await res.json();
                isUpdatingConfig = true;
                configVolumen.value = conf.VolumenGeneral ?? 100;
                volumenLabel.textContent = configVolumen.value + '%';
                configNotificaciones.checked = conf.NotificacionesHabilitadas ?? true;
                configDaltonico.checked = conf.ModoDaltonico ?? false;
                isUpdatingConfig = false;
            }
        } catch(e) {
            console.error('Error cargando configuracion', e);
        }
        configModal.show();
    });

    async function saveConfig() {
        if (isUpdatingConfig) return;
        try {
            await fetch(`${API_BASE}/configuracion/${USER_ID}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    TemaVisual: 'oscuro',
                    VolumenGeneral: parseInt(configVolumen.value),
                    NotificacionesHabilitadas: configNotificaciones.checked,
                    ModoDaltonico: configDaltonico.checked
                })
            });
            // Aplicar cambios en vivo localmente (ejemplo)
            if (configDaltonico.checked) {
                document.body.classList.add('daltonico-mode');
            } else {
                document.body.classList.remove('daltonico-mode');
            }
        } catch(e) {
            console.error('Error guardando configuracion', e);
        }
    }

    configVolumen.addEventListener('input', (e) => {
        volumenLabel.textContent = e.target.value + '%';
    });
    configVolumen.addEventListener('change', saveConfig);
    configNotificaciones.addEventListener('change', saveConfig);
    configDaltonico.addEventListener('change', saveConfig);

    // Cargar datos al iniciar
    cargarPerfil();

    console.log('Perfil Babel Iniciado...');
});