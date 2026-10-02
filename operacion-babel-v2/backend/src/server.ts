import { createApp } from './app.js';
import { ENV } from './config/env.js';

const app = createApp();

app.listen(ENV.PORT, () => {
  console.log(`═══════════════════════════════════════════════════════════════`);
  console.log(`  OPERACIÓN BABEL - BACKEND v2.0 (ARQUITECTURA EN CAPAS)`);
  console.log(`  Estado: Activo y en escucha en el puerto ${ENV.PORT}`);
  console.log(`  Modo: ${ENV.NODE_ENV}`);
  console.log(`  Endpoints: http://localhost:${ENV.PORT}/api/v1/health`);
  console.log(`═══════════════════════════════════════════════════════════════`);
});
