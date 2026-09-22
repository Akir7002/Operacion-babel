// API de Operacion Babel - wrapper unico de fetch para todas las paginas.
// Reemplaza los 9 'const API_BASE = ...' duplicados y unifica errores.
const BabelAPI = (() => {
    const API_BASE = 'http://localhost:3000/api';

    // Sesiones activas: devuelve el usuario guardado o null.
    const obtenerSesion = () => {
        try {
            const raw = localStorage.getItem('babelUser');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            console.error('Error parseando sesion', e);
            return null;
        }
    };

    const guardarSesion = (usuario) => {
        localStorage.setItem('babelUser', JSON.stringify(usuario));
    };

    const cerrarSesion = () => {
        localStorage.removeItem('babelUser');
        sessionStorage.removeItem('babelAdminAccess');
    };

    // Ejecuta una peticion y normaliza errores: lanza { codigo, error, detalles, http }.
    async function ejecutar(ruta, opciones = {}) {
        const respuesta = await fetch(`${API_BASE}${ruta}`, {
            headers: { 'Content-Type': 'application/json' },
            ...opciones,
        });

        let datos = null;
        try {
            datos = await respuesta.json();
        } catch (e) {
            datos = null;
        }

        if (!respuesta.ok) {
            const fallo = new Error((datos && datos.error) || `Error HTTP ${respuesta.status}`);
            fallo.codigo = (datos && datos.codigo) || 'BBL-GEN-001';
            fallo.detalles = datos && datos.detalles;
            fallo.http = respuesta.status;
            throw fallo;
        }

        return datos;
    }

    const api = {
        obtenerSesion,
        guardarSesion,
        cerrarSesion,

        // Auth
        login: (correo, contrasena) => ejecutar('/login', { method: 'POST', body: JSON.stringify({ Correo: correo, Contrasena: contrasena }) }),
        recuperarContrasena: (correo) => ejecutar('/recuperar-contrasena', { method: 'POST', body: JSON.stringify({ Correo: correo }) }),
        restablecerContrasena: (token, nuevaContrasena) => ejecutar('/restablecer-contrasena', { method: 'POST', body: JSON.stringify({ token, nuevaContrasena }) }),
        verificarClaveAdmin: (securityKey) => ejecutar('/administradores/verificar-clave', { method: 'POST', body: JSON.stringify({ securityKey }) }),

        // Usuarios / registro
        registrarRecluta: (payload) => ejecutar('/reclutas', { method: 'POST', body: JSON.stringify(payload) }),
        listarUsuariosActivos: () => ejecutar('/usuarios/activos'),
        listarIntendentesActivos: () => ejecutar('/intendentes/activos'),
        registrarIntendente: (payload) => ejecutar('/intendentes', { method: 'POST', body: JSON.stringify(payload) }),
        registrarAdministrador: (payload) => ejecutar('/administradores', { method: 'POST', body: JSON.stringify(payload) }),
        eliminarAdministrador: (idUsuario, securityKey) => ejecutar(`/administradores/${idUsuario}`, { method: 'DELETE', body: JSON.stringify({ securityKey }) }),
        darDeBajaUsuario: (idUsuario) => ejecutar(`/usuarios/${idUsuario}`, { method: 'DELETE' }),
        regenerarVidas: (idUsuario) => ejecutar(`/usuarios/${idUsuario}/regenerar-vidas`, { method: 'POST' }),

        // Contenido
        listarMazos: () => ejecutar('/mazos'),
        listarFlashcards: (idMazo) => ejecutar(`/mazos/${idMazo}/flashcards`),
        listarFrases: (idIdioma) => ejecutar(`/frases/${idIdioma}`),

        // Perfil / config / stats
        obtenerPerfil: (idUsuario) => ejecutar(`/perfil/${idUsuario}`),
        obtenerHistorial: (idUsuario) => ejecutar(`/perfil/${idUsuario}/historial`),
        obtenerEstadisticas: (idUsuario) => ejecutar(`/estadisticas/${idUsuario}`),
        obtenerConfiguracion: (idUsuario) => ejecutar(`/configuracion/${idUsuario}`),
        actualizarConfiguracion: (idUsuario, payload) => ejecutar(`/configuracion/${idUsuario}`, { method: 'PUT', body: JSON.stringify(payload) }),

        // Juego
        crearSesion: (idUsuario, modoJuego) => ejecutar('/sesiones', { method: 'POST', body: JSON.stringify({ IdUsuario: idUsuario, ModoJuego: modoJuego }) }),
        finalizarSesion: (idSesion, payload) => ejecutar(`/sesiones/${idSesion}/finalizar`, { method: 'PUT', body: JSON.stringify(payload) }),
        registrarGameOver: (payload) => ejecutar('/game-over', { method: 'POST', body: JSON.stringify(payload) }),
        registrarProgresoFlashcard: (idUsuario, idFlashcard, acierto) => ejecutar('/flashcards/progreso', { method: 'POST', body: JSON.stringify({ IdUsuario: idUsuario, IdFlashcard: idFlashcard, Acierto: acierto }) }),
        registrarPuntos: (idUsuario, puntos, fuente) => ejecutar('/puntos', { method: 'POST', body: JSON.stringify({ IdUsuario: idUsuario, Puntos: puntos, Fuente: fuente }) }),
        evaluarLogros: (idUsuario) => ejecutar('/logros/evaluar', { method: 'POST', body: JSON.stringify({ IdUsuario: idUsuario }) }),
        listarLogros: (idUsuario) => ejecutar(`/logros/${idUsuario}`),

        // Exportaciones (descargas directas: devuelven el URL)
        urlExportarIntendentes: () => `${API_BASE}/exportar/intendentes`,
        urlExportarReclutas: () => `${API_BASE}/exportar/reclutas`,
    };

    return api;
})();
