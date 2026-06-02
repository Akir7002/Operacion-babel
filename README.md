# Operacion Babel

Operacion Babel es un proyecto web en JavaScript que combina una interfaz de juegos y entrenamiento con un backend en Node.js, Express y SQL Server. El repositorio incluye pantallas para Ahorcado, Flashcards, Mazos y Enlistamiento, junto con scripts auxiliares para carga, pruebas y configuracion de datos.

## Notas de version

### v1.0.0

- Publicacion inicial del proyecto en GitHub.
- Organizacion del frontend por modulos y paginas independientes.
- Integracion de un backend HTTP con Express para las operaciones de datos.
- Conexion con SQL Server mediante una capa de acceso a base de datos.
- Inclusion de scripts de apoyo para vistas, carga de contenido y validaciones locales.

## Caracteristicas

- Frontend separado en HTML, CSS y JavaScript por funcionalidad.
- Backend en `index.js` con rutas para operaciones del sistema.
- Persistencia de datos conectada a SQL Server.
- Recursos de base de datos y textos de referencia incluidos en el repositorio.

## Estructura principal

- `Babelhome.html`: pagina principal del proyecto.
- `Pages/`: vistas principales de los modulos.
- `Css Babel/`: estilos del sitio.
- `Js babel/`: logica del frontend.
- `database/`: base de datos de referencia en texto.
- `index.js`: servidor principal del backend.
- `db.js`: configuracion y conexion a la base de datos.
- `SETUP_GUIDE.md` y `CONEXION_BD_GUIA.md`: guias de apoyo.

## Requisitos

- Node.js instalado.
- npm o pnpm para instalar dependencias.
- SQL Server accesible desde el equipo local.

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