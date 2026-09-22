# Matriz de Trazabilidad Rápida (Estándar IREB)
**Proyecto:** Base de Operaciones Babel

| ID Req. Funcional (RF) | Historia de Usuario | Descripción Breve | Componente Arquitectónico | Criterio de Validación (Prueba) | Estado DB (PostgreSQL) |
|---|---|---|---|---|---|
| **RF-01** | HU-01 | Crear expediente (Registro) | Controlador `AuthController` | Intento de registro con alias duplicado debe fallar. | Tabla `Usuarios` |
| **RF-02** | HU-03 | Login seguro encriptado | Middleware Autenticación | Login con contraseña incorrecta debe dar error 401. | Tabla `Usuarios` (Hash) |
| **RF-03** | HU-02 | Seleccionar frente (Idioma) | Formulario Landing Page | El idioma preferido se asigna correctamente en el registro. | Tabla `Idiomas` |
| **RF-04** | HU-06, HU-07 | Funcionamiento de Flashcard (Rotar) | Componente UI `Flashcard.js` | Al hacer clic, se muestra la traducción (cara trasera). | Tabla `Flashcards` |
| **RF-05** | HU-08 | Audio en Flashcards | Servicio de Audio UI | Reproducir URL de audio debe emitir sonido claro. | Campo `AudioUrl` |
| **RF-06** | HU-10, HU-11 | Misiones de juego | Controlador `MisionesController` | Resolver desafío a tiempo debe aumentar puntos. | Tabla `DesafiosInfiltracion`|
| **RF-07** | HU-15, HU-16 | Castigo Táctico (Blackout) | Estado de UI / Contexto de Vidas | Vidas = 0 desencadena overlay negro instantáneo. | Tabla `HistorialGameOver`|
| **RF-08** | HU-17 | Actualización de rango y XP | Servicio `ProgresoService` | XP > límite requerido cambia ID Rango automáticamente. | Tabla `Estadisticas`, `Rangos`|
| **RF-09** | HU-18 | Desbloqueo de insignias | Lógica de Gamificación (Cron/Jobs) | Rachas de conexión insertan registro de insignia. | Tabla `UsuarioLogros` |
