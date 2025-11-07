# Sistema de Correccion Automatica con IA

Sistema completo de correccion automatica de entregas academicas utilizando Inteligencia Artificial (Google Gemini), con panel de administracion, gestion de rubricas y automatizacion de flujos con n8n.

---

## Tabla de Contenidos

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

## Descripcion General

Sistema integral para **automatizar la correccion de trabajos practicos, parciales y finales** en entornos academicos universitarios. Utiliza **Google Gemini AI** para evaluar codigo, documentos y entregas de alumnos segun rubricas personalizadas.

### Problema que resuelve

- **Ahorra tiempo**: Corrige automaticamente entregas de alumnos en segundos
- **Consistencia**: Aplica los mismos criterios de evaluacion a todos los alumnos
- **Rubricas desde PDF**: Genera automaticamente rubricas estructuradas desde consignas en PDF
- **Automatizacion**: Integra con Google Sheets para registro automatico de notas
- **Feedback detallado**: Proporciona resumen por criterios, fortalezas y recomendaciones

### Para quien es?

- **Docentes universitarios**: Que necesitan corregir multiples entregas
- **Catedras**: Con muchos alumnos y multiples comisiones
- **Instituciones educativas**: Que buscan estandarizar evaluaciones

---

## Caracteristicas Principales

### Sistema de Autenticacion y Roles
- Login con JWT (JSON Web Tokens)
- **Roles**: Administrador y Usuario normal
- Proteccion de rutas segun permisos

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

### Integracion con Google Sheets
- Subida automatica de resultados
- Registro de notas por alumno
- Historial de evaluaciones

### Correccion Batch
- Procesa multiples entregas simultaneamente
- Sube resultados automaticamente
- Genera reporte consolidado

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
|  | Login (JWT)  |  |  Admin Panel |  |   User View     |    |
|  |              |  |  (4 CRUD)    |  |   (Correccion)  |    |
|  +--------------+  +--------------+  +-----------------+    |
+-------------------------------------------------------------+
                           |  ^
                    HTTP REST API
                           v  |
+-------------------------------------------------------------+
|                        BACKEND                              |
|              Node.js + Express + MongoDB                    |
|                                                             |
|  +--------------+  +--------------+  +-----------------+    |
|  | Auth (JWT)   |  |  CRUD APIs   |  |  n8n Service    |    |
|  |              |  |  (4 modelos) |  |  (Webhooks)     |    |
|  +--------------+  +--------------+  +-----------------+    |
+-------------------------------------------------------------+
                           |  ^
                        MongoDB
                           v  |
+-------------------------------------------------------------+
|  Universities    Courses    Rubrics    Users               |
+-------------------------------------------------------------+
                           |
                      Webhooks HTTP
                           v
+-------------------------------------------------------------+
|                         n8n WORKFLOWS                       |
|                                                             |
|  Webhook /rubrica    -> Google Gemini -> Genera rubrica    |
|  Webhook /corregir   -> Google Gemini -> Evalua entrega    |
|  Webhook /spreadsheet -> Google Sheets -> Sube resultados  |
|  Webhook /automatico -> Batch processing -> Correccion     |
+-------------------------------------------------------------+
                           |  ^
                   +------------------+
                   |  Google Services |
                   |                  |
                   |  - Gemini AI     |
                   |  - Sheets API    |
                   |  - Drive API     |
                   +------------------+
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
- **n8n** - Workflow automation
- **Google Gemini 2.5 Flash** - Modelo de IA para correccion
- **Google Sheets API** - Registro de notas
- **Google Drive API** - Almacenamiento de archivos

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
- **n8n** (self-hosted o cloud)
- **Cuenta de Google Cloud** (para Gemini API)

### 1. Clonar el Repositorio

```bash
git clone <URL-del-repositorio>
cd correcion-automatica
```

### 2. Configurar Backend

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

# Ejecutar seed para datos iniciales
npm run seed

# Iniciar backend
npm run dev
```

**Backend corriendo en**: `http://localhost:5000`

### 3. Configurar Frontend

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

### 4. Configurar n8n

```bash
cd n8n-workflows

# Importar flujos en tu instancia de n8n
# Ver: n8n-workflows/README.md para instrucciones detalladas
```

### 5. Acceder al Sistema

**Credenciales por defecto** (despues de ejecutar seed):

- **Admin**:
  - Usuario: `admin`
  - Contraseña: `admin123`

- **Usuario normal**:
  - Usuario: `usuario`
  - Contraseña: `usuario123`

**URLs**:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`
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

### Guias Principales

| Documento | Descripcion | Ubicacion |
|-----------|-------------|-----------|
| **README.md** | Documentacion general del proyecto | Este archivo |
| **PROYECTO_PLAN.md** | Plan detallado de desarrollo, fases completadas | Raiz |
| **GUIA_PRUEBAS.md** | Guia paso a paso para probar el sistema | Raiz |
| **GUIA_TESTING.md** | Testing tecnico de endpoints | Raiz |

### Documentacion por Componente

| Componente | Documentacion | Ubicacion |
|------------|---------------|-----------|
| **Backend** | API REST, endpoints, modelos | `proyecto-correccion/backend/README.md` |
| **Frontend** | Componentes, flujos de usuario, setup | `proyecto-correccion/frontend-*/README.md` |
| **n8n Flujos** | Webhooks, configuracion, troubleshooting | `n8n-workflows/README.md` |
| **Consolidador** | Herramienta de consolidacion de proyectos | `proyecto-correccion/CONSOLIDATOR_README.md` |

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

## Estado del Proyecto

### Fases Completadas

| Fase | Estado | Progreso | Fecha |
|------|--------|----------|-------|
| **Fase 1**: Backend - CRUD completo | Completada | 100% | 21/10/2025 |
| **Fase 2**: Frontend - Componentes base | Completada | 100% | 21/10/2025 |
| **Fase 3**: Admin Panel + UserView | Completada | 100% | 21/10/2025 |
| **Fase 3.5**: CRUD de Usuarios | Completada | 100% | 22/10/2025 |
| **Fase 4**: Integracion y Testing | Pendiente | 0% | - |

**Progreso total**: 83% (29/35 tareas completadas)

### Funcionalidades Implementadas

- Sistema de autenticacion JWT con roles
- CRUD de Universidades
- CRUD de Materias/Cursos
- CRUD de Rubricas (JSON + PDF con IA)
- CRUD de Usuarios (con soft delete y restauracion)
- Generacion de rubricas desde PDF con Gemini AI
- Correccion automatica de entregas con IA
- Subida de resultados a Google Sheets
- Correccion batch de multiples entregas
- Consolidador de proyectos
- Soft delete en todos los modelos
- Integracion completa Frontend - Backend - n8n

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
MONGODB_URI=mongodb://localhost:27017/correcion-automatica
PORT=5000
JWT_SECRET=tu-secret-super-seguro
JWT_EXPIRES_IN=7d
N8N_RUBRIC_WEBHOOK_URL=https://tu-n8n.cloud/webhook/rubrica
N8N_GRADING_WEBHOOK_URL=https://tu-n8n.cloud/webhook/corregir
N8N_SPREADSHEET_WEBHOOK_URL=https://tu-n8n.cloud/webhook/spreadsheet
CORS_ORIGIN=http://localhost:5173
```

#### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000
VITE_N8N_GRADING_WEBHOOK=https://tu-n8n.cloud/webhook/corregir
VITE_N8N_SPREADSHEET_WEBHOOK=https://tu-n8n.cloud/webhook/spreadsheet
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

**Ultima actualizacion**: Noviembre 2025
**Version**: 1.0
**Estado**: En desarrollo (83% completado)
