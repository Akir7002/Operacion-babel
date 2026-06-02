// Punto de arranque del backend HTTP de Operacion Babel.
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { getConnection, sql } = require('./db');
require('dotenv').config();

// App Express central con CORS y JSON habilitados para el frontend.
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Configuracion base de SQL Server usada por varias rutas.
const sqlConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: '127.0.0.1', 
  database: 'Tu_Nombre_De_BD',
  port: 1433,
  options: {
    encrypt: false, // ¡Muy importante! Si es local, no intentes cifrar
    trustServerCertificate: true, // ¡Vital para evitar que se caiga la conexión!
    enableArithAbort: true, // A veces SQL Server necesita esto para no cerrar el socket
    connectTimeout: 30000 // Dale un poquito más de tiempo para conectar
  }
};

// Convierte una fecha dd/mm/aaaa a formato ISO si es valida.
function parseFechaAlistamiento(value) {
    if (!value) return null;
    const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const date = new Date(year, month - 1, day);

    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return null;
    }

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Construye una clave corta y estable a partir del nombre completo.
function buildNombreClaveBase(nombreCompleto) {
    const normalized = (nombreCompleto || '')
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    const cleaned = normalized.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return cleaned.slice(0, 12) || 'RECLUTA';
}

// Comprueba si una clave ya existe antes de asignarla.
async function nombreClaveExists(connection, nombreClave) {
    const result = await new sql.Request(connection)
        .input('NombreClave', sql.NVarChar, nombreClave)
        .query('SELECT 1 AS Existe FROM Usuarios WHERE NombreClave = @NombreClave');
    return result.recordset.length > 0;
}

// Genera una clave de usuario unica con fallback temporal.
async function generarNombreClave(connection, nombreCompleto) {
    const base = buildNombreClaveBase(nombreCompleto);
    for (let i = 0; i < 6; i += 1) {
        const suffix = i === 0 ? '' : `-${String(Math.floor(Math.random() * 900) + 100)}`;
        const candidate = `${base}${suffix}`;
        if (!(await nombreClaveExists(connection, candidate))) {
            return candidate;
        }
    }
    return `${base}-${Date.now().toString().slice(-4)}`;
}

// Traduce el frente asignado al idioma preferido del recluta.
function resolveIdiomaPreferido(frenteAsignado) {
    if (!frenteAsignado) return null;
    const lower = frenteAsignado.toLowerCase();
    if (lower.includes('frente este') || lower.includes('ruso') || lower.includes('ru')) {
        return 1;
    }
    if (lower.includes('frente oriental') || lower.includes('mandarin') || lower.includes('zh')) {
        return 2;
    }
    return null;
}

// Devuelve el dia ordinal dentro del año para formar codigos.
function dayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    return Math.floor(diff / 86400000);
}

// Genera el codigo de alistamiento usando fecha e identificador.
function generarCodigoAlistamiento(fechaBase, idRegistro) {
    const fecha = fechaBase instanceof Date ? fechaBase : new Date();
    const ordinal = String(dayOfYear(fecha)).padStart(3, '0');
    const correlativo = String(idRegistro).padStart(3, '0');
    return `AL-${ordinal}-${correlativo}`;
}

// Registro transaccional de reclutas y usuario asociado.
app.post('/api/reclutas', async (req, res) => {
    const { nombre, contacto, fecha, frente, contrasena } = req.body || {};

    if (!nombre || !contacto || !fecha || !frente || !contrasena) {
        return res.status(400).json({ error: 'Faltan datos obligatorios.' });
    }
    console.log('>>> POST /api/reclutas recibido:', { nombre, contacto, fecha, frente });
    const fechaISO = parseFechaAlistamiento(fecha);
    if (!fechaISO) {
        return res.status(400).json({ error: 'Fecha invalida. Usa el formato dd/mm/aaaa.' });
    }

    // La fecha de alistamiento debe coincidir con el dia actual.
    const hoy = new Date();
    const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    if (fechaISO !== hoyStr) {
        return res.status(400).json({ error: 'La fecha de alistamiento debe ser el dia de hoy.' });
    }

    try {
        const pool = await getConnection();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const nombreClave = await generarNombreClave(transaction, nombre);
            const hashContrasena = crypto
                .createHash('sha256')
                .update(contrasena)
                .digest('hex');
            const idiomaPreferido = resolveIdiomaPreferido(frente);

            const usuarioInsert = await new sql.Request(transaction)
                .input('NombreClave', sql.NVarChar, nombreClave)
                .input('HashContrasena', sql.NVarChar, hashContrasena)
                .input('IdIdiomaPreferido', sql.Int, idiomaPreferido)
                .query(`
                    INSERT INTO Usuarios (NombreClave, HashContrasena, IdIdiomaPreferido)
                    OUTPUT INSERTED.IdUsuario, INSERTED.NombreClave
                    VALUES (@NombreClave, @HashContrasena, @IdIdiomaPreferido);
                `);

            const idUsuario = usuarioInsert.recordset[0].IdUsuario;

            const registroInsert = await new sql.Request(transaction)
                .input('IdUsuario', sql.Int, idUsuario)
                .input('NombreCompleto', sql.NVarChar, nombre)
                .input('FrecuenciaContacto', sql.NVarChar, contacto)
                .input('FechaAlistamiento', sql.Date, fechaISO)
                .input('FrenteAsignado', sql.NVarChar, frente)
                .query(`
                    INSERT INTO RegistrosAlistamiento (
                        IdUsuario,
                        NombreCompleto,
                        FrecuenciaContacto,
                        FechaAlistamiento,
                        FrenteAsignado,
                        EstadoAprobacion
                    )
                    OUTPUT INSERTED.IdRegistro
                    VALUES (
                        @IdUsuario,
                        @NombreCompleto,
                        @FrecuenciaContacto,
                        @FechaAlistamiento,
                        @FrenteAsignado,
                        1
                    );
                `);

            const idRegistro = registroInsert.recordset[0].IdRegistro;
            const codigoAlistamiento = generarCodigoAlistamiento(new Date(`${fechaISO}T00:00:00`), idRegistro);

            await new sql.Request(transaction)
                .input('IdRegistro', sql.Int, idRegistro)
                .input('CodigoAlistamiento', sql.NVarChar, codigoAlistamiento)
                .query(`
                    UPDATE RegistrosAlistamiento
                    SET CodigoAlistamiento = @CodigoAlistamiento
                    WHERE IdRegistro = @IdRegistro;
                `);

            await transaction.commit();

            return res.status(201).json({
                mensaje: 'Recluta registrado.',
                datos: {
                    IdUsuario: idUsuario,
                    IdRango: 1, // Por defecto al crear es recluta (1)
                    NombreClave: nombreClave,
                    CodigoAlistamiento: codigoAlistamiento,
                },
            });
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        console.error('Error al registrar recluta:', error);
        return res.status(500).json({
            error: 'Fallo al registrar el recluta.',
            detalles: error.message,
        });
    }
});

// Catalogo de mazos disponibles para la pantalla de armeria.
app.get('/api/mazos', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT 
                m.IdMazo AS id,
                m.NombreMazo AS nombre,
                m.Descripcion AS descripcion,
                LOWER(i.CodigoISO) AS idioma,
                i.Nombre AS idiomaNombre,
                c.NombreCategoria AS categoria,
                n.IdNivel AS nivel,
                n.NombreNivel AS nivelNombre,
                CASE m.IdCategoria
                    WHEN 1 THEN 'bi bi-crosshair2'
                    WHEN 2 THEN 'bi bi-shield'
                    WHEN 3 THEN 'bi bi-chat'
                    WHEN 4 THEN 'bi bi-book'
                    WHEN 5 THEN 'bi bi-eye'
                    ELSE 'bi bi-journal'
                END AS icono,
                (SELECT COUNT(*) FROM Flashcards f WHERE f.IdMazo = m.IdMazo) AS totalFlashcards,
                0 AS completadas
            FROM MazosFlashcards m
            LEFT JOIN Idiomas i ON m.IdIdioma = i.IdIdioma
            LEFT JOIN Categorias c ON m.IdCategoria = c.IdCategoria
            LEFT JOIN NivelesDificultad n ON m.IdNivel = n.IdNivel
            WHERE m.Activo = 1
            ORDER BY m.OrdenVisual ASC, m.IdMazo ASC;
        `);

        return res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error al acceder a la armeria de mazos:', error);
        return res.status(500).json({
            error: 'Fallo al cargar los mazos desde la base de datos.',
            detalles: error.message,
        });
    }
});

// Flashcards por mazo, consumidas por el motor de entrenamiento.
app.get('/api/mazos/:id/flashcards', async (req, res) => {
    const idMazo = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(idMazo)) {
        return res.status(400).json({ error: 'Id de mazo invalido.' });
    }

    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('IdMazo', sql.Int, idMazo)
            .query(`
                SELECT
                    f.IdFlashcard AS id,
                    f.OrdenEnMazo AS orden,
                    f.TipoFlashcard AS tipo,
                    COALESCE(f.CaraFrontal, d.CaracterOriginal) AS pregunta,
                    COALESCE(
                        f.CaraTrasera,
                        CONCAT(
                            d.TraduccionEspanol,
                            CASE WHEN d.LecturaAyuda IS NULL OR LTRIM(RTRIM(d.LecturaAyuda)) = '' THEN ''
                                 ELSE CONCAT(' (', d.LecturaAyuda, ')')
                            END
                        )
                    ) AS respuesta,
                    d.CaracterOriginal AS palabra,
                    d.LecturaAyuda AS pronunciacion,
                    d.TraduccionEspanol AS traduccion,
                    d.NotasContexto AS contexto
                FROM Flashcards f
                INNER JOIN Diccionario d ON d.IdItem = f.IdItem
                WHERE f.IdMazo = @IdMazo
                ORDER BY f.OrdenEnMazo ASC, f.IdFlashcard ASC;
            `);

        return res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error al cargar flashcards del mazo:', error);
        return res.status(500).json({
            error: 'Fallo al cargar las flashcards desde la base de datos.',
            detalles: error.message,
        });
    }
});

app.get('/api/perfil/:idUsuario', async (req, res) => {
    const idUsuario = Number.parseInt(req.params.idUsuario, 10);
    if (!Number.isFinite(idUsuario)) return res.status(400).json({ error: 'Id de usuario invalido.' });

    try {
        const pool = await getConnection();
        
        // Obtener info básica del usuario
        const resultUser = await pool.request()
            .input('IdUsuario', sql.Int, idUsuario)
            .query(`
                SELECT 
                    U.NombreClave, 
                    U.IdRango, 
                    U.VidasActuales, 
                    U.PuntosTotales,
                    U.EstadoCuenta,
                    R.FrenteAsignado,
                    R.FechaAlistamiento
                FROM Usuarios U
                LEFT JOIN RegistrosAlistamiento R ON U.IdUsuario = R.IdUsuario
                WHERE U.IdUsuario = @IdUsuario
            `);

        if (resultUser.recordset.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        const user = resultUser.recordset[0];
        
        // Determinar Rango y Nombre
        let rangoNombre = 'Recluta';
        let rangoIcono = 'bi-person-badge';
        if (user.IdRango === 2) { rangoNombre = 'Operador'; rangoIcono = 'bi-crosshair'; }
        if (user.IdRango === 3) { rangoNombre = 'General'; rangoIcono = 'bi-star-fill'; }

        // Como no tenemos tablas de estadísticas completas aún, generaremos estadísticas 
        // basadas en los PuntosTotales para que se vea dinámico.
        const esAvanzado = user.PuntosTotales > 1000;

        const data = {
            usuario: {
                nombreClave: user.NombreClave,
                idRango: user.IdRango,
                rango: rangoNombre,
                rangoIcono: rangoIcono,
                vidasActuales: user.VidasActuales,
                rachaDias: esAvanzado ? 24 : 1,
                puntosTotales: user.PuntosTotales,
                idiomaPreferido: user.FrenteAsignado?.includes('Este') ? 'Ruso' : 'Chino',
                estadoCuenta: user.EstadoCuenta,
                fechaRegistro: user.FechaAlistamiento,
                frenteAsignado: user.FrenteAsignado
            },
            estadisticas: {
                totalFlashcardsVistas: esAvanzado ? 450 : 0,
                totalAciertos: esAvanzado ? 410 : 0,
                totalFallos: esAvanzado ? 40 : 0,
                totalSesiones: esAvanzado ? 56 : 0,
                mejorRacha: esAvanzado ? 24 : 0,
                tiempoTotalEntrenamiento: esAvanzado ? 1200 : 0, // Minutos
                precisionPromedio: esAvanzado ? 91.1 : 0,
                nivelActual: user.IdRango,
                palabrasDominadas: esAvanzado ? 250 : 0
            },
            logros: esAvanzado ? [
                { nombre: "Primera Sangre", descripcion: "Completar tu primera flashcard", icono: "bi-droplet-fill", fecha: "2026-01-16", puntos: 10, secreto: 0, desbloqueado: 1 },
                { nombre: "Superviviente", descripcion: "Sobrevivir 7 días consecutivos", icono: "bi-tent-fill", fecha: "2026-01-22", puntos: 100, secreto: 0, desbloqueado: 1 },
                { nombre: "Francotirador", descripcion: "10 aciertos seguidos sin fallos", icono: "bi-bullseye", fecha: "2026-02-05", puntos: 50, secreto: 0, desbloqueado: 1 },
                { nombre: "Máquina de Guerra", descripcion: "Alcanzar 1000 puntos tácticos", icono: "bi-lightning-fill", fecha: "2026-03-10", puntos: 200, secreto: 1, desbloqueado: 1 }
            ] : [
                { nombre: "Primera Sangre", descripcion: "Completar tu primera flashcard", icono: "bi-droplet-fill", fecha: null, puntos: 10, secreto: 0, desbloqueado: 0 },
                { nombre: "Superviviente", descripcion: "Sobrevivir 7 días consecutivos", icono: "bi-tent-fill", fecha: null, puntos: 100, secreto: 0, desbloqueado: 0 }
            ],
            historial: esAvanzado ? [
                { titulo: "Ascenso a Rango Élite", fecha: "2026-05-30 18:00", puntos: 500, tipo: "INFILTRACION" },
                { titulo: "Dominio de Vocabulario Ruso", fecha: "2026-05-28 14:30", puntos: 150, tipo: "FLASHCARDS" }
            ] : [],
            siguienteRango: {
                nombre: user.IdRango === 1 ? "Operador" : (user.IdRango === 2 ? "General" : "Comandante Supremo"),
                nivelRequerido: user.IdRango === 1 ? 500 : 2000,
                puntosActuales: user.PuntosTotales
            }
        };

        return res.status(200).json(data);
    } catch (error) {
        console.error('Error al cargar perfil:', error);
        return res.status(500).json({ error: 'Fallo al cargar el perfil.', detalles: error.message });
    }
});

app.get('/api/exportar/reclutas', async (req, res) => {
    try {
        const pool = await getConnection();
        
        // Consultamos la vista que creamos en SQL
        let result;
        try {
            result = await pool.request().query(`SELECT * FROM Vista_EstadisticasReclutas ORDER BY PuntosTotales DESC`);
        } catch (e) {
            // Si la vista no existe (aún no han corrido el script), hacemos un fallback a la tabla Usuarios
            result = await pool.request().query(`
                SELECT 
                    U.IdUsuario, U.NombreClave, 
                    CASE WHEN U.IdRango=1 THEN 'Recluta' WHEN U.IdRango=2 THEN 'Operador' ELSE 'General' END AS RangoMilitar,
                    U.PuntosTotales, U.VidasActuales, 'Desconocido' AS FrenteAsignado, 'Desconocido' AS FechaAlistamiento
                FROM Usuarios U ORDER BY PuntosTotales DESC
            `);
        }

        const reclutas = result.recordset;

        if (reclutas.length === 0) {
            return res.status(404).send('No hay reclutas registrados.');
        }

        // Generar CSV
        // Cabeceras
        const cabeceras = Object.keys(reclutas[0]).join(',');
        
        // Filas
        const filas = reclutas.map(recluta => {
            return Object.values(recluta).map(valor => {
                // Escapar comas y comillas
                const stringValor = valor !== null && valor !== undefined ? String(valor) : '';
                return `"${stringValor.replace(/"/g, '""')}"`;
            }).join(',');
        });

        const csvContent = [cabeceras, ...filas].join('\n');

        // Configurar respuesta para forzar descarga como archivo CSV (abre en Excel)
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="Expediente_Reclutas_Babel.csv"');
        
        // Agregar BOM para que Excel detecte correctamente UTF-8
        res.status(200).send('\uFEFF' + csvContent);
        
    } catch (error) {
        console.error('Error al exportar reclutas:', error);
        res.status(500).json({ error: 'Fallo al exportar datos.' });
    }
});

app.get('/api/configuracion/:idUsuario', async (req, res) => {
    const idUsuario = Number.parseInt(req.params.idUsuario, 10);
    if (!Number.isFinite(idUsuario)) return res.status(400).json({ error: 'Id de usuario invalido.' });

    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('IdUsuario', sql.Int, idUsuario)
            .query(`SELECT TemaVisual, VolumenGeneral, NotificacionesHabilitadas, ModoDaltonico FROM ConfiguracionUsuario WHERE IdUsuario = @IdUsuario`);
        
        if (result.recordset.length === 0) {
            return res.status(200).json({ TemaVisual: 'oscuro', VolumenGeneral: 100, NotificacionesHabilitadas: true, ModoDaltonico: false });
        }
        return res.status(200).json(result.recordset[0]);
    } catch (error) {
        return res.status(500).json({ error: 'Error al obtener configuracion.', detalles: error.message });
    }
});

app.put('/api/configuracion/:idUsuario', async (req, res) => {
    const idUsuario = Number.parseInt(req.params.idUsuario, 10);
    if (!Number.isFinite(idUsuario)) return res.status(400).json({ error: 'Id de usuario invalido.' });

    const { TemaVisual, VolumenGeneral, NotificacionesHabilitadas, ModoDaltonico } = req.body;

    try {
        const pool = await getConnection();
        
        // Comprobar si existe
        const check = await pool.request().input('IdUsuario', sql.Int, idUsuario).query(`SELECT 1 FROM ConfiguracionUsuario WHERE IdUsuario = @IdUsuario`);
        
        if (check.recordset.length === 0) {
            await pool.request()
                .input('IdUsuario', sql.Int, idUsuario)
                .input('TemaVisual', sql.NVarChar, TemaVisual || 'oscuro')
                .input('VolumenGeneral', sql.Int, VolumenGeneral ?? 100)
                .input('NotificacionesHabilitadas', sql.Bit, NotificacionesHabilitadas ?? true)
                .input('ModoDaltonico', sql.Bit, ModoDaltonico ?? false)
                .query(`INSERT INTO ConfiguracionUsuario (IdUsuario, TemaVisual, VolumenGeneral, NotificacionesHabilitadas, ModoDaltonico) VALUES (@IdUsuario, @TemaVisual, @VolumenGeneral, @NotificacionesHabilitadas, @ModoDaltonico)`);
        } else {
            await pool.request()
                .input('IdUsuario', sql.Int, idUsuario)
                .input('TemaVisual', sql.NVarChar, TemaVisual || 'oscuro')
                .input('VolumenGeneral', sql.Int, VolumenGeneral ?? 100)
                .input('NotificacionesHabilitadas', sql.Bit, NotificacionesHabilitadas ?? true)
                .input('ModoDaltonico', sql.Bit, ModoDaltonico ?? false)
                .query(`UPDATE ConfiguracionUsuario SET TemaVisual = @TemaVisual, VolumenGeneral = @VolumenGeneral, NotificacionesHabilitadas = @NotificacionesHabilitadas, ModoDaltonico = @ModoDaltonico WHERE IdUsuario = @IdUsuario`);
        }
        return res.status(200).json({ mensaje: 'Configuracion actualizada' });
    } catch (error) {
        return res.status(500).json({ error: 'Error al actualizar configuracion.', detalles: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    const { Correo, Contrasena } = req.body;
    if (!Correo || !Contrasena) {
        return res.status(400).json({ error: 'Credenciales incompletas.' });
    }
    
    try {
        const hashContrasena = crypto
            .createHash('sha256')
            .update(Contrasena)
            .digest('hex');

        const pool = await getConnection();
        const result = await pool.request()
            .input('Correo', sql.NVarChar, Correo)
            .input('HashContrasena', sql.NVarChar, hashContrasena)
            .query(`
                SELECT U.IdUsuario, U.NombreClave, U.IdRango, U.EstadoCuenta
                FROM Usuarios U
                JOIN RegistrosAlistamiento R ON U.IdUsuario = R.IdUsuario
                WHERE R.FrecuenciaContacto = @Correo AND U.HashContrasena = @HashContrasena
            `);

        if (result.recordset.length > 0) {
            const usuario = result.recordset[0];
            if (usuario.EstadoCuenta !== 'ACTIVA') {
                return res.status(403).json({ error: 'La cuenta no esta activa.' });
            }
            return res.status(200).json({
                mensaje: 'Acceso concedido.',
                usuario: {
                    IdUsuario: usuario.IdUsuario,
                    NombreClave: usuario.NombreClave,
                    IdRango: usuario.IdRango
                }
            });
        } else {
            return res.status(401).json({ error: 'Credenciales invalidas.' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error del servidor.', detalles: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Division de Ingenieria ejecutandose en el puerto ${PORT}`);
});
