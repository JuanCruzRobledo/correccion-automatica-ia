# 🚀 Guía de Configuración y Despliegue

## Sistema de Corrección Automática Multi-Tenant

Esta guía te ayudará a configurar y desplegar el sistema completo desde cero.

---

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Configuración del Backend](#configuración-del-backend)
3. [Configuración del Frontend](#configuración-del-frontend)
4. [Configuración de n8n](#configuración-de-n8n)
5. [Configuración de Google Drive](#configuración-de-google-drive)
6. [Seed de Datos](#seed-de-datos)
7. [Inicio del Sistema](#inicio-del-sistema)
8. [Verificación](#verificación)
9. [Troubleshooting](#troubleshooting)

---

## 🔧 Requisitos Previos

### Software Necesario

```bash
# Node.js (v18 o superior)
node --version  # debe ser >= v18.0.0

# npm (v9 o superior)
npm --version   # debe ser >= v9.0.0

# MongoDB (v6 o superior)
mongod --version  # debe ser >= v6.0.0

# Git
git --version
```

### Cuentas Requeridas

- ✅ Cuenta de Google (para Drive y Gemini API)
- ✅ Instancia de n8n (self-hosted o cloud)
- ✅ MongoDB (local o Atlas)

---

## 🗄️ Configuración del Backend

### 1. Clonar el repositorio

```bash
cd backend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env
```

### 4. Editar `.env` con tus credenciales

```bash
# .env

# === SERVER ===
PORT=5000
NODE_ENV=development

# === DATABASE ===
MONGODB_URI=mongodb://localhost:27017/correccion-automatica
# O para MongoDB Atlas:
# MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/correccion-automatica

# === JWT ===
JWT_SECRET=tu-secreto-muy-seguro-cambialo-en-produccion
JWT_EXPIRES_IN=7d

# === ENCRYPTION (para API keys de Gemini) ===
ENCRYPTION_KEY=tu-clave-de-encriptacion-32-caracteres-minimo

# === N8N WEBHOOKS ===
# URLs de tus workflows en n8n (configurar después de activar n8n)
N8N_RUBRIC_WEBHOOK=https://tu-n8n.com/webhook/rubrica
N8N_CORRECT_WEBHOOK=https://tu-n8n.com/webhook/corregir
N8N_SPREADSHEET_WEBHOOK=https://tu-n8n.com/webhook/spreadsheet
N8N_AUTOMATIC_CORRECTION_WEBHOOK=https://tu-n8n.com/webhook/automatico
N8N_UPLOAD_FILE_TO_DRIVE_WEBHOOK=https://tu-n8n.com/webhook/upload-file-to-drive

# === GOOGLE DRIVE (para estructura de carpetas) ===
GOOGLE_DRIVE_ROOT_FOLDER_ID=1abcd1234efgh5678ijkl
# ID de la carpeta raíz en Drive donde se organizarán las universidades

# === WEBHOOKS DE CARPETAS (n8n) ===
N8N_CREATE_UNIVERSITY_FOLDER_WEBHOOK=https://tu-n8n.com/webhook/create-university-folder
N8N_CREATE_FACULTY_FOLDER_WEBHOOK=https://tu-n8n.com/webhook/create-faculty-folder
N8N_CREATE_CAREER_FOLDER_WEBHOOK=https://tu-n8n.com/webhook/create-career-folder
N8N_CREATE_COURSE_FOLDER_WEBHOOK=https://tu-n8n.com/webhook/create-course-folder
N8N_CREATE_COMMISSION_FOLDER_WEBHOOK=https://tu-n8n.com/webhook/create-commission-folder

# === CORS (Frontend URLs permitidas) ===
FRONTEND_URL=http://localhost:5173
# En producción: https://tu-dominio.com
```

### 5. Verificar conexión a MongoDB

```bash
# Si usas MongoDB local
mongod

# En otra terminal
npm run dev

# Deberías ver: "✅ Conectado a MongoDB"
```

---

## ⚛️ Configuración del Frontend

### 1. Ir a la carpeta del frontend

```bash
cd frontend-correccion-automatica-n8n
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env
```

### 4. Editar `.env`

```bash
# .env

# URL del backend
VITE_API_URL=http://localhost:5000

# En producción:
# VITE_API_URL=https://api.tu-dominio.com
```

---

## 🔄 Configuración de n8n

### Opción A: n8n Cloud

1. Ir a https://n8n.io y crear cuenta
2. Crear nuevo workflow
3. Importar workflows desde `n8n-workflows/`

### Opción B: n8n Self-Hosted (Docker)

#### 1. Instalar n8n con Docker

```bash
# Crear volumen para persistencia
docker volume create n8n_data

# Ejecutar n8n
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER=admin \
  -e N8N_BASIC_AUTH_PASSWORD=tu-password-seguro \
  docker.n8n.io/n8nio/n8n
```

#### 2. Acceder a n8n

```bash
# Abrir navegador
http://localhost:5678

# Login con:
# Usuario: admin
# Password: tu-password-seguro
```

### Importar Workflows

#### Método 1: Archivo Consolidado (Rápido)

```bash
# 1. En n8n UI: Settings > Import from File
# 2. Seleccionar: n8n-workflows/workflows-en-un-archivo.json
# 3. Import
```

#### Método 2: Archivos Separados (Producción)

Importar cada workflow individualmente:

```bash
# Workflows de corrección
- flujo_correccion_manual.json
- flujo_correccion_masiva.json

# Workflow de upload (NUEVO)
- upload-file-to-drive.json

# Workflows de carpetas
- create-university-folder.json
- create-faculty-folder.json
- create-career-folder.json
- create-course-folder.json
- create-commission-folder.json
```

### Configurar Credenciales de Google

**Para cada workflow que use Google Drive o Gemini:**

1. Abrir el workflow
2. Click en nodo "Google Drive" o "Google Gemini"
3. Click en "Create New Credential"
4. Seleccionar tipo de credencial:
   - **Google Drive OAuth2 API** (para Drive)
   - **Google Gemini API** (para Gemini)
5. Seguir proceso de OAuth
6. Guardar

### Activar Workflows y Copiar URLs

**Para cada workflow:**

1. Click en toggle "Active" (esquina superior derecha)
2. Click en nodo "Webhook"
3. Copiar URL del webhook
4. Pegar en `.env` del backend en la variable correspondiente

**Ejemplo:**

```bash
# Workflow: upload-file-to-drive
# URL copiada: https://tu-n8n.com/webhook-test/abc123/upload-file-to-drive

# En backend/.env:
N8N_UPLOAD_FILE_TO_DRIVE_WEBHOOK=https://tu-n8n.com/webhook-test/abc123/upload-file-to-drive
```

---

## 📁 Configuración de Google Drive

### 1. Crear Carpeta Raíz

```bash
# 1. Ir a Google Drive
# 2. Crear carpeta: "Sistema Corrección Automática"
# 3. Abrir la carpeta
# 4. Copiar ID de la URL
#    URL: https://drive.google.com/drive/folders/1abcd1234efgh5678ijkl
#    ID: 1abcd1234efgh5678ijkl
# 5. Pegar en backend/.env:
GOOGLE_DRIVE_ROOT_FOLDER_ID=1abcd1234efgh5678ijkl
```

### 2. Compartir con n8n

```bash
# 1. Click derecho en carpeta > Compartir
# 2. Agregar la cuenta de Google usada en n8n
# 3. Dar permisos de "Editor"
```

### 3. Estructura Automática

Las subcarpetas se crean automáticamente cuando:
- Creas una universidad → workflow crea carpeta
- Creas una facultad → workflow crea subcarpeta
- Creas una comisión → workflow crea carpeta + subcarpeta de rúbrica

---

## 🌱 Seed de Datos

### 1. Ejecutar seed multi-tenant

```bash
cd backend
node src/scripts/seedMultiTenant.js
```

### 2. Verificar creación

```bash
# Deberías ver:
✅ Base de datos limpiada
✅ Universidades creadas: UTN, UBA
✅ Usuarios creados: 9 usuarios
✅ Estructuras creadas para UTN y UBA
✅ Profesores asignados a comisiones
✅ Rúbricas creadas

📊 RESUMEN DE DATOS CREADOS:
   Usuarios:      9
   Universidades: 2
   Facultades:    2
   Carreras:      2
   Cursos:        3
   Comisiones:    4
   Rúbricas:      1
```

### 3. Usuarios de prueba creados

```bash
# Super Admin (acceso global)
Usuario: superadmin
Contraseña: admin123

# UTN Admin
Usuario: admin-utn
Contraseña: admin123

# Profesor UTN (María García)
Usuario: prof-garcia
Contraseña: prof123
Comisiones: 1K1, 2K1

# Profesor UTN (Juan López)
Usuario: prof-lopez
Contraseña: prof123
Comisiones: 1K2

# UBA Admin
Usuario: admin-uba
Contraseña: admin123

# Profesor UBA
Usuario: prof-rodriguez
Contraseña: prof123
Comisiones: Comisión 1

# Usuario normal UTN
Usuario: estudiante-utn
Contraseña: user123

# Usuario normal UBA
Usuario: estudiante-uba
Contraseña: user123
```

---

## 🚀 Inicio del Sistema

### Terminal 1: MongoDB

```bash
# Si usas MongoDB local
mongod
```

### Terminal 2: n8n

```bash
# Si usas Docker
docker start n8n

# O si es self-hosted sin Docker
n8n start
```

### Terminal 3: Backend

```bash
cd backend
npm run dev

# Deberías ver:
# ✅ Conectado a MongoDB
# ✅ Servidor corriendo en http://localhost:5000
# ✅ Entorno: development
```

### Terminal 4: Frontend

```bash
cd frontend-correccion-automatica-n8n
npm run dev

# Deberías ver:
# ➜  Local:   http://localhost:5173/
```

---

## ✅ Verificación

### 1. Verificar Backend

```bash
# Test de salud
curl http://localhost:5000/health

# Respuesta esperada:
{
  "status": "ok",
  "mongodb": "connected",
  "timestamp": "2025-11-10T..."
}
```

### 2. Verificar Frontend

```bash
# Abrir navegador
http://localhost:5173

# Deberías ver:
# - Pantalla de login
# - Diseño oscuro con aurora background
```

### 3. Login de prueba

```bash
# 1. Ir a http://localhost:5173/login
# 2. Usuario: superadmin
# 3. Contraseña: admin123
# 4. Login

# Deberías ser redirigido a /admin
# Y ver el Admin Panel
```

### 4. Verificar n8n Workflows

```bash
# 1. Ir a n8n UI: http://localhost:5678
# 2. Verificar que todos los workflows estén "Active"
# 3. Verificar que todos tengan credenciales configuradas (icono verde)
```

---

## 🔍 Troubleshooting

### Backend no inicia

```bash
# Error: Cannot connect to MongoDB
# Solución:
1. Verificar que MongoDB esté corriendo: mongod
2. Verificar MONGODB_URI en .env
3. Si usas Atlas, verificar usuario/password y whitelist IP

# Error: Port 5000 already in use
# Solución:
# Cambiar PORT en .env a otro puerto (ej: 5001)
```

### Frontend no carga

```bash
# Error: Network Error / Cannot connect to backend
# Solución:
1. Verificar que backend esté corriendo
2. Verificar VITE_API_URL en frontend/.env
3. Verificar CORS en backend/.env (FRONTEND_URL)

# Error: Página en blanco
# Solución:
# Limpiar caché y recargar: Ctrl+Shift+R
```

### n8n Workflows no funcionan

```bash
# Error: Webhook returns 404
# Solución:
1. Verificar que workflow esté "Active"
2. Copiar URL del webhook nuevamente
3. Actualizar .env del backend
4. Reiniciar backend

# Error: Google Drive unauthorized
# Solución:
1. Ir a n8n > Credentials
2. Encontrar "Google Drive OAuth2 API"
3. Click en "Reconnect"
4. Completar OAuth nuevamente
```

### Seed falla

```bash
# Error: Duplicate key error
# Solución:
# Ya hay datos en la BD. Limpiar primero:
mongo
> use correccion-automatica
> db.dropDatabase()
> exit
# Luego ejecutar seed nuevamente

# Error: Cannot find module
# Solución:
cd backend
npm install
node src/scripts/seedMultiTenant.js
```

---

## 📚 Próximos Pasos

Una vez configurado todo:

1. ✅ Leer `GUIA_TESTING.md` para probar el sistema
2. ✅ Revisar `n8n-workflows/UPLOAD_FILE_WORKFLOW.md` para detalles del upload
3. ✅ Crear carpetas manualmente en Drive para las rúbricas (`drive_folder_id`)
4. ✅ Probar flujo completo: Crear usuario → Asignar profesor → Subir entrega

---

## 🔐 Seguridad en Producción

### Variables sensibles

```bash
# Cambiar en producción:
JWT_SECRET=usar-generador-de-secretos-seguros
ENCRYPTION_KEY=32-caracteres-minimo-aleatorios

# Generar secretos seguros:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### CORS

```bash
# Actualizar en backend/.env
FRONTEND_URL=https://tu-dominio-produccion.com
```

### HTTPS

```bash
# Usar certificados SSL
# Configurar reverse proxy (nginx/Apache)
# O usar servicios como Vercel/Netlify (frontend) y Railway/Render (backend)
```

---

## 🆘 Soporte

Si tienes problemas:

1. Revisar logs del backend: `backend/logs/`
2. Revisar consola del navegador (F12)
3. Revisar ejecuciones de n8n workflows
4. Consultar documentación específica en carpeta `docs/`
