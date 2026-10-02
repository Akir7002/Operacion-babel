import { query } from '../config/db.js';

export class GameRepository {
  async getUserLives(idUsuario: number): Promise<number | null> {
    const res = await query('SELECT vidasactuales FROM usuarios WHERE idusuario = $1', [idUsuario]);
    return res.rowCount && res.rowCount > 0 ? res.rows[0].vidasactuales : null;
  }

  async createSesion(idUsuario: number, vidasInicio: number, modoJuego: string = 'FLASHCARDS') {
    const sql = `
      INSERT INTO sesionesentrenamiento (idusuario, vidasinicio, modojuego)
      VALUES ($1, $2, $3)
      RETURNING idsesion
    `;
    const res = await query(sql, [idUsuario, vidasInicio, modoJuego]);
    return res.rows[0].idsesion;
  }

  async finalizarSesion(
    idSesion: number,
    estado: string,
    vidasFinal: number | null,
    puntajeTotal: number,
    tiempoTotalSeg: number
  ) {
    await query(
      `UPDATE sesionesentrenamiento
       SET fechafin = NOW(), estadosesion = $2, vidasfinal = $3, puntajetotal = $4, tiempototalseg = $5
       WHERE idsesion = $1`,
      [idSesion, estado || 'COMPLETADA', vidasFinal, puntajeTotal || 0, tiempoTotalSeg || 0]
    );

    await query(
      `UPDATE estadisticas
       SET totalsesiones = totalsesiones + 1,
           tiempototalentrenamiento = tiempototalentrenamiento + $2,
           ultimaactualizacion = NOW()
       WHERE idusuario = (SELECT idusuario FROM sesionesentrenamiento WHERE idsesion = $1)`,
      [idSesion, tiempoTotalSeg || 0]
    );
  }

  async registrarGameOver(
    idUsuario: number,
    idSesion: number | null,
    causaMuerte: string,
    progresoPerdido: number,
    mensajeFinal: string
  ) {
    await query(
      `INSERT INTO historialgameover (idusuario, idsesion, causamuerte, progresoperdido, mensajefinal)
       VALUES ($1, $2, $3, $4, $5)`,
      [idUsuario, idSesion, causaMuerte || 'Vidas agotadas', progresoPerdido || 0, mensajeFinal || 'Misión fallida']
    );

    await query(
      `UPDATE estadisticas
       SET totalgameovers = totalgameovers + 1, ultimaactualizacion = NOW()
       WHERE idusuario = $1`,
      [idUsuario]
    );

    if (idSesion) {
      await query(
        `UPDATE sesionesentrenamiento SET estadosesion = 'GAME_OVER', fechafin = NOW() WHERE idsesion = $1`,
        [idSesion]
      );
    }
  }

  async guardarProgresoFlashcard(idUsuario: number, idFlashcard: number, acierto: boolean) {
    const existing = await query(
      `SELECT vecesvista, vecesacertada, vecesfallada, nivelconfianza
       FROM progresoflashcards WHERE idusuario = $1 AND idflashcard = $2`,
      [idUsuario, idFlashcard]
    );

    let nivelConfianza = acierto ? 60 : 0;
    let diasIntervalo = acierto ? 1 : 0.01;
    let dominada = false;

    if (!existing.rowCount || existing.rowCount === 0) {
      dominada = acierto;
      const proximaRevision = new Date(Date.now() + diasIntervalo * 86400000);
      await query(
        `INSERT INTO progresoflashcards (idusuario, idflashcard, vecesvista, vecesacertada, vecesfallada, ultimarevision, nivelconfianza, proximarevision, dominada)
         VALUES ($1, $2, 1, $3, $4, NOW(), $5, $6, $7)`,
        [idUsuario, idFlashcard, acierto ? 1 : 0, acierto ? 0 : 1, nivelConfianza, proximaRevision, dominada]
      );
    } else {
      const prog = existing.rows[0];
      const nuevaVista = Number(prog.vecesvista || 0) + 1;
      const nuevaAcertada = Number(prog.vecesacertada || 0) + (acierto ? 1 : 0);
      const nuevaFallada = Number(prog.vecesfallada || 0) + (acierto ? 0 : 1);

      let conf = Number(prog.nivelconfianza || 0);
      if (acierto) {
        conf = Math.min(100, conf + 25);
        if (conf >= 80) {
          diasIntervalo = 6;
          dominada = true;
        } else {
          diasIntervalo = 2;
        }
      } else {
        conf = Math.max(0, conf - 30);
        diasIntervalo = 0.05;
        dominada = false;
      }

      const proximaRevision = new Date(Date.now() + diasIntervalo * 86400000);

      await query(
        `UPDATE progresoflashcards
         SET vecesvista = $3, vecesacertada = $4, vecesfallada = $5,
             ultimarevision = NOW(), nivelconfianza = $6, proximarevision = $7, dominada = $8
         WHERE idusuario = $1 AND idflashcard = $2`,
        [idUsuario, idFlashcard, nuevaVista, nuevaAcertada, nuevaFallada, conf, proximaRevision, dominada]
      );
    }

    // Actualizar Estadisticas (acumulados y precisión)
    await query(
      `UPDATE estadisticas
       SET totalflashcardsvistas = totalflashcardsvistas + 1,
           totalaciertos = totalaciertos + $2,
           totalfallos = totalfallos + $3,
           ultimaactualizacion = NOW()
       WHERE idusuario = $1`,
      [idUsuario, acierto ? 1 : 0, acierto ? 0 : 1]
    );

    const statsCalc = await query(
      `SELECT
         CASE WHEN (totalaciertos + totalfallos) > 0
              THEN ROUND((totalaciertos::numeric / (totalaciertos + totalfallos)::numeric) * 100.0, 2)
              ELSE 0.00 END AS precision,
         (SELECT COUNT(*) FROM progresoflashcards WHERE idusuario = $1 AND dominada = true) AS dominadas
       FROM estadisticas WHERE idusuario = $1`,
      [idUsuario]
    );

    if (statsCalc.rowCount && statsCalc.rowCount > 0) {
      await query(
        `UPDATE estadisticas
         SET precisionpromedio = $2, palabrasdominadas = $3
         WHERE idusuario = $1`,
        [idUsuario, statsCalc.rows[0].precision, statsCalc.rows[0].dominadas]
      );
    }
  }

  async actualizarRacha(idUsuario: number, puntos: number, fuente: string = 'FLASHCARDS'): Promise<number> {
    const today = new Date().toISOString().slice(0, 10);
    const existingRacha = await query(
      `SELECT idracha, puntosdeldia, flashcardsrevisadas, desafioscompletados
       FROM rachadiaria WHERE idusuario = $1 AND fecha = $2`,
      [idUsuario, today]
    );

    const esFlashcard = fuente === 'FLASHCARDS' ? 1 : 0;
    const esDesafio = fuente === 'INFILTRACION' ? 1 : 0;

    if (!existingRacha.rowCount || existingRacha.rowCount === 0) {
      await query(
        `INSERT INTO rachadiaria (idusuario, fecha, entrenamientocompletado, puntosdeldia, flashcardsrevisadas, desafioscompletados)
         VALUES ($1, $2, true, $3, $4, $5)`,
        [idUsuario, today, puntos, esFlashcard, esDesafio]
      );
    } else {
      const r = existingRacha.rows[0];
      await query(
        `UPDATE rachadiaria
         SET puntosdeldia = puntosdeldia + $2,
             flashcardsrevisadas = flashcardsrevisadas + $3,
             desafioscompletados = desafioscompletados + $4,
             entrenamientocompletado = true
         WHERE idracha = $1`,
        [r.idracha, puntos, esFlashcard, esDesafio]
      );
    }

    // Cómputo de días consecutivos usando CTE de grupos de fechas correlativas
    const rachaData = await query(
      `WITH dias AS (
         SELECT fecha,
                fecha - (ROW_NUMBER() OVER (ORDER BY fecha))::integer AS grp
         FROM rachadiaria
         WHERE idusuario = $1 AND entrenamientocompletado = true
       )
       SELECT COUNT(*) AS diasconsecutivos
       FROM dias
       WHERE grp = (
         SELECT grp FROM dias WHERE fecha = $2
       )`,
      [idUsuario, today]
    );

    const diasConsecutivos = rachaData.rowCount && rachaData.rowCount > 0
      ? Number(rachaData.rows[0].diasconsecutivos)
      : 1;

    await query(`UPDATE usuarios SET rachadias = $2 WHERE idusuario = $1`, [idUsuario, diasConsecutivos]);

    const mejorResult = await query(`SELECT mejorracha FROM estadisticas WHERE idusuario = $1`, [idUsuario]);
    if (mejorResult.rowCount && mejorResult.rowCount > 0 && diasConsecutivos > (mejorResult.rows[0].mejorracha || 0)) {
      await query(`UPDATE estadisticas SET mejorracha = $2, ultimaactualizacion = NOW() WHERE idusuario = $1`, [idUsuario, diasConsecutivos]);
    }

    return diasConsecutivos;
  }

  async actualizarPuntos(idUsuario: number, puntosASumar: number, fuente: string = 'FLASHCARDS') {
    const res = await query(
      `UPDATE usuarios
       SET puntostotales = puntostotales + $2
       WHERE idusuario = $1
       RETURNING puntostotales`,
      [idUsuario, puntosASumar]
    );

    const puntosTotales = res.rows[0]?.puntostotales || 0;

    // Actualizar racha diaria con la actividad actual
    const rachaDias = await this.actualizarRacha(idUsuario, puntosASumar, fuente);

    // Evaluar ascenso de rango militar según puntos / nivel
    const nivelCalculado = Math.floor(puntosTotales / 500) + 1;
    await query(
      `UPDATE estadisticas
       SET nivelactual = $2, ultimaactualizacion = NOW()
       WHERE idusuario = $1`,
      [idUsuario, nivelCalculado]
    );

    const rangoRes = await query(
      `SELECT idrango, nombrerango
       FROM rangos
       WHERE nivelrequerido <= $1
       ORDER BY nivelrequerido DESC LIMIT 1`,
      [nivelCalculado]
    );

    let nuevoRango = 'Recluta';
    if (rangoRes.rowCount && rangoRes.rowCount > 0) {
      nuevoRango = rangoRes.rows[0].nombrerango;
      await query(
        `UPDATE usuarios SET idrango = $2 WHERE idusuario = $1`,
        [idUsuario, rangoRes.rows[0].idrango]
      );
    }

    return { puntosTotales, nuevoRango, rachaDias };
  }

  async evaluarLogros(idUsuario: number) {
    const statsResult = await query(
      `SELECT e.*, u.puntostotales, u.rachadias
       FROM estadisticas e
       JOIN usuarios u ON u.idusuario = e.idusuario
       WHERE e.idusuario = $1`,
      [idUsuario]
    );

    if (!statsResult.rowCount || statsResult.rowCount === 0) {
      return [];
    }

    const stats = statsResult.rows[0];
    const logrosResult = await query('SELECT * FROM logros ORDER BY idlogro ASC');
    const logros = logrosResult.rows;

    const desbloqueados: any[] = [];

    for (const logro of logros) {
      const yaDesbloqueado = await query(
        `SELECT 1 FROM usuariologros WHERE idusuario = $1 AND idlogro = $2`,
        [idUsuario, logro.idlogro]
      );
      if (yaDesbloqueado.rowCount && yaDesbloqueado.rowCount > 0) continue;

      let cumple = false;
      const cond = (logro.codigocondicion || '').toUpperCase();

      switch (cond) {
        case 'PRIMERA_FLASHCARD':
        case 'FLASH_1':
          cumple = Number(stats.totalflashcardsvistas || 0) >= 1;
          break;
        case 'RACHA_7_DIAS':
        case 'RACHA_7':
          cumple = Number(stats.rachadias || 0) >= 7;
          break;
        case 'RACHA_30_DIAS':
          cumple = Number(stats.rachadias || 0) >= 30;
          break;
        case '10_ACIERTOS_SEGUIDOS':
        case 'STREAK_10':
          cumple = Number(stats.mejorracha || 0) >= 10;
          break;
        case '1000_PUNTOS':
          cumple = Number(stats.puntostotales || 0) >= 1000;
          break;
        case '5000_PUNTOS':
          cumple = Number(stats.puntostotales || 0) >= 5000;
          break;
        case 'PRECISION_90':
          cumple = Number(stats.precisionpromedio || 0) >= 90 && Number(stats.totalflashcardsvistas || 0) >= 10;
          break;
        case '50_DOMINADAS':
          cumple = Number(stats.palabrasdominadas || 0) >= 50;
          break;
        case '100_DOMINADAS':
          cumple = Number(stats.palabrasdominadas || 0) >= 100;
          break;
        case 'PRIMERA_SESION':
          cumple = Number(stats.totalsesiones || 0) >= 1;
          break;
        case '10_SESIONES':
          cumple = Number(stats.totalsesiones || 0) >= 10;
          break;
        case 'PRIMER_GAME_OVER':
          cumple = Number(stats.totalgameovers || 0) >= 1;
          break;
        case 'SUPERVIVIENTE':
          cumple = Number(stats.totalgameovers || 0) === 0 && Number(stats.totalsesiones || 0) >= 5;
          break;
        case 'FRASE_5':
        case '5_INFILTRACIONES':
          cumple = Number(stats.totalsesiones || 0) >= 5 || Number(stats.palabrasdominadas || 0) >= 5;
          break;
        default:
          cumple = false;
      }

      if (cumple) {
        await query(
          `INSERT INTO usuariologros (idusuario, idlogro, fechadesbloqueo)
           VALUES ($1, $2, NOW())
           ON CONFLICT DO NOTHING`,
          [idUsuario, logro.idlogro]
        );

        if (logro.puntosrecompensa > 0) {
          await query(
            `UPDATE usuarios SET puntostotales = puntostotales + $2 WHERE idusuario = $1`,
            [idUsuario, logro.puntosrecompensa]
          );
        }

        desbloqueados.push({
          idLogro: logro.idlogro,
          nombreLogro: logro.nombrelogro,
          descripcion: logro.descripcion,
          puntosRecompensa: logro.puntosrecompensa,
          iconoMilitar: logro.icono || '🎖️',
        });
      }
    }

    return desbloqueados;
  }

  async getEstadisticas(idUsuario: number) {
    const res = await query(
      `SELECT
          u.puntostotales AS "PuntosTotales",
          u.rachadias AS "RachaDias",
          u.vidasactuales AS "VidasActuales",
          e.totalflashcardsvistas AS "TotalFlashcardsVistas",
          COALESCE(e.totalflashcardsvistas, 0) AS "TotalTarjetasEstudiadas",
          e.totalaciertos AS "TotalAciertos",
          e.totalfallos AS "TotalFallos",
          e.totalsesiones AS "TotalSesiones",
          e.totalgameovers AS "TotalGameOvers",
          e.tiempototalentrenamiento AS "TiempoTotalEntrenamiento",
          e.precisionpromedio AS "PrecisionPromedio",
          e.palabrasdominadas AS "PalabrasDominadas",
          e.mejorracha AS "MejorRacha",
          e.mejorracha AS "MejorRachaAhorcado",
          e.palabrasdominadas AS "PalabrasCompletadasAhorcado",
          e.nivelactual AS "NivelActual"
       FROM estadisticas e
       JOIN usuarios u ON u.idusuario = e.idusuario
       WHERE e.idusuario = $1`,
      [idUsuario]
    );
    return res.rows[0] || null;
  }

  async getHistorialSesiones(idUsuario: number) {
    const res = await query(
      `SELECT
          s.idsesion AS "IdSesion",
          s.fechainicio AS "FechaInicio",
          s.fechafin AS "FechaFin",
          s.modojuego AS "ModoJuego",
          s.estadosesion AS "EstadoSesion",
          s.puntajetotal AS "PuntajeTotal",
          s.tiempototalseg AS "TiempoTotalSeg",
          m.nombremazo AS "NombreMazo"
       FROM sesionesentrenamiento s
       LEFT JOIN mazosflashcards m ON m.idmazo = s.idmazo
       WHERE s.idusuario = $1
       ORDER BY s.fechainicio DESC LIMIT 20`,
      [idUsuario]
    );
    return res.rows;
  }

  async getLogros(idUsuario: number) {
    const res = await query(
      `SELECT
          l.idlogro AS "IdLogro",
          l.nombrelogro AS "NombreLogro",
          l.descripcion AS "Descripcion",
          l.puntosrecompensa AS "PuntosRecompensa",
          COALESCE(l.icono, '🎖️') AS "IconoMilitar",
          l.codigocondicion AS "CodigoCondicion",
          l.secreto AS "Secreto",
          CASE WHEN ul.idusuario IS NOT NULL THEN true ELSE false END AS "Desbloqueado",
          ul.fechadesbloqueo AS "FechaDesbloqueo"
       FROM logros l
       LEFT JOIN usuariologros ul ON ul.idlogro = l.idlogro AND ul.idusuario = $1
       ORDER BY l.idlogro ASC`,
      [idUsuario]
    );
    return res.rows;
  }
}
