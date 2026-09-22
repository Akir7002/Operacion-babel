// Pantalla de acceso: valida credenciales y guarda la sesion activa.
// Las llamadas HTTP se hacen a traves de window.BabelAPI (core/api.js).
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const errorText = document.getElementById('errorText');
    const btnSubmit = document.getElementById('btnSubmit');

    // Sidebar de navegacion secundaria (compartido en core/ui.js).
    BabelUI.inicializarSidebar();

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

            const data = await window.BabelAPI.login(correo, contrasena);

            // Persistir la sesion para el resto de paginas.
            window.BabelAPI.guardarSesion({
                idUsuario: data.usuario.IdUsuario,
                nombreClave: data.usuario.NombreClave,
                idRango: data.usuario.IdRango
            });

            // Llevar al usuario al panel correcto segun su rango.
            if (Number(data.usuario.IdRango) >= 4) {
                window.location.href = 'Administradores.html';
            } else {
                window.location.href = '../Babelhome.html';
            }
        } catch (error) {
            console.error('Error de login:', error.codigo || '', error.message);
            mostrarError(error.message || 'Acceso denegado.');
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = 'INICIAR CONEXIÓN <i class="bi bi-box-arrow-in-right ms-2"></i>';
        }
    });

    function mostrarError(mensaje) {
        errorText.textContent = mensaje;
        loginError.classList.remove('d-none');
    }

    // ═══════════════════════════════════════════════════════════════
    // RECUPERACION DE CONTRASENA
    // ═══════════════════════════════════════════════════════════════
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const recoverySection = document.getElementById('recoverySection');
    const recoveryStep1 = document.getElementById('recoveryStep1');
    const recoveryStep2 = document.getElementById('recoveryStep2');
    const recoveryEmail = document.getElementById('recoveryEmail');
    const recoveryTokenInput = document.getElementById('recoveryToken');
    const recoveryNewPassword = document.getElementById('recoveryNewPassword');
    const btnSendRecovery = document.getElementById('btnSendRecovery');
    const btnCancelRecovery = document.getElementById('btnCancelRecovery');
    const btnResetPassword = document.getElementById('btnResetPassword');
    const btnBackToStep1 = document.getElementById('btnBackToStep1');
    const recoveryError1 = document.getElementById('recoveryError1');
    const recoverySuccess1 = document.getElementById('recoverySuccess1');
    const recoveryError2 = document.getElementById('recoveryError2');
    const recoverySuccess2 = document.getElementById('recoverySuccess2');

    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.classList.add('d-none');
            recoverySection.classList.remove('d-none');
        });
    }

    if (btnCancelRecovery) {
        btnCancelRecovery.addEventListener('click', () => {
            recoverySection.classList.add('d-none');
            loginForm.classList.remove('d-none');
            recoveryStep1.classList.remove('d-none');
            recoveryStep2.classList.add('d-none');
            limpiarRecovery();
        });
    }

    if (btnBackToStep1) {
        btnBackToStep1.addEventListener('click', () => {
            recoveryStep2.classList.add('d-none');
            recoveryStep1.classList.remove('d-none');
            limpiarRecovery();
        });
    }

    function limpiarRecovery() {
        recoveryError1.classList.add('d-none');
        recoverySuccess1.classList.add('d-none');
        recoveryError2.classList.add('d-none');
        recoverySuccess2.classList.add('d-none');
        if (recoveryEmail) recoveryEmail.value = '';
        if (recoveryTokenInput) recoveryTokenInput.value = '';
        if (recoveryNewPassword) recoveryNewPassword.value = '';
    }

    if (btnSendRecovery) {
        btnSendRecovery.addEventListener('click', async () => {
            const email = recoveryEmail ? recoveryEmail.value.trim() : '';
            recoveryError1.classList.add('d-none');
            recoverySuccess1.classList.add('d-none');

            if (!email) {
                recoveryError1.textContent = 'Ingresa tu correo electronico.';
                recoveryError1.classList.remove('d-none');
                return;
            }

            btnSendRecovery.disabled = true;
            btnSendRecovery.innerHTML = '<span class="spinner-border spinner-border-sm"></span> BUSCANDO...';

            try {
                const data = await window.BabelAPI.recuperarContrasena(email);

                recoverySuccess1.innerHTML = `<strong>Token generado para ${data.nombreClave}:</strong><br><code style="word-break:break-all; font-size:0.75rem;">${data.token}</code><br><small class="text-muted">Copia este token y pásalo en el siguiente paso.</small>`;
                recoverySuccess1.classList.remove('d-none');

                setTimeout(() => {
                    recoveryStep1.classList.add('d-none');
                    recoveryStep2.classList.remove('d-none');
                }, 2000);
            } catch (error) {
                recoveryError1.textContent = error.message;
                recoveryError1.classList.remove('d-none');
            } finally {
                btnSendRecovery.disabled = false;
                btnSendRecovery.innerHTML = 'ENVIAR TOKEN <i class="bi bi-send ms-2"></i>';
            }
        });
    }

    if (btnResetPassword) {
        btnResetPassword.addEventListener('click', async () => {
            const token = recoveryTokenInput ? recoveryTokenInput.value.trim() : '';
            const newPass = recoveryNewPassword ? recoveryNewPassword.value.trim() : '';
            recoveryError2.classList.add('d-none');
            recoverySuccess2.classList.add('d-none');

            if (!token || !newPass) {
                recoveryError2.textContent = 'Token y nueva contraseña son requeridos.';
                recoveryError2.classList.remove('d-none');
                return;
            }

            if (newPass.length < 4) {
                recoveryError2.textContent = 'La contraseña debe tener al menos 4 caracteres.';
                recoveryError2.classList.remove('d-none');
                return;
            }

            btnResetPassword.disabled = true;
            btnResetPassword.innerHTML = '<span class="spinner-border spinner-border-sm"></span> RESTABLECIENDO...';

            try {
                const data = await window.BabelAPI.restablecerContrasena(token, newPass);

                recoverySuccess2.textContent = `Contraseña de ${data.nombreClave} actualizada correctamente. Ya puedes iniciar sesión.`;
                recoverySuccess2.classList.remove('d-none');

                setTimeout(() => {
                    recoverySection.classList.add('d-none');
                    loginForm.classList.remove('d-none');
                    limpiarRecovery();
                }, 3000);
            } catch (error) {
                recoveryError2.textContent = error.message;
                recoveryError2.classList.remove('d-none');
            } finally {
                btnResetPassword.disabled = false;
                btnResetPassword.innerHTML = 'RESTABLECER <i class="bi bi-check-circle ms-2"></i>';
            }
        });
    }
});
