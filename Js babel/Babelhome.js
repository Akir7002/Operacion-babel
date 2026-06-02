// Comportamiento de la pagina principal y sus accesos rapidos.
document.addEventListener('DOMContentLoaded', () => {
    // Secciones visibles en el inicio y en la zona de misiones.
    const heroSection = document.querySelector('.hero-section');
    const missionSection = document.querySelector('.mission-section');
    const footerElement = document.querySelector('footer');
    const heroButton = document.getElementById('heroScrollButton');
    const enlistButton = document.getElementById('enlistButton');
    const scrollTopButton = document.querySelector('.scroll-top-btn');
    const targetNodes = document.querySelectorAll('.target-node');
    const header = document.querySelector('header');
    const sectionVisibility = {
        mission: false,
        footer: false,
    };

    // Lleva la vista al bloque de misiones.
    function scrollToMission() {
        if (missionSection) {
            missionSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // Retorna al encabezado principal.
    function scrollToTop() {
        if (heroSection) {
            heroSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // Controla si el boton de regreso arriba debe mostrarse.
    function updateTopButtonVisibility() {
        document.body.classList.toggle('show-top-btn', sectionVisibility.mission || sectionVisibility.footer);
    }

    // Oculta el header cuando el hero deja de estar enfocado.
    const heroObserver = new IntersectionObserver((entries) => {
        const [entry] = entries;
        document.body.classList.toggle('header-hidden', !entry.isIntersecting);
    }, {
        threshold: 0.55,
    });

    // Muestra el atajo superior cuando la pagina ya tiene scroll.
    const sectionObserver = new IntersectionObserver((entries) => {
        const [entry] = entries;
        sectionVisibility.mission = entry.isIntersecting;
        updateTopButtonVisibility();
    }, {
        threshold: 0.25,
    });

    // Ajusta estilos al entrar en el pie de pagina.
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

    if (enlistButton) {
        enlistButton.addEventListener('click', () => {
            window.location.href = 'Pages/Enlistamiento.html';
        });
    }

    const exportExcelBtn = document.getElementById('exportExcelBtn');
    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', () => {
            // Reemplazar o asegurar que apunta al backend real
            const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                            ? 'http://localhost:3000/api/exportar/reclutas' 
                            : '/api/exportar/reclutas';
            window.open(apiUrl, '_blank');
        });
    }

    // Sidebar lateral para navegar entre secciones.
    function inicializarSidebar() {
        const menuBtn = document.getElementById('menuBtn');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');

        if (!menuBtn || !sidebar || !overlay) return;

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

    inicializarSidebar();

    targetNodes.forEach((node) => {
        node.addEventListener('mouseover', () => {
            node.style.filter = 'brightness(1.5) drop-shadow(0 0 15px red)';
        });

        node.addEventListener('mouseout', () => {
            node.style.filter = 'none';
        });

        node.addEventListener('click', (event) => {
            const label = event.currentTarget.querySelector('.target-label');
            if (!label) {
                return;
            }

            console.log('Iniciando despliegue en: ' + label.innerText);
        });
    });

    window.scrollToMission = scrollToMission;
    window.scrollToTop = scrollToTop;
    window.addEventListener('load', () => {
        console.log('Sistema Babel Iniciado...');
        if (header) {
            header.classList.remove('header-hidden');
        }
    });
});