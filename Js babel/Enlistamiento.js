/* ═══════════════════════════════════════════════════════════════
    ENLISTAMIENTO.JS - Registro de Reclutas de Operación Babel
    Flujo de validacion, envio y confirmacion de alta.
    ═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
     // Campos y paneles del formulario de enlistamiento.
    const contactFrequencyInput = document.getElementById('contactFrequency');
    const contactField = document.getElementById('contactField');
    const contactStatus = document.getElementById('contactStatus');
    const enlistmentDateInput = document.getElementById('enlistmentDate');
    const enlistmentDateField = document.getElementById('enlistmentDateField');
    const recruitPasswordInput = document.getElementById('recruitPassword');
    const passwordField = document.getElementById('passwordField');
    const frontAssignedSelect = document.getElementById('frontAssigned');
    const frontAssignedField = document.getElementById('frontAssignedField');
    const recruitNameInput = document.getElementById('recruitName');
    const recruitNameField = document.getElementById('recruitNameField');
    const enlistmentForm = document.getElementById('enlistmentForm');
    const summaryView = document.getElementById('summaryView');
    const stamp = document.getElementById('stamp');
    const blackout = document.getElementById('blackoutScreen');
    const newEnlistmentBtn = document.getElementById('newEnlistmentBtn');

    // Inicializar sidebar y scroll behavior (compartidos en core/ui.js)
    BabelUI.inicializarSidebar({ usaClaseEnBody: true });
    BabelUI.inicializarScrollBehavior({ usaSentinel: true, invertirInterseccion: true });

    // Validacion de correo institucional (utilidad compartida en core/ui.js)
    function isValidEmailAddress(value) {
        return BabelUI.esCorreoValido(value);
    }

    function getEmailDomainError(value) {
        return BabelUI.obtenerErrorDominioCorreo(value);
    }

    // Exige que la fecha coincida con el dia actual.
    function isDateComplete(value) {
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value.trim())) return false;
        
        // Obtener la fecha de hoy en formato DD/MM/YYYY
        const hoy = new Date();
        const dia = String(hoy.getDate()).padStart(2, '0');
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        const anio = hoy.getFullYear();
        const fechaActual = `${dia}/${mes}/${anio}`;
        
        return value.trim() === fechaActual;
    }

    // Refleja visualmente si un campo esta correcto o incompleto.
    function setFieldState(fieldElement, statusElement, isValid) {
        if (!fieldElement || !statusElement) {
            return;
        }

        fieldElement.classList.toggle('invalid', !isValid);
        fieldElement.classList.toggle('valid', isValid);
        statusElement.innerHTML = isValid
            ? '<i class="bi bi-check-circle-fill"></i>'
            : '<i class="bi bi-exclamation-circle-fill"></i>';
        statusElement.style.opacity = isValid ? '0' : '1';
    }

    function updateTextFieldState(inputElement, fieldElement, statusElement) {
        const value = inputElement ? inputElement.value.trim() : '';
        const isValid = value.length > 0;
        setFieldState(fieldElement, statusElement, isValid);
    }

    // Valida el medio de contacto en tiempo real.
    function updateContactValidation() {
        if (!contactFrequencyInput) {
            return;
        }

        const value = contactFrequencyInput.value.trim();
        const isValid = isValidEmailAddress(value);
        const domainError = getEmailDomainError(value);

        contactField.classList.toggle('invalid', !isValid);
        contactField.classList.toggle('valid', isValid);
        if (contactStatus) {
            contactStatus.innerHTML = isValid
                ? '<i class="bi bi-check-circle-fill"></i>'
                : `<i class="bi bi-exclamation-circle-fill" title="${domainError}"></i>`;
            contactStatus.style.opacity = isValid ? '0' : '1';
        }
    }

    // La contrasena requiere un minimo de longitud.
    function updatePasswordValidation() {
        if (!recruitPasswordInput || !passwordField) return;
        const value = recruitPasswordInput.value.trim();
        const isValid = value.length >= 4;
        setFieldState(passwordField, passwordField.querySelector('.field-status'), isValid);
    }

    // Normaliza la fecha mientras el usuario escribe.
    function formatEnlistmentDate(value) {
        const digits = value.replace(/\D/g, '').slice(0, 8);
        const parts = [];

        if (digits.length > 0) {
            parts.push(digits.slice(0, 2));
        }
        if (digits.length > 2) {
            parts.push(digits.slice(2, 4));
        }
        if (digits.length > 4) {
            parts.push(digits.slice(4, 8));
        }

        return parts.join('/');
    }

    // Comprueba que la fecha final sea valida y actual.
    function updateDateValidation() {
        if (!enlistmentDateInput) {
            return;
        }

        const value = enlistmentDateInput.value.trim();
        const isValid = isDateComplete(value);
        setFieldState(enlistmentDateField, enlistmentDateField ? enlistmentDateField.querySelector('.field-status') : null, isValid);
    }

    // Asegura que el frente haya sido seleccionado.
    function updateFrontValidation() {
        if (!frontAssignedSelect) {
            return;
        }

        const hasValue = Boolean(frontAssignedSelect.value);
        setFieldState(frontAssignedField, frontAssignedField ? frontAssignedField.querySelector('.field-status') : null, hasValue);
    }

    // Muestra el sello visual de procesamiento (compartido en core/ui.js).
    function showStamp(message) {
        BabelUI.mostrarSello(stamp, message);
    }

    // Oculta el sello una vez termina el proceso (compartido en core/ui.js).
    function hideStamp() {
        BabelUI.ocultarSello(stamp);
    }

    // Presenta el resumen final tras un alta exitosa.
    function showSummary(name, contact, date, front) {
        document.getElementById('summaryName').textContent = name;
        document.getElementById('summaryContact').textContent = contact;
        document.getElementById('summaryDate').textContent = date;
        document.getElementById('summaryFront').textContent = front;

        enlistmentForm.style.display = 'none';
        summaryView.classList.remove('hidden');
    }

    // Vuelve a mostrar el formulario para una nueva captura.
    function showForm() {
        enlistmentForm.style.display = 'block';
        summaryView.classList.add('hidden');
    }

    // Ejecuta validacion, envio al backend y manejo de respuesta.
    async function processForm(event) {
        if (event) {
            event.preventDefault();
        }

        const recruitNameValue = recruitNameInput ? recruitNameInput.value.trim() : '';
        const contactValue = contactFrequencyInput ? contactFrequencyInput.value.trim() : '';
        const passwordValue = recruitPasswordInput ? recruitPasswordInput.value.trim() : '';
        const dateValue = enlistmentDateInput ? enlistmentDateInput.value.trim() : '';
        const selectedFront = frontAssignedSelect ? frontAssignedSelect.value : '';

        updateTextFieldState(recruitNameInput, recruitNameField, recruitNameField ? recruitNameField.querySelector('.field-status') : null);
        updateContactValidation();
        updatePasswordValidation();
        updateDateValidation();
        updateFrontValidation();

        if (!recruitNameValue) {
            recruitNameInput && recruitNameInput.focus();
            return;
        }

        if (!isValidEmailAddress(contactValue)) {
            contactField.classList.add('invalid');
            contactField.classList.remove('valid');
            contactFrequencyInput && contactFrequencyInput.focus();
            return;
        }

        if (passwordValue.length < 4) {
            recruitPasswordInput && recruitPasswordInput.focus();
            return;
        }

        if (!isDateComplete(dateValue)) {
            enlistmentDateInput && enlistmentDateInput.focus();
            return;
        }

        if (!selectedFront) {
            frontAssignedSelect && frontAssignedSelect.focus();
            return;
        }

        showStamp();
        if (stamp) {
            stamp.textContent = 'TRANSMITIENDO...';
        }

        try {
            const data = await window.BabelAPI.registrarRecluta({
                nombre: recruitNameValue,
                contacto: contactValue,
                contrasena: passwordValue,
                fecha: dateValue,
                frente: selectedFront
            });

            if (stamp) {
                stamp.textContent = 'APROBADO';
            }

            window.setTimeout(() => {
                hideStamp();
                window.BabelAPI.guardarSesion({
                    idUsuario: data.datos.IdUsuario,
                    nombreClave: data.datos.NombreClave,
                    idRango: data.datos.IdRango || 1
                });
                const frontText = frontAssignedSelect.options[frontAssignedSelect.selectedIndex].text;
                showSummary(recruitNameValue, contactValue, dateValue, frontText);
            }, 2000);
        } catch (error) {
            console.error('Error de comunicación:', error.codigo || '', error.message);
            hideStamp();
            triggerGameOver();
        }
    }

    // Pantalla temporal de bloqueo por fallo de transmision.
    function triggerGameOver() {
        if (!blackout) {
            return;
        }

        blackout.style.display = 'flex';
        window.setTimeout(() => {
            blackout.style.display = 'none';
        }, 3000);
    }

    if (contactFrequencyInput) {
        contactFrequencyInput.addEventListener('input', updateContactValidation);
        contactFrequencyInput.addEventListener('blur', updateContactValidation);
    }

    if (recruitPasswordInput) {
        recruitPasswordInput.addEventListener('input', updatePasswordValidation);
        recruitPasswordInput.addEventListener('blur', updatePasswordValidation);
    }

    if (enlistmentDateInput) {
        enlistmentDateInput.addEventListener('input', (event) => {
            const formattedValue = formatEnlistmentDate(event.target.value);
            event.target.value = formattedValue;
            updateDateValidation();
        });
        enlistmentDateInput.addEventListener('blur', updateDateValidation);
    }

    if (frontAssignedSelect) {
        frontAssignedSelect.addEventListener('change', updateFrontValidation);
    }

    if (recruitNameInput) {
        recruitNameInput.addEventListener('input', () => updateTextFieldState(recruitNameInput, recruitNameField, recruitNameField ? recruitNameField.querySelector('.field-status') : null));
        recruitNameInput.addEventListener('blur', () => updateTextFieldState(recruitNameInput, recruitNameField, recruitNameField ? recruitNameField.querySelector('.field-status') : null));
    }

    if (enlistmentForm) {
        enlistmentForm.addEventListener('submit', processForm);
    }

    if (newEnlistmentBtn) {
        newEnlistmentBtn.addEventListener('click', () => {
            enlistmentForm.reset();
            showForm();
            updateTextFieldState(recruitNameInput, recruitNameField, recruitNameField ? recruitNameField.querySelector('.field-status') : null);
            updateContactValidation();
            updatePasswordValidation();
            updateDateValidation();
            updateFrontValidation();
        });
    }

    window.triggerGameOver = triggerGameOver;
});
