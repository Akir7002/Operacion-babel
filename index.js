const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { getConnection, sql } = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

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

async function nombreClaveExists(connection, nombreClave) {
    const result = await new sql.Request(connection)
        .input('NombreClave', sql.NVarChar, nombreClave)
        .query('SELECT 1 AS Existe FROM Usuarios WHERE NombreClave = @NombreClave');
    return result.recordset.length > 0;
}

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

app.post('/api/reclutas', async (req, res) => {
    const { nombre, contacto, fecha, frente } = req.body || {};

    if (!nombre || !contacto || !fecha || !frente) {
        return res.status(400).json({ error: 'Faltan datos obligatorios.' });
    }

    const fechaISO = parseFechaAlistamiento(fecha);
    if (!fechaISO) {
        return res.status(400).json({ error: 'Fecha invalida. Usa el formato dd/mm/aaaa.' });
    }

    try {
        const pool = await getConnection();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const nombreClave = await generarNombreClave(transaction, nombre);
            const hashContrasena = crypto
                .createHash('sha256')
                .update(`${contacto}-${Date.now()}`)
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

app.listen(PORT, () => {
    console.log(`Division de Ingenieria ejecutandose en el puerto ${PORT}`);
});
