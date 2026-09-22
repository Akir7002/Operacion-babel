// Punto de arranque del backend HTTP de Operacion Babel (bootstrap).
// Toda la logica vive en src/ (routes -> controllers -> services -> repositories -> db).
require('dotenv').config();

const app = require('./src/app');
const { Pool } = require('pg'); // verificacion temprana de dependencia

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Division de Ingenieria ejecutandose en el puerto ${PORT}`);
});

// Evita warning de variable no usada en entornos estrictos.
void Pool;
