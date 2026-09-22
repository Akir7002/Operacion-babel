// Aplicacion Express: middleware + montaje de routers + manejo central de errores.
const express = require('express');
const cors = require('cors');

const usuariosRoutes = require('./routes/usuarios.routes');
const administradoresRoutes = require('./routes/administradores.routes');
const authRoutes = require('./routes/auth.routes');
const contenidoRoutes = require('./routes/contenido.routes');
const sesionesRoutes = require('./routes/sesiones.routes');
const perfilRoutes = require('./routes/perfil.routes');
const { errorHandler, rutaNoEncontrada } = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

// Montaje de routers por recurso (todos bajo /api).
app.use('/api', authRoutes);
app.use('/api', usuariosRoutes);
app.use('/api', administradoresRoutes);
app.use('/api', contenidoRoutes);
app.use('/api', sesionesRoutes);
app.use('/api', perfilRoutes);

// 404 + errorHandler central: TODA respuesta de error sale con { ok, codigo, error }.
app.use(rutaNoEncontrada);
app.use(errorHandler);

module.exports = app;
