# Operacion Babel

Operacion Babel es un proyecto web en JavaScript que combina una interfaz de juegos y entrenamiento con un backend en Node.js, Express y **PostgreSQL**. El repositorio incluye pantallas para Ahorcado, Flashcards, Mazos y Enlistamiento, junto con scripts auxiliares para carga, pruebas y configuracion de datos.

## Arquitectura

Backend organizado en capas (routes -> controllers -> services -> repositories -> db):

```
index.js                 Arranque del servidor (bootstrap)
src/
  app.js                 Express: middleware + montaje de routers
  db.js                  Adaptador del pool de PostgreSQL (db.js raiz)
  config/security.js     Clave administrativa (SOLO servidor)
  errors/                Catalogo de errores BBL-* + AppError + errorHandler
  middleware/            Manejo central de errores { ok, codigo, error }
  routes/                Routers por recurso (usuarios, auth, sesiones...)
  controllers/           Handlers delgados: validan y responden
  services/              Logica de negocio (SM-2, XP/racha, logros, perfil)
  repositories/           Todo el SQL por entidad
Js babel/
  core/api.js            Wrapper unico de fetch (window.BabelAPI)
  core/ui.js             Utilidades compartidas (window.BabelUI)
  Auth.js                Proteccion de rutas (valida clave contra el backend)
  *.js                   Logica por pagina usando BabelAPI
```

`core/ui.js` centraliza el sidebar, el scroll/header hiding, la accesibilidad (daltonismo/animaciones reducidas), la validacion de correo y clave, logros, vidas y el sello de procesamiento. Las 9 paginas consumen `window.BabelUI` en lugar de duplicar ese codigo.

### Codigos de error internos

Toda respuesta de fallo sale con el formato `{ ok:false, codigo:"BBL-XXX-NNN", error:"mensaje" }`:
`BBL-AUTH-*` (credenciales/clave/token), `BBL-USR-*` (usuarios), `BBL-VAL-*` (validaciones), `BBL-MAZ-*`, `BBL-SES-*`, `BBL-EXP-*`, `BBL-DB-001` (base de datos), `BBL-GEN-001` (interno).

## Notas de version

### v1.0.0

- Publicacion inicial del proyecto en GitHub.
- Organizacion del frontend por modulos y paginas independientes.
- Integracion de un backend HTTP con Express para las operaciones de datos.
- Conexion con PostgreSQL mediante una capa de acceso a base de datos.
- Inclusion de scripts de apoyo para vistas, carga de contenido y validaciones locales.

## Caracteristicas

- Frontend separado en HTML, CSS y JavaScript por funcionalidad.
- Backend en `src/` con rutas para operaciones del sistema.
- Persistencia de datos conectada a PostgreSQL.
- Recursos de base de datos y textos de referencia incluidos en el repositorio.

## Estructura principal

- `Babelhome.html`: pagina principal del proyecto.
- `Pages/`: vistas principales de los modulos.
- `Css Babel/`: estilos del sitio.
- `Js babel/`: logica del frontend (`core/api.js` es el punto de entrada de red y `core/ui.js` las utilidades compartidas).
- `database/`: base de datos de referencia en texto.
- `index.js`: servidor principal del backend.
- `db.js`: configuracion y conexion a la base de datos.

## Requisitos

- Node.js instalado.
- npm o pnpm para instalar dependencias.
- PostgreSQL accesible desde el equipo local.

## Instalacion

1. Clona el repositorio.
2. Instala las dependencias:

```bash
npm install
```

3. Crea un archivo `.env` con las variables necesarias para tu entorno local.

## Ejecucion

Para levantar el backend en desarrollo:

```bash
npm run dev
```

Si no usas nodemon, tambien puedes ejecutar:

```bash
node index.js
```

## Notas de publicacion

- Los archivos `.env` y `.env.keys` no se versionan para evitar exponer credenciales.
- `node_modules/` tampoco se sube al repositorio; se regenera con `npm install`.
- Usa `.env.example` como plantilla para crear tu archivo `.env` local.
- La clave de la Oficina de Operaciones vive solo en el backend (`src/config/security.js` o variable de entorno `ADMIN_SECURITY_KEY`); el cliente la valida contra `POST /api/administradores/verificar-clave`.

## Mejoras futuras (roadmap)

- **Autenticacion por token (diferida):** hoy la sesion es un `babelUser` en `localStorage` y la clave administrativa se verifica llamando al backend en cada peticion critica. El plan contempla reemplazar eso por un `Authorization: Bearer <token>` firmado (JWT) emitido por `/login` y `/registrar-intendente`, con `HttpOnly` y expiracion, sin exponer la clave en el cliente.
- **bcrypt para contraseñas (opcional):** si la seguridad lo requiere, se puede mover el hash a `bcrypt` en `src/services` sin cambios de contrato en la API.
- **Roles por rango:** el `idRango` ya viaja en la sesion; se puede endurecer la autorizacion por ruta con middleware dedicado.
