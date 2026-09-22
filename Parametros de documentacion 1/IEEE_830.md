# Especificación de Requisitos de Software (Norma IEEE 830)
**Proyecto:** Base de Operaciones Babel

## 1. Introducción
### 1.1 Propósito
El propósito de este documento es definir las especificaciones de los requerimientos de software para la plataforma "Operaciones Babel", detallando sus funcionalidades, comportamiento esperado, interfaces y restricciones. Está dirigido al equipo de desarrollo, la gerencia de proyecto y stakeholders involucrados en su creación.

### 1.2 Alcance
**Operaciones Babel** es una plataforma web gamificada orientada al aprendizaje progresivo de idiomas complejos (Ruso y Mandarín), estructurada bajo la narrativa de operaciones tácticas e inteligencia militar. El sistema contempla una aplicación web con frontend en HTML, CSS y JS, conectada a un backend en Node.js/Express, respaldado por una base de datos relacional PostgreSQL.

### 1.3 Definiciones, Acrónimos y Abreviaturas
- **Callsign:** Nombre en clave o alias militar del usuario.
- **Activo:** Usuario registrado en el sistema.
- **SITREP (Situation Report):** Reporte de situación, que representa el progreso del usuario.
- **Flashcard:** Tarjeta de inteligencia para aprendizaje de vocabulario y fonética.
- **PostgreSQL:** Sistema de gestión de bases de datos relacional que sustituye a SQL Server en la nueva arquitectura.

## 2. Descripción General
### 2.1 Perspectiva del Producto
El sistema se compone de una interfaz de cliente ligera e inmersiva y un servidor API REST que centraliza la lógica de negocio, control de progreso (experiencia/vidas/rachas) y almacenamiento persistente en PostgreSQL. 

### 2.2 Funciones del Producto
- Autenticación y creación de Expediente de Activo.
- Sistema de progresión y jerarquía militar (Rangos).
- Repositorio y visualización de Flashcards en "La Armería".
- Misiones tácticas: Minijuegos tipo "Ahorcado" y de traducción bajo presión.
- Penalizaciones inmersivas (Castigo táctico por pérdida de vidas).
- Sistema de estadísticas, rachas y logros.

### 2.3 Características de los Usuarios
- **Recluta (Nivel 0):** Interfaz estricta, vocabulario básico.
- **Activo en Observación:** Acceso a armería, aprendizaje inicial.
- **Especialista de Enlace:** Participación activa en misiones (descifrado).
- **Aliado de Élite:** Usuario experto con progresión completa.

### 2.4 Restricciones Generales
- Conexión constante a internet.
- Resolución de pantalla orientada a escritorio/móvil (Diseño responsive con estilo Terminal).
- Backend ejecutado en entorno Node.js utilizando un motor PostgreSQL nativo.

## 3. Requisitos Específicos
### 3.1 Requisitos de Interfaz Externa
- **Interfaces de Usuario (UI):** Paleta verde oliva, negro, texto monospace. Efectos de glitch, simulando terminales tácticas clasificadas.
- **Interfaces de Software:** La comunicación Frontend-Backend debe realizarse mediante API REST JSON. 
- **Interfaces de Base de Datos:** Conexión a PostgreSQL utilizando paquetes como `pg` en Node.js.

### 3.2 Requisitos Funcionales y Atributos de Calidad
*(Consultar el documento de Requerimientos y Restricciones para el detalle exhaustivo).*
