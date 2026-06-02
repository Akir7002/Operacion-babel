// Pantalla de acceso: valida credenciales y guarda la sesion activa.
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = 'http://localhost:3000/api';
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const errorText = document.getElementById('errorText');
    const btnSubmit = document.getElementById('btnSubmit');

    // Elementos del sidebar para navegacion secundaria.
    const menuBtn = document.getElementById('menuBtn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (menuBtn && sidebar && sidebarOverlay) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
        });

        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    }

    // Si ya existe sesion, no volver a mostrar el login.
    const session = localStorage.getItem('babelUser');
    if (session) {
        window.location.href = '../Babelhome.html';
    }

    // Envio del formulario de acceso.
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const correo = document.getElementById('correo').value.trim();
        const contrasena = document.getElementById('contrasena').value.trim();

        if (!correo || !contrasena) {
            mostrarError('Por favor, ingresa ambas credenciales.');
            return;
        }

        try {
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> VERIFICANDO...';
            
            const response = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    Correo: correo,
                    Contrasena: contrasena
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Persistir la sesion para el resto de paginas.
                localStorage.setItem('babelUser', JSON.stringify({
                    idUsuario: data.usuario.IdUsuario,
                    nombreClave: data.usuario.NombreClave,
                    idRango: data.usuario.IdRango
                }));

                // Llevar al usuario al panel principal.
                window.location.href = '../Babelhome.html';
            } else {
                mostrarError(data.error || 'Acceso denegado.');
            }
        } catch (error) {
            console.error('Error de login:', error);
            mostrarError('Sin conexión con la Base de Datos.');
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = 'INICIAR CONEXIÓN <i class="bi bi-box-arrow-in-right ms-2"></i>';
        }
    });

    function mostrarError(mensaje) {
        errorText.textContent = mensaje;
        loginError.classList.remove('d-none');
    }
});
