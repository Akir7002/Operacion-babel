/* ═══════════════════════════════════════════════════════════════
   ENLISTAMIENTO.JS - Registro de Reclutas de Operación Babel
   ═══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    const contactFrequencyInput = document.getElementById('contactFrequency');
    const contactField = document.getElementById('contactField');
    const contactStatus = document.getElementById('contactStatus');
    const enlistmentDateInput = document.getElementById('enlistmentDate');
    const enlistmentDateField = document.getElementById('enlistmentDateField');
    const frontAssignedSelect = document.getElementById('frontAssigned');
    const frontAssignedField = document.getElementById('frontAssignedField');
    const recruitNameInput = document.getElementById('recruitName');
    const recruitNameField = document.getElementById('recruitNameField');
    const enlistmentForm = document.getElementById('enlistmentForm');
    const summaryView = document.getElementById('summaryView');
    const stamp = document.getElementById('stamp');
    const blackout = document.getElementById('blackoutScreen');
    const newEnlistmentBtn = document.getElementById('newEnlistmentBtn');

    // Inicializar sidebar y scroll behavior como Babelhome
    inicializarSidebar();
    inicializarScrollBehavior();

    function isGmailAddress(value) {
        return /^[^\s@]+@gmail\.com$/i.test(value.trim());
    }

    function isDateComplete(value) {
        return /^\d{2}\/\d{2}\/\d{4}$/.test(value.trim());
    }

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

    function updateContactValidation() {
        if (!contactFrequencyInput) {
            return;
        }

        const value = contactFrequencyInput.value.trim();
        const isValid = isGmailAddress(value);

        contactField.classList.toggle('invalid', !isValid);
        contactField.classList.toggle('valid', isValid);
        if (contactStatus) {
            contactStatus.innerHTML = isValid
                ? '<i class="bi bi-check-circle-fill"></i>'
                : '<i class="bi bi-exclamation-circle-fill"></i>';
            contactStatus.style.opacity = isValid ? '0' : '1';
        }
    }

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

    function updateDateValidation() {
        if (!enlistmentDateInput) {
            return;
        }

        const value = enlistmentDateInput.value.trim();
        const isValid = isDateComplete(value);
        setFieldState(enlistmentDateField, enlistmentDateField ? enlistmentDateField.querySelector('.field-status') : null, isValid);
    }

    function updateFrontValidation() {
        if (!frontAssignedSelect) {
            return;
        }

        const hasValue = Boolean(frontAssignedSelect.value);
        setFieldState(frontAssignedField, frontAssignedField ? frontAssignedField.querySelector('.field-status') : null, hasValue);
    }

    function showStamp() {
        if (!stamp) {
            return;
        }

        stamp.classList.add('stamp-active');
    }

    function hideStamp() {
        if (!stamp) {
            return;
        }

        stamp.classList.remove('stamp-active');
    }

    function showSummary(name, contact, date, front) {
        document.getElementById('summaryName').textContent = name;
        document.getElementById('summaryContact').textContent = contact;
        document.getElementById('summaryDate').textContent = date;
        document.getElementById('summaryFront').textContent = front;

        enlistmentForm.style.display = 'none';
        summaryView.classList.remove('hidden');
    }

    function showForm() {
        enlistmentForm.style.display = 'block';
        summaryView.classList.add('hidden');
    }

    function processForm(event) {
        if (event) {
            event.preventDefault();
        }

        const recruitNameValue = recruitNameInput ? recruitNameInput.value.trim() : '';
        const contactValue = contactFrequencyInput ? contactFrequencyInput.value.trim() : '';
        const dateValue = enlistmentDateInput ? enlistmentDateInput.value.trim() : '';
        const selectedFront = frontAssignedSelect ? frontAssignedSelect.value : '';

        updateTextFieldState(recruitNameInput, recruitNameField, recruitNameField ? recruitNameField.querySelector('.field-status') : null);
        updateContactValidation();
        updateDateValidation();
        updateFrontValidation();

        if (!recruitNameValue) {
            recruitNameInput && recruitNameInput.focus();
            return;
        }

        if (!isGmailAddress(contactValue)) {
            contactField.classList.add('invalid');
            contactField.classList.remove('valid');
            contactFrequencyInput && contactFrequencyInput.focus();
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

        window.setTimeout(() => {
            hideStamp();
            showSummary(recruitNameValue, contactValue, dateValue, selectedFront);

            console.log('Datos enviados al Cuartel General de la Base Babel.');
        }, 3500);
    }

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
            updateDateValidation();
            updateFrontValidation();
        });
    }

    window.triggerGameOver = triggerGameOver;
});

/* ═══════════════════════════════════════════════════════════════
   SIDEBAR - IGUAL QUE BABELHOME (con body.sidebar-active)
   ═══════════════════════════════════════════════════════════════ */
function inicializarSidebar() {
    const menuBtn = document.getElementById('menuBtn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (!menuBtn || !sidebar || !overlay) {
        return;
    }

    menuBtn.style.cursor = 'pointer';
    menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.classList.toggle('sidebar-active', sidebar.classList.contains('active'));
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        document.body.classList.remove('sidebar-active');
    });
}

/* ═══════════════════════════════════════════════════════════════
   SCROLL BEHAVIOR - IGUAL QUE BABELHOME (IntersectionObserver)
   ═══════════════════════════════════════════════════════════════ */
function inicializarScrollBehavior() {
    const mainSection = document.querySelector('main');
    const footerElement = document.querySelector('footer');
    const scrollTopButton = document.getElementById('scrollTopButton');
    const header = document.querySelector('header');
    const sectionVisibility = {
        main: false,
        footer: false,
    };

    function updateTopButtonVisibility() {
        document.body.classList.toggle('show-top-btn', sectionVisibility.main || sectionVisibility.footer);
    }

    const navbarThresholdPx = 5;
    let lastScrollTop = 0;
    let ticking = false;

    function resolveScrollElement() {
        const candidates = [
            document.scrollingElement,
            document.documentElement,
            document.body,
            document.querySelector('main'),
            document.querySelector('.main-content'),
            document.querySelector('.page-shell'),
            document.querySelector('.page-wrap'),
        ].filter(Boolean);

        return candidates.find((el) => (el.scrollHeight - el.clientHeight) > 2)
            || document.scrollingElement
            || document.documentElement;
    }

    let scrollElement = null;

    function getScrollTop() {
        const el = scrollElement || (scrollElement = resolveScrollElement());
        return el ? el.scrollTop : window.scrollY;
    }

    function showHeader() {
        document.body.classList.remove('header-hidden');
    }

    function hideHeader() {
        document.body.classList.add('header-hidden');
    }

    function updateHeaderOnScroll() {
        const currentTop = getScrollTop();

        if (currentTop <= navbarThresholdPx) {
            showHeader();
            lastScrollTop = currentTop;
            return;
        }

        const delta = currentTop - lastScrollTop;
        if (Math.abs(delta) < 1) {
            return;
        }

        if (delta > 0) {
            hideHeader();
        } else {
            showHeader();
        }

        lastScrollTop = currentTop;
    }

    function onScroll() {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(() => {
            updateHeaderOnScroll();
            ticking = false;
        });
    }

    // Observer para detectar cuando se hace scroll más allá del main
    const scrollObserver = new IntersectionObserver((entries) => {
        const [entry] = entries;
        sectionVisibility.main = !entry.isIntersecting;
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

    if (mainSection) {
        // Crear un elemento sentinel para detectar scroll
        const sentinel = document.createElement('div');
        sentinel.style.position = 'absolute';
        sentinel.style.top = '100px';
        sentinel.style.height = '1px';
        sentinel.style.width = '100%';
        sentinel.style.pointerEvents = 'none';
        document.body.prepend(sentinel);
        scrollObserver.observe(sentinel);
    }

    if (footerElement) {
        footerObserver.observe(footerElement);
    }

    if (scrollTopButton) {
        scrollTopButton.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    scrollElement = resolveScrollElement();
    lastScrollTop = getScrollTop();
    updateHeaderOnScroll();

    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('scroll', onScroll, true);

    window.addEventListener('load', () => {
        scrollElement = null;
        lastScrollTop = getScrollTop();
        updateHeaderOnScroll();
    });
}