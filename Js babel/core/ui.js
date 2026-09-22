// UI de Operacion Babel - utilidades compartidas entre paginas.
// Reemplaza la duplicacion de sidebar, scroll behavior, accesibilidad,
// validacion de correo/clave, logros y vidas en los 9 modulos.
// Debe cargarse DESPUES de core/api.js (usa window.BabelAPI).
const BabelUI = (() => {
    // ── Sesion y usuario ───────────────────────────────────────────
    function obtenerIdUsuario() {
        const sesion = window.BabelAPI ? window.BabelAPI.obtenerSesion() : null;
        return sesion ? sesion.idUsuario : null;
    }

    // ── Accesibilidad (daltonismo / animaciones reducidas) ─────────
    async function aplicarAccesibilidad(idUsuario) {
        const uid = idUsuario ?? window.babelUser?.idUsuario;
        if (!uid) return;
        try {
            const c = await window.BabelAPI.obtenerConfiguracion(uid);
            if (c.ModoDaltonico) document.body.classList.add('daltonico-mode');
            if (c.AnimacionesReducidas) document.body.classList.add('reduced-animations');
        } catch (e) { /* config sin persistir: se ignora */ }
    }

    // ── Sidebar lateral ────────────────────────────────────────────
    // usaClaseEnBody: tambien conmuta `sidebar-active` en <body> (Ahorcado/Enlistamiento).
    function inicializarSidebar(opciones = {}) {
        const usaClaseEnBody = Boolean(opciones.usaClaseEnBody);
        const menuBtn = document.getElementById('menuBtn');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');

        if (!menuBtn || !sidebar || !overlay) return;

        menuBtn.style.cursor = 'pointer';
        menuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
            if (usaClaseEnBody) {
                document.body.classList.toggle('sidebar-active', sidebar.classList.contains('active'));
            }
        });

        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            if (usaClaseEnBody) {
                document.body.classList.remove('sidebar-active');
            }
        });
    }

    // ── Scroll top + header hide (variante con hero/mision) ───────
    // Usada por Babelhome, Mazos, Flashcards, Perfil, Administradores e Intendentes.
    // Opciones: heroSelector, misionSelector, scrollTopSelector, thresholdHero.
    function inicializarScrollTop(opciones = {}) {
        const heroSection = document.querySelector(opciones.heroSelector || '[data-hero]');
        const missionSection = document.querySelector(opciones.misionSelector || '[data-mission]');
        const footerElement = document.querySelector('footer');
        const scrollTopButton = document.querySelector(opciones.scrollTopSelector || '#scrollTopButton');
        const heroButton = document.getElementById('heroScrollButton');
        const header = document.querySelector('header');
        const sectionVisibility = { mision: false, footer: false };

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
            document.body.classList.toggle('show-top-btn', sectionVisibility.mision || sectionVisibility.footer);
        }

        const heroObserver = new IntersectionObserver((entries) => {
            const [entry] = entries;
            document.body.classList.toggle('header-hidden', !entry.isIntersecting);
        }, { threshold: opciones.thresholdHero ?? 0.55 });

        const sectionObserver = new IntersectionObserver((entries) => {
            const [entry] = entries;
            sectionVisibility.mision = entry.isIntersecting;
            updateTopButtonVisibility();
        }, { threshold: 0.25 });

        const footerObserver = new IntersectionObserver((entries) => {
            const [entry] = entries;
            document.body.classList.toggle('footer-mode', entry.isIntersecting);
            sectionVisibility.footer = entry.isIntersecting;
            updateTopButtonVisibility();
        }, { threshold: 0.18 });

        if (heroSection) heroObserver.observe(heroSection);
        if (missionSection) sectionObserver.observe(missionSection);
        if (footerElement) footerObserver.observe(footerElement);

        if (heroButton) heroButton.addEventListener('click', scrollToMission);
        if (scrollTopButton) scrollTopButton.addEventListener('click', scrollToTop);

        window.scrollToMission = scrollToMission;
        window.scrollToTop = scrollToTop;
        window.addEventListener('load', () => {
            if (header) header.classList.remove('header-hidden');
        });
    }

    // ── Scroll con deteccion del elemento correcto ─────────────────
    // Variante de Ahorcado y Enlistamiento: resuelve el contenedor con scroll
    // real (documentElement, main, .main-content...) con requestAnimationFrame.
    // usaSentinel (Enlistamiento): crea un centinela sobre <main>.
    function inicializarScrollBehavior(opciones = {}) {
        const mainSection = document.querySelector(opciones.mainSelector || 'main');
        const missionSection = document.querySelector(opciones.misionSelector || '.page-mission');
        const footerElement = document.querySelector('footer');
        const scrollTopButton = document.getElementById('scrollTopButton');
        const sectionVisibility = { principal: false, footer: false };

        function updateTopButtonVisibility() {
            document.body.classList.toggle('show-top-btn', sectionVisibility.principal || sectionVisibility.footer);
        }

        const navbarThresholdPx = 5;
        let lastScrollTop = 0;
        let ticking = false;

        function resolveScrollElement() {
            const candidates = [
                document.scrollingElement,
                document.documentElement,
                document.body,
                document.querySelector('main'),
                document.querySelector('.main-content'),
                document.querySelector('.page-shell'),
                document.querySelector('.page-wrap'),
            ].filter(Boolean);

            return candidates.find((el) => (el.scrollHeight - el.clientHeight) > 2)
                || document.scrollingElement
                || document.documentElement;
        }

        let scrollElement = null;

        function getScrollTop() {
            const el = scrollElement || (scrollElement = resolveScrollElement());
            return el ? el.scrollTop : window.scrollY;
        }

        function showHeader() {
            document.body.classList.remove('header-hidden');
        }

        function hideHeader() {
            document.body.classList.add('header-hidden');
        }

        function updateHeaderOnScroll() {
            const currentTop = getScrollTop();

            if (currentTop <= navbarThresholdPx) {
                showHeader();
                lastScrollTop = currentTop;
                return;
            }

            const delta = currentTop - lastScrollTop;
            if (Math.abs(delta) < 1) {
                return;
            }

            if (delta > 0) {
                hideHeader();
            } else {
                showHeader();
            }

            lastScrollTop = currentTop;
        }

        function onScroll() {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(() => {
                updateHeaderOnScroll();
                ticking = false;
            });
        }

        const scrollObserver = new IntersectionObserver((entries) => {
            const [entry] = entries;
            // Enlistamiento usa un centinela: se muestra el boton cuando el usuario
            // ha pasado el margen superior. Ahorcado muestra el boton mientras la
            // seccion de misiones es visible.
            sectionVisibility.principal = opciones.invertirInterseccion
                ? !entry.isIntersecting
                : entry.isIntersecting;
            updateTopButtonVisibility();
        }, { threshold: 0.25 });

        const footerObserver = new IntersectionObserver((entries) => {
            const [entry] = entries;
            document.body.classList.toggle('footer-mode', entry.isIntersecting);
            sectionVisibility.footer = entry.isIntersecting;
            updateTopButtonVisibility();
        }, { threshold: 0.18 });

        if (opciones.usaSentinel && mainSection) {
            const sentinel = document.createElement('div');
            sentinel.style.position = 'absolute';
            sentinel.style.top = '100px';
            sentinel.style.height = '1px';
            sentinel.style.width = '100%';
            sentinel.style.pointerEvents = 'none';
            document.body.prepend(sentinel);
            scrollObserver.observe(sentinel);
        } else if (missionSection) {
            scrollObserver.observe(missionSection);
        }

        if (footerElement) {
            footerObserver.observe(footerElement);
        }

        if (scrollTopButton) {
            scrollTopButton.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        scrollElement = resolveScrollElement();
        lastScrollTop = getScrollTop();
        updateHeaderOnScroll();

        window.addEventListener('scroll', onScroll, { passive: true });
        document.addEventListener('scroll', onScroll, true);

        window.addEventListener('load', () => {
            scrollElement = null;
            lastScrollTop = getScrollTop();
            updateHeaderOnScroll();
        });
    }

    // ── Validacion de correo institucional ─────────────────────────
    const DOMINIOS_PERMITIDOS = [
        'gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'live.com',
        'icloud.com', 'protonmail.com', 'aol.com', 'zoho.com', 'mail.com',
        'outlook.es', 'hotmail.es', 'yahoo.es', 'gmail.es'
    ];

    function esCorreoValido(value) {
        const email = value.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(email)) return false;
        return DOMINIOS_PERMITIDOS.includes(email.split('@')[1]);
    }

    function obtenerErrorDominioCorreo(value) {
        const email = value.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(email)) return 'Formato de correo invalido.';
        if (!DOMINIOS_PERMITIDOS.includes(email.split('@')[1])) {
            return 'Dominio no permitido. Usa Gmail, Outlook, Hotmail, Yahoo u otro valido.';
        }
        return '';
    }

    // ── Clave de seguridad administrativa ──────────────────────────
    // Solo comprueba presencia/longitud en el cliente. La validacion real
    // la hace el backend en POST /api/administradores/verificar-clave.
    function claveSeguridadSintaxisValida(value) {
        return String(value || '').trim().length >= 6;
    }

    // ── Logros ─────────────────────────────────────────────────────
    async function evaluarLogros() {
        const userId = obtenerIdUsuario();
        if (!userId) return;
        try {
            const data = await window.BabelAPI.evaluarLogros(userId);
            if (data && data.nuevosLogros && data.nuevosLogros.length > 0) {
                data.nuevosLogros.forEach((logro) => {
                    console.log(`Logro desbloqueado: ${logro.Nombre} (+${logro.Puntos} XP)`);
                });
            }
        } catch (e) {
            console.warn('Error evaluando logros:', e.codigo || '', e.message);
        }
    }

    // ── Vidas del sidebar ──────────────────────────────────────────
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

    // ── Sello de procesamiento ─────────────────────────────────────
    function mostrarSello(stamp, mensaje) {
        if (!stamp) return;
        if (mensaje) stamp.textContent = mensaje;
        stamp.classList.add('stamp-active');
    }

    function ocultarSello(stamp) {
        if (!stamp) return;
        stamp.classList.remove('stamp-active');
    }

    return {
        obtenerIdUsuario,
        aplicarAccesibilidad,
        inicializarSidebar,
        inicializarScrollTop,
        inicializarScrollBehavior,
        esCorreoValido,
        obtenerErrorDominioCorreo,
        claveSeguridadSintaxisValida,
        evaluarLogros,
        actualizarVidas,
        mostrarSello,
        ocultarSello,
    };
})();