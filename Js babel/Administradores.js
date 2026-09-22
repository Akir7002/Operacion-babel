/* ═══════════════════════════════════════════════════════════════
   ADMINISTRADORES.JS - Panel de Administracion de Operación Babel
   Alta de administradores, listado de usuarios activos y bajas.
   ═══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    const adminForm = document.getElementById('adminForm');
    const adminNameInput = document.getElementById('adminName');
    const adminContactInput = document.getElementById('adminContact');
    const adminSecurityKeyInput = document.getElementById('adminSecurityKey');
    const adminPasswordInput = document.getElementById('adminPassword');
    const adminNameField = document.getElementById('adminNameField');
    const adminContactField = document.getElementById('adminContactField');
    const adminSecurityField = document.getElementById('adminSecurityField');
    const adminPasswordField = document.getElementById('adminPasswordField');
    const adminSummaryView = document.getElementById('adminSummaryView');
    const adminUsersList = document.getElementById('adminUsersList');
    const userSearchInput = document.getElementById('userSearch');
    const refreshUsersBtn = document.getElementById('refreshUsersBtn');
    const exportUsersBtn = document.getElementById('exportUsersBtn');
    const activeUsersCount = document.getElementById('activeUsersCount');
    const registryStatus = document.getElementById('registryStatus');
    const newAdminBtn = document.getElementById('newAdminBtn');
    const stamp = document.getElementById('stamp');
    const blackout = document.getElementById('blackoutScreen');
    const adminUnlockKey = 'babelAdminAccess';

    BabelUI.inicializarSidebar();
    BabelUI.inicializarScrollTop();
    validarAccesoAdministrador();

    let activeUsers = [];

    function validarAccesoAdministrador() {
        const currentUser = window.babelUser;
        const userRank = Number(currentUser?.idRango || 0);
        const hasUnlock = sessionStorage.getItem(adminUnlockKey) === '1';

        if (userRank < 4 && !hasUnlock) {
            if (blackout) {
                blackout.classList.add('visible');
            }

            window.setTimeout(() => {
                window.location.href = '../Babelhome.html';
            }, 1800);
        }
}

    function isValidEmailAddress(value) {
        return BabelUI.esCorreoValido(value);
    }

    function isValidSecurityKey(value) {
        // La clave ya NO vive en el cliente: solo verificamos presencia/longitud.
        // La validacion real la hace el backend en /api/administradores/verificar-clave.
        return BabelUI.claveSeguridadSintaxisValida(value);
    }

    function setFieldState(fieldElement, isValid) {
        if (!fieldElement) return;
        fieldElement.classList.toggle('invalid', !isValid);
        fieldElement.classList.toggle('valid', isValid);
    }

    function updateInputValidation() {
        const nameValid = Boolean(adminNameInput?.value.trim());
        const contactValid = isValidEmailAddress(adminContactInput?.value || '');
        const securityValid = isValidSecurityKey(adminSecurityKeyInput?.value || '');
        const passwordValid = (adminPasswordInput?.value || '').trim().length >= 4;

        setFieldState(adminNameField, nameValid);
        setFieldState(adminContactField, contactValid);
        setFieldState(adminSecurityField, securityValid);
        setFieldState(adminPasswordField, passwordValid);

        return nameValid && contactValid && securityValid && passwordValid;
    }

    function showStamp(message) {
        BabelUI.mostrarSello(stamp, message);
    }

    function hideStamp() {
        BabelUI.ocultarSello(stamp);
    }

    function showSummary(name, contact, codename, code) {
        document.getElementById('adminSummaryName').textContent = name;
        document.getElementById('adminSummaryContact').textContent = contact;
        document.getElementById('adminSummaryCodename').textContent = codename;
        document.getElementById('adminSummaryCode').textContent = code;

        adminForm.style.display = 'none';
        adminSummaryView.classList.remove('hidden');
    }

    function showForm() {
        adminForm.style.display = 'grid';
        adminSummaryView.classList.add('hidden');
    }

    function formatDate(value) {
        if (!value) return 'Sin registro';
        try {
            return new Intl.DateTimeFormat('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }).format(new Date(value));
        } catch {
            return String(value);
        }
    }

    function escapeText(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function renderUsers() {
        const term = (userSearchInput?.value || '').trim().toLowerCase();
        const filtered = activeUsers.filter((user) => {
            const searchable = [
                user.NombreClave,
                user.NombreCompleto,
                user.RangoMilitar,
                user.FrecuenciaContacto,
                user.FrenteAsignado,
                user.CodigoAlistamiento,
            ].join(' ').toLowerCase();
            return !term || searchable.includes(term);
        });

        if (activeUsersCount) {
            activeUsersCount.textContent = `${filtered.length} usuarios activos`;
        }

        if (!adminUsersList) return;

        if (filtered.length === 0) {
            adminUsersList.innerHTML = '<div class="empty-state">No se encontraron usuarios activos con ese filtro.</div>';
            return;
        }

        adminUsersList.innerHTML = filtered.map((user) => `
            <article class="user-card">
                <div class="user-card-header">
                    <div>
                        <h3>${escapeText(user.NombreClave)}</h3>
                        <div class="user-status">${escapeText(user.NombreCompleto || 'Sin nombre registrado')}</div>
                    </div>
                    <span class="user-rank"><i class="bi bi-award"></i> ${escapeText(user.RangoMilitar)}</span>
                </div>
                <dl>
                    <dt>Contacto</dt><dd>${escapeText(user.FrecuenciaContacto || 'No registrado')}</dd>
                    <dt>Puntos</dt><dd>${escapeText(user.PuntosTotales ?? 0)}</dd>
                    <dt>Vidas</dt><dd>${escapeText(user.VidasActuales ?? 0)}</dd>
                    <dt>Racha</dt><dd>${escapeText(user.RachaDias ?? 0)} días</dd>
                    <dt>Frente</dt><dd>${escapeText(user.FrenteAsignado || 'Sin asignar')}</dd>
                    <dt>Registro</dt><dd>${escapeText(formatDate(user.FechaRegistro))}</dd>
                    <dt>Última conexión</dt><dd>${escapeText(formatDate(user.UltimaConexion))}</dd>
                    <dt>Código</dt><dd>${escapeText(user.CodigoAlistamiento || 'Sin código')}</dd>
                </dl>
                <div class="user-actions">
                    <span class="user-status">${user.EsAdministrador ? 'Intendente' : 'Usuario activo'}</span>
                    <button type="button" class="delete-user-btn" data-user-id="${escapeText(user.IdUsuario)}" data-is-admin="${user.EsAdministrador ? '1' : '0'}">${user.EsAdministrador ? 'Eliminar intendente' : 'Dar de baja'}</button>
                </div>
            </article>
        `).join('');

        adminUsersList.querySelectorAll('[data-user-id]').forEach((button) => {
            button.addEventListener('click', async () => {
                const idUsuario = button.getAttribute('data-user-id');
                const isAdminTarget = button.getAttribute('data-is-admin') === '1';
                const user = activeUsers.find((item) => String(item.IdUsuario) === String(idUsuario));
                if (!user) return;

                const confirmed = window.confirm(`Dar de baja a ${user.NombreClave}?`);
                if (!confirmed) return;

                const securityKey = adminSecurityKeyInput ? adminSecurityKeyInput.value.trim() : '';
                if (isAdminTarget && !isValidSecurityKey(securityKey)) {
                    registryStatus.textContent = 'Clave de seguridad invalida para administrar intendentes.';
                    return;
                }

                button.disabled = true;
                try {
                    const data = isAdminTarget
                        ? await window.BabelAPI.eliminarAdministrador(idUsuario, securityKey)
                        : await window.BabelAPI.darDeBajaUsuario(idUsuario);

                    registryStatus.textContent = (data && data.mensaje) || 'Usuario dado de baja.';
                    if (isAdminTarget && window.babelUser && String(window.babelUser.idUsuario) === String(idUsuario)) {
                        localStorage.removeItem('babelUser');
                        sessionStorage.removeItem(adminUnlockKey);
                        window.location.href = '../Pages/Login.html';
                        return;
                    }
                    await loadActiveUsers();
                } catch (error) {
                    console.error('Error al borrar usuario:', error);
                    registryStatus.textContent = error.message;
                } finally {
                    button.disabled = false;
                }
            });
        });
    }

    async function loadActiveUsers() {
        if (registryStatus) {
            registryStatus.textContent = 'Sincronizando base de datos...';
        }

        try {
            const data = await window.BabelAPI.listarUsuariosActivos();
            activeUsers = Array.isArray(data) ? data : [];
            renderUsers();

            if (registryStatus) {
                registryStatus.textContent = `Base local sincronizada · ${activeUsers.length} usuarios activos`;
            }
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
            activeUsers = [];
            if (adminUsersList) {
                adminUsersList.innerHTML = '<div class="empty-state">No fue posible cargar los usuarios activos.</div>';
            }
            if (registryStatus) {
                registryStatus.textContent = error.message;
            }
        }
    }

    function abrirExportacionUsuarios() {
        window.open(window.BabelAPI.urlExportarIntendentes(), '_blank');
    }

    async function processForm(event) {
        if (event) {
            event.preventDefault();
        }

        const nameValue = adminNameInput ? adminNameInput.value.trim() : '';
        const contactValue = adminContactInput ? adminContactInput.value.trim() : '';
        const securityKeyValue = adminSecurityKeyInput ? adminSecurityKeyInput.value.trim() : '';
        const passwordValue = adminPasswordInput ? adminPasswordInput.value.trim() : '';

        const isValid = updateInputValidation();
        if (!isValid) {
            return;
        }

        showStamp('REGISTRANDO...');

        try {
            const data = await window.BabelAPI.registrarAdministrador({
                nombre: nameValue,
                contacto: contactValue,
                securityKey: securityKeyValue,
                contrasena: passwordValue,
            });

            showStamp('APROBADO');
            window.setTimeout(() => {
                hideStamp();
                showSummary(nameValue, contactValue, data.datos.NombreClave, data.datos.CodigoAlistamiento);
                adminForm.reset();
                updateInputValidation();
                loadActiveUsers();
            }, 1500);
        } catch (error) {
            console.error('Error de comunicación:', error);
            hideStamp();
            if (blackout) {
                blackout.classList.add('visible');
                blackout.querySelector('h2').textContent = 'ERROR DE TRANSMISIÓN...';
                blackout.querySelector('p').textContent = error.message;
            }
        }
    }

    if (adminForm) {
        adminForm.addEventListener('submit', processForm);
    }

    if (newAdminBtn) {
        newAdminBtn.addEventListener('click', showForm);
    }

    if (refreshUsersBtn) {
        refreshUsersBtn.addEventListener('click', loadActiveUsers);
    }

    if (exportUsersBtn) {
        exportUsersBtn.addEventListener('click', abrirExportacionUsuarios);
    }

    if (userSearchInput) {
        userSearchInput.addEventListener('input', renderUsers);
    }

    [adminNameInput, adminContactInput, adminSecurityKeyInput, adminPasswordInput].forEach((input) => {
        if (!input) return;
        input.addEventListener('input', updateInputValidation);
    });

    loadActiveUsers();
});