// Auth.js - Proteccion de rutas y sincronizacion de sesion.
(function() {
    // Estas paginas pueden verse sin sesion activa.
    const currentPath = window.location.pathname;
    const isPublicPage = currentPath.endsWith('Login.html') || currentPath.endsWith('Enlistamiento.html') || currentPath.endsWith('Babelhome.html') || currentPath.endsWith('/');

    // Carga la sesion persistida, si existe.
    const sessionStr = localStorage.getItem('babelUser');
    let user = null;

    if (sessionStr) {
        try {
            user = JSON.parse(sessionStr);
        } catch(e) {
            console.error('Error parseando sesión', e);
        }
    }

    if (!user && !isPublicPage) {
        // Si la ruta es privada y no hay sesion, redirige a login.
        const inRoot = window.location.pathname.endsWith('Babelhome.html') || window.location.pathname.endsWith('/') || !window.location.pathname.includes('/Pages/');
        window.location.replace(inRoot ? 'Pages/Login.html' : 'Login.html');
        return; // Detener ejecución
    }

    // Exponer globalmente el usuario para el resto de scripts.
    window.babelUser = user;

    // Cuando cargue el DOM, insertar el acceso a cierre de sesion.
    document.addEventListener('DOMContentLoaded', () => {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && user) {
            // Actualiza el codename visible en la barra lateral.
            const userCodenameEl = document.getElementById('sidebarCodename') || document.getElementById('sidebarRank');
            if (userCodenameEl) userCodenameEl.textContent = user.nombreClave;

            // Crea el enlace de salida para limpiar la sesion.
            const logoutBtn = document.createElement('a');
            logoutBtn.href = '#';
            logoutBtn.className = 'sidebar-link text-danger mt-auto'; // mt-auto pushes it to bottom if flex
            logoutBtn.style.borderTop = '1px solid #333';
            logoutBtn.style.marginTop = 'auto';
            logoutBtn.innerHTML = '<i class="bi bi-box-arrow-left"></i> Desconectar';
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('babelUser');
                const inRoot = window.location.pathname.endsWith('Babelhome.html') || window.location.pathname.endsWith('/') || !window.location.pathname.includes('/Pages/');
                window.location.replace(inRoot ? 'Pages/Login.html' : 'Login.html');
            });
            sidebar.appendChild(logoutBtn);
        }
    });
})();
