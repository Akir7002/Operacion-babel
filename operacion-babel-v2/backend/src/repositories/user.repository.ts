import { query, getClient } from '../config/db.js';

export class UserRepository {
  async findByContacto(contacto: string) {
    const sql = `
      SELECT u.idusuario, u.nombreclave, u.hashcontrasena, u.idrango, u.estadocuenta, u.vidasactuales
      FROM usuarios u
      JOIN registrosalistamiento r ON u.idusuario = r.idusuario
      WHERE LOWER(r.frecuenciacontacto) = LOWER($1)
    `;
    const res = await query(sql, [contacto]);
    return res.rows[0] || null;
  }

  async findByNombreClave(nombreClave: string) {
    const sql = `
      SELECT u.idusuario, u.nombreclave, u.hashcontrasena, u.idrango, u.estadocuenta, u.vidasactuales
      FROM usuarios u
      WHERE UPPER(u.nombreclave) = UPPER($1)
    `;
    const res = await query(sql, [nombreClave]);
    return res.rows[0] || null;
  }

  async findById(idUsuario: number) {
    const sql = `
      SELECT 
        u.idusuario AS "idUsuario",
        u.nombreclave AS "nombreClave",
        u.idrango AS "idRango",
        COALESCE(rg.nombrerango, 'Recluta') AS "nombreRango",
        u.puntostotales AS "puntosTotales",
        u.vidasactuales AS "vidasActuales",
        u.rachadias AS "rachaDias",
        u.estadocuenta AS "estadoCuenta",
        r.nombrecompleto AS "nombreCompleto",
        r.frecuenciacontacto AS "frecuenciaContacto",
        r.frenteasignado AS "frenteAsignado",
        r.codigoalistamiento AS "codigoAlistamiento"
      FROM usuarios u
      LEFT JOIN rangos rg ON rg.idrango = u.idrango
      LEFT JOIN registrosalistamiento r ON r.idusuario = u.idusuario
      WHERE u.idusuario = $1
    `;
    const res = await query(sql, [idUsuario]);
    return res.rows[0] || null;
  }

  async updateUltimaConexion(idUsuario: number) {
    await query('UPDATE usuarios SET ultimaconexion = NOW() WHERE idusuario = $1', [idUsuario]);
  }

  async updatePasswordHash(idUsuario: number, newHash: string) {
    await query('UPDATE usuarios SET hashcontrasena = $1 WHERE idusuario = $2', [newHash, idUsuario]);
  }

  async getActiveUsers(onlyAdmins: boolean = false) {
    const sql = `
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
      WHERE u.estadocuenta = 'ACTIVA' ${onlyAdmins ? 'AND u.idrango >= 4' : ''}
      ORDER BY CASE WHEN u.idrango >= 4 THEN 0 ELSE 1 END, u.idrango DESC, u.fecharegistro DESC
    `;
    const res = await query(sql);
    return res.rows;
  }

  async createReclutaTransaction(data: {
    nombre: string;
    contacto: string;
    hashContrasena: string;
    idRango: number;
    fechaAlistamiento?: string | null;
    frenteAsignado?: string | null;
    nombreClave: string;
    idiomaPreferido?: number | null;
  }) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const userInsert = await client.query(
        `INSERT INTO usuarios (nombreclave, hashcontrasena, ididiomapreferido, idrango)
         VALUES ($1, $2, $3, $4)
         RETURNING idusuario, nombreclave`,
        [data.nombreClave, data.hashContrasena, data.idiomaPreferido, data.idRango]
      );

      const idUsuario = userInsert.rows[0].idusuario;

      const regInsert = await client.query(
        `INSERT INTO registrosalistamiento (
            idusuario, nombrecompleto, frecuenciacontacto, fechaalistamiento, frenteasignado, estadoaprobacion
         ) VALUES ($1, $2, $3, $4, $5, true)
         RETURNING idregistro`,
        [idUsuario, data.nombre, data.contacto, data.fechaAlistamiento || new Date(), data.frenteAsignado]
      );

      const idRegistro = regInsert.rows[0].idregistro;
      const codigoAlistamiento = `AL-${String(idRegistro).padStart(5, '0')}`;

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

      await client.query('COMMIT');
      return { idUsuario, nombreClave: data.nombreClave, codigoAlistamiento };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async deleteUser(idUsuario: number) {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM progresoflashcards WHERE idusuario = $1', [idUsuario]);
      await client.query('DELETE FROM historialgameover WHERE idusuario = $1', [idUsuario]);
      await client.query('DELETE FROM sesionesentrenamiento WHERE idusuario = $1', [idUsuario]);
      await client.query('DELETE FROM configuracionusuario WHERE idusuario = $1', [idUsuario]);
      await client.query('DELETE FROM estadisticas WHERE idusuario = $1', [idUsuario]);
      await client.query('DELETE FROM registrosalistamiento WHERE idusuario = $1', [idUsuario]);
      const res = await client.query('DELETE FROM usuarios WHERE idusuario = $1', [idUsuario]);
      await client.query('COMMIT');
      return res.rowCount ?? 0 > 0;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getConfiguracion(idUsuario: number) {
    const sql = `
      SELECT mododaltonico AS "ModoDaltonico", animacionesreducidas AS "AnimacionesReducidas"
      FROM configuracionusuario WHERE idusuario = $1
    `;
    const res = await query(sql, [idUsuario]);
    return res.rows[0] || { ModoDaltonico: false, AnimacionesReducidas: false };
  }

  async updateConfiguracion(idUsuario: number, daltonico: boolean, animacionesReducidas: boolean) {
    const sql = `
      INSERT INTO configuracionusuario (idusuario, mododaltonico, animacionesreducidas)
      VALUES ($1, $2, $3)
      ON CONFLICT (idusuario)
      DO UPDATE SET mododaltonico = $2, animacionesreducidas = $3
    `;
    await query(sql, [idUsuario, daltonico, animacionesReducidas]);
  }

  async regenerarVidas(idUsuario: number) {
    const sql = `
      UPDATE usuarios
      SET vidasactuales = 5, ultimaconexion = NOW()
      WHERE idusuario = $1
      RETURNING vidasactuales
    `;
    const res = await query(sql, [idUsuario]);
    return res.rows[0];
  }
}
