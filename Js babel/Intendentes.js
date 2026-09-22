/* ═══════════════════════════════════════════════════════════════
   INTENDENTES.JS - Registro de intendentes con estética de enlistamiento
   ═══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    const intendenteForm = document.getElementById('intendenteForm');
    const intendenteNameInput = document.getElementById('intendenteName');
    const intendenteContactInput = document.getElementById('intendenteContact');
    const intendenteSecurityInput = document.getElementById('intendenteSecurityKey');
    const intendentePasswordInput = document.getElementById('intendentePassword');
    const nameField = document.getElementById('intendenteNameField');
    const contactField = document.getElementById('intendenteContactField');
    const securityField = document.getElementById('intendenteSecurityField');
    const passwordField = document.getElementById('intendentePasswordField');
    const summaryView = document.getElementById('intendenteSummaryView');
    const stamp = document.getElementById('stamp');
    const blackout = document.getElementById('blackoutScreen');
    const newBtn = document.getElementById('newIntendenteBtn');

    BabelUI.inicializarSidebar();
    BabelUI.inicializarScrollTop();

    function isValidEmailAddress(value) {
        return BabelUI.esCorreoValido(value);
    }

    function isValidSecurityKey(value) {
        // La clave ya NO vive en el cliente: solo verificamos presencia/longitud.
        // La verificacion real de la clave sucede en el backend al registrar.
        return BabelUI.claveSeguridadSintaxisValida(value);
    }

    function setFieldState(fieldElement, isValid) {
        if (!fieldElement) return;
        fieldElement.classList.toggle('invalid', !isValid);
        fieldElement.classList.toggle('valid', isValid);
    }

    function validateForm() {
        const nameValid = Boolean(intendenteNameInput?.value.trim());
        const contactValid = isValidEmailAddress(intendenteContactInput?.value || '');
        const securityValid = isValidSecurityKey(intendenteSecurityInput?.value || '');
        const passwordValid = (intendentePasswordInput?.value || '').trim().length >= 4;

        setFieldState(nameField, nameValid);
        setFieldState(contactField, contactValid);
        setFieldState(securityField, securityValid);
        setFieldState(passwordField, passwordValid);

        return nameValid && contactValid && securityValid && passwordValid;
    }

    function showStamp(message) {
        BabelUI.mostrarSello(stamp, message);
    }

    function hideStamp() {
        BabelUI.ocultarSello(stamp);
    }

    function showSummary(name, contact, codename, code) {
        document.getElementById('summaryName').textContent = name;
        document.getElementById('summaryContact').textContent = contact;
        document.getElementById('summaryCodename').textContent = codename;
        document.getElementById('summaryCode').textContent = code;
        intendenteForm.style.display = 'none';
        summaryView.classList.remove('hidden');
    }

    function showForm() {
        intendenteForm.style.display = 'grid';
        summaryView.classList.add('hidden');
    }

    async function processForm(event) {
        if (event) event.preventDefault();

        if (!validateForm()) return;

        const nameValue = intendenteNameInput.value.trim();
        const contactValue = intendenteContactInput.value.trim();
        const securityKeyValue = intendenteSecurityInput.value.trim();
        const passwordValue = intendentePasswordInput.value.trim();

        showStamp('REGISTRANDO...');

        try {
            const data = await window.BabelAPI.registrarIntendente({
                nombre: nameValue,
                contacto: contactValue,
                contrasena: passwordValue,
                claveSeguridad: securityKeyValue,
            });

            showStamp('APROBADO');
            window.setTimeout(() => {
                hideStamp();
                showSummary(nameValue, contactValue, data.datos.NombreClave, data.datos.CodigoAlistamiento);
            }, 1200);
        } catch (error) {
            console.error('Error registrando intendente:', error);
            hideStamp();
            if (blackout) {
                blackout.classList.add('visible');
                blackout.querySelector('h2').textContent = 'ERROR DE TRANSMISIÓN...';
                blackout.querySelector('p').textContent = error.message;
            }
        }
    }

    if (intendenteForm) {
        intendenteForm.addEventListener('submit', processForm);
    }

    if (newBtn) {
        newBtn.addEventListener('click', () => {
            intendenteForm.reset();
            validateForm();
            showForm();
        });
    }

    [intendenteNameInput, intendenteContactInput, intendenteSecurityInput, intendentePasswordInput].forEach((input) => {
        if (!input) return;
        input.addEventListener('input', validateForm);
    });
});