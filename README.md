# Sistema de Corrección Automática con IA

Sistema completo de corrección automática de entregas académicas utilizando Inteligencia Artificial (Google Gemini), con panel de administración, gestión de rúbricas, sistema multi-tenant jerárquico y automatización de flujos con n8n.

---

## Tabla de Contenidos

- [Inicio Rápido con Docker](#inicio-rápido-con-docker-🐳) ⭐ **NUEVO**
- [Descripcion General](#descripcion-general)
- [Caracteristicas Principales](#caracteristicas-principales)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Stack Tecnologico](#stack-tecnologico)
- [Inicio Rapido](#inicio-rapido)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Documentacion](#documentacion)
- [Flujo General del Sistema](#flujo-general-del-sistema)
- [Estado del Proyecto](#estado-del-proyecto)
- [Creditos](#creditos)

---

## Inicio Rápido con Docker 🐳

**¿Primera vez usando el sistema? ¡Ejecútalo en minutos!**

### Requisitos
- [Docker Desktop](https://docs.docker.com/get-docker/) instalado
- [Git](https://git-scm.com/downloads) instalado

### Instalación

#### Windows (con .bat)
```batch
# 1. Clonar repositorio
git clone https://github.com/tu-usuario/proyecto-correccion.git
cd proyecto-correccion

# 2. Ejecutar script de inicio (hace setup automáticamente)
start.bat
```

#### Linux/Mac o con make
```bash
# 1. Clonar repositorio
git clone https://github.com/tu-usuario/proyecto-correccion.git
cd proyecto-correccion

# 2. Setup inicial y arranque
make setup
# Edita .env (solo MONGODB_URI es obligatorio)
make start

# O usa el script:
./start.sh
```

### Acceder al Sistema

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:5000
- **N8N:** http://localhost:5678 (admin/admin123)

### Comandos Disponibles

#### Windows (sin make)
```batch
start.bat                   # Iniciar sistema completo
stop.bat                    # Detener servicios
docker-compose up -d        # Iniciar servicios manualmente
docker-compose down         # Detener servicios manualmente
docker-compose logs -f      # Ver logs en tiempo real
docker-compose ps           # Ver estado
```

#### Linux/Mac (con scripts o make)
```bash
# Con scripts
./start.sh        # Iniciar servicios
./stop.sh         # Detener servicios

# Con make
make start        # Iniciar servicios
make stop         # Detener servicios
make logs-f       # Ver logs en tiempo real
make status       # Ver estado de servicios
make troubleshoot # Diagnóstico si hay problemas
make help         # Ver todos los comandos
```

### Documentación Completa

- **📖 [Guía Completa de Docker](README-DOCKER.md)** - Instalación detallada, configuración y troubleshooting
- **⚡ [Quick Start](QUICK-START.md)** - Guía ultra rápida (3 pasos)
- **🌐 [Networking](NETWORKING.md)** - Comunicación entre servicios y troubleshooting de red
- **👥 [Contributing](CONTRIBUTING.md)** - Guía para desarrolladores
- **🔧 [Configurar N8N](n8n/README-PRECONFIGURACION.md)** - Preconfigurar workflows y credenciales
- **📚 [Toda la Documentación](docs/README.md)** - Índice completo de documentación

---

## Descripcion General

Sistema integral para **automatizar la correccion de trabajos practicos, parciales y finales** en entornos academicos universitarios. Utiliza **Google Gemini AI** para evaluar codigo, documentos y entregas de alumnos segun rubricas personalizadas.

**🎉 NUEVA VERSIÓN (Diciembre 2025)**: Sistema completamente refactorizado para usar **almacenamiento local + MongoDB** eliminando dependencias de Google Drive y Google Sheets. Más simple, más rápido, más portable.

### Problema que resuelve

- **Ahorra tiempo**: Corrige automaticamente entregas de alumnos en segundos
- **Consistencia**: Aplica los mismos criterios de evaluacion a todos los alumnos
- **Rubricas desde PDF**: Genera automaticamente rubricas estructuradas desde consignas en PDF
- **Almacenamiento local**: Todos los archivos se guardan en el servidor (no requiere Google Drive)
- **Base de datos unificada**: MongoDB como única fuente de verdad
- **Feedback detallado**: Proporciona resumen por criterios, fortalezas y recomendaciones
- **PDFs de devolución**: Genera PDFs profesionales con correcciones desde MongoDB

### Para quien es?

- **Docentes universitarios**: Que necesitan corregir multiples entregas
- **Catedras**: Con muchos alumnos y multiples comisiones
- **Instituciones educativas**: Que buscan estandarizar evaluaciones

---

## Caracteristicas Principales

### Sistema de Autenticación Multi-tenant Jerárquico
- Login con JWT (JSON Web Tokens)
- **Roles jerárquicos**: Super Admin, University Admin, Faculty Admin, Career Admin, Course Admin, Commission Admin, y User
- Cambio de contraseña obligatorio en primer login
- Protección de rutas según permisos
- Auto-filtrado de datos según contexto del usuario
- Registro público desactivado (solo admins pueden crear usuarios)

### Panel de Administracion
- **Gestion de Universidades**: CRUD completo con soft delete
- **Gestion de Materias/Cursos**: Organizacion por universidad
- **Gestion de Rubricas**:
  - Generacion automatica desde PDF con Google Gemini AI
  - Creacion manual desde JSON
  - Edicion, visualizacion y descarga
- **Gestion de Usuarios**: Crear, editar, eliminar y restaurar usuarios

### Correccion Automatica con IA
- **Evaluacion con Google Gemini 2.5 Flash**
- Soporta multiples lenguajes: Python, Java, C, SQL, Web, etc.
- Analisis de:
  - Correctitud funcional
  - Calidad de codigo
  - Validaciones y manejo de errores
  - Eficiencia algoritmica
  - Buenas practicas

### Generacion de Feedback Detallado
- **Nota final** (sobre 100 puntos)
- **Resumen por criterios** con puntajes parciales
- **Fortalezas** identificadas en el codigo
- **Recomendaciones** especificas de mejora

### Almacenamiento y Gestión
- **Almacenamiento local**: Archivos en `backend/uploads/submissions/`
- **MongoDB**: Base de datos única para metadatos y correcciones
- **Sin dependencias cloud**: No requiere Google Drive ni Google Sheets
- **PDFs de devolución**: Generación directa desde MongoDB con PDFKit

### Correccion Batch
- Procesa multiples entregas simultaneamente
- Guarda resultados en MongoDB
- Genera ZIP con PDFs de devolución para todos los estudiantes

### Consolidador de Proyectos
- Herramienta publica (sin autenticacion)
- Convierte proyectos completos en un archivo de texto
- Optimizado para analisis por IA (ChatGPT, Claude)
- 6 modos predefinidos + personalizado

---

## Arquitectura del Sistema

```
+-------------------------------------------------------------+
|                        FRONTEND                             |
|          React + TypeScript + Tailwind CSS                  |
|                                                             |
|  +--------------+  +--------------+  +-----------------+    |
|  | Login (JWT)  |  |  Admin Panel |  | Professor View  |    |
|  |              |  |  (Multi CRUD)|  | (Submissions)   |    |
|  +--------------+  +--------------+  +-----------------+    |
+-------------------------------------------------------------+
                           |  ^
                    HTTP REST API
                           v  |
+-------------------------------------------------------------+
|                        BACKEND                              |
|         Node.js + Express + MongoDB + Local Storage        |
|                                                             |
|  +--------------+  +--------------+  +-----------------+    |
|  | Auth (JWT)   |  |  CRUD APIs   |  | File Storage    |    |
|  |              |  | Multi-tenant |  | (Local FS)      |    |
|  +--------------+  +--------------+  +-----------------+    |
|                                                             |
|  +--------------+  +--------------+  +-----------------+    |
|  | PDF Service  |  | Submission   |  |  n8n Webhooks   |    |
|  | (PDFKit)     |  | Controller   |  |  (Solo Gemini)  |    |
|  +--------------+  +--------------+  +-----------------+    |
+-------------------------------------------------------------+
                           |  ^
                    MongoDB Atlas
                           v  |
+-------------------------------------------------------------+
| Universities  Faculties  Careers  Courses  Commissions     |
| Rubrics  Submissions  Users                                |
+-------------------------------------------------------------+
                           |
              Webhook HTTP (Solo para IA)
                           v
+-------------------------------------------------------------+
|                    n8n WORKFLOWS (IA)                       |
|                                                             |
|  Webhook /rubric   -> Google Gemini -> Genera rubrica      |
|  Webhook /grading  -> Google Gemini -> Evalua entrega      |
+-------------------------------------------------------------+
                           |  ^
                   +------------------+
                   |  Google Gemini   |
                   |                  |
                   |  - Gemini 2.5    |
                   |    Flash         |
                   +------------------+

ALMACENAMIENTO:
- Archivos: backend/uploads/submissions/{commission}/{rubric}/{student}/
- Metadatos: MongoDB (submissions, corrections, rubrics)
- PDFs: Generados on-demand con PDFKit
```

---

## Stack Tecnologico

### Frontend
- **React 18.2.0** - Framework UI
- **TypeScript 5.2.2** - Tipado estatico
- **Tailwind CSS 3.4.13** - Estilos utility-first
- **Vite 4.4.9** - Build tool y dev server
- **React Router DOM** - Navegacion SPA
- **Axios** - Cliente HTTP

### Backend
- **Node.js 18+** - Runtime
- **Express 4.18** - Framework web
- **MongoDB + Mongoose** - Base de datos NoSQL
- **JWT** - Autenticacion stateless
- **bcrypt** - Hash de contraseñas
- **Multer** - Upload de archivos

### Orquestacion y AI
- **n8n** - Workflow automation (solo para IA)
- **Google Gemini 2.5 Flash** - Modelo de IA para correccion
- **PDFKit** - Generación de PDFs de devolución
- **Archiver** - Compresión de ZIPs para batch

### DevOps
- **Git** - Control de versiones
- **npm** - Gestion de paquetes
- **MongoDB Atlas** - Base de datos en la nube (opcional)
- **Vercel/Netlify** - Deploy frontend (opcional)

---

## Inicio Rapido

### Requisitos Previos

- **Node.js** >= 18.0.0
- **MongoDB** (local o Atlas)
- **n8n** (self-hosted o cloud) - **DEBE estar corriendo antes del seed**
- **Cuenta de Google Cloud** (para Gemini API y Google Drive API)

### 1. Clonar el Repositorio

```bash
git clone <URL-del-repositorio>
cd correcion-automatica
```

### 2. Configurar n8n (IMPORTANTE: hacer ANTES del seed)

```bash
cd n8n-workflows

# Importar flujos en tu instancia de n8n
# Ver: n8n-workflows/README.md para instrucciones detalladas

# CRITICAL: Asegurarse de que n8n esté corriendo en http://localhost:5678
# CRITICAL: Activar los 5 workflows de creación de carpetas:
#   - create-university-folder
#   - create-faculty-folder
#   - create-career-folder
#   - create-course-folder
#   - create-commission-folder

# Configurar en n8n las siguientes variables de entorno:
# - GOOGLE_DRIVE_ROOT_FOLDER_ID (ID de tu carpeta raíz en Drive)
# - GOOGLE_GEMINI_API_KEY (tu API key de Gemini)

# Configurar credenciales de Google Drive OAuth2 en n8n
```

### 3. Configurar Backend

```bash
cd proyecto-correccion/backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales:
# - MONGODB_URI
# - JWT_SECRET
# - N8N_RUBRIC_WEBHOOK_URL
# - N8N_GRADING_WEBHOOK_URL
# - N8N_SPREADSHEET_WEBHOOK_URL
#
# NUEVAS VARIABLES para creación de carpetas en Drive durante seed:
# - SEED_CREATE_DRIVE_FOLDERS=true (true: crea carpetas en Drive, false: solo MongoDB)
# - N8N_CREATE_UNIVERSITY_FOLDER_WEBHOOK
# - N8N_CREATE_FACULTY_FOLDER_WEBHOOK
# - N8N_CREATE_CAREER_FOLDER_WEBHOOK
# - N8N_CREATE_COURSE_FOLDER_WEBHOOK
# - N8N_CREATE_COMMISSION_FOLDER_WEBHOOK

# Ejecutar seed para datos iniciales y estructura de Drive
# IMPORTANTE: Asegúrate de que n8n esté corriendo ANTES de ejecutar el seed
# El seed creará:
#   - Estructura completa en MongoDB
#   - Jerarquía de carpetas en Google Drive (si SEED_CREATE_DRIVE_FOLDERS=true)
# Tiempo estimado: 3-5 minutos con Drive, 5-10 segundos sin Drive

npm run seed

# Iniciar backend
npm run dev
```

**Backend corriendo en**: `http://localhost:5000`

**Estructura creada por el seed:**
- Universidad: UTN
- Facultad: FRM (Facultad Regional Mendoza)
- Carreras: Ingeniería en Sistemas + Tecnicatura en Programación
- Materias: Programación 1, 2 y 3 (por carrera)
- Comisiones: 4 comisiones por materia (24 en total)
- Carpetas en Drive: ~82 carpetas (incluye subcarpetas Entregas y Rubricas)

### 4. Configurar Frontend

```bash
cd proyecto-correccion/frontend-correccion-automatica-n8n

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env:
# VITE_API_URL=http://localhost:5000
# VITE_N8N_GRADING_WEBHOOK=...
# VITE_N8N_SPREADSHEET_WEBHOOK=...

# Iniciar frontend
npm run dev
```

**Frontend corriendo en**: `http://localhost:5173`

### 5. Acceder al Sistema

**Credenciales por defecto** (después de ejecutar seed):

- **Super Admin**:
  - Usuario: `superadmin`
  - Contraseña: `admin123`
  - **Nota**: Al primer login, se solicitará cambio de contraseña obligatorio

- **Admin UTN**:
  - Usuario: `admin-utn`
  - Contraseña: `admin123`
  - Gestiona toda la Universidad UTN

- **Admin FRM**:
  - Usuario: `admin-frm`
  - Contraseña: `admin123`
  - Gestiona Facultad Regional Mendoza

- **Profesores**:
  - Usuario: `prof-garcia` / `prof-lopez` / `prof-martinez`
  - Contraseña: `prof123`
  - Asignados a diferentes comisiones

- **Usuario normal**:
  - Usuario: `usuario`
  - Contraseña: `usuario123`
  - Solo puede corregir entregas

**URLs**:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- n8n: `http://localhost:5678` (debe estar corriendo)
- Consolidador: `http://localhost:5173/consolidator` (publico)

---

## Estructura del Proyecto

```
correcion-automatica/
|
+-- proyecto-correccion/               # Aplicacion principal
    |
    +-- backend/                       # API REST (Node.js + Express)
    |   |
    |   +-- src/
    |   |   +-- config/                # Configuracion (DB, etc.)
    |   |   +-- models/                # Modelos Mongoose
    |   |   |   +-- University.js
    |   |   |   +-- Course.js
    |   |   |   +-- Rubric.js
    |   |   |   +-- User.js
    |   |   +-- controllers/           # Logica de negocio
    |   |   +-- routes/                # Definicion de endpoints
    |   |   +-- middleware/            # Auth, validaciones
    |   |   +-- services/              # Llamadas a n8n
    |   |   +-- app.js
    |   |
    |   +-- scripts/
    |   |   +-- seedDatabase.js        # Datos iniciales
    |   |   +-- migrateDeletedField.js
    |   |
    |   +-- .env.example
    |   +-- package.json
    |   +-- README.md                  # Documentacion del backend
    |
    +-- frontend-correccion-automatica-n8n/  # Frontend React
    |   |
    |   +-- src/
    |   |   +-- components/
    |   |   |   +-- admin/             # Admin Panel (4 CRUDs)
    |   |   |   +-- user/              # Vista de usuario
    |   |   |   +-- auth/              # Login, ProtectedRoute
    |   |   |   +-- shared/            # Componentes reutilizables
    |   |   |   +-- layout/            # Layout principal
    |   |   |
    |   |   +-- services/              # API calls (axios)
    |   |   +-- hooks/                 # Custom hooks
    |   |   +-- types/                 # TypeScript types
    |   |   +-- App.tsx                # Router principal
    |   |   +-- main.tsx
    |   |
    |   +-- .env.example
    |   +-- package.json
    |   +-- README.md                  # Documentacion del frontend
    |
    +-- CONSOLIDATOR_README.md         # Documentacion del consolidador
|
+-- n8n-workflows/                     # Flujos de n8n
|   +-- workflows-en-un-archivo.json   # Archivo consolidado (todos los workflows)
|   +-- flujo_correccion_manual.json   # Correccion individual
|   +-- flujo_correccion_masiva.json   # Correccion batch
|   +-- create-*-folder.json           # Flujos de carpetas (5 archivos)
|   +-- README.md                      # Documentacion de flujos n8n
|
+-- PROYECTO_PLAN.md                   # Plan maestro del proyecto
+-- GUIA_PRUEBAS.md                    # Guia de testing usuario
+-- GUIA_TESTING.md                    # Guia de testing tecnico
+-- CAMBIOS_CORRECCION_AUTOMATICA.md   # Log de cambios
+-- README.md                          # Este archivo
```

---

## Documentacion

### Documentación Principal (raíz)

| Documento | Descripción |
|-----------|-------------|
| **[Quick Start](QUICK-START.md)** | Inicio rápido en 3 pasos ⚡ |
| **[Guía Docker](README-DOCKER.md)** | Instalación completa con Docker 🐳 |
| **[Networking](NETWORKING.md)** | Troubleshooting de red 🌐 |
| **[Contributing](CONTRIBUTING.md)** | Guía para desarrolladores 👥 |

### Documentación Técnica (docs/)

| Documento | Descripción |
|-----------|-------------|
| **[Índice de Documentación](docs/README.md)** | Índice completo 📚 |
| **[Guía de Testing](docs/reference/GUIA_TESTING.md)** | Testing completo |
| **[Configuración y Despliegue](docs/reference/GUIA_CONFIGURACION_Y_DESPLIEGUE.md)** | Deploy en producción |
| **[Documentos Históricos](docs/completed/)** | Estado histórico y tareas completadas |

### Documentación por Componente

| Componente | Documentación |
|------------|---------------|
| **Backend** | [backend/README.md](backend/README.md) - API REST, endpoints, modelos |
| **Frontend** | [frontend-correccion-automatica-n8n/README.md](frontend-correccion-automatica-n8n/README.md) |
| **n8n Flujos** | [n8n-workflows/README.md](n8n-workflows/README.md) - Webhooks y configuración |
| **Scripts** | [scripts/README.md](scripts/README.md) - Scripts de utilidad |

---

## Flujo General del Sistema

### 1. Administrador crea una rubrica desde PDF

```
Admin Panel -> Upload PDF -> n8n /rubrica -> Gemini analiza PDF
-> Genera JSON estructurado -> Guarda en MongoDB
```

### 2. Profesor corrige una entrega

```
UserView -> Selecciona universidad/materia/rubrica
-> Sube archivo alumno -> n8n /corregir -> Gemini evalua
-> Devuelve nota + feedback -> Muestra en UI
```

### 3. Profesor sube resultados a planilla

```
UserView -> Completa datos planilla -> n8n /spreadsheet
-> Google Sheets API -> Escribe fila con resultados
```

### 4. Correccion batch de toda una comision

```
UserView -> Sube ZIP con todas las entregas -> n8n /automatico
-> Procesa todas en lote -> Sube todas a Sheets
-> Genera reporte consolidado
```

---

## 🆕 Refactorización Drive → MongoDB (Diciembre 2025)

### ✅ Cambios Implementados

El sistema fue completamente refactorizado para **eliminar dependencias de Google Drive y Google Sheets**, simplificando la arquitectura y mejorando la portabilidad.

#### **Backend - Eliminaciones**
- ❌ `driveService.js` - Servicio de Google Drive (ELIMINADO)
- ❌ Endpoints de creación de carpetas en Drive (universidad, facultad, carrera, curso, comisión)
- ❌ Endpoint `PUT /api/rubrics/:rubricId/spreadsheet` (configuración de planillas)
- ❌ Función `updateRubricSpreadsheet()` en rubricController
- ❌ Función `fixRubricDriveFolder()` en rubricController
- ❌ Variables `.env` obsoletas (15+ variables de webhooks de Drive eliminadas)

#### **Backend - Nuevas Funcionalidades**
- ✅ `fileStorageService.js` - Almacenamiento local en `backend/uploads/submissions/`
- ✅ `devolutionPdfService.js` - Generación de PDFs con PDFKit
- ✅ Endpoint `POST /api/commissions/:commissionId/rubrics/:rubricId/batch-devolution-pdfs` (genera ZIP con PDFs)
- ✅ Función `generateBatchDevolutionPdfsFromMongo()` - Batch de PDFs desde MongoDB
- ✅ Modelo `Submission` refactorizado:
  - Campos nuevos: `file_path`, `file_storage_type`, `file_mime_type`
  - Campos eliminados: `drive_file_id`, `drive_file_url`, `student_folder_id`
- ✅ Modelo `Rubric` limpio:
  - Campos eliminados: `spreadsheet_file_id`, `spreadsheet_file_url`, `drive_folder_id`
- ✅ Script `seedDatabase.js` optimizado (de ~5 min a ~10 seg)

#### **Frontend - Eliminaciones**
- ❌ `ConfigureSpreadsheetModal.tsx` (ELIMINADO)
- ❌ Botón "Configurar planilla"
- ❌ Botón "Ver en Drive"
- ❌ Indicadores de estado de planilla (✅/⚠️)
- ❌ Función `updateSpreadsheet()` en rubricService
- ❌ Variable `VITE_SPREADSHEET_WEBHOOK_URL` (marcada obsoleta)

#### **Frontend - Mejoras**
- ✅ `ProfessorView.tsx` simplificado (sin referencias a spreadsheet)
- ✅ `SubmissionsList.tsx` limpio (solo MongoDB)
- ✅ Botón "📄 PDFs Devolución" usa nuevo endpoint MongoDB

### ⚠️ Archivos Mantenidos Temporalmente

Los siguientes archivos **se mantienen temporalmente** para comparación y testing. **DEBERÁN SER ELIMINADOS** después de verificar que la generación de PDFs desde MongoDB funciona correctamente:

#### **Para Eliminar Después de Testing:**

1. **`backend/src/services/nodeDevolutionService.js`**
   - Servicio antiguo que usaba Google Sheets + Python para PDFs
   - **Reemplazado por**: `devolutionPdfService.js`
   - **Acción**: Eliminar cuando se confirme que `generateBatchDevolutionPdfsFromMongo()` funciona

2. **`backend/src/services/nodeSimilarityReportService.js`**
   - Servicio antiguo para reportes de similitud desde Sheets
   - **Acción**: Eliminar si se confirma que no se usa más

3. **`backend/src/controllers/devolutionController.js` - Funciones:**
   - `downloadBatchDevolutionPdfs()` (líneas 110-167)
   - `downloadStudentDevolutionPdf()` (líneas 173-224)
   - **Reemplazadas por**: `generateBatchDevolutionPdfsFromMongo()`
   - **Acción**: Eliminar estas funciones después de testing

4. **Endpoint obsoleto (marcado):**
   - `POST /api/commissions/:commissionId/rubrics/:rubricId/generate-devolution-pdfs`
   - **Reemplazado por**: `/batch-devolution-pdfs`
   - **Acción**: Eliminar ruta en `commissionRoutes.js`

### 📝 Plan de Limpieza Post-Testing

```bash
# 1. Testing (hacer primero):
# - Probar generación de PDF individual: GET /api/submissions/{id}/devolution-pdf
# - Probar generación batch: POST /api/commissions/{commissionId}/rubrics/{rubricId}/batch-devolution-pdfs
# - Verificar que los PDFs se generen correctamente desde MongoDB

# 2. Si el testing es exitoso, eliminar:
rm backend/src/services/nodeDevolutionService.js
rm backend/src/services/nodeSimilarityReportService.js

# 3. Editar backend/src/controllers/devolutionController.js:
# - Eliminar funciones: downloadBatchDevolutionPdfs, downloadStudentDevolutionPdf
# - Eliminar helpers: getRubricWithSpreadsheet, resolveSheetId

# 4. Editar backend/src/routes/commissionRoutes.js:
# - Eliminar endpoint obsoleto: POST .../generate-devolution-pdfs
# - Eliminar imports relacionados

# 5. Actualizar exports en devolutionController.js
```

### 🎯 Beneficios de la Refactorización

| Aspecto | Antes (Drive + Sheets) | Ahora (MongoDB + Local) |
|---------|----------------------|-------------------------|
| **Setup** | Configurar OAuth2, Drive API, Sheets API, n8n workflows | Solo MongoDB + archiver |
| **Seed Time** | ~5 minutos (creaba carpetas en Drive) | ~10 segundos |
| **Dependencias** | Google Drive, Sheets, Python, n8n | Solo MongoDB, PDFKit |
| **Complejidad** | 15+ webhooks de n8n | 2 webhooks (solo IA) |
| **Storage** | Drive (requiere internet) | Local (funciona offline) |
| **Portabilidad** | Baja (atado a cuenta Google) | Alta (funciona en cualquier servidor) |
| **Costo** | Cuotas API de Google | Sin costos adicionales |

---

## Estado del Proyecto

### Fases Completadas

| Fase | Estado | Progreso | Fecha |
|------|--------|----------|-------|
| **Fase 1**: Backend - CRUD completo | Completada | 100% | 21/10/2024 |
| **Fase 2**: Frontend - Componentes base | Completada | 100% | 21/10/2024 |
| **Fase 3**: Admin Panel + UserView | Completada | 100% | 21/10/2024 |
| **Fase 3.5**: CRUD de Usuarios | Completada | 100% | 22/10/2024 |
| **Fase 10**: Backend - Sistema Multi-tenant Jerárquico | Completada | 100% | Nov 2025 |
| **Fase 11**: Backend - Controllers y Rutas | Completada | 100% | Nov 2025 |
| **Fase 12**: Frontend - Permisos y Filtros Dinámicos | Completada | 100% | Nov 2025 |
| **Fase 13**: Seguridad - Cambio de Contraseña Obligatorio | Completada | 100% | Nov 2025 |
| **Fase 14**: Seguridad - Desactivar Registro Público | Completada | 100% | Nov 2025 |
| **Fase 15**: Testing Multi-tenant | Pendiente | 0% | - |
| **Fase 16**: Frontend - Vistas Específicas por Rol | Completada | 100% | Nov 2025 |
| **Fase 17**: Documentación y Deploy | Pendiente | 0% | - |
| **Refactorización Drive → MongoDB** | Completada | 95% | Dic 2025 |

**Progreso total**: ~90% (FASES 1-14, 16, Refactorización completadas; Fases 15, 17 pendientes)

### Funcionalidades Implementadas

- ✅ Sistema de autenticación JWT con roles jerárquicos multi-tenant
- ✅ Cambio de contraseña obligatorio en primer login
- ✅ Registro público desactivado (solo admins)
- ✅ CRUD de Universidades, Facultades, Carreras, Cursos y Comisiones
- ✅ CRUD de Rúbricas (JSON + PDF con IA)
- ✅ CRUD de Usuarios con roles jerárquicos
- ✅ Permisos y filtros dinámicos según rol del usuario
- ✅ Vistas específicas por rol (professor-admin, faculty-admin)
- ✅ Layout subordinado para professor-admin (selector de materia → tabs)
- ✅ Paneles informativos en modales para datos jerárquicos
- ✅ Auto-filtrado de datos según contexto del usuario
- ✅ Generación de rúbricas desde PDF con Gemini AI
- ✅ Corrección automática de entregas con IA
- ✅ **Almacenamiento local de archivos** (backend/uploads/submissions/)
- ✅ **Generación de PDFs de devolución desde MongoDB**
- ✅ **Generación batch de PDFs (ZIP)** sin Google Sheets
- ✅ Corrección batch de múltiples entregas
- ✅ Consolidador de proyectos
- ✅ Soft delete en todos los modelos
- ✅ Sistema completamente independiente de Google Drive/Sheets

### Proximos Pasos (Fase 4)

- [ ] Testing end-to-end completo
- [ ] Optimizaciones de performance
- [ ] Mejoras de UX/UI segun feedback
- [ ] Manejo avanzado de errores
- [ ] Documentacion de deploy a produccion
- [ ] Configuracion de CI/CD
- [ ] Monitoreo y logs

---

## Capturas de Pantalla

### Login
- Pantalla de autenticacion con credenciales de prueba
- Diseño dark theme con gradientes

### Admin Panel
- **Tab Universidades**: Tabla + CRUD completo
- **Tab Materias**: Filtros + gestion por universidad
- **Tab Rubricas**: Creacion desde PDF/JSON, visualizacion, descarga
- **Tab Usuarios**: Gestion completa con soft delete

### User View
- **Seccion 1**: Seleccion de contexto academico (cascada de selects)
- **Seccion 2**: Correccion con visualizacion de resultados
- **Seccion 3**: Configuracion y subida a Google Sheets

---

## Configuracion Avanzada

### Variables de Entorno

#### Backend (`backend/.env`)
```env
# Base de datos
MONGODB_URI=mongodb://localhost:27017/correcion-automatica

# Servidor
PORT=5000
NODE_ENV=development

# Autenticación JWT
JWT_SECRET=tu-secret-super-seguro
JWT_EXPIRES_IN=7d

# Encriptación
ENCRYPTION_KEY=tu-encryption-key-de-64-caracteres-hex

# n8n Webhooks (Solo para IA)
N8N_RUBRIC_WEBHOOK_URL=https://tu-n8n.cloud/webhook/rubrica
N8N_GRADING_WEBHOOK_URL=https://tu-n8n.cloud/webhook/corregir

# CORS
CORS_ORIGIN=http://localhost:5173
```

#### Frontend (`frontend/.env`)
```env
# Backend API
VITE_API_URL=http://localhost:5000

# n8n Webhooks (Solo para IA)
VITE_RUBRIC_WEBHOOK_URL=https://tu-n8n.cloud/webhook/rubric
VITE_GRADING_WEBHOOK_URL=https://tu-n8n.cloud/webhook/grading
VITE_BATCH_GRADING_WEBHOOK_URL=https://tu-n8n.cloud/webhook/batch-grading

# OBSOLETO - Google Sheets (Ya no se usa)
# VITE_SPREADSHEET_WEBHOOK_URL ya no es necesario
```

#### n8n (variables de entorno o settings)
```env
GOOGLE_GEMINI_API_KEY=tu-api-key
GOOGLE_DRIVE_ROOT_FOLDER_ID=id-de-carpeta-raiz
```

---

## Testing

### Backend
```bash
cd proyecto-correccion/backend

# Ejecutar seed para datos de prueba
npm run seed

# Testing manual con Thunder Client/Postman
# Ver: GUIA_TESTING.md
```

### Frontend
```bash
cd proyecto-correccion/frontend-correccion-automatica-n8n

# Desarrollo con hot-reload
npm run dev

# Build de produccion
npm run build

# Testing manual
# Ver: GUIA_PRUEBAS.md
```

### Flujos de n8n
```bash
# Testing de webhooks
# Ver: n8n-workflows/README.md seccion "Testing"
```

---

## Deploy a Produccion

### Frontend (Vercel/Netlify)
```bash
cd proyecto-correccion/frontend-correccion-automatica-n8n
npm run build
# Deploy carpeta dist/
```

### Backend (Railway/Render/Heroku)
```bash
cd proyecto-correccion/backend
# Configurar variables de entorno en plataforma
# Deploy desde repositorio Git
```

### n8n (n8n Cloud o Self-Hosted)
- Importar flujos desde `n8n-workflows/workflows-en-un-archivo.json` (o flujos separados)
- Configurar credenciales de Google
- Activar workflows

### MongoDB (MongoDB Atlas)
- Crear cluster gratuito
- Configurar IP Whitelist
- Obtener connection string
- Actualizar `MONGODB_URI` en backend

---

## Troubleshooting

### Backend no conecta con MongoDB
```bash
# Verificar que MongoDB este corriendo
mongosh

# O iniciar MongoDB
mongod
```

### Frontend no conecta con backend
```bash
# Verificar que backend este corriendo
curl http://localhost:5000/health

# Verificar VITE_API_URL en .env del frontend
```

### n8n webhooks no responden
- Verificar que workflows esten activados
- Verificar credenciales de Google
- Revisar logs de ejecucion en n8n

### Error al generar rubrica desde PDF
- Verificar API key de Google Gemini
- Verificar formato del PDF (maximo 10 paginas)
- Revisar logs del workflow en n8n

### Problemas con el Seed

#### El seed falla con errores de Drive
**Problema:** Al ejecutar `npm run seed`, aparecen errores relacionados con Google Drive o n8n.

**Soluciones:**
1. Verificar que n8n esté corriendo: `curl http://localhost:5678`
2. Verificar que los 5 workflows de creación de carpetas estén activos en n8n
3. Verificar las URLs de webhooks en `.env`:
   ```bash
   # Deben apuntar a tu instancia de n8n
   N8N_CREATE_UNIVERSITY_FOLDER_WEBHOOK=http://localhost:5678/webhook/...
   ```
4. Verificar credenciales de Google Drive OAuth2 en n8n
5. Verificar que `GOOGLE_DRIVE_ROOT_FOLDER_ID` esté configurado en n8n

**Alternativa:** Si solo necesitas datos de prueba en MongoDB sin Drive:
```bash
# En backend/.env, cambiar:
SEED_CREATE_DRIVE_FOLDERS=false
```

#### El seed crea carpetas duplicadas en Drive
**Problema:** Al ejecutar el seed varias veces, se crean carpetas duplicadas en Google Drive.

**Solución:**
- Limpiar manualmente las carpetas en Google Drive antes de re-ejecutar el seed
- O eliminar la carpeta raíz completa y volver a crearla
- Los workflows de n8n actuales no verifican si la carpeta ya existe

#### El seed es muy lento
**Problema:** El seed tarda más de 10 minutos en completarse.

**Causas posibles:**
- Red lenta o Google Drive con alta latencia
- Timeouts configurados muy altos en driveService.js
- Demasiadas carpetas creándose simultáneamente

**Solución:**
- Verificar conexión a internet
- Revisar logs de n8n para identificar qué está tardando
- Considerar ejecutar el seed sin Drive (`SEED_CREATE_DRIVE_FOLDERS=false`) y crear carpetas manualmente después

#### El seed falla a mitad de camino
**Problema:** El seed se detiene con error después de crear algunas entidades.

**Solución:**
- Revisar logs para identificar en qué fase falló
- Limpiar MongoDB: `mongosh` → `use correcion-automatica` → `db.dropDatabase()`
- Limpiar carpetas creadas en Drive (si las hay)
- Corregir el problema identificado en los logs
- Volver a ejecutar `npm run seed`

Para más detalles, ver: `docs/TROUBLESHOOTING.md`

---

## Contribuciones

Este es un proyecto academico/educativo. Si deseas contribuir:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## Licencia

Este proyecto se publica sin licencia especifica. Consulta con los autores para uso comercial.

---

## Creditos

### Desarrolladores
- Proyecto desarrollado como sistema de correccion automatica academica

### Tecnologias Utilizadas
- **Google Gemini AI** - Modelo de inteligencia artificial
- **n8n** - Workflow automation platform
- **React** - Framework frontend por Meta
- **Express** - Framework backend por OpenJS Foundation
- **MongoDB** - Base de datos NoSQL
- **Tailwind CSS** - Framework CSS utility-first

### Agradecimientos
- Comunidad de n8n por la documentacion
- Google AI por Gemini API
- Stack Overflow y GitHub por recursos

---

## Soporte y Contacto

Para problemas, sugerencias o consultas:

- **Documentacion**: Ver archivos README en cada carpeta
- **Guias**: `GUIA_PRUEBAS.md`, `GUIA_TESTING.md`
- **Issues**: Reportar en el repositorio
- **Email**: [Agregar email de contacto]

---

## Enlaces Utiles

- [Google Gemini API](https://ai.google.dev/docs)
- [n8n Documentation](https://docs.n8n.io/)
- [React Documentation](https://react.dev/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express Documentation](https://expressjs.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Última actualización**: Diciembre 2025
**Versión**: 2.0 (Refactorización MongoDB)
**Estado**: En desarrollo (~90% completado - FASES 1-14, 16 + Refactorización)
