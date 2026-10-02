# Operación Babel v2.0 - Arquitectura Modular y Escalable

Esta es la versión paralela moderna de **Operación Babel**, reconstruida siguiendo estándares de ingeniería de software, arquitectura en capas y separación limpia entre cliente y servidor.

---

## 🏛️ Arquitectura del Sistema

```
operacion-babel-v2/
├── backend/                  # API REST v1 desacoplada (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── config/           # Conexión PostgreSQL y variables de entorno
│   │   ├── types/            # Modelos e interfaces de dominio tipadas
│   │   ├── middlewares/      # JWT Authentication, Role Guards, Error Handler
│   │   ├── repositories/     # Capa de acceso a datos (PostgreSQL DAL)
│   │   ├── services/         # Reglas de negocio (SM-2, XP, Rangos, Auth)
│   │   ├── controllers/      # Entrada/Salida HTTP
│   │   └── routes/           # Rutas modulares con versionado /api/v1/
│   └── dist/                 # Transpilación a JavaScript de alto rendimiento
│
└── frontend/                 # Single Page Application (Angular 22 Standalone)
    └── src/app/
        ├── core/             # Servicios globales (Auth con Signals, Interceptors, Guards)
        ├── shared/           # Componentes tácticos reutilizables (Sidebar, Header, Vidas)
        └── features/         # Módulos de usuario (Home, Armería, Flashcards, Infiltración, Perfil, Mando)
```

---

## 🚀 Puesta en Marcha Rápida (con pnpm)

### 1. Iniciar el Backend
```bash
cd backend
pnpm install
pnpm dev
```
El servidor táctico arrancará en `http://localhost:3000`. Puedes verificar su estado en:
`http://localhost:3000/api/v1/health`

### 2. Iniciar el Frontend (Angular)
En otra terminal:
```bash
cd frontend
pnpm install
pnpm start
```
Abre tu navegador en:
`http://localhost:4200`

---

## 🛡️ Mejoras de Seguridad y Buenas Prácticas
1. **JWT (JSON Web Tokens):** Sesiones sin estado, preparadas para clientes web, móviles o servicios externos.
2. **bcryptjs:** Hashing criptográfico robusto con salting automático (con migración transparente de contraseñas legacy).
3. **Control de Acceso por Roles (RBAC):** `adminGuard` para el panel de mandos basado en rango militar (`IdRango >= 4`).
4. **Cero Duplicación de Código:** El Header táctico, el Menú lateral y la Barra de vidas están desacoplados en componentes independientes.
5. **Navegación SPA:** Transiciones suaves e instantáneas sin recargar la página.
