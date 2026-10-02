# 📡 INFORME DE ACTUALIZACIÓN TÁCTICA v2.1.0
## Base de Operaciones Babel (B.O.B.)
### Conexión Frontend Angular ↔ Backend en Juegos, Motor de Logros y Rachas Diarias

---

### 1. Resumen Ejecutivo de la Versión

| Parámetro | Detalle |
| :--- | :--- |
| **Versión del Sistema** | `v2.1.0` (Transición a producción conectada) |
| **Fecha de Despliegue** | Octubre 2026 |
| **Componentes Afectados** | Backend API REST (`/api/v1/`), Frontend Angular 22 (`Training`, `Infiltration`, `Profile`), Modelos y Capa de Persistencia |
| **Historias de Usuario Impactadas** | **HU-09, HU-10, HU-12, HU-13, HU-14, HU-15, HU-16, HU-17, HU-18, HU-19** |

La presente actualización resuelve el desacoplamiento técnico entre los módulos de juego del frontend en Angular y la API táctica del backend identificado tras la migración de arquitectura. A partir de esta versión, **todas las interacciones de combate (Flashcards e Infiltración) persisten en tiempo real en la base de datos PostgreSQL**, activando el cálculo algorítmico de repaso espaciado (SM-2), el registro correlativo de rachas diarias y el desbloqueo programado de insignias y logros militares.

---

### 2. Detalle de Cambios Técnicos Implementados

#### 2.1. Capa Backend (Node.js + Express + TypeScript)

1. **Corrección y Alineación de Persistencia (`game.repository.ts`)**:
   - **Esquema de Flashcards**: Se alineó la sentencia `INSERT/UPDATE` en `progresoflashcards` con los nombres exactos de columnas de la base de datos (`vecesvista`, `vecesacertada`, `vecesfallada`, `ultimarevision`, `nivelconfianza`, `proximarevision`, `dominada`).
   - **Algoritmo SM-2 y Precisión**: Cada evaluación calcula el intervalo de días para la próxima revisión y actualiza la tabla `estadisticas` (`totalflashcardsvistas`, `totalaciertos`, `totalfallos`, `precisionpromedio` y `palabrasdominadas`).

2. **Motor de Cómputo de Rachas Diarias (`actualizarRacha`)**:
   - Registro de actividad en `rachadiaria` agrupada por fecha actual (`idusuario`, `fecha`, `puntosdeldia`, `flashcardsrevisadas`, `desafioscompletados`).
   - Cálculo estricto de días consecutivos ininterrumpidos mediante Common Table Expressions (CTE) con agrupamiento correlativo de fechas en PostgreSQL.
   - Sincronización automática de `usuarios.rachadias` y récord histórico en `estadisticas.mejorracha`.

3. **Motor de Evaluación de Logros Militares (`evaluarLogros`)**:
   - Nuevo método y endpoint dedicado `POST /api/v1/logros/evaluar`.
   - Evaluación en tiempo real contra las condiciones programables (`CodigoCondicion`):
     - `FLASH_1` / `PRIMERA_FLASHCARD`: Al completar la primera tarjeta.
     - `RACHA_7` / `RACHA_7_DIAS`: Al mantener 7 días de racha activa.
     - `RACHA_30_DIAS`: Al mantener 30 días de racha.
     - `STREAK_10` / `10_ACIERTOS_SEGUIDOS`: 10 aciertos consecutivos.
     - `1000_PUNTOS` / `5000_PUNTOS`: Metas de experiencia acumulada.
     - `PRECISION_90`: Más de 90% de puntería táctica con volumen de práctica.
     - `50_DOMINADAS` / `100_DOMINADAS`: Vocabulario memorizado.
     - `PRIMERA_SESION`, `10_SESIONES`, `PRIMER_GAME_OVER`, `SUPERVIVIENTE`, `5_INFILTRACIONES`.
   - Inserción idempotente en `usuariologros` y adjudicación automática de los `puntosrecompensa` al usuario.

4. **Corrección de Catálogo de Frases (`deck.repository.ts`)**:
   - Adaptación de la consulta SQL en `findFrasesByIdioma` para consultar las columnas vigentes `fraseoriginal`, `traduccionespanol`, `pista`, `letrasocultas`, `tiempolimiteseg` y `nombrenivel`.

5. **Exposición de Rutas y Controladores (`game.controller.ts`, `game.routes.ts`)**:
   - Endpoint `POST /api/v1/logros/evaluar`.
   - Soporte de parámetro `Fuente: 'FLASHCARDS' | 'INFILTRACION'` en `POST /api/v1/puntos`.
   - Compatibilidad completa de alias de estadísticas (`TotalTarjetasEstudiadas`, `PuntosTotales`, `RachaDias`, `PrecisionPromedio`).

---

#### 2.2. Capa Frontend (Angular 22 Standalone)

1. **Entrenamiento Táctico de Flashcards (`training.component.ts`)**:
   - **Inicio de Sesión**: Inicia sesión formal en el backend (`POST /api/v1/sesiones`) al montar el componente.
   - **Persistencia por Tarjeta**: Cada botón de evaluación (`NO DOMINADO` / `DOMINADO`) despacha `POST /api/v1/flashcards/progreso` y `POST /api/v1/puntos`.
   - **Cierre de Misión**: Al finalizar el mazo, se envía `PUT /api/v1/sesiones/:id/finalizar` con estado `COMPLETADA`, puntaje y tiempo transcurrido, seguido de la evaluación de medallas.
   - **Game Over Táctico**: Al caer las vidas a cero, se notifica al backend vía `POST /api/v1/game-over` y se finaliza la sesión como `GAME_OVER`.
   - **Notificaciones In-Game**: Notificación visual animada en pantalla (`achievement-banner`) ante el desbloqueo de cualquier condecoración.

2. **Modo Infiltración Lingüística (`infiltration.component.ts`)**:
   - **Consumo de Frases**: Carga dinámica desde la API (`GET /api/v1/frases/:idIdioma`) con respaldo local en memoria en caso de pérdida de red.
   - **Temporizador Táctico (HU-14)**: Temporizador regresivo de 60 segundos por palabra con advertencia visual crítica en rojo al restar menos de 10 segundos. Si el temporizador expira, se emite una penalización de intento fallido.
   - **Puntuación Modulada (RF-044)**: Bonificación de puntos combinando vidas restantes y segundos ahorrados: `50 + (vidas * 10) + (tiempo * 2)`.
   - **Reporte de Misión**: Registro de Game Over y sincronización de puntos y racha con la base central.

3. **Hoja de Servicio / Perfil del Activo (`profile.component.ts`)**:
   - **Galería de Condecoraciones e Insignias**: Sección dedicada que consume `GET /api/v1/logros/:idUsuario`, mostrando medallas activas (con brillo militar y badge `CONCEDIDO`) y medallas por desbloquear (`CLASIFICADO`).
   - **Métricas Tácticas en Vivo**: Visualización de días de racha (`🔥 RachaDias`), precisión porcentual de combate, flashcards revisadas, nivel e infiltraciones descifradas.

4. **Tipado e Interfaces (`core/models/index.ts`)**:
   - Modelos tipados `Achievement`, `UserStats` y `User` enriquecidos con compatibilidad hacia las respuestas de la base de datos.

---

### 3. Matriz de Cobertura de Historias de Usuario

| Historia | Requisito SRS | Estado Previo | Nuevo Estado en v2.1.0 |
| :--- | :--- | :---: | :---: |
| **HU-09** (Progreso de Flashcards & XP) | RF-022, RF-026 | 🟡 Desconectado | ✅ **100% Conectado y persistiendo en BD** |
| **HU-10** (Repetición Espaciada SM-2) | RF-023, RF-024 | 🟡 Incompleto | ✅ **100% Intervalos calculados en BD** |
| **HU-12** (Ciclo de Vida de Sesiones) | RF-030, RF-032 | 🟡 Parcial | ✅ **100% Sesiones iniciadas y finalizadas** |
| **HU-13** (Infiltración & Ahorcado) | RF-013, RF-040 | 🟡 Solo local | ✅ **100% Frases de API + sesión activa** |
| **HU-14** (Temporizador de Infiltración) | RF-042, RF-044 | 🟡 No implementado | ✅ **100% Timer 60s + bonus modulado** |
| **HU-15** (XP y Ascenso de Rango) | RF-050, RF-051 | 🟡 Parcial | ✅ **100% Ascenso automático en tiempo real** |
| **HU-16** (Game Over y Bajas en Combate)| RF-033 | 🟡 Solo local | ✅ **100% Registrado en HistorialGameOver** |
| **HU-17** (Racha Diaria Consecutiva) | RF-052, RF-057 | 🟡 Omitido | ✅ **100% Cómputo CTE diario en RachaDiaria** |
| **HU-18** (Sistema de Condecoraciones) | RF-053, RF-054 | 🟡 Sin evaluar | ✅ **100% Motor evaluador + notificaciones**|
| **HU-19** (Hoja de Servicio Completa) | RF-055, RF-056 | 🟡 Incompleto | ✅ **100% Dashboard con insignias y stats** |

---

### 4. Guía para Control de Versiones y Subida a GitHub

Para versionar adecuadamente estos cambios y mantener un historial limpio en Git, siga los siguientes pasos desde la terminal del proyecto:

#### Paso 1: Verificar el estado del repositorio
```bash
git status
```

#### Paso 2: Agregar los archivos modificados
```bash
# Backend táctico
git add operacion-babel-v2/backend/src/repositories/game.repository.ts
git add operacion-babel-v2/backend/src/repositories/deck.repository.ts
git add operacion-babel-v2/backend/src/services/game.service.ts
git add operacion-babel-v2/backend/src/controllers/game.controller.ts
git add operacion-babel-v2/backend/src/routes/game.routes.ts

# Frontend táctico Angular
git add operacion-babel-v2/frontend/src/app/core/models/index.ts
git add operacion-babel-v2/frontend/src/app/features/training/training.component.ts
git add operacion-babel-v2/frontend/src/app/features/infiltration/infiltration.component.ts
git add operacion-babel-v2/frontend/src/app/features/profile/profile.component.ts

# Documento de actualización y notas de versión
git add operacion-babel-v2/ACTUALIZACION_SISTEMA_JUEGOS_LOGROS_RACHA.md
```

#### Paso 3: Realizar commits semánticos ordenados
Puede realizar un commit atómico consolidado o commits divididos por capa:

**Opción A (Commit Consolidado de Versión):**
```bash
git commit -m "feat(core): conectar juegos angular con backend, motor de logros y rachas v2.1.0

- Integra endpoints de sesiones, progreso y game-over en Training e Infiltration
- Implementa cálculo de racha diaria correlativa con CTE en PostgreSQL
- Agrega motor evaluador de 14 condiciones de logros militares y notificaciones
- Incorpora galería de condecoraciones en la Hoja de Servicio (Profile)
- Agrega temporizador regresivo de 60s con puntaje modulado en Infiltración"
```

**Opción B (Commits Modulares por Componente):**
```bash
# 1. Backend
git commit -m "feat(backend): implementar motor de logros, rachas con CTE y persistencia SM-2"

# 2. Frontend Training
git commit -m "feat(training): conectar flashcards con backend para sesiones, progreso y game-over"

# 3. Frontend Infiltration
git commit -m "feat(infiltration): agregar temporizador de 60s, consumo de frases API y puntaje dinámico"

# 4. Frontend Profile & Docs
git commit -m "feat(profile): agregar galería de insignias militares y métricas tácticas v2.1.0"
```

#### Paso 4: Crear la etiqueta (tag) de la versión
```bash
git tag -a v2.1.0 -m "Versión 2.1.0: Conexión Frontend-Backend Juegos, Logros y Rachas"
```

#### Paso 5: Enviar los cambios al repositorio remoto (GitHub)
```bash
# Subir la rama actual (por ejemplo main o develop)
git push origin main

# Subir la etiqueta de versión a GitHub Releases
git push origin v2.1.0
```

---
*División de Ingeniería — Base de Operaciones Babel (B.O.B.)*
