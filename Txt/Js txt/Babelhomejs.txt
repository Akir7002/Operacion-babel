document.addEventListener('DOMContentLoaded', () => {
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

    function scrollToMission() {
        if (missionSection) {
            missionSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function scrollToTop() {
        if (heroSection) {
            heroSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
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

    if (enlistButton) {
        enlistButton.addEventListener('click', () => {
            window.location.href = 'Pages/Enlistamiento.html';
        });
    }

    // Inicializar sidebar (botón de hamburguesa)
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