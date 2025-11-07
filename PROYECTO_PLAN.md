# 📋 PLAN DE DESARROLLO - SISTEMA DE CORRECCIÓN AUTOMÁTICA CON ADMIN PANEL

> **Proyecto**: Sistema de Corrección Automática con MongoDB y Admin Panel
> **Inicio**: 21 de Octubre, 2025
> **Estado**: En Desarrollo

---

## 📖 ÍNDICE

1. [Metodología de Trabajo](#-metodología-de-trabajo)
2. [Resumen del Proyecto](#-resumen-del-proyecto)
3. [Arquitectura Actual](#-arquitectura-actual)
4. [Arquitectura Objetivo](#-arquitectura-objetivo)
5. [Esquema de Base de Datos](#-esquema-de-base-de-datos)
6. [Backend - API REST](#-backend---api-rest)
7. [Frontend - Componentes y Vistas](#-frontend---componentes-y-vistas)
8. [Sistema de Autenticación](#-sistema-de-autenticación)
9. [Plan de Implementación - FASES](#-plan-de-implementación---fases)
10. [Comandos Útiles](#-comandos-útiles)
11. [Mejoras Futuras](#-mejoras-futuras)

---

## 🎯 METODOLOGÍA DE TRABAJO

### Cómo usar este documento

Este README es la **guía maestra** del proyecto. Antes de cada sesión de trabajo:

1. **LEE este README completo** para entender el contexto
2. **IDENTIFICA la fase actual** en la sección [Plan de Implementación](#-plan-de-implementación---fases)
3. **REVISA qué tareas están pendientes** en esa fase
4. **TRABAJA en las tareas** siguiendo el orden establecido
5. **AL TERMINAR cada tarea**, márcala como completada (`[ ]` → `[✓]`)
6. **AL TERMINAR cada fase completa**, actualiza:
   - Marcar fase como `✅ COMPLETADA`
   - Actualizar fecha de finalización
   - Si hay pendientes, documentarlos en "Notas/Pendientes"

### Reglas de trabajo

- ✅ **SIEMPRE documenta el código** (comentarios en funciones complejas)
- ✅ **SIEMPRE actualiza este README** al terminar tareas
- ✅ **SIEMPRE trabaja fase por fase** (no saltes de fase)
- ✅ **SIEMPRE testea** antes de marcar como completado
- ✅ **SIEMPRE commitea** al terminar una tarea importante
- ❌ **NUNCA elimines código** sin documentar por qué
- ❌ **NUNCA cambies la arquitectura** sin actualizar este README

### Formato de checkboxes

- `[ ]` = Tarea **pendiente**
- `[✓]` = Tarea **completada**
- `[~]` = Tarea **en progreso**
- `[⚠]` = Tarea con **problemas/bloqueada**

---

## 🎯 RESUMEN DEL PROYECTO

### Objetivo

Transformar el sistema actual de corrección automática de un sistema con datos hardcodeados a una arquitectura completa con:

- ✅ **Base de datos MongoDB** para persistencia
- ✅ **Admin Panel** para gestión de Universidades, Materias y Rúbricas
- ✅ **Vista simplificada** para usuarios normales
- ✅ **Sistema de autenticación** con roles (admin/usuario)
- ✅ **Baja lógica** (soft delete) en todas las entidades

### Cambios principales

| Antes | Después |
|-------|---------|
| Datos hardcodeados en frontend | Datos dinámicos desde MongoDB |
| Sin autenticación | Login con JWT + roles |
| Sin panel de administración | Admin panel completo con CRUD |
| App.tsx monolítico (1421 líneas) | Arquitectura modular con componentes |
| 4 universidades fijas | CRUD completo de universidades |
| Cursos/Rúbricas fijos | CRUD completo de cursos y rúbricas |

---

## 🏗️ ARQUITECTURA ACTUAL

### Stack Tecnológico

**Frontend**:
- React 18.2.0 + TypeScript 5.2.2
- Tailwind CSS 3.4.13 (dark theme con Aurora background)
- Vite 4.4.9

**Backend/Orquestación**:
- n8n (webhooks para generar rúbricas, corregir, subir a spreadsheet)
- Google Gemini API (IA)
- Google Sheets API

**Datos actuales**:
- Hardcodeados en `App.tsx`
- 4 universidades UTN
- 2 rúbricas preestablecidas

### Flujo actual

```
Usuario → Frontend (React) → n8n webhooks → Google Gemini → Respuesta
                                  ↓
                           Google Sheets (persistencia)
```

---

## 🎯 ARQUITECTURA OBJETIVO

### Stack Tecnológico

**Frontend** (mantiene lo actual + mejoras):
- React 18 + TypeScript
- Tailwind CSS (mismo estilo)
- Vite
- Axios (llamadas API)
- React Router (navegación)

**Backend** (nuevo):
- Node.js + Express
- MongoDB + Mongoose
- JWT (autenticación)
- Multer (upload de archivos)
- bcrypt (hash de contraseñas)
- CORS

**Integración**:
- Frontend ↔ Backend API REST (CRUD)
- Backend → n8n webhooks (generación rúbricas, corrección)

### Flujo objetivo

```
Usuario → Login → JWT token
           ↓
    [Usuario normal]                    [Admin]
           ↓                               ↓
    Vista simplificada          Vista simplificada + Admin Panel
           ↓                               ↓
    Selecciona desde BD         Gestiona CRUD (Universidades/Cursos/Rúbricas)
           ↓                               ↓
    Corrige con n8n             Crea rúbricas desde PDF (n8n webhook)
           ↓                               ↓
    Sube a Google Sheets        Todo persiste en MongoDB
```

---

## 📊 ESQUEMA DE BASE DE DATOS

### MongoDB Collections

#### 1. **universities**
```javascript
{
  _id: ObjectId,
  university_id: String (unique, ej: "utn-frm"),
  name: String (ej: "UTN - Facultad Regional Mendoza"),
  deleted: Boolean (default: false), // Baja lógica
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. **courses**
```javascript
{
  _id: ObjectId,
  course_id: String (unique, ej: "prog-1"),
  name: String (ej: "Programación 1"),
  university_id: String (referencia a universities),
  deleted: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

#### 3. **rubrics**
```javascript
{
  _id: ObjectId,
  rubric_id: String (unique, generado automáticamente),
  name: String (ej: "TP Listas - Python"),
  university_id: String,
  course_id: String,
  rubric_json: Object (esquema completo de la rúbrica),
  source: String (enum: "pdf", "json", "manual"),
  original_file_url: String (opcional, si se subió desde PDF/JSON),
  deleted: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

#### 4. **users**
```javascript
{
  _id: ObjectId,
  username: String (unique),
  password: String (hashed con bcrypt),
  role: String (enum: "admin", "user"),
  createdAt: Date,
  updatedAt: Date
}
```

### Índices

```javascript
// universities
db.universities.createIndex({ university_id: 1 }, { unique: true })
db.universities.createIndex({ deleted: 1 })

// courses
db.courses.createIndex({ course_id: 1 }, { unique: true })
db.courses.createIndex({ university_id: 1 })
db.courses.createIndex({ deleted: 1 })

// rubrics
db.rubrics.createIndex({ rubric_id: 1 }, { unique: true })
db.rubrics.createIndex({ university_id: 1, course_id: 1 })
db.rubrics.createIndex({ deleted: 1 })

// users
db.users.createIndex({ username: 1 }, { unique: true })
```

---

## 🔧 BACKEND - API REST

### Estructura de carpetas

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # Conexión MongoDB
│   ├── models/
│   │   ├── University.js        # Schema Mongoose
│   │   ├── Course.js
│   │   ├── Rubric.js
│   │   └── User.js
│   ├── controllers/
│   │   ├── authController.js    # Login, verify token
│   │   ├── universityController.js
│   │   ├── courseController.js
│   │   └── rubricController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── universityRoutes.js
│   │   ├── courseRoutes.js
│   │   └── rubricRoutes.js
│   ├── middleware/
│   │   ├── auth.js              # Verificar JWT
│   │   └── adminOnly.js         # Verificar rol admin
│   ├── services/
│   │   └── n8nService.js        # Llamadas a webhooks n8n
│   └── app.js                   # Express app principal
├── scripts/
│   └── seedDatabase.js          # Migración de datos iniciales
├── .env
├── .env.example
├── package.json
└── README.md
```

### Endpoints de la API

#### **Autenticación**
- `POST /api/auth/login` - Login (devuelve JWT)
  - Body: `{ username, password }`
  - Response: `{ token, user: { username, role } }`

- `POST /api/auth/register` - Crear usuario (solo admin)
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ username, password, role }`

- `GET /api/auth/verify` - Verificar token JWT
  - Headers: `Authorization: Bearer <token>`
  - Response: `{ valid: true, user: {...} }`

#### **Universidades** (CRUD - solo admin)
- `GET /api/universities` - Listar todas (no eliminadas)
  - Response: `[{ _id, university_id, name, createdAt, updatedAt }]`

- `GET /api/universities/:id` - Obtener una

- `POST /api/universities` - Crear (requiere auth admin)
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ university_id, name }`

- `PUT /api/universities/:id` - Actualizar (requiere auth admin)
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ name }` (university_id no se puede cambiar)

- `DELETE /api/universities/:id` - Baja lógica (requiere auth admin)
  - Headers: `Authorization: Bearer <token>`

#### **Materias/Cursos** (CRUD - solo admin)
- `GET /api/courses` - Listar todos (query param: `?university_id=...`)
  - Response: `[{ _id, course_id, name, university_id, createdAt, updatedAt }]`

- `GET /api/courses/:id` - Obtener uno

- `POST /api/courses` - Crear (requiere auth admin)
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ course_id, name, university_id }`

- `PUT /api/courses/:id` - Actualizar (requiere auth admin)
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ name, university_id }`

- `DELETE /api/courses/:id` - Baja lógica (requiere auth admin)
  - Headers: `Authorization: Bearer <token>`

#### **Rúbricas** (CRUD - solo admin puede crear/editar/eliminar)
- `GET /api/rubrics` - Listar todas (query params: `?university_id=&course_id=`)
  - Response: `[{ _id, rubric_id, name, university_id, course_id, rubric_json, source, createdAt, updatedAt }]`

- `GET /api/rubrics/:id` - Obtener una

- `POST /api/rubrics` - Crear desde JSON (requiere auth admin)
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ name, university_id, course_id, rubric_json }`

- `POST /api/rubrics/from-pdf` - Crear desde PDF (llama a webhook n8n, requiere auth admin)
  - Headers: `Authorization: Bearer <token>`
  - Body (multipart/form-data): `{ name, university_id, course_id, pdf_file }`
  - Proceso:
    1. Recibe PDF
    2. Llama a webhook n8n `/rubrica`
    3. Obtiene JSON de rúbrica
    4. Guarda en BD

- `PUT /api/rubrics/:id` - Actualizar (requiere auth admin)
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ name, rubric_json }`

- `DELETE /api/rubrics/:id` - Baja lógica (requiere auth admin)
  - Headers: `Authorization: Bearer <token>`

---

## 🎨 FRONTEND - COMPONENTES Y VISTAS

### Estructura de carpetas refactorizada

```
frontend-n8n/
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   ├── AdminPanel.tsx           # Aside con tabs
│   │   │   ├── UniversitiesManager.tsx  # CRUD universidades
│   │   │   ├── CoursesManager.tsx       # CRUD materias
│   │   │   └── RubricsManager.tsx       # CRUD rúbricas
│   │   ├── user/
│   │   │   └── UserView.tsx             # Vista simplificada
│   │   ├── auth/
│   │   │   └── Login.tsx                # Pantalla de login
│   │   ├── shared/
│   │   │   ├── Button.tsx               # Componente reutilizable
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Table.tsx
│   │   └── layout/
│   │       └── Layout.tsx               # Layout principal
│   ├── hooks/
│   │   ├── useAuth.ts                   # Hook de autenticación
│   │   └── useApi.ts                    # Hook para llamadas API
│   ├── services/
│   │   ├── api.ts                       # Axios instance
│   │   └── authService.ts               # Login, logout, getToken
│   ├── types/
│   │   └── index.ts                     # Tipos TypeScript
│   ├── App.tsx                          # Router principal
│   ├── main.tsx
│   └── styles.css
├── .env
└── package.json
```

### Flujo de Usuario

#### **Usuario Normal** (no autenticado o rol "user")
1. **Vista simplificada** con 3 secciones:
   - **Sección 1: Contexto Académico**
     - Select: Universidad (desde BD)
     - Select: Materia (filtradas por universidad, desde BD)
     - Select: Rúbrica (filtradas por universidad + materia, desde BD)

   - **Sección 2: Subir Archivo a Corregir**
     - Input file: Archivo del alumno
     - Botón: "Corregir"
     - Resultado: Muestra evaluación de n8n

   - **Sección 3: Subir Resultados a Planilla**
     - Inputs: URL spreadsheet, nombre hoja, alumno, nota
     - Textareas: Resumen, fortalezas, recomendaciones (auto-llenados)
     - Botón: "Subir a planilla"

#### **Administrador** (rol "admin")
1. **Login** → Obtiene JWT
2. **Vista principal** = Vista de usuario + **Admin Panel (aside izquierdo)**
3. **Admin Panel**:
   - **Tab 1: Universidades**
     - Tabla con universidades
     - Botones: Crear, Editar, Eliminar (baja lógica)
     - Modal para crear/editar

   - **Tab 2: Materias**
     - Select: Filtrar por universidad
     - Tabla con materias
     - Botones: Crear, Editar, Eliminar
     - Modal para crear/editar (seleccionar universidad)

   - **Tab 3: Rúbricas**
     - Selects: Filtrar por universidad + materia
     - Tabla con rúbricas
     - Botones:
       - Crear desde JSON (upload)
       - Crear desde PDF (upload → llama a n8n webhook → guarda resultado)
       - Editar (modal con editor JSON)
       - Eliminar (baja lógica)
     - Preview de rúbrica JSON

### Estilo Visual

**Mantener el estilo actual**:
- Tailwind dark theme (`bg-slate-950`, `text-slate-100`)
- Aurora background animado (gradientes radiales con blur)
- Cards con `bg-slate-900/70`, `border-slate-800/60`, `rounded-2xl/3xl`
- Botones con gradientes (`from-sky-400 via-indigo-500 to-purple-500`)
- Inputs con `focus:ring` y `focus:border-{color}-400/70`
- Animaciones suaves (`motion-safe:animate-float`, `transition-all`)
- Scrollbars personalizados (`.code-scrollbar`, `.result-scrollbar`)

---

## 🔐 SISTEMA DE AUTENTICACIÓN

### Flujo de Autenticación

1. Usuario ingresa `username` + `password` en Login.tsx
2. Frontend → `POST /api/auth/login` → Backend
3. Backend:
   - Busca usuario en BD
   - Valida password con bcrypt
   - Genera JWT con payload: `{ userId, username, role }`
   - Devuelve `{ token, user }`
4. Frontend:
   - Guarda token en `localStorage`
   - Redirige según rol:
     - `admin` → Vista con Admin Panel
     - `user` → Vista simplificada
5. En cada request a endpoints protegidos:
   - Frontend incluye header: `Authorization: Bearer <token>`
   - Backend middleware verifica token y extrae usuario

### Roles

- **user**: Acceso solo a vista simplificada (sin admin panel)
- **admin**: Acceso completo (vista simplificada + admin panel con CRUD)

### Middleware de Backend

#### `auth.js` (verifica JWT)
```javascript
// Verifica que el token sea válido
// Si es válido, añade req.user = { userId, username, role }
// Si no, devuelve 401 Unauthorized
```

#### `adminOnly.js` (verifica rol admin)
```javascript
// Requiere que auth.js se haya ejecutado antes
// Verifica que req.user.role === 'admin'
// Si no, devuelve 403 Forbidden
```

---

## 🚀 PLAN DE IMPLEMENTACIÓN - FASES

### FASE 1: Backend - Configuración Base y CRUD ✅ COMPLETADA
**Fecha inicio**: 21/10/2025
**Fecha fin**: 21/10/2025
**Estado**: ✅ COMPLETADA

#### Tareas:
- [✓] 1.1. Crear proyecto Node.js + Express
  - [✓] Inicializar `npm init`
  - [✓] Instalar dependencias: `express`, `mongoose`, `jsonwebtoken`, `bcrypt`, `dotenv`, `cors`, `multer`
  - [✓] Crear estructura de carpetas
  - [✓] Configurar `.env.example`

- [✓] 1.2. Configurar MongoDB
  - [✓] Crear cuenta en MongoDB Atlas (o instalar local)
  - [✓] Crear cluster y obtener connection string
  - [✓] Crear `src/config/database.js` con conexión
  - [✓] Testear conexión (pendiente de usuario - necesita configurar .env)

- [✓] 1.3. Crear modelos Mongoose
  - [✓] `src/models/University.js`
  - [✓] `src/models/Course.js`
  - [✓] `src/models/Rubric.js`
  - [✓] `src/models/User.js`
  - [✓] Agregar índices y validaciones

- [✓] 1.4. Implementar sistema de autenticación
  - [✓] `src/controllers/authController.js` (login, register, verify)
  - [✓] `src/routes/authRoutes.js`
  - [✓] `src/middleware/auth.js` (verificar JWT)
  - [✓] `src/middleware/auth.js` incluye requireAdmin (verificar rol)
  - [✓] Testear endpoints de auth con Postman/Thunder Client (pendiente de usuario)

- [✓] 1.5. Implementar CRUD de Universidades
  - [✓] `src/controllers/universityController.js`
  - [✓] `src/routes/universityRoutes.js`
  - [✓] GET /api/universities (listar)
  - [✓] GET /api/universities/:id (obtener una)
  - [✓] POST /api/universities (crear - solo admin)
  - [✓] PUT /api/universities/:id (actualizar - solo admin)
  - [✓] DELETE /api/universities/:id (baja lógica - solo admin)
  - [✓] Testear todos los endpoints (pendiente de usuario)

- [✓] 1.6. Implementar CRUD de Materias/Cursos
  - [✓] `src/controllers/courseController.js`
  - [✓] `src/routes/courseRoutes.js`
  - [✓] GET /api/courses (listar con filtro ?university_id)
  - [✓] GET /api/courses/:id
  - [✓] POST /api/courses (crear - solo admin)
  - [✓] PUT /api/courses/:id (actualizar - solo admin)
  - [✓] DELETE /api/courses/:id (baja lógica - solo admin)
  - [✓] Testear todos los endpoints (pendiente de usuario)

- [✓] 1.7. Implementar CRUD de Rúbricas
  - [✓] `src/controllers/rubricController.js`
  - [✓] `src/routes/rubricRoutes.js`
  - [✓] `src/services/n8nService.js` (llamar webhook /rubrica)
  - [✓] GET /api/rubrics (listar con filtros)
  - [✓] GET /api/rubrics/:id
  - [✓] POST /api/rubrics (crear desde JSON - solo admin)
  - [✓] POST /api/rubrics/from-pdf (crear desde PDF - solo admin)
  - [✓] PUT /api/rubrics/:id (actualizar - solo admin)
  - [✓] DELETE /api/rubrics/:id (baja lógica - solo admin)
  - [✓] Configurar Multer para upload de PDFs
  - [✓] Testear todos los endpoints (pendiente de usuario)

- [✓] 1.8. Script de migración de datos
  - [✓] `scripts/seedDatabase.js`
  - [✓] Migrar 4 universidades actuales (UTN-FRM, FRA, FRSN, FRBA)
  - [✓] Migrar cursos actuales (Programación 1-3, BD, etc.)
  - [✓] Migrar 2 rúbricas preestablecidas (TP Listas + Parcial PythonForestal)
  - [✓] Crear usuario admin por defecto: `admin / admin123`
  - [✓] Ejecutar script y verificar datos en MongoDB (pendiente de usuario)

- [✓] 1.9. Documentación del backend
  - [✓] Crear `backend/README.md`
  - [✓] Documentar cómo instalar y ejecutar
  - [✓] Documentar variables de entorno
  - [✓] Documentar endpoints con ejemplos curl

#### Notas/Pendientes:
```
✅ FASE 1 COMPLETADA (21/10/2025)

Archivos creados:
- backend/package.json
- backend/.env.example
- backend/.gitignore
- backend/src/config/database.js
- backend/src/models/University.js
- backend/src/models/Course.js
- backend/src/models/Rubric.js
- backend/src/models/User.js
- backend/src/middleware/auth.js
- backend/src/controllers/authController.js
- backend/src/controllers/universityController.js
- backend/src/controllers/courseController.js
- backend/src/controllers/rubricController.js
- backend/src/routes/authRoutes.js
- backend/src/routes/universityRoutes.js
- backend/src/routes/courseRoutes.js
- backend/src/routes/rubricRoutes.js
- backend/src/services/n8nService.js
- backend/src/app.js
- backend/scripts/seedDatabase.js
- backend/README.md

Pendiente del usuario:
1. Configurar MongoDB (local o Atlas)
2. Copiar .env.example a .env y configurar variables
3. Ejecutar npm run seed para migrar datos
4. Ejecutar npm run dev para iniciar servidor
5. Testear endpoints con Postman/Thunder Client

Próximos pasos:
- Pasar a FASE 2: Frontend - Refactorización y Componentes Base
```

---

### FASE 2: Frontend - Refactorización y Componentes Base ✅ COMPLETADA
**Fecha inicio**: 21/10/2025
**Fecha fin**: 21/10/2025
**Estado**: ✅ COMPLETADA

#### Tareas:
- [✓] 2.1. Reestructurar proyecto frontend
  - [✓] Crear carpetas: `components/`, `hooks/`, `services/`, `types/`
  - [✓] Crear subcarpetas: `admin/`, `user/`, `auth/`, `shared/`, `layout/`
  - [✓] Instalar dependencias adicionales: `axios`, `react-router-dom`

- [✓] 2.2. Crear tipos TypeScript
  - [✓] `src/types/index.ts`
  - [✓] Tipos: University, Course, Rubric, User, AuthResponse, ApiError, RubricJSON, etc.

- [✓] 2.3. Crear servicio API
  - [✓] `src/services/api.ts` (Axios instance con interceptores)
  - [✓] `src/services/authService.ts` (login, logout, getToken, isAuthenticated, getUser, isAdmin)
  - [✓] Configurar baseURL desde variable de entorno (VITE_API_URL)

- [✓] 2.4. Crear hooks personalizados
  - [✓] `src/hooks/useAuth.ts` (manejo de autenticación con estado completo)
  - [✓] `src/hooks/useApi.ts` (llamadas API con loading/error states)

- [✓] 2.5. Crear componentes compartidos base
  - [✓] `src/components/shared/Button.tsx` (con variants y loading state)
  - [✓] `src/components/shared/Input.tsx` (con label, error, helperText)
  - [✓] `src/components/shared/Select.tsx` (con opciones y estilos coherentes)
  - [✓] `src/components/shared/Card.tsx` (con hover opcional)
  - [✓] `src/components/shared/Modal.tsx` (con footer opcional y ESC handler)
  - [✓] `src/components/shared/Table.tsx` (genérica con tipos)
  - [✓] Mantener estilo Tailwind oscuro

- [✓] 2.6. Crear layout principal
  - [✓] `src/components/layout/Layout.tsx`
  - [✓] Incluir navbar con botón logout (si está autenticado)
  - [✓] Mantener Aurora background

- [✓] 2.7. Configurar React Router (componentes base)
  - [✓] `src/components/auth/ProtectedRoute.tsx` (requiere auth, opcional admin)
  - [✓] `src/components/auth/Login.tsx` (componente completo de login)
  - [✓] Actualizar `.env.example` con VITE_API_URL

#### Notas/Pendientes:
```
✅ FASE 2 COMPLETADA (21/10/2025)

Archivos creados:
- frontend-n8n/src/types/index.ts
- frontend-n8n/src/services/api.ts
- frontend-n8n/src/services/authService.ts
- frontend-n8n/src/hooks/useAuth.ts
- frontend-n8n/src/hooks/useApi.ts
- frontend-n8n/src/components/shared/Button.tsx
- frontend-n8n/src/components/shared/Input.tsx
- frontend-n8n/src/components/shared/Select.tsx
- frontend-n8n/src/components/shared/Card.tsx
- frontend-n8n/src/components/shared/Modal.tsx
- frontend-n8n/src/components/shared/Table.tsx
- frontend-n8n/src/components/layout/Layout.tsx
- frontend-n8n/src/components/auth/ProtectedRoute.tsx
- frontend-n8n/src/components/auth/Login.tsx

Dependencias instaladas:
- axios
- react-router-dom

Pendiente para Fase 3:
- Modificar App.tsx para integrar React Router
- Crear UserView (vista simplificada)
- Crear AdminPanel con CRUD de Universidades, Cursos y Rúbricas
- Conectar todo con el backend API

Próximos pasos:
- Pasar a FASE 3: Frontend - Vistas y Admin Panel
```

---

### FASE 3: Frontend - Vistas y Admin Panel ✅ COMPLETADA
**Fecha inicio**: 21/10/2025
**Fecha fin**: 21/10/2025
**Estado**: ✅ COMPLETADA

#### Tareas:
- [✓] 3.1. Crear componente de Login (YA ESTABA EN FASE 2)
  - [✓] `src/components/auth/Login.tsx`
  - [✓] Form con username + password
  - [✓] Llamar a `authService.login()`
  - [✓] Guardar token en localStorage
  - [✓] Redirigir según rol
  - [✓] Manejo de errores

- [✓] 3.2. Crear vista de usuario simplificada
  - [✓] `src/components/user/UserView.tsx`
  - [✓] Sección 1: Contexto Académico (selects dinámicos desde BD)
  - [✓] Sección 2: Subir archivo a corregir (con llamada a webhook n8n)
  - [✓] Sección 3: Subir resultados a planilla (auto-llenado desde resultado)
  - [✓] Conectar con API para obtener universidades/cursos/rúbricas
  - [✓] Parsing automático de secciones (nota, resumen, fortalezas, recomendaciones)

- [✓] 3.3. Crear Admin Panel
  - [✓] `src/components/admin/AdminPanel.tsx`
  - [✓] Aside lateral con 3 tabs (Universidades, Materias, Rúbricas)
  - [✓] Sistema de navegación entre tabs con estado activo
  - [✓] Estilo coherente con tema oscuro y gradientes

- [✓] 3.4. Crear CRUD de Universidades
  - [✓] `src/components/admin/UniversitiesManager.tsx`
  - [✓] Tabla con universidades (usando Table component)
  - [✓] Modal para crear/editar (con validaciones)
  - [✓] Botón eliminar con confirmación
  - [✓] Conectar con API (universityService)

- [✓] 3.5. Crear CRUD de Materias
  - [✓] `src/components/admin/CoursesManager.tsx`
  - [✓] Select para filtrar por universidad
  - [✓] Tabla con materias (muestra nombre de universidad)
  - [✓] Modal para crear/editar (incluye select de universidad)
  - [✓] Conectar con API (courseService)
  - [✓] Recarga automática al cambiar filtro

- [✓] 3.6. Crear CRUD de Rúbricas
  - [✓] `src/components/admin/RubricsManager.tsx`
  - [✓] Selects para filtrar por universidad + materia (cascada)
  - [✓] Tabla con rúbricas (badge de fuente: PDF/JSON/MANUAL)
  - [✓] Modal para crear desde JSON (con textarea y validación)
  - [✓] Modal para crear desde PDF (con upload y llamada a n8n)
  - [✓] Modal para editar JSON (textarea editable)
  - [✓] Modal para ver rúbrica (solo lectura)
  - [✓] Botón descargar JSON (download file)
  - [✓] Conectar con API (rubricService)

- [✓] 3.7. Integrar vistas en App.tsx
  - [✓] Ruta `/` → UserView (requiere auth)
  - [✓] Ruta `/login` → Login (pública)
  - [✓] Ruta `/admin` → AdminPanel (requiere auth + rol admin)
  - [✓] Ruta 404 (página no encontrada)
  - [✓] Respaldo de App.tsx original (App.tsx.backup)

#### Notas/Pendientes:
```
✅ FASE 3 COMPLETADA (21/10/2025)

Archivos creados:
- frontend-n8n/src/services/universityService.ts
- frontend-n8n/src/services/courseService.ts
- frontend-n8n/src/services/rubricService.ts
- frontend-n8n/src/components/admin/UniversitiesManager.tsx
- frontend-n8n/src/components/admin/CoursesManager.tsx
- frontend-n8n/src/components/admin/RubricsManager.tsx
- frontend-n8n/src/components/admin/AdminPanel.tsx
- frontend-n8n/src/components/user/UserView.tsx
- frontend-n8n/src/App.tsx (actualizado con React Router)
- frontend-n8n/src/App.tsx.backup (respaldo del original)

Características implementadas:
✅ Admin Panel completo con tabs funcionales
✅ CRUD de Universidades (tabla, modales, validaciones)
✅ CRUD de Cursos (filtros, cascada de selects)
✅ CRUD de Rúbricas (JSON + PDF, visualización, descarga)
✅ UserView simplificada (selects dinámicos, corrección, planilla)
✅ Integración completa con backend API REST
✅ Llamadas a webhooks n8n (corrección y planilla)
✅ Parsing automático de resultados
✅ Estilo coherente dark theme en todos los componentes

Pendiente para Fase 4:
- Testing completo del flujo
- Ajustes de UX/UI según pruebas
- Manejo de errores mejorado
- Optimizaciones de performance

Próximos pasos:
- Pasar a FASE 4: Integración, Testing y Ajustes Finales
```

---

### FASE 3.5: CRUD de Usuarios y Mejoras ✅ COMPLETADA
**Fecha inicio**: 22/10/2025
**Fecha fin**: 22/10/2025
**Estado**: ✅ COMPLETADA

#### Tareas:
- [✓] 3.5.1. Implementar CRUD completo de usuarios en backend
  - [✓] Crear controlador `userController.js` con todas las operaciones
  - [✓] Crear rutas protegidas `/api/users` (requieren admin)
  - [✓] Agregar campo `deleted` al modelo User para soft delete
  - [✓] Implementar endpoint de restauración `PUT /api/users/:id/restore`
  - [✓] Actualizar validaciones de login para cuentas eliminadas
  - [✓] Mejorar validaciones de username (activos vs eliminados)

- [✓] 3.5.2. Crear servicio de usuarios en frontend
  - [✓] `userService.ts` con funciones: getUsers, getAllUsers, createUser, updateUser, deleteUser, restoreUser
  - [✓] Agregar campo `deleted` al tipo User en TypeScript

- [✓] 3.5.3. Crear componente UsersManager
  - [✓] Tabla con columnas: Usuario, Rol, Estado, Fecha, Acciones
  - [✓] Toggle "Mostrar eliminados" para ver usuarios inactivos
  - [✓] Modal para crear usuario (username, password, rol)
  - [✓] Modal para editar usuario (permite cambiar username, password opcional, rol)
  - [✓] Botón "Eliminar" con soft delete
  - [✓] Botón "Restaurar" para usuarios eliminados
  - [✓] Badges de estado: ✅ Activo / 🚫 Eliminado
  - [✓] Badges de rol: 👨‍💼 Admin / 👤 Usuario
  - [✓] Protección del usuario `admin` principal

- [✓] 3.5.4. Integrar UsersManager en AdminPanel
  - [✓] Agregar tab "👥 Usuarios" en el aside
  - [✓] Renderizar UsersManager al seleccionar el tab

- [✓] 3.5.5. Corregir bug de z-index del header
  - [✓] Aumentar z-index del navbar a `z-50`
  - [✓] Bajar z-index del contenido a `z-0`

- [✓] 3.5.6. Actualizar script de seed
  - [✓] Agregar campo `deleted: false` explícitamente a usuarios
  - [✓] Crear script de migración `migrateDeletedField.js`
  - [✓] Agregar comando npm `npm run migrate:deleted`

#### Notas/Pendientes:
```
✅ FASE 3.5 COMPLETADA (22/10/2025)

Archivos creados/modificados:
Backend:
- backend/src/controllers/userController.js (NUEVO)
- backend/src/routes/userRoutes.js (NUEVO)
- backend/src/models/User.js (actualizado con soft delete)
- backend/src/controllers/authController.js (validación de cuentas eliminadas)
- backend/src/app.js (agregada ruta /api/users)
- backend/scripts/migrateDeletedField.js (NUEVO)
- backend/scripts/seedDatabase.js (actualizado)
- backend/package.json (comando migrate:deleted)

Frontend:
- frontend-n8n/src/services/userService.ts (NUEVO)
- frontend-n8n/src/components/admin/UsersManager.tsx (NUEVO)
- frontend-n8n/src/components/admin/AdminPanel.tsx (agregado tab Usuarios)
- frontend-n8n/src/components/layout/Layout.tsx (corregido z-index)
- frontend-n8n/src/types/index.ts (agregado campo deleted)

Características implementadas:
✅ CRUD completo de usuarios (crear, leer, actualizar, eliminar, restaurar)
✅ Soft delete con campo deleted en modelo User
✅ Validación de login para cuentas eliminadas (403 Forbidden)
✅ Toggle "Mostrar eliminados" en interfaz
✅ Badges visuales de estado (Activo/Eliminado) y rol (Admin/Usuario)
✅ Protección del usuario admin principal (no se puede eliminar ni cambiar rol)
✅ Validaciones mejoradas de username (evita conflictos con eliminados)
✅ Compatibilidad con usuarios antiguos sin campo deleted
✅ Script de migración para agregar campo deleted a usuarios existentes
✅ Corrección de bug de z-index en header
✅ 4 tabs en Admin Panel: Universidades, Materias, Rúbricas, Usuarios

Próximos pasos:
- Pasar a FASE 4: Integración, Testing y Ajustes Finales
```

---

### FASE 4: Integración, Testing y Ajustes Finales ⏸️ PENDIENTE
**Fecha inicio**: __/__/____
**Fecha fin**: __/__/____
**Estado**: ⏸️ PENDIENTE

#### Tareas:
- [ ] 4.1. Conectar frontend con backend API
  - [ ] Configurar variable de entorno `VITE_API_URL`
  - [ ] Testear login
  - [ ] Testear CRUD de universidades
  - [ ] Testear CRUD de materias
  - [ ] Testear CRUD de rúbricas (JSON y PDF)
  - [ ] Testear flujo de corrección desde UserView

- [ ] 4.2. Testing del flujo completo como Admin
  - [ ] Login como admin
  - [ ] Crear universidad
  - [ ] Crear materia vinculada a universidad
  - [ ] Crear rúbrica desde PDF
  - [ ] Crear rúbrica desde JSON
  - [ ] Editar rúbrica
  - [ ] Eliminar rúbrica (baja lógica)
  - [ ] Verificar que aparecen en UserView
  - [ ] Corregir archivo usando rúbrica creada
  - [ ] Subir resultados a planilla

- [ ] 4.3. Testing del flujo completo como Usuario
  - [ ] Login como user (o sin login si se permite)
  - [ ] Verificar que NO aparece Admin Panel
  - [ ] Seleccionar universidad/materia/rúbrica desde BD
  - [ ] Subir archivo y corregir
  - [ ] Subir resultados a planilla
  - [ ] Verificar que no puede acceder a rutas de admin

- [ ] 4.4. Manejo de errores
  - [ ] Mostrar mensajes de error claros en frontend
  - [ ] Validaciones en formularios
  - [ ] Toasts/notificaciones de éxito
  - [ ] Loading states en botones
  - [ ] Manejo de errores de red

- [ ] 4.5. Ajustes de UX y estilos
  - [ ] Responsividad en mobile
  - [ ] Transiciones suaves
  - [ ] Accesibilidad (ARIA labels, teclado)
  - [ ] Consistencia de colores y espaciados
  - [ ] Iconos (opcional)

- [ ] 4.6. Optimizaciones
  - [ ] Lazy loading de componentes
  - [ ] Debounce en búsquedas
  - [ ] Paginación en tablas (si hay muchos registros)
  - [ ] Cache de datos con React Query (opcional)

- [ ] 4.7. Documentación final
  - [ ] Actualizar `frontend-n8n/README.md`
  - [ ] Documentar cómo instalar y ejecutar
  - [ ] Documentar variables de entorno
  - [ ] Screenshots del Admin Panel
  - [ ] Documentar flujo de usuario

- [ ] 4.8. Preparar para producción
  - [ ] Build de producción (`npm run build`)
  - [ ] Testear build
  - [ ] Variables de entorno para producción
  - [ ] Instrucciones de deploy

#### Notas/Pendientes:
```
(Espacio para anotar problemas encontrados, decisiones tomadas, etc.)


```

---

## 📊 RESUMEN DE PROGRESO

| Fase | Estado | Progreso | Fecha Inicio | Fecha Fin |
|------|--------|----------|--------------|-----------|
| Fase 1: Backend | ✅ COMPLETADA | 100% (9/9) | 21/10/2025 | 21/10/2025 |
| Fase 2: Frontend Base | ✅ COMPLETADA | 100% (7/7) | 21/10/2025 | 21/10/2025 |
| Fase 3: Vistas y Admin | ✅ COMPLETADA | 100% (7/7) | 21/10/2025 | 21/10/2025 |
| Fase 3.5: CRUD Usuarios | ✅ COMPLETADA | 100% (6/6) | 22/10/2025 | 22/10/2025 |
| Fase 4: Integración | ⏸️ PENDIENTE | 0% (0/8) | - | - |

**Progreso total**: 83% (29/35 tareas completadas)

---

## 🔧 COMANDOS ÚTILES

### Backend

```bash
# Instalación
cd backend
npm install

# Desarrollo
npm run dev

# Producción
npm start

# Migrar datos iniciales
npm run seed

# Migrar campo deleted a usuarios existentes (opcional)
npm run migrate:deleted

# Testing (si se implementa)
npm test
```

### Frontend

```bash
# Instalación
cd frontend-n8n
npm install

# Desarrollo
npm run dev

# Build producción
npm run build

# Preview build
npm run preview
```

### MongoDB

```bash
# Conectar a MongoDB local
mongosh

# Conectar a MongoDB Atlas
mongosh "mongodb+srv://cluster0.xxxxx.mongodb.net/myDatabase" --username <usuario>

# Ver colecciones
show collections

# Ver documentos de una colección
db.universities.find().pretty()
```

---

## 💡 MEJORAS FUTURAS

(Después de completar las 4 fases principales)

- [ ] **Roles granulares**: Profesor (puede crear rúbricas de su materia) vs Admin total
- [ ] **Historial de correcciones**: Guardar en BD todas las correcciones realizadas
- [ ] **Dashboard analytics**: Estadísticas de uso, notas promedio por materia
- [ ] **Batch grading**: Corregir múltiples alumnos a la vez
- [ ] **Exportar rúbricas**: Descargar todas las rúbricas de una materia en ZIP
- [ ] **Versioning de rúbricas**: Mantener versiones anteriores (v1, v2, etc.)
- [ ] **Notificaciones**: Sistema de notificaciones en tiempo real
- [ ] **Comentarios**: Permitir comentarios en las correcciones
- [ ] **Integración con LMS**: Moodle, Canvas, Blackboard
- [ ] **API pública**: Exponer API REST para integraciones externas

---

## 📝 NOTAS GENERALES

### Decisiones de diseño

- **Baja lógica vs Hard delete**: Usamos baja lógica (`deleted: true`) para mantener integridad referencial y permitir auditoría
- **JWT vs Sesiones**: JWT permite escalabilidad horizontal y stateless backend
- **MongoDB vs SQL**: MongoDB por flexibilidad en esquema de rúbricas (JSON anidado)
- **Monorepo vs Repos separados**: Mantenemos frontend y backend en el mismo repo por simplicidad

### Convenciones de código

- **Naming**: camelCase para variables/funciones, PascalCase para componentes/clases
- **Commits**: Usar conventional commits (`feat:`, `fix:`, `docs:`, etc.)
- **Branches**: `main` (producción), `develop` (desarrollo), `feature/nombre` (features)
- **Code style**: ESLint + Prettier (configurar en ambos proyectos)

### Contactos y recursos

- **n8n Docs**: https://docs.n8n.io/
- **MongoDB Docs**: https://docs.mongodb.com/
- **Express Docs**: https://expressjs.com/
- **React Docs**: https://react.dev/
- **Tailwind Docs**: https://tailwindcss.com/docs

---

## ✅ CHECKLIST FINAL

Antes de dar por terminado el proyecto:

- [ ] Todas las fases completadas (1-4)
- [ ] Backend documentado y testeado
- [ ] Frontend documentado y testeado
- [ ] README.md actualizado con instrucciones claras
- [ ] Variables de entorno documentadas
- [ ] Script de migración ejecutado y verificado
- [ ] Usuario admin creado
- [ ] Flujo completo testeado (admin + usuario)
- [ ] Build de producción funcional
- [ ] Código commiteado y pusheado

---

**Última actualización**: 21 de Octubre, 2025
**Actualizado por**: Claude Code
**Versión del documento**: 1.0
