// Punto de arranque del backend HTTP de Operacion Babel.
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { query, getClient } = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const ADMIN_SECURITY_KEY = 'Ak_Opb6202';

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

function buildNombreClaveBase(nombreCompleto) {
    const normalized = (nombreCompleto || '')
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    const cleaned = normalized.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return cleaned.slice(0, 12) || 'RECLUTA';
}

async function nombreClaveExists(client, nombreClave) {
    const result = await client.query(
        'SELECT 1 AS existe FROM usuarios WHERE nombreclave = $1',
        [nombreClave]
    );
    return result.rowCount > 0;
}

async function generarNombreClave(client, nombreCompleto) {
    const base = buildNombreClaveBase(nombreCompleto);
    for (let i = 0; i < 6; i += 1) {
        const suffix = i === 0 ? '' : `-${String(Math.floor(Math.random() * 900) + 100)}`;
        const candidate = `${base}${suffix}`;
        if (!(await nombreClaveExists(client, candidate))) {
            return candidate;
        }
    }
    return `${base}-${Date.now().toString().slice(-4)}`;
}

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

function dayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    return Math.floor(diff / 86400000);
}

function generarCodigoAlistamiento(fechaBase, idRegistro) {
    const fecha = fechaBase instanceof Date ? fechaBase : new Date();
    const ordinal = String(dayOfYear(fecha)).padStart(3, '0');
    const correlativo = String(idRegistro).padStart(3, '0');
    return `AL-${ordinal}-${correlativo}`;
}

function isValidAdminSecurityKey(value) {
    return String(value || '').trim() === ADMIN_SECURITY_KEY;
}

async function registrarUsuarioConRegistro(client, {
    nombre,
    contacto,
    contrasena,
    idRango,
    fechaAlistamiento,
    frenteAsignado,
}) {
    const nombreClave = await generarNombreClave(client, nombre);
    const hashContrasena = crypto
        .createHash('sha256')
        .update(contrasena)
        .digest('hex');

    const idiomaPreferido = resolveIdiomaPreferido(frenteAsignado || contacto);

    const usuarioInsert = await client.query(
        `INSERT INTO usuarios (nombreclave, hashcontrasena, ididiomapreferido, idrango)
         VALUES ($1, $2, $3, $4)
         RETURNING idusuario, nombreclave`,
        [nombreClave, hashContrasena, idiomaPreferido, idRango]
    );

    const idUsuario = usuarioInsert.rows[0].idusuario;

    const registroInsert = await client.query(
        `INSERT INTO registrosalistamiento (
            idusuario, nombrecompleto, frecuenciacontacto, fechaalistamiento, frenteasignado, estadoaprobacion
         )
         VALUES ($1, $2, $3, $4, $5, true)
         RETURNING idregistro`,
        [idUsuario, nombre, contacto, fechaAlistamiento || new Date(), frenteAsignado]
    );

    const idRegistro = registroInsert.rows[0].idregistro;
    const codigoAlistamiento = generarCodigoAlistamiento(new Date(), idRegistro);

    await client.query(
        `UPDATE registrosalistamiento SET codigoalistamiento = $1 WHERE idregistro = $2`,
        [codigoAlistamiento, idRegistro]
    );

    await client.query(
        `INSERT INTO estadisticas (idusuario) VALUES ($1) ON CONFLICT DO NOTHING`,
        [idUsuario]
    );

    await client.query(
        `INSERT INTO configuracionusuario (idusuario) VALUES ($1) ON CONFLICT DO NOTHING`,
        [idUsuario]
    );

    return { idUsuario, nombreClave, codigoAlistamiento };
}

// --- RUTAS ---

app.get('/api/usuarios/activos', async (req, res) => {
    try {
        const result = await query(`
            SELECT
                u.idusuario AS "IdUsuario",
                u.nombreclave AS "NombreClave",
                u.idrango AS "IdRango",
                COALESCE(rg.nombrerango, CASE WHEN u.idrango >= 4 THEN 'Administrador' ELSE 'Desconocido' END) AS "RangoMilitar",
                u.puntostotales AS "PuntosTotales",
                u.vidasactuales AS "VidasActuales",
                u.rachadias AS "RachaDias",
                u.estadocuenta AS "EstadoCuenta",
                u.fecharegistro AS "FechaRegistro",
                u.ultimaconexion AS "UltimaConexion",
                r.nombrecompleto AS "NombreCompleto",
                r.frecuenciacontacto AS "FrecuenciaContacto",
                r.fechaalistamiento AS "FechaAlistamiento",
                r.frenteasignado AS "FrenteAsignado",
                r.codigoalistamiento AS "CodigoAlistamiento",
                CASE WHEN u.idrango >= 4 THEN 1 ELSE 0 END AS "EsAdministrador"
            FROM usuarios u
            LEFT JOIN rangos rg ON rg.idrango = u.idrango
            LEFT JOIN registrosalistamiento r ON r.idusuario = u.idusuario
            WHERE u.estadocuenta = 'ACTIVA'
            ORDER BY CASE WHEN u.idrango >= 4 THEN 0 ELSE 1 END, u.idrango DESC, u.fecharegistro DESC
        `);
        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al listar usuarios activos:', error);
        return res.status(500).json({ error: 'Fallo al cargar los usuarios activos.', detalles: error.message });
    }
});

app.get('/api/intendentes/activos', async (req, res) => {
    try {
        const result = await query(`
            SELECT
                u.idusuario AS "IdUsuario",
                u.nombreclave AS "NombreClave",
                u.idrango AS "IdRango",
                COALESCE(rg.nombrerango, CASE WHEN u.idrango >= 4 THEN 'Intendente' ELSE 'Desconocido' END) AS "RangoMilitar",
                u.puntostotales AS "PuntosTotales",
                u.vidasactuales AS "VidasActuales",
                u.rachadias AS "RachaDias",
                u.estadocuenta AS "EstadoCuenta",
                u.fecharegistro AS "FechaRegistro",
                u.ultimaconexion AS "UltimaConexion",
                r.nombrecompleto AS "NombreCompleto",
                r.frecuenciacontacto AS "FrecuenciaContacto",
                r.fechaalistamiento AS "FechaAlistamiento",
                r.frenteasignado AS "FrenteAsignado",
                r.codigoalistamiento AS "CodigoAlistamiento",
                CASE WHEN u.idrango >= 4 THEN 1 ELSE 0 END AS "EsAdministrador"
            FROM usuarios u
            LEFT JOIN rangos rg ON rg.idrango = u.idrango
            LEFT JOIN registrosalistamiento r ON r.idusuario = u.idusuario
            WHERE u.estadocuenta = 'ACTIVA' AND u.idrango >= 4
            ORDER BY u.idrango DESC, u.fecharegistro DESC
        `);
        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al listar intendentes activos:', error);
        return res.status(500).json({ error: 'Fallo al cargar los intendentes activos.', detalles: error.message });
    }
});

app.get('/api/exportar/intendentes', async (req, res) => {
    try {
        const result = await query(`
            SELECT
                u.idusuario AS "IdUsuario",
                u.nombreclave AS "NombreClave",
                COALESCE(rg.nombrerango, CASE WHEN u.idrango >= 4 THEN 'Intendente' ELSE 'Desconocido' END) AS "RangoMilitar",
                u.puntostotales AS "PuntosTotales",
                u.vidasactuales AS "VidasActuales",
                u.rachadias AS "RachaDias",
                u.estadocuenta AS "EstadoCuenta",
                u.fecharegistro AS "FechaRegistro",
                u.ultimaconexion AS "UltimaConexion",
                COALESCE(r.nombrecompleto, 'Sin nombre') AS "NombreCompleto",
                COALESCE(r.frecuenciacontacto, 'No registrado') AS "FrecuenciaContacto",
                COALESCE(TO_CHAR(r.fechaalistamiento, 'YYYY-MM-DD'), 'Sin registro') AS "FechaAlistamiento",
                COALESCE(r.frenteasignado, 'Sin asignar') AS "FrenteAsignado",
                COALESCE(r.codigoalistamiento, 'Sin codigo') AS "CodigoAlistamiento",
                CASE WHEN u.idrango >= 4 THEN 1 ELSE 0 END AS "EsAdministrador"
            FROM usuarios u
            LEFT JOIN rangos rg ON rg.idrango = u.idrango
            LEFT JOIN registrosalistamiento r ON r.idusuario = u.idusuario
            WHERE u.estadocuenta = 'ACTIVA' AND u.idrango >= 4
            ORDER BY u.idrango DESC, u.fecharegistro DESC
        `);

        const intendentes = result.rows;
        if (intendentes.length === 0) {
            return res.status(404).send('No hay intendentes activos para exportar.');
        }

        const cabeceras = Object.keys(intendentes[0]).join(',');
        const filas = intendentes.map((usuario) => Object.values(usuario).map((valor) => {
            const stringValor = valor !== null && valor !== undefined ? String(valor) : '';
            return `"${stringValor.replace(/"/g, '""')}"`;
        }).join(','));

        const csvContent = [cabeceras, ...filas].join('\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="Expediente_Intendentes_Activos_Babel.csv"');
        res.status(200).send('\uFEFF' + csvContent);
    } catch (error) {
        console.error('Error al exportar intendentes:', error);
        return res.status(500).json({ error: 'Fallo al exportar intendentes.', detalles: error.message });
    }
});

app.post('/api/administradores', async (req, res) => {
    const { nombre, contacto, contrasena, securityKey } = req.body || {};

    if (!nombre || !contacto || !contrasena) {
        return res.status(400).json({ error: 'Faltan datos obligatorios para el administrador.' });
    }

    if (!isValidAdminSecurityKey(securityKey)) {
        return res.status(403).json({ error: 'Clave de seguridad invalida.' });
    }

    const client = await getClient();
    try {
        await client.query('BEGIN');

        const resultado = await registrarUsuarioConRegistro(client, {
            nombre,
            contacto,
            contrasena,
            idRango: 4,
            frenteAsignado: 'Acceso Administrativo',
            fechaAlistamiento: new Date(),
        });

        await client.query('COMMIT');

        return res.status(201).json({
            mensaje: 'Administrador registrado.',
            datos: {
                IdUsuario: resultado.idUsuario,
                IdRango: 4,
                NombreClave: resultado.nombreClave,
                CodigoAlistamiento: resultado.codigoAlistamiento,
            },
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al registrar administrador:', error);
        return res.status(500).json({ error: 'Fallo al registrar el administrador.', detalles: error.message });
    } finally {
        client.release();
    }
});

app.delete('/api/administradores/:idUsuario', async (req, res) => {
    const idUsuario = Number.parseInt(req.params.idUsuario, 10);
    const { securityKey } = req.body || {};

    if (!Number.isFinite(idUsuario)) {
        return res.status(400).json({ error: 'Id de usuario invalido.' });
    }

    if (!isValidAdminSecurityKey(securityKey)) {
        return res.status(403).json({ error: 'Clave de seguridad invalida.' });
    }

    try {
        const result = await query(
            `DELETE FROM usuarios WHERE idusuario = $1 AND idrango >= 4 RETURNING idusuario`,
            [idUsuario]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'El administrador no existe o no tiene rango administrativo.' });
        }

        return res.status(200).json({ mensaje: 'Administrador dado de baja correctamente.' });
    } catch (error) {
        console.error('Error al dar de baja al administrador:', error);
        return res.status(500).json({ error: 'Fallo al borrar el administrador.', detalles: error.message });
    }
});

app.delete('/api/usuarios/:idUsuario', async (req, res) => {
    const idUsuario = Number.parseInt(req.params.idUsuario, 10);
    if (!Number.isFinite(idUsuario)) {
        return res.status(400).json({ error: 'Id de usuario invalido.' });
    }

    try {
        const result = await query(
            `UPDATE usuarios SET estadocuenta = 'BAJA'
             WHERE idusuario = $1 AND estadocuenta = 'ACTIVA'
             RETURNING idusuario`,
            [idUsuario]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'El usuario no existe o ya no esta activo.' });
        }

        return res.status(200).json({ mensaje: 'Usuario dado de baja correctamente.' });
    } catch (error) {
        console.error('Error al dar de baja al usuario:', error);
        return res.status(500).json({ error: 'Fallo al borrar el usuario.', detalles: error.message });
    }
});

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

    const hoy = new Date();
    const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    if (fechaISO !== hoyStr) {
        return res.status(400).json({ error: 'La fecha de alistamiento debe ser el dia de hoy.' });
    }

    const client = await getClient();
    try {
        await client.query('BEGIN');

        const resultado = await registrarUsuarioConRegistro(client, {
            nombre,
            contacto,
            contrasena,
            idRango: 1,
            fechaAlistamiento: new Date(`${fechaISO}T00:00:00`),
            frenteAsignado: frente,
        });

        await client.query('COMMIT');

        return res.status(201).json({
            mensaje: 'Recluta registrado.',
            datos: {
                IdUsuario: resultado.idUsuario,
                IdRango: 1,
                NombreClave: resultado.nombreClave,
                CodigoAlistamiento: resultado.codigoAlistamiento,
            },
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al registrar recluta:', error);
        return res.status(500).json({ error: 'Fallo al registrar el recluta.', detalles: error.message });
    } finally {
        client.release();
    }
});

app.get('/api/mazos', async (req, res) => {
    try {
        const result = await query(`
            SELECT
                m.idmazo AS id,
                m.nombremazo AS nombre,
                m.descripcion AS descripcion,
                LOWER(i.codigoiso) AS idioma,
                i.nombre AS "idiomaNombre",
                c.nombrecategoria AS categoria,
                n.idnivel AS nivel,
                n.nombrenivel AS "nivelNombre",
                CASE m.idcategoria
                    WHEN 1 THEN 'bi bi-crosshair2'
                    WHEN 2 THEN 'bi bi-shield'
                    WHEN 3 THEN 'bi bi-chat'
                    WHEN 4 THEN 'bi bi-book'
                    WHEN 5 THEN 'bi bi-eye'
                    ELSE 'bi bi-journal'
                END AS icono,
                (SELECT COUNT(*) FROM flashcards f WHERE f.idmazo = m.idmazo) AS "totalFlashcards",
                0 AS completadas
            FROM mazosflashcards m
            LEFT JOIN idiomas i ON m.ididioma = i.ididioma
            LEFT JOIN categorias c ON m.idcategoria = c.idcategoria
            LEFT JOIN nivelesdificultad n ON m.idnivel = n.idnivel
            WHERE m.activo = true
            ORDER BY m.ordenvisual ASC, m.idmazo ASC
        `);
        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al acceder a la armeria de mazos:', error);
        return res.status(500).json({ error: 'Fallo al cargar los mazos desde la base de datos.', detalles: error.message });
    }
});

app.get('/api/mazos/:id/flashcards', async (req, res) => {
    const idMazo = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(idMazo)) {
        return res.status(400).json({ error: 'Id de mazo invalido.' });
    }

    try {
        const result = await query(`
            SELECT
                f.idflashcard AS id,
                f.ordenenmazo AS orden,
                f.tipoflashcard AS tipo,
                COALESCE(f.carafrontal, d.caracteroriginal) AS pregunta,
                COALESCE(
                    f.caratrasera,
                    d.traduccionespanol ||
                    CASE WHEN d.lecturaayuda IS NULL OR TRIM(d.lecturaayuda) = '' THEN ''
                         ELSE ' (' || d.lecturaayuda || ')'
                    END
                ) AS respuesta,
                d.caracteroriginal AS palabra,
                d.lecturaayuda AS pronunciacion,
                d.traduccionespanol AS traduccion,
                d.notascontexto AS contexto
            FROM flashcards f
            INNER JOIN diccionario d ON d.iditem = f.iditem
            WHERE f.idmazo = $1
            ORDER BY f.ordenenmazo ASC, f.idflashcard ASC
        `, [idMazo]);
        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al cargar flashcards del mazo:', error);
        return res.status(500).json({ error: 'Fallo al cargar las flashcards desde la base de datos.', detalles: error.message });
    }
});

app.get('/api/perfil/:idUsuario', async (req, res) => {
    const idUsuario = Number.parseInt(req.params.idUsuario, 10);
    if (!Number.isFinite(idUsuario)) return res.status(400).json({ error: 'Id de usuario invalido.' });

    try {
        const resultUser = await query(`
            SELECT
                u.nombreclave,
                u.idrango,
                u.vidasactuales,
                u.puntostotales,
                u.estadocuenta,
                r.frenteasignado,
                r.fechaalistamiento
            FROM usuarios u
            LEFT JOIN registrosalistamiento r ON u.idusuario = r.idusuario
            WHERE u.idusuario = $1
        `, [idUsuario]);

        if (resultUser.rowCount === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        const user = resultUser.rows[0];

        let rangoNombre = 'Recluta';
        let rangoIcono = 'bi-person-badge';
        if (user.idrango === 2) { rangoNombre = 'Operador'; rangoIcono = 'bi-crosshair'; }
        if (user.idrango === 3) { rangoNombre = 'General'; rangoIcono = 'bi-star-fill'; }

        const esAvanzado = user.puntostotales > 1000;

        const data = {
            usuario: {
                nombreClave: user.nombreclave,
                idRango: user.idrango,
                rango: rangoNombre,
                rangoIcono: rangoIcono,
                vidasActuales: user.vidasactuales,
                rachaDias: esAvanzado ? 24 : 1,
                puntosTotales: user.puntostotales,
                idiomaPreferido: user.frenteasignado?.includes('Este') ? 'Ruso' : 'Chino',
                estadoCuenta: user.estadocuenta,
                fechaRegistro: user.fechaalistamiento,
                frenteAsignado: user.frenteasignado,
            },
            estadisticas: {
                totalFlashcardsVistas: esAvanzado ? 450 : 0,
                totalAciertos: esAvanzado ? 410 : 0,
                totalFallos: esAvanzado ? 40 : 0,
                totalSesiones: esAvanzado ? 56 : 0,
                mejorRacha: esAvanzado ? 24 : 0,
                tiempoTotalEntrenamiento: esAvanzado ? 1200 : 0,
                precisionPromedio: esAvanzado ? 91.1 : 0,
                nivelActual: user.idrango,
                palabrasDominadas: esAvanzado ? 250 : 0,
            },
            logros: esAvanzado ? [
                { nombre: 'Primera Sangre', descripcion: 'Completar tu primera flashcard', icono: 'bi-droplet-fill', fecha: '2026-01-16', puntos: 10, secreto: 0, desbloqueado: 1 },
                { nombre: 'Superviviente', descripcion: 'Sobrevivir 7 dias consecutivos', icono: 'bi-tent-fill', fecha: '2026-01-22', puntos: 100, secreto: 0, desbloqueado: 1 },
                { nombre: 'Francotirador', descripcion: '10 aciertos seguidos sin fallos', icono: 'bi-bullseye', fecha: '2026-02-05', puntos: 50, secreto: 0, desbloqueado: 1 },
                { nombre: 'Maquina de Guerra', descripcion: 'Alcanzar 1000 puntos tacticos', icono: 'bi-lightning-fill', fecha: '2026-03-10', puntos: 200, secreto: 1, desbloqueado: 1 },
            ] : [
                { nombre: 'Primera Sangre', descripcion: 'Completar tu primera flashcard', icono: 'bi-droplet-fill', fecha: null, puntos: 10, secreto: 0, desbloqueado: 0 },
                { nombre: 'Superviviente', descripcion: 'Sobrevivir 7 dias consecutivos', icono: 'bi-tent-fill', fecha: null, puntos: 100, secreto: 0, desbloqueado: 0 },
            ],
            historial: esAvanzado ? [
                { titulo: 'Ascenso a Rango Elite', fecha: '2026-05-30 18:00', puntos: 500, tipo: 'INFILTRACION' },
                { titulo: 'Dominio de Vocabulario Ruso', fecha: '2026-05-28 14:30', puntos: 150, tipo: 'FLASHCARDS' },
            ] : [],
            siguienteRango: {
                nombre: user.idrango === 1 ? 'Operador' : (user.idrango === 2 ? 'General' : 'Comandante Supremo'),
                nivelRequerido: user.idrango === 1 ? 500 : 2000,
                puntosActuales: user.puntostotales,
            },
        };

        return res.status(200).json(data);
    } catch (error) {
        console.error('Error al cargar perfil:', error);
        return res.status(500).json({ error: 'Fallo al cargar el perfil.', detalles: error.message });
    }
});

app.get('/api/exportar/reclutas', async (req, res) => {
    try {
        let result;
        try {
            result = await query('SELECT * FROM vista_estadisticasreclutas ORDER BY puntostotales DESC');
        } catch (e) {
            result = await query(`
                SELECT
                    u.idusuario AS "IdUsuario", u.nombreclave AS "NombreClave",
                    CASE WHEN u.idrango=1 THEN 'Recluta' WHEN u.idrango=2 THEN 'Operador' ELSE 'General' END AS "RangoMilitar",
                    u.puntostotales AS "PuntosTotales", u.vidasactuales AS "VidasActuales",
                    'Desconocido' AS "FrenteAsignado", 'Desconocido' AS "FechaAlistamiento"
                FROM usuarios u ORDER BY puntostotales DESC
            `);
        }

        const reclutas = result.rows;

        if (reclutas.length === 0) {
            return res.status(404).send('No hay reclutas registrados.');
        }

        const cabeceras = Object.keys(reclutas[0]).join(',');
        const filas = reclutas.map(recluta => {
            return Object.values(recluta).map(valor => {
                const stringValor = valor !== null && valor !== undefined ? String(valor) : '';
                return `"${stringValor.replace(/"/g, '""')}"`;
            }).join(',');
        });

        const csvContent = [cabeceras, ...filas].join('\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="Expediente_Reclutas_Babel.csv"');
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
        const result = await query(
            'SELECT temavisual, volumengeneral, notificacioneshabilitadas, notificacionesactivadas, mododaltonico, animacionesreducidas FROM configuracionusuario WHERE idusuario = $1',
            [idUsuario]
        );

        if (result.rowCount === 0) {
            return res.status(200).json({ TemaVisual: 'oscuro', VolumenGeneral: 100, NotificacionesHabilitadas: true, ModoDaltonico: false });
        }
        return res.status(200).json(result.rows[0]);
    } catch (error) {
        return res.status(500).json({ error: 'Error al obtener configuracion.', detalles: error.message });
    }
});

app.put('/api/configuracion/:idUsuario', async (req, res) => {
    const idUsuario = Number.parseInt(req.params.idUsuario, 10);
    if (!Number.isFinite(idUsuario)) return res.status(400).json({ error: 'Id de usuario invalido.' });

    const { TemaVisual, VolumenGeneral, NotificacionesHabilitadas, NotificacionesActivadas, ModoDaltonico, AnimacionesReducidas } = req.body;
    const notificacionesVal = NotificacionesHabilitadas ?? NotificacionesActivadas ?? true;

    try {
        const check = await query('SELECT 1 FROM configuracionusuario WHERE idusuario = $1', [idUsuario]);

        if (check.rowCount === 0) {
            await query(
                `INSERT INTO configuracionusuario (idusuario, temavisual, volumengeneral, notificacioneshabilitadas, mododaltonico, animacionesreducidas)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [idUsuario, TemaVisual || 'oscuro', VolumenGeneral ?? 100, notificacionesVal, ModoDaltonico ?? false, AnimacionesReducidas ?? false]
            );
        } else {
            await query(
                `UPDATE configuracionusuario
                 SET temavisual = $2, volumengeneral = $3, notificacioneshabilitadas = $4, mododaltonico = $5, animacionesreducidas = $6
                 WHERE idusuario = $1`,
                [idUsuario, TemaVisual || 'oscuro', VolumenGeneral ?? 100, notificacionesVal, ModoDaltonico ?? false, AnimacionesReducidas ?? false]
            );
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

        const result = await query(`
            SELECT u.idusuario, u.nombreclave, u.idrango, u.estadocuenta
            FROM usuarios u
            JOIN registrosalistamiento r ON u.idusuario = r.idusuario
            WHERE r.frecuenciacontacto = $1 AND u.hashcontrasena = $2
        `, [Correo, hashContrasena]);

        if (result.rowCount > 0) {
            const usuario = result.rows[0];
            if (usuario.estadocuenta !== 'ACTIVA') {
                return res.status(403).json({ error: 'La cuenta no esta activa.' });
            }
            await query(
                'UPDATE usuarios SET ultimaconexion = NOW() WHERE idusuario = $1',
                [usuario.idusuario]
            );
            return res.status(200).json({
                mensaje: 'Acceso concedido.',
                usuario: {
                    IdUsuario: usuario.idusuario,
                    NombreClave: usuario.nombreclave,
                    IdRango: usuario.idrango,
                },
            });
        } else {
            return res.status(401).json({ error: 'Credenciales invalidas.' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error del servidor.', detalles: error.message });
    }
});

// ═══════════════════════════════════════════════════════════════
// RECUPERACION DE CONTRASENA (simulada)
// ═══════════════════════════════════════════════════════════════
const recoveryTokens = new Map();

app.post('/api/recuperar-contrasena', async (req, res) => {
    const { Correo } = req.body;
    if (!Correo) {
        return res.status(400).json({ error: 'Ingresa tu correo electronico.' });
    }

    try {
        const result = await query(
            `SELECT u.idusuario, u.nombreclave
             FROM usuarios u
             JOIN registrosalistamiento r ON u.idusuario = r.idusuario
             WHERE r.frecuenciacontacto = $1 AND u.estadocuenta = 'ACTIVA'`,
            [Correo]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'No se encontro una cuenta activa con ese correo.' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const usuario = result.rows[0];

        recoveryTokens.set(token, {
            idUsuario: usuario.idusuario,
            nombreClave: usuario.nombreclave,
            expira: Date.now() + 15 * 60 * 1000
        });

        console.log(`\n═══ RECUPERACION DE CONTRASENA ═══`);
        console.log(`Usuario: ${usuario.nombreclave}`);
        console.log(`Correo: ${Correo}`);
        console.log(`Token: ${token}`);
        console.log(`Expira en 15 minutos.\n`);

        return res.status(200).json({
            mensaje: 'Se genero un token de recuperacion.',
            token,
            nombreClave: usuario.nombreclave
        });
    } catch (error) {
        console.error('Error en recuperacion:', error);
        return res.status(500).json({ error: 'Error del servidor.', detalles: error.message });
    }
});

app.post('/api/restablecer-contrasena', async (req, res) => {
    const { token, nuevaContrasena } = req.body;
    if (!token || !nuevaContrasena) {
        return res.status(400).json({ error: 'Token y nueva contrasena son requeridos.' });
    }

    if (nuevaContrasena.length < 4) {
        return res.status(400).json({ error: 'La contrasena debe tener al menos 4 caracteres.' });
    }

    const datos = recoveryTokens.get(token);
    if (!datos) {
        return res.status(400).json({ error: 'Token invalido.' });
    }

    if (Date.now() > datos.expira) {
        recoveryTokens.delete(token);
        return res.status(400).json({ error: 'Token expirado. Solicita uno nuevo.' });
    }

    try {
        const hashContrasena = crypto
            .createHash('sha256')
            .update(nuevaContrasena)
            .digest('hex');

        await query(
            `UPDATE usuarios SET hashcontrasena = $1 WHERE idusuario = $2`,
            [hashContrasena, datos.idUsuario]
        );

        recoveryTokens.delete(token);

        return res.status(200).json({
            mensaje: 'Contrasena actualizada correctamente.',
            nombreClave: datos.nombreClave
        });
    } catch (error) {
        console.error('Error al restablecer contrasena:', error);
        return res.status(500).json({ error: 'Error del servidor.', detalles: error.message });
    }
});

// ═══════════════════════════════════════════════════════════════
// SESIONES DE ENTRENAMIENTO
// ═══════════════════════════════════════════════════════════════
app.post('/api/sesiones', async (req, res) => {
    const { IdUsuario, ModoJuego } = req.body;
    if (!IdUsuario) return res.status(400).json({ error: 'IdUsuario requerido.' });

    try {
        const userResult = await query('SELECT vidasactuales FROM usuarios WHERE idusuario = $1', [IdUsuario]);
        if (userResult.rowCount === 0) return res.status(404).json({ error: 'Usuario no encontrado.' });

        const vidasInicio = userResult.rows[0].vidasactuales;
        const result = await query(
            `INSERT INTO sesionesentrenamiento (idusuario, vidasinicio, modojuego)
             VALUES ($1, $2, $3)
             RETURNING idsesion`,
            [IdUsuario, vidasInicio, ModoJuego || 'FLASHCARDS']
        );

        return res.status(201).json({ IdSesion: result.rows[0].idsesion, VidasInicio: vidasInicio });
    } catch (error) {
        console.error('Error al crear sesion:', error);
        return res.status(500).json({ error: 'Fallo al crear sesion.', detalles: error.message });
    }
});

app.put('/api/sesiones/:idSesion/finalizar', async (req, res) => {
    const idSesion = Number.parseInt(req.params.idSesion, 10);
    if (!Number.isFinite(idSesion)) return res.status(400).json({ error: 'Id de sesion invalido.' });

    const { EstadoSesion, VidasFinal, PuntajeTotal, TiempoTotalSeg } = req.body;

    try {
        await query(
            `UPDATE sesionesentrenamiento
             SET fechafin = NOW(), estadoSesion = $2, vidasfinal = $3, puntajetotal = $4, tiempototalseg = $5
             WHERE idsesion = $1`,
            [idSesion, EstadoSesion || 'COMPLETADA', VidasFinal ?? null, PuntajeTotal ?? 0, TiempoTotalSeg ?? 0]
        );

        await query(
            `UPDATE estadisticas
             SET totalsesiones = totalsesiones + 1, ultimaactualizacion = NOW()
             WHERE idusuario = (SELECT idusuario FROM sesionesentrenamiento WHERE idsesion = $1)`,
            [idSesion]
        );

        return res.status(200).json({ mensaje: 'Sesion finalizada.' });
    } catch (error) {
        console.error('Error al finalizar sesion:', error);
        return res.status(500).json({ error: 'Fallo al finalizar sesion.', detalles: error.message });
    }
});

// ═══════════════════════════════════════════════════════════════
// GAME OVER
// ═══════════════════════════════════════════════════════════════
app.post('/api/game-over', async (req, res) => {
    const { IdUsuario, IdSesion, CausaMuerte, ProgresoPerdido, MensajeFinal } = req.body;
    if (!IdUsuario) return res.status(400).json({ error: 'IdUsuario requerido.' });

    try {
        await query(
            `INSERT INTO historialgameover (idusuario, idsesion, causamuerte, progresoperdido, mensajefinal)
             VALUES ($1, $2, $3, $4, $5)`,
            [IdUsuario, IdSesion || null, CausaMuerte || 'Vidas agotadas', ProgresoPerdido || 0, MensajeFinal || 'Mision fallida']
        );

        await query(
            `UPDATE estadisticas
             SET totalgameovers = totalgameovers + 1, ultimaactualizacion = NOW()
             WHERE idusuario = $1`,
            [IdUsuario]
        );

        if (IdSesion) {
            await query(
                `UPDATE sesionesentrenamiento SET estadoSesion = 'GAME_OVER', fechafin = NOW() WHERE idsesion = $1`,
                [IdSesion]
            );
        }

        return res.status(201).json({ mensaje: 'Game over registrado.' });
    } catch (error) {
        console.error('Error al registrar game over:', error);
        return res.status(500).json({ error: 'Fallo al registrar game over.', detalles: error.message });
    }
});

// ═══════════════════════════════════════════════════════════════
// PROGRESO FLASHCARDS + SM-2
// ═══════════════════════════════════════════════════════════════
app.post('/api/flashcards/progreso', async (req, res) => {
    const { IdUsuario, IdFlashcard, Acierto } = req.body;
    if (!IdUsuario || !IdFlashcard) return res.status(400).json({ error: 'IdUsuario e IdFlashcard requeridos.' });

    const calidad = Acierto ? 5 : 0;

    try {
        const existing = await query(
            `SELECT idprogreso, vecesvista, vecesacertada, vecesfallada, nivelconfianza
             FROM progresoflashcards
             WHERE idusuario = $1 AND idflashcard = $2`,
            [IdUsuario, IdFlashcard]
        );

        if (existing.rowCount === 0) {
            const proximaRevision = new Date(Date.now() + (calidad >= 3 ? 1 : 0.007) * 86400000);
            await query(
                `INSERT INTO progresoflashcards (idusuario, idflashcard, vecesvista, vecesacertada, vecesfallada, ultimarevision, nivelconfianza, proximarevision, dominada)
                 VALUES ($1, $2, 1, $3, $4, NOW(), $5, $6, $7)`,
                [IdUsuario, IdFlashcard, Acierto ? 1 : 0, Acierto ? 0 : 1, calidad >= 3 ? 3 : 0, proximaRevision, calidad >= 4]
            );
        } else {
            const prog = existing.rows[0];
            const nuevaVista = prog.vecesvista + 1;
            const nuevaAcertada = prog.vecesacertada + (Acierto ? 1 : 0);
            const nuevaFallada = prog.vecesfallada + (Acierto ? 0 : 1);

            let q = calidad;
            let n = prog.nivelconfianza;
            let ef = 2.5;

            if (q >= 3) {
                if (n === 0) { ef = 2.5; n = 1; }
                else if (n === 1) { n = 6; }
                else { n = Math.round(n * ef); }
            } else {
                n = 0;
            }

            ef = Math.max(1.3, ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

            const intervaloDias = n <= 1 ? 0.007 : (q >= 3 ? n / 1440 : 0.007);
            const proximaRevision = new Date(Date.now() + intervaloDias * 86400000);
            const dominada = nuevaAcertada >= 3 && (nuevaAcertada / nuevaVista) >= 0.75;

            await query(
                `UPDATE progresoflashcards
                 SET vecesvista = $3, vecesacertada = $4, vecesfallada = $5,
                     ultimarevision = NOW(), nivelconfianza = $6, proximarevision = $7, dominada = $8
                 WHERE idusuario = $1 AND idflashcard = $2`,
                [IdUsuario, IdFlashcard, nuevaVista, nuevaAcertada, nuevaFallada, n, proximaRevision, dominada]
            );
        }

        await query(
            `UPDATE estadisticas
             SET totalflashcardsvistas = totalflashcardsvistas + 1,
                 totalaciertos = totalaciertos + $2,
                 totalfallos = totalfallos + $3,
                 ultimaactualizacion = NOW()
             WHERE idusuario = $1`,
            [IdUsuario, Acierto ? 1 : 0, Acierto ? 0 : 1]
        );

        const precisionResult = await query(
            `SELECT
                 CASE WHEN (totalaciertos + totalfallos) = 0 THEN 0
                      ELSE ROUND((totalaciertos::DECIMAL / (totalaciertos + totalfallos)) * 100, 2)
                 END AS precision,
                 (SELECT COUNT(*) FROM progresoflashcards WHERE idusuario = $1 AND dominada = true) AS dominadas
             FROM estadisticas WHERE idusuario = $1`,
            [IdUsuario]
        );

        if (precisionResult.rowCount > 0) {
            await query(
                `UPDATE estadisticas SET precisionpromedio = $2, palabrasdominadas = $3 WHERE idusuario = $1`,
                [IdUsuario, precisionResult.rows[0].precision, precisionResult.rows[0].dominadas]
            );
        }

        return res.status(200).json({ mensaje: 'Progreso registrado.', acierto: !!Acierto });
    } catch (error) {
        console.error('Error al registrar progreso flashcard:', error);
        return res.status(500).json({ error: 'Fallo al registrar progreso.', detalles: error.message });
    }
});

// ═══════════════════════════════════════════════════════════════
// PUNTOS / XP + RACHA DIARIA
// ═══════════════════════════════════════════════════════════════
app.post('/api/puntos', async (req, res) => {
    const { IdUsuario, Puntos, Fuente } = req.body;
    if (!IdUsuario || !Puntos) return res.status(400).json({ error: 'IdUsuario y Puntos requeridos.' });

    try {
        await query(
            `UPDATE usuarios SET puntostotales = puntostotales + $2 WHERE idusuario = $1`,
            [IdUsuario, Puntos]
        );

        const hoy = new Date().toISOString().slice(0, 10);
        const existingRacha = await query(
            `SELECT idracha, entrenamientocompletado, puntosdeldia, flashcardsrevisadas
             FROM rachadiaria WHERE idusuario = $1 AND fecha = $2`,
            [IdUsuario, hoy]
        );

        if (existingRacha.rowCount === 0) {
            await query(
                `INSERT INTO rachadiaria (idusuario, fecha, entrenamientocompletado, puntosdeldia, flashcardsrevisadas)
                 VALUES ($1, $2, true, $3, $4)`,
                [IdUsuario, hoy, Puntos, Fuente === 'FLASHCARDS' ? 1 : 0]
            );
        } else {
            const racha = existingRacha.rows[0];
            await query(
                `UPDATE rachadiaria
                 SET puntosdeldia = $3,
                     entrenamientocompletado = true,
                     flashcardsrevisadas = flashcardsrevisadas + $4
                 WHERE idracha = $1`,
                [racha.idracha, IdUsuario, racha.puntosdeldia + Puntos, Fuente === 'FLASHCARDS' ? 1 : 0]
            );
        }

        const rachaData = await query(
            `SELECT COUNT(*) AS diasconsecutivos
             FROM (
                 SELECT fecha FROM rachadiaria
                 WHERE idusuario = $1 AND entrenamientocompletado = true
                 ORDER BY fecha DESC
                 LIMIT 365
             ) sub
             WHERE fecha >= CURRENT_DATE - INTERVAL '365 days'`,
            [IdUsuario]
        );

        const diasConsecutivos = rachaData.rowCount > 0 ? Number(rachaData.rows[0].diasconsecutivos) : 0;
        await query(
            `UPDATE usuarios SET rachadias = $2 WHERE idusuario = $1`,
            [IdUsuario, diasConsecutivos]
        );

        const mejorResult = await query(
            `SELECT mejorracha FROM estadisticas WHERE idusuario = $1`, [IdUsuario]
        );
        if (mejorResult.rowCount > 0 && diasConsecutivos > mejorResult.rows[0].mejorracha) {
            await query(
                `UPDATE estadisticas SET mejorracha = $2 WHERE idusuario = $1`,
                [IdUsuario, diasConsecutivos]
            );
        }

        const userResult = await query(
            `SELECT puntostotales, idrango FROM usuarios WHERE idusuario = $1`, [IdUsuario]
        );
        let nuevoRango = null;
        if (userResult.rowCount > 0) {
            const puntos = userResult.rows[0].puntostotales;
            const rangoActual = userResult.rows[0].idrango;
            let nuevoIdRango = rangoActual;
            if (puntos >= 2000 && rangoActual < 3) nuevoIdRango = 3;
            else if (puntos >= 500 && rangoActual < 2) nuevoIdRango = 2;

            if (nuevoIdRango > rangoActual) {
                await query(`UPDATE usuarios SET idrango = $2 WHERE idusuario = $1`, [IdUsuario, nuevoIdRango]);
                const nombreRango = nuevoIdRango === 2 ? 'Operador' : 'General';
                nuevoRango = { IdRango: nuevoIdRango, Nombre: nombreRango };
            }

            await query(
                `UPDATE estadisticas SET nivelactual = $2 WHERE idusuario = $1`,
                [IdUsuario, nuevoIdRango]
            );
        }

        return res.status(200).json({
            mensaje: 'Puntos registrados.',
            puntosOtorgados: Puntos,
            rachaDias: diasConsecutivos,
            ascenso: nuevoRango,
        });
    } catch (error) {
        console.error('Error al registrar puntos:', error);
        return res.status(500).json({ error: 'Fallo al registrar puntos.', detalles: error.message });
    }
});

// ═══════════════════════════════════════════════════════════════
// EVALUAR LOGROS
// ═══════════════════════════════════════════════════════════════
app.post('/api/logros/evaluar', async (req, res) => {
    const { IdUsuario } = req.body;
    if (!IdUsuario) return res.status(400).json({ error: 'IdUsuario requerido.' });

    try {
        const statsResult = await query(
            `SELECT e.*, u.puntostotales, u.rachadias
             FROM estadisticas e
             JOIN usuarios u ON u.idusuario = e.idusuario
             WHERE e.idusuario = $1`,
            [IdUsuario]
        );

        if (statsResult.rowCount === 0) return res.status(200).json({ nuevosLogros: [] });

        const stats = statsResult.rows[0];
        const logrosResult = await query('SELECT * FROM logros');
        const logros = logrosResult.rows;

        const desbloqueados = [];

        for (const logro of logros) {
            const yaDesbloqueado = await query(
                `SELECT 1 FROM usuarialogros WHERE idusuario = $1 AND idlogro = $2`,
                [IdUsuario, logro.idlogro]
            );
            if (yaDesbloqueado.rowCount > 0) continue;

            let cumple = false;
            switch (logro.codigocondicion) {
                case 'PRIMERA_FLASHCARD':
                    cumple = stats.totalflashcardsvistas >= 1;
                    break;
                case 'RACHA_7_DIAS':
                    cumple = stats.rachadias >= 7;
                    break;
                case 'RACHA_30_DIAS':
                    cumple = stats.rachadias >= 30;
                    break;
                case '10_ACIERTOS_SEGUIDOS':
                    cumple = stats.mejorracha >= 10;
                    break;
                case '1000_PUNTOS':
                    cumple = stats.puntostotales >= 1000;
                    break;
                case '5000_PUNTOS':
                    cumple = stats.puntostotales >= 5000;
                    break;
                case 'PRECISION_90':
                    cumple = Number(stats.precisionpromedio) >= 90 && stats.totalflashcardsvistas >= 20;
                    break;
                case '50_DOMINADAS':
                    cumple = stats.palabrasdominadas >= 50;
                    break;
                case '100_DOMINADAS':
                    cumple = stats.palabrasdominadas >= 100;
                    break;
                case 'PRIMERA_SESION':
                    cumple = stats.totalsesiones >= 1;
                    break;
                case '10_SESIONES':
                    cumple = stats.totalsesiones >= 10;
                    break;
                case 'PRIMER_GAME_OVER':
                    cumple = stats.totalgameovers >= 1;
                    break;
                case 'SUPERVIVIENTE':
                    cumple = stats.totalgameovers === 0 && stats.totalsesiones >= 5;
                    break;
                case 'POLYGLOT':
                    cumple = stats.palabrasdominadas >= 200;
                    break;
                default:
                    break;
            }

            if (cumple) {
                await query(
                    `INSERT INTO usuarialogros (idusuario, idlogro) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                    [IdUsuario, logro.idlogro]
                );
                if (logro.puntosrecompensa > 0) {
                    await query(
                        `UPDATE usuarios SET puntostotales = puntostotales + $2 WHERE idusuario = $1`,
                        [IdUsuario, logro.puntosrecompensa]
                    );
                }
                desbloqueados.push({
                    IdLogro: logro.idlogro,
                    Nombre: logro.nombrelogro,
                    Descripcion: logro.descripcion,
                    Puntos: logro.puntosrecompensa,
                });
            }
        }

        return res.status(200).json({ nuevosLogros: desbloqueados });
    } catch (error) {
        console.error('Error al evaluar logros:', error);
        return res.status(500).json({ error: 'Fallo al evaluar logros.', detalles: error.message });
    }
});

// ═══════════════════════════════════════════════════════════════
// ESTADISTICAS REALES
// ═══════════════════════════════════════════════════════════════
app.get('/api/estadisticas/:idUsuario', async (req, res) => {
    const idUsuario = Number.parseInt(req.params.idUsuario, 10);
    if (!Number.isFinite(idUsuario)) return res.status(400).json({ error: 'Id de usuario invalido.' });

    try {
        const result = await query(
            `SELECT * FROM estadisticas WHERE idusuario = $1`,
            [idUsuario]
        );

        if (result.rowCount === 0) {
            return res.status(200).json({
                TotalFlashcardsVistas: 0, TotalAciertos: 0, TotalFallos: 0,
                TotalSesiones: 0, TotalGameOvers: 0, MejorRacha: 0,
                TiempoTotalEntrenamiento: 0, PrecisionPromedio: 0,
                PalabrasDominadas: 0, NivelActual: 1,
            });
        }

        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener estadisticas:', error);
        return res.status(500).json({ error: 'Fallo al obtener estadisticas.', detalles: error.message });
    }
});

// ═══════════════════════════════════════════════════════════════
// FRASES PARA AHORCADO
// ═══════════════════════════════════════════════════════════════
app.get('/api/frases/:idIdioma', async (req, res) => {
    const idIdioma = Number.parseInt(req.params.idIdioma, 10);
    if (!Number.isFinite(idIdioma)) return res.status(400).json({ error: 'Id de idioma invalido.' });

    try {
        const result = await query(
            `SELECT
                 f.idfrase AS id,
                 f.fraseoriginal AS frase,
                 f.traduccionespanol AS traduccion,
                 f.pista,
             f.letrasocultas AS letrasOcultas,
             f.tiempolimiteseg AS tiempoLimite,
                 n.nombrenivel AS nivel
             FROM frases f
             LEFT JOIN nivelesdificultad n ON f.idnivel = n.idnivel
             WHERE f.ididioma = $1
             ORDER BY RANDOM()`,
            [idIdioma]
        );

        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al obtener frases:', error);
        return res.status(500).json({ error: 'Fallo al obtener frases.', detalles: error.message });
    }
});

// ═══════════════════════════════════════════════════════════════
// HISTORIAL DEL USUARIO
// ═══════════════════════════════════════════════════════════════
app.get('/api/perfil/:idUsuario/historial', async (req, res) => {
    const idUsuario = Number.parseInt(req.params.idUsuario, 10);
    if (!Number.isFinite(idUsuario)) return res.status(400).json({ error: 'Id de usuario invalido.' });

    try {
        const goResult = await query(
            `SELECT
                 'GAME_OVER' AS tipo,
                 causamuerte AS titulo,
                 fechagameover AS fecha,
                 progresoperdido AS puntos,
                 mensajefinal
             FROM historialgameover
             WHERE idusuario = $1
             ORDER BY fechagameover DESC
             LIMIT 20`,
            [idUsuario]
        );

        const sesionResult = await query(
            `SELECT
                 'FLASHCARDS' AS tipo,
                 modojuego AS titulo,
                 fechafin AS fecha,
                 puntajetotal AS puntos
             FROM sesionesentrenamiento
             WHERE idusuario = $1 AND estadosesion = 'COMPLETADA'
             ORDER BY fechafin DESC
             LIMIT 20`,
            [idUsuario]
        );

        const todosEvents = [...goResult.rows, ...sesionResult.rows]
            .filter(e => e.fecha)
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
            .slice(0, 20);

        return res.status(200).json(todosEvents);
    } catch (error) {
        console.error('Error al obtener historial:', error);
        return res.status(500).json({ error: 'Fallo al obtener historial.', detalles: error.message });
    }
});

// ═══════════════════════════════════════════════════════════════
// LOGROS DEL USUARIO
// ═══════════════════════════════════════════════════════════════
app.get('/api/logros/:idUsuario', async (req, res) => {
    const idUsuario = Number.parseInt(req.params.idUsuario, 10);
    if (!Number.isFinite(idUsuario)) return res.status(400).json({ error: 'Id de usuario invalido.' });

    try {
        const result = await query(
            `SELECT
                 l.idlogro,
                 l.nombrelogro AS nombre,
                 l.descripcion,
                 l.icono,
                 l.puntosrecompensa AS puntos,
                 l.secreto,
                 CASE WHEN ul.idusuario IS NOT NULL THEN true ELSE false END AS desbloqueado,
                 ul.fechadesbloqueo AS fecha
             FROM logros l
             LEFT JOIN usuarialogros ul ON ul.idlogro = l.idlogro AND ul.idusuario = $1
             ORDER BY ul.fechadesbloqueo DESC NULLS LAST, l.idlogro ASC`,
            [idUsuario]
        );

        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al obtener logros:', error);
        return res.status(500).json({ error: 'Fallo al obtener logros.', detalles: error.message });
    }
});

// ═══════════════════════════════════════════════════════════════
// AUMENTAR VIDAS (regeneracion diaria o por compra)
// ═══════════════════════════════════════════════════════════════
app.post('/api/usuarios/:idUsuario/regenerar-vidas', async (req, res) => {
    const idUsuario = Number.parseInt(req.params.idUsuario, 10);
    if (!Number.isFinite(idUsuario)) return res.status(400).json({ error: 'Id de usuario invalido.' });

    try {
        await query(
            `UPDATE usuarios SET vidasactuales = LEAST(vidasactuales + 1, 5) WHERE idusuario = $1`,
            [idUsuario]
        );
        const result = await query('SELECT vidasactuales FROM usuarios WHERE idusuario = $1', [idUsuario]);
        return res.status(200).json({ VidasActuales: result.rows[0]?.vidasactuales ?? 5 });
    } catch (error) {
        console.error('Error al regenerar vidas:', error);
        return res.status(500).json({ error: 'Fallo al regenerar vidas.', detalles: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Division de Ingenieria ejecutandose en el puerto ${PORT}`);
});
