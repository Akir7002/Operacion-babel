// Comportamiento de la pagina principal y sus accesos rapidos.
// Las llamadas HTTP se hacen a traves de window.BabelAPI (core/api.js).
document.addEventListener('DOMContentLoaded', () => {
    // Aplicar configuracion de accesibilidad.
    BabelUI.aplicarAccesibilidad();

    // Secciones visibles en el inicio y en la zona de misiones.
    const enlistButton = document.getElementById('enlistButton');
    const targetNodes = document.querySelectorAll('.target-node');

    // Scroll suave, atajo superior y ocultamiento del header al bajar.
    BabelUI.inicializarScrollTop({
        heroSelector: '.hero-section',
        misionSelector: '.mission-section',
        scrollTopSelector: '.scroll-top-btn',
    });

    if (enlistButton) {
        enlistButton.addEventListener('click', () => {
            window.location.href = 'Pages/Enlistamiento.html';
        });
    }

    // Sidebar lateral para navegar entre secciones.
    BabelUI.inicializarSidebar();

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

    window.addEventListener('load', () => {
        console.log('Sistema Babel Iniciado...');
        const header = document.querySelector('header');
        if (header) {
            header.classList.remove('header-hidden');
        }
    });
});
