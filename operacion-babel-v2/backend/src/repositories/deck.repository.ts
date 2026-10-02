import { query } from '../config/db.js';

export class DeckRepository {
  async findAllDecks() {
    const sql = `
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
    `;
    const res = await query(sql);
    return res.rows;
  }

  async findFlashcardsByDeckId(idMazo: number) {
    const sql = `
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
        d.notascontexto AS contexto,
        c.nombrecategoria AS categoria
      FROM flashcards f
      INNER JOIN diccionario d ON d.iditem = f.iditem
      LEFT JOIN categorias c ON c.idcategoria = d.idcategoria
      WHERE f.idmazo = $1
      ORDER BY f.ordenenmazo ASC, f.idflashcard ASC
    `;
    const res = await query(sql, [idMazo]);
    return res.rows;
  }

  async findFrasesByIdioma(idIdioma: number) {
    const sql = `
      SELECT
        fr.idfrase AS "IdFrase",
        fr.fraseoriginal AS "FraseOriginal",
        fr.fraseoriginal AS "palabra",
        fr.traduccionespanol AS "TraduccionEspanol",
        fr.traduccionespanol AS "traduccion",
        fr.pista AS "Pista",
        fr.pista AS "pista",
        fr.letrasocultas AS "LetrasOcultas",
        fr.tiempolimiteseg AS "TiempoLimiteSeg",
        COALESCE(n.nombrenivel, 'Clasificado') AS "NivelNombre"
      FROM frases fr
      LEFT JOIN nivelesdificultad n ON n.idnivel = fr.idnivel
      WHERE fr.ididioma = $1
      ORDER BY RANDOM()
    `;
    const res = await query(sql, [idIdioma]);
    return res.rows;
  }
}
