# Requerimientos y Restricciones (RSTR)
**Proyecto:** Base de Operaciones Babel

## 1. Requerimientos Funcionales (RF)

| ID | Nombre | Descripción |
|---|---|---|
| **RF-01** | **Gestión de Expedientes** | El sistema debe permitir a los usuarios registrarse creando un "Expediente del Activo" y asignarles un *Callsign* único. |
| **RF-02** | **Autenticación Encriptada** | El sistema debe validar el acceso del usuario mediante contraseñas (Hash encriptado) almacenadas en PostgreSQL. |
| **RF-03** | **Selección de Frente** | El usuario debe poder seleccionar su idioma de aprendizaje inicial (Ruso o Mandarín) en el registro. |
| **RF-04** | **La Armería (Flashcards)** | El sistema debe proveer tarjetas con caracteres originales en el frente, y traducción + fonética (Pinyin/Lectura de ayuda) al reverso. |
| **RF-05** | **Audio Integrado** | El sistema debe reproducir la pronunciación correcta al visualizar el reverso de la Flashcard (`AudioUrl`). |
| **RF-06** | **Misiones Tácticas (Juego)** | El sistema debe ofrecer misiones de descifrado y traducción rápida basadas en el nivel actual del usuario. |
| **RF-07** | **Castigo Táctico** | Si la "Integridad de la Cobertura" (Vidas) llega a cero, el sistema debe presentar una pantalla negra de penalización y deducir progreso. |
| **RF-08** | **Cálculo de SITREP** | El sistema debe llevar un registro de progreso, puntos totales, racha diaria y rango militar actualizado en tiempo real. |
| **RF-09** | **Sistema de Logros** | El sistema debe desbloquear insignias militares cuando el usuario cumple condiciones específicas (ej. racha de 7 días). |

## 2. Requerimientos No Funcionales (RNF)

| ID | Nombre | Descripción |
|---|---|---|
| **RNF-01** | **Rendimiento BD** | Las consultas de progreso y asignación de flashcards en PostgreSQL no deben exceder los 500ms en tiempo de respuesta. |
| **RNF-02** | **Seguridad (Hashing)** | Las contraseñas de los usuarios deben ser cifradas obligatoriamente mediante un algoritmo fuerte (BCrypt o Argon2) antes de guardarse en la BD. |
| **RNF-03** | **Estética y UI** | La interfaz debe utilizar tipografía Monospace y paletas de colores inmersivas (verde radar, naranja alerta) acorde a la temática. |
| **RNF-04** | **Accesibilidad** | El sistema debe contar con configuraciones opcionales para Modo Daltónico y animaciones reducidas. |
| **RNF-05** | **Codificación BD** | La base de datos PostgreSQL debe usar codificación UTF-8 para soportar correctamente caracteres cirílicos, Hanzi y Emojis. |

## 3. Restricciones (RSTR)

- **RSTR-01: Arquitectura de Base de Datos.** La aplicación está restringida al uso exclusivo de **PostgreSQL**. Se prohíbe el uso de SQL Server en el entorno productivo tras la migración. Los tipos de datos deben ser los nativos (ej. `SERIAL` para PK, `TIMESTAMP` para fechas, `VARCHAR`/`TEXT`).
- **RSTR-02: Backend Exclusivo.** El servidor debe estar desarrollado en **Node.js** utilizando el framework **Express**.
- **RSTR-03: Independencia del Cliente.** El frontend debe estar construido estrictamente con **HTML, CSS (Vanilla o framework autorizado) y JavaScript**. La comunicación con el backend solo será por API REST.
- **RSTR-04: Audio y Multimedia.** Los archivos de audio deben hospedarse en un repositorio de assets, y la base de datos debe almacenar exclusivamente sus URLs.
