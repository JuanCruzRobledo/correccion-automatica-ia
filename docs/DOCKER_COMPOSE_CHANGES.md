# Cambios en docker-compose.yml - Migración a MongoDB

**Fecha**: 2025-12-15
**Versión**: Post-Refactorización MongoDB

## Resumen

El `docker-compose.yml` ha sido actualizado para eliminar todas las dependencias obsoletas de Google Drive y Google Sheets, reflejando la migración completa a MongoDB como fuente de verdad única.

## Cambios Realizados

### 1. Variables de Entorno ELIMINADAS

Las siguientes variables de entorno fueron **eliminadas del servicio backend** por ser obsoletas:

#### Webhooks de Google Sheets (ya no se usan)
```yaml
# ELIMINADO - Ya no usamos Google Sheets
N8N_SPREADSHEET_WEBHOOK_URL: http://n8n:5678/webhook/spreadsheet
N8N_WEBHOOK_GET_CORRECTIONS: http://n8n:5678/webhook/get-student-corrections
```

#### Webhooks de Creación de Carpetas Drive (ya no se usan)
```yaml
# ELIMINADO - Ya no creamos estructura de carpetas en Drive
SEED_CREATE_DRIVE_FOLDERS: "true"
N8N_CREATE_UNIVERSITY_FOLDER_WEBHOOK: http://n8n:5678/webhook/create-university-folder
N8N_CREATE_FACULTY_FOLDER_WEBHOOK: http://n8n:5678/webhook/create-faculty-folder
N8N_CREATE_CAREER_FOLDER_WEBHOOK: http://n8n:5678/webhook/create-career-folder
N8N_CREATE_COURSE_FOLDER_WEBHOOK: http://n8n:5678/webhook/create-course-folder
N8N_CREATE_COMMISSION_FOLDER_WEBHOOK: http://n8n:5678/webhook/create-commission-folder
N8N_CREATE_SUBMISSION_FOLDER_WEBHOOK: http://n8n:5678/webhook/create-submission-folder
```

**Total eliminadas**: 9 variables obsoletas

### 2. Variables de Entorno MODIFICADAS

#### Webhook de Corrección Masiva
```yaml
# ANTES
N8N_BATCH_GRADING_WEBHOOK_URL: http://n8n:5678/webhook/automatico

# AHORA
N8N_BATCH_GRADING_WEBHOOK_URL: http://n8n:5678/webhook/automatico-mongodb
```

**Razón**: Ahora apunta al nuevo flujo MongoDB que lee/escribe desde la base de datos en lugar de Drive/Sheets.

### 3. Variables de Entorno AGREGADAS

#### Almacenamiento Local de Archivos
```yaml
# Nuevas variables para almacenamiento de archivos de entregas
FILE_STORAGE_TYPE: ${FILE_STORAGE_TYPE:-local}
UPLOAD_MAX_SIZE: ${UPLOAD_MAX_SIZE:-50000000}
UPLOAD_PATH: ${UPLOAD_PATH:-./uploads}
```

**Razón**: Los archivos de entregas ahora se guardan en el filesystem local del backend en lugar de Google Drive.

### 4. Volúmenes AGREGADOS

#### Volumen para Persistencia de Uploads
```yaml
# En la sección backend.volumes
volumes:
  - ./backend:/app
  - /app/node_modules
  - backend_uploads:/app/uploads  # NUEVO

# En la sección volumes (al final del archivo)
volumes:
  backend_uploads:
    driver: local
    name: correcion_backend_uploads
```

**Razón**: Persistir los archivos de entregas entre reinicios de containers.

### 5. Build Args del Frontend MODIFICADOS

```yaml
# ANTES
args:
  VITE_API_URL: http://localhost:${BACKEND_PORT:-5000}
  VITE_RUBRIC_WEBHOOK_URL: http://localhost:${N8N_PORT:-5678}/webhook/rubrica
  VITE_GRADING_WEBHOOK_URL: http://localhost:${N8N_PORT:-5678}/webhook/corregir
  VITE_SPREADSHEET_WEBHOOK_URL: http://localhost:${N8N_PORT:-5678}/webhook/spreadsheet  # ELIMINADO
  VITE_BATCH_GRADING_WEBHOOK_URL: http://localhost:${N8N_PORT:-5678}/webhook/automatico  # MODIFICADO

# AHORA
args:
  VITE_API_URL: http://localhost:${BACKEND_PORT:-5000}
  VITE_RUBRIC_WEBHOOK_URL: http://localhost:${N8N_PORT:-5678}/webhook/rubrica
  VITE_GRADING_WEBHOOK_URL: http://localhost:${N8N_PORT:-5678}/webhook/corregir
  VITE_BATCH_GRADING_WEBHOOK_URL: http://localhost:${N8N_PORT:-5678}/webhook/automatico-mongodb
```

**Cambios**:
- ❌ Eliminado `VITE_SPREADSHEET_WEBHOOK_URL` (ya no se usa)
- ✏️ Modificado `VITE_BATCH_GRADING_WEBHOOK_URL` para apuntar a webhook MongoDB

### 6. Comentarios Actualizados

```yaml
# ANTES
# Stack completo: Backend + Frontend + N8N
# Base de datos: MongoDB Atlas (en la nube)

# AHORA
# Stack completo: Backend + Frontend + N8N
# Base de datos: MongoDB Atlas (fuente de verdad única)
# Almacenamiento: Filesystem local (backend/uploads/)
# N8N: Solo para corrección automática con Gemini AI
```

**Razón**: Clarificar la nueva arquitectura sin dependencias de Drive/Sheets.

## Variables que SE MANTIENEN

Las siguientes variables de n8n **se mantienen** porque aún se usan:

```yaml
# Generación de rúbrica desde PDF con Gemini
N8N_RUBRIC_WEBHOOK_URL: http://n8n:5678/webhook/rubrica

# Corrección individual con Gemini
N8N_GRADING_WEBHOOK_URL: http://n8n:5678/webhook/corregir

# Corrección masiva (ahora con MongoDB)
N8N_BATCH_GRADING_WEBHOOK_URL: http://n8n:5678/webhook/automatico-mongodb
```

## Impacto en .env.example

El archivo `.env.example` también fue actualizado con las nuevas variables:

```bash
# ============================================
# BACKEND - ALMACENAMIENTO DE ARCHIVOS
# ============================================
FILE_STORAGE_TYPE=local
UPLOAD_MAX_SIZE=50000000
UPLOAD_PATH=./uploads
```

## Flujo de Datos Actualizado

### Antes (Sistema con Drive/Sheets)
```
Usuario → Backend → n8n → Google Drive (archivos)
                    ↓
                  Google Sheets (correcciones)
                    ↓
                  MongoDB (metadata parcial)
```

### Ahora (Sistema solo MongoDB)
```
Usuario → Backend → MongoDB (fuente de verdad)
          ↓           ↓
      Filesystem   n8n (solo corrección Gemini)
     (archivos)
```

## Servicios n8n Afectados

### Workflows que YA NO SE USAN
- ❌ Creación de carpetas Drive (todos los flujos de carpetas)
- ❌ Creación/actualización de Google Sheets
- ❌ Subida de archivos a Drive
- ❌ Lectura de correcciones desde Sheets

### Workflows que SÍ SE USAN (refactorizados)
- ✅ `flujo-correcion-automatica-mongodb.json` - Principal (nuevo)
- ✅ `flujo-correcion-masiva-mongodb.json` - Secundario (nuevo)
- ✅ Generación de rúbrica desde PDF (sin cambios)

## Verificación Post-Cambios

Para verificar que todo funciona correctamente:

1. **Ejecutar Docker Compose**:
   ```bash
   docker-compose down -v
   docker-compose up --build
   ```

2. **Verificar variables de entorno**:
   ```bash
   docker exec correcion-backend env | grep N8N
   docker exec correcion-backend env | grep FILE_STORAGE
   docker exec correcion-backend env | grep UPLOAD
   ```

3. **Verificar que no haya referencias a variables obsoletas**:
   ```bash
   # No debería encontrar nada
   docker exec correcion-backend env | grep SPREADSHEET
   docker exec correcion-backend env | grep CREATE_
   docker exec correcion-backend env | grep GET_CORRECTIONS
   ```

4. **Verificar volumen de uploads**:
   ```bash
   docker volume ls | grep correcion_backend_uploads
   ```

## Notas Importantes

1. **Retrocompatibilidad**: Las submissions antiguas que tienen `drive_file_id` siguen siendo válidas pero ya no se usan.

2. **Limpieza de Datos**: Los campos `drive_folder_id`, `spreadsheet_file_id` en modelos antiguos pueden quedar en null.

3. **Migración Gradual**: Si hay datos históricos en Drive/Sheets que se quieran conservar, usar los scripts de migración documentados en el plan.

4. **Webhooks de n8n**: Asegurarse de que los workflows en n8n estén importados y activos antes de iniciar el sistema.

5. **Persistencia**: El volumen `backend_uploads` debe hacerse backup regularmente si se usa en producción.

## Referencias

- Plan de migración: `docs/plans/PLAN_MIGRACION_DRIVE_A_MONGODB.md`
- Flujos n8n nuevos: `n8n-workflows/README-MONGODB-MIGRATION.md`
- Variables de entorno: `.env.example`

## Changelog

| Fecha | Versión | Cambios |
|-------|---------|---------|
| 2025-12-15 | v2.0 | Migración completa a MongoDB, eliminación de dependencias Drive/Sheets |
| 2025-12-12 | v1.5 | Inicio de refactorización |
