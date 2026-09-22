// Repositorio de MAZOS, FLASHCARDS y FRASES del ahorcado.
const { query } = require('../db');

async function listarMazos() {
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
    return result.rows;
}

async function listarFlashcardsPorMazo(idMazo) {
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
    return result.rows;
}

async function listarFrasesPorIdioma(idIdioma) {
    const result = await query(`
        SELECT
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
        ORDER BY RANDOM()
    `, [idIdioma]);
    return result.rows;
}

module.exports = {
    listarMazos,
    listarFlashcardsPorMazo,
    listarFrasesPorIdioma,
};
