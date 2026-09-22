// Auth.js - Proteccion de rutas y sincronizacion de sesion.
// La clave de la Oficina de Operaciones YA NO vive en el cliente:
// se valida contra POST /api/administradores/verificar-clave.
(function() {
    const currentPath = window.location.pathname;
    const isPublicPage = currentPath.endsWith('Login.html') || currentPath.endsWith('Enlistamiento.html') || currentPath.endsWith('Babelhome.html') || currentPath.endsWith('/') || currentPath.endsWith('Intendentes.html');
    const isAdminPage = currentPath.endsWith('Administradores.html') || currentPath.endsWith('Intendentes.html');
    const isOficinaOperaciones = currentPath.endsWith('Administradores.html');
    const ADMIN_UNLOCK_KEY = 'babelAdminAccess';

    const user = window.BabelAPI ? window.BabelAPI.obtenerSesion() : null;

    function hasAdminUnlock() {
        return sessionStorage.getItem(ADMIN_UNLOCK_KEY) === '1';
    }

    function clearAdminUnlock() {
        sessionStorage.removeItem(ADMIN_UNLOCK_KEY);
    }

    function setAdminUnlock() {
        sessionStorage.setItem(ADMIN_UNLOCK_KEY, '1');
    }

    // Valida la clave contra el backend. Devuelve true/false.
    async function validarClaveAdmin(clave) {
        try {
            await window.BabelAPI.verificarClaveAdmin(clave);
            return true;
        } catch (e) {
            console.error(`[${e.codigo || 'BBL-GEN-001'}] Clave rechazada:`, e.error);
            return false;
        }
    }

    function attachAdminAccessPrompts() {
        document.querySelectorAll('[data-admin-access]').forEach((element) => {
            element.addEventListener('click', async (event) => {
                event.preventDefault();
                const clave = window.prompt('Ingresa la clave de acceso a la Oficina de Operaciones:');
                if (clave === null) return;

                if (await validarClaveAdmin(clave)) {
                    setAdminUnlock();
                    window.location.href = element.getAttribute('href') || 'Pages/Administradores.html';
                } else {
                    window.alert('Clave incorrecta.');
                }
            });
        });
    }

    // Oficina de Operaciones: acceso SOLO con clave de seguridad validada por el servidor.
    if (isOficinaOperaciones) {
        if (hasAdminUnlock()) {
            window.babelUser = user;
            document.addEventListener('DOMContentLoaded', attachAdminAccessPrompts);
            return;
        }

        document.addEventListener('DOMContentLoaded', async () => {
            document.body.style.display = 'none';

            const clave = window.prompt('ACCESO RESTRINGIDO\n\nIngresa la clave de seguridad para entrar a la Oficina de Operaciones:');
            if (clave === null) {
                window.location.replace(currentPath.includes('/Pages/') ? '../Babelhome.html' : 'Babelhome.html');
                return;
            }

            if (await validarClaveAdmin(clave)) {
                setAdminUnlock();
                document.body.style.display = '';
                window.babelUser = user;
                attachAdminAccessPrompts();
                return;
            }

            window.alert('Clave incorrecta. Acceso denegado.');
            window.location.replace(currentPath.includes('/Pages/') ? '../Babelhome.html' : 'Babelhome.html');
        });
        return;
    }

    if (!user && !isPublicPage) {
        const inRoot = window.location.pathname.endsWith('Babelhome.html') || window.location.pathname.endsWith('/') || !window.location.pathname.includes('/Pages/');
        window.location.replace(inRoot ? 'Pages/Login.html' : 'Login.html');
        return;
    }

    if (isAdminPage && !(user && Number(user.idRango || 0) >= 4) && !hasAdminUnlock()) {
        const inRoot = window.location.pathname.endsWith('Babelhome.html') || window.location.pathname.endsWith('/') || !window.location.pathname.includes('/Pages/');
        clearAdminUnlock();
        window.location.replace(inRoot ? 'Babelhome.html' : '../Babelhome.html');
        return;
    }

    window.babelUser = user;

    document.addEventListener('DOMContentLoaded', () => {
        attachAdminAccessPrompts();
        const sidebar = document.getElementById('sidebar');
        if (sidebar && user) {
            const userCodenameEl = document.getElementById('sidebarCodename') || document.getElementById('sidebarRank');
            if (userCodenameEl) userCodenameEl.textContent = user.nombreClave;

            const logoutBtn = document.createElement('a');
            logoutBtn.href = '#';
            logoutBtn.className = 'sidebar-link text-danger mt-auto';
            logoutBtn.style.borderTop = '1px solid #333';
            logoutBtn.style.marginTop = 'auto';
            logoutBtn.innerHTML = '<i class="bi bi-box-arrow-left"></i> Desconectar';
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.BabelAPI.cerrarSesion();
                const inRoot = window.location.pathname.endsWith('Babelhome.html') || window.location.pathname.endsWith('/') || !window.location.pathname.includes('/Pages/');
                window.location.replace(inRoot ? 'Pages/Login.html' : 'Login.html');
            });
            sidebar.appendChild(logoutBtn);
        }
    });
})();
