# 📋 PLAN DE REFACTORIZACIÓN V3 - Sistema Multi-Tenant con Rol de Profesor

**Versión:** 3.0
**Fecha:** Noviembre 2025
**Tipo:** Guía orientada a tareas (NO código completo)
**Duración estimada:** 25-35 días (~5-7 semanas)

---

## 🎯 OBJETIVOS PRINCIPALES

### Funcionalidades a Implementar

1. **Sistema Multi-Tenant**
   - `super-admin`: Acceso global a todas las universidades
   - `university-admin`: Solo acceso a SU universidad (actual rol `admin`)
   - Agregar campo `university_id` a usuarios

2. **Nuevo Rol de Profesor**
   - Rol `professor` con acceso a comisiones asignadas
   - Puede subir entregas de alumnos (archivos .txt del consolidador)
   - Gestiona sus propias comisiones

3. **Subida de Entregas de Alumnos**
   - Profesor sube archivos .txt a rúbricas específicas
   - Archivos se guardan en Drive dentro de carpeta de rúbrica
   - Registro en BD con modelo `Submission`

4. **Consolidador: Dual Mode**
   - **Modo actual:** Herramienta pública standalone (`/consolidator`)
   - **Modo profesor:** Vista integrada con opción de subir .txt generado a Drive
   - Profesor puede usar consolidador y directamente asignar a rúbrica

5. **Sistema de Tooltips**
   - Ayuda contextual en todos los formularios
   - Iconos ℹ️ con hover para explicar campos

---

## 📊 ESTRUCTURA DE DATOS

### Jerarquía del Sistema (YA EXISTE - NO MODIFICAR)

```
University
  └── Faculty
      └── Career
          └── Course
              └── Commission
                  ├── Professors (⚠️ MODIFICAR)
                  └── Rubrics
                      └── Submissions (⭐ CREAR NUEVO)
```

### Estructura en Google Drive (SIMPLIFICADA)

```
ROOT_DRIVE_FOLDER/
└── {university_id}/
    └── {faculty_id}/
        └── {career_id}/
            └── {course_id}/
                └── {commission_id}/
                    └── {rubric_folder_id}/           ← Carpeta existente de rúbrica
                        ├── alumno-juan-perez.txt      ← Archivos .txt directos
                        ├── alumno-maria-gomez.txt
                        └── alumno-pedro-lopez.txt
```

**Ventajas:**
- ✅ Sin subcarpetas por alumno (más simple)
- ✅ Nombre de archivo identifica al alumno
- ✅ Menos operaciones en Drive
- ✅ Usa carpeta existente de rúbrica (`drive_folder_id`)

---

## 🗂️ CAMBIOS EN MODELOS

### 1. User (MODIFICAR)

**Estado actual:**
```javascript
role: String (enum: ['admin', 'user'])
```

**Estado nuevo:**
```javascript
role: String (enum: ['super-admin', 'university-admin', 'professor', 'user'])
university_id: String (required si role !== 'super-admin', index: true)
```

**Cambios necesarios:**
- ✅ Modificar enum de `role`
- ✅ Agregar campo `university_id`
- ✅ Validación pre-save: `university_id` obligatorio para todos excepto `super-admin`
- ✅ Método estático: `findByUniversity(university_id)`
- ✅ Método estático: `findProfessorsByUniversity(university_id)`

---

### 2. Commission (MODIFICAR)

**Estado actual:**
```javascript
professor_name: String
professor_email: String
```

**Estado nuevo:**
```javascript
professors: [ObjectId] (ref: 'User', roles: 'professor')
```

**Cambios necesarios:**
- ⚠️ Agregar campo `professors: [ObjectId]`
- ⚠️ **NO ELIMINAR** `professor_name` y `professor_email` todavía (migración primero)
- ✅ Método de instancia: `assignProfessor(userId)`
- ✅ Método de instancia: `removeProfessor(userId)`
- ✅ Método estático: `findByProfessor(professorId)`

---

### 3. Rubric (YA COMPLETO - NO MODIFICAR)

**Estado actual:** ✅ PERFECTO
```javascript
{
  rubric_id: String,
  commission_id: String,    // ✅ Ya existe
  course_id: String,        // ✅ Ya existe
  career_id: String,        // ✅ Ya existe
  faculty_id: String,       // ✅ Ya existe
  university_id: String,    // ✅ Ya existe
  drive_folder_id: String,  // ✅ Ya existe (carpeta de rúbrica en Drive)
  // ... otros campos
}
```

**Cambios:** ❌ NINGUNO - Todo lo necesario ya está

---

### 4. Submission (CREAR NUEVO)

**Modelo nuevo:**
```javascript
{
  submission_id: String (unique, auto-generado),

  // Jerarquía completa
  commission_id: String (required, index),
  rubric_id: String (required, index),
  course_id: String,
  career_id: String,
  faculty_id: String,
  university_id: String (required, index),

  // Datos del alumno
  student_name: String (required, ej: "juan-perez"),
  student_id: String (legajo/DNI, opcional),

  // Archivo
  file_name: String (required, ej: "alumno-juan-perez.txt"),
  file_size: Number (bytes),
  file_content_preview: String (primeros 500 caracteres),

  // Google Drive (SIMPLIFICADO)
  drive_file_id: String (ID del archivo en Drive),
  drive_file_url: String (URL del archivo),
  rubric_drive_folder_id: String (ID de carpeta de rúbrica),

  // Metadata
  uploaded_by: ObjectId (ref: User, profesor que subió),
  uploaded_at: Date (default: now),

  // Estado
  status: String (enum: ['uploaded', 'pending-correction', 'corrected', 'failed']),

  // Corrección (opcional)
  correction: {
    corrected_at: Date,
    corrected_by: ObjectId (ref: User),
    grade: Number,
    summary: String,
    strengths: String,
    recommendations: String,
    result_json: Mixed
  },

  deleted: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

**Índices:**
- `{ commission_id: 1, rubric_id: 1, deleted: 1 }`
- `{ rubric_id: 1, student_name: 1 }` (unique)
- `{ university_id: 1, deleted: 1 }`
- `{ uploaded_by: 1, deleted: 1 }`
- `{ status: 1, deleted: 1 }`

**Métodos:**
- `generateSubmissionId(commissionId, studentName)` (estático)
- `findActive(filters)` (estático)
- `softDelete()` (instancia)
- `restore()` (instancia)

---

## 🔐 MIDDLEWARE MULTI-TENANT

### Archivos a crear:

**`backend/src/middleware/multiTenant.js` (NUEVO):**

Funciones necesarias:
1. `checkUniversityAccess(req, res, next)`
   - super-admin: pasa todo
   - university-admin: valida que `req.body.university_id === req.user.university_id`
   - professor: valida que `req.body.university_id === req.user.university_id`
   - user: valida que `req.body.university_id === req.user.university_id`

2. `checkProfessorAccess(req, res, next)`
   - super-admin y university-admin: pasa todo
   - professor: valida que esté en `commission.professors`
   - user: rechaza

3. `requireRoles(...allowedRoles)`
   - Valida que `req.user.role` esté en `allowedRoles`

---

## 📅 FASES DEL PROYECTO

---

## ✅ FASE 0: Migración de Datos Existentes (1-2 días)

### 🎯 Objetivo
Migrar datos existentes al nuevo esquema multi-tenant sin perder información.

### 📋 Tareas

#### 0.1. Backup de Base de Datos
- [ ] Crear backup completo de MongoDB
- [ ] Verificar que el backup sea restaurable
- [ ] Documentar comando de restore

**Comando:**
```bash
mongodump --uri="mongodb://localhost:27017/correcion-automatica" --out=./backup-pre-refactorizacion
```

#### 0.2. Crear Script de Migración
- [ ] Crear archivo `backend/scripts/migrateToMultiTenant.js`

**Acciones del script:**

1. **Migrar usuarios:**
   - [ ] Cambiar todos los `role: 'admin'` → `role: 'university-admin'`
   - [ ] Asignar `university_id` a todos los usuarios
     - Opción A: Asignar todos a universidad por defecto (ej: `utn-frm`)
     - Opción B: Prompt manual para asignar universidad por usuario
   - [ ] Crear usuario `super-admin` inicial (username: `superadmin`, password: `superadmin123`)
   - [ ] Validar que ningún usuario quedó sin `university_id` (excepto super-admin)

2. **Migrar comisiones:**
   - [ ] Para cada Commission con `professor_name` o `professor_email`:
     - Buscar usuario con ese nombre/email
     - Si existe: agregarlo al array `professors`
     - Si NO existe: crear usuario con `role: 'professor'`, asignar `university_id`
   - [ ] **NO ELIMINAR** campos `professor_name` y `professor_email` todavía
   - [ ] Validar que todas las comisiones con profesor tengan el array `professors` poblado

3. **Validaciones finales:**
   - [ ] Contar usuarios sin `university_id` (debe ser 1: el super-admin)
   - [ ] Contar comisiones con `professors` vacío vs. con profesores
   - [ ] Verificar que no haya duplicados en `professors`

#### 0.3. Ejecutar Migración
- [ ] Ejecutar script en entorno de desarrollo
- [ ] Revisar logs y errores
- [ ] Validar datos migrados manualmente (sample de 5-10 registros)
- [ ] Si todo OK: ejecutar en producción

**Comando:**
```bash
npm run migrate:multi-tenant
```

#### 0.4. Rollback Plan
- [ ] Documentar pasos para revertir cambios
- [ ] Probar restore desde backup

---

## ✅ FASE 1: Backend - Modificar Modelos (2-3 días) - ✅ COMPLETADO

**Fecha de completado:** 2025-11-10
**Commit:** `e18df86` - feat: FASE 1 - Modelos y Middleware Multi-Tenant
**Rama:** `feature/models-middleware`

### 🎯 Objetivo
Actualizar modelos User y Commission, crear modelo Submission y middleware multi-tenant.

### 📋 Tareas

#### 1.1. Modificar modelo User ✅
- [x] Abrir `backend/src/models/User.js`
- [x] Modificar enum de `role`: `['super-admin', 'university-admin', 'professor', 'user']`
- [x] Agregar campo `university_id: { type: String, default: null, index: true }`
- [x] Agregar validación pre-save: `university_id` requerido si `role !== 'super-admin'`
- [x] Agregar método estático `findByUniversity(university_id)`
- [x] Agregar método estático `findProfessorsByUniversity(university_id)`

**Referencia de código:** Ver plan V2 líneas 262-314

#### 1.2. Modificar modelo Commission ✅
- [x] Abrir `backend/src/models/Commission.js`
- [x] Agregar campo `professors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }]`
- [x] Agregar índice: `professors`
- [x] Agregar método `assignProfessor(userId)`
- [x] Agregar método `removeProfessor(userId)`
- [x] Agregar método estático `findByProfessor(professorId)`
- [x] ⚠️ **NO ELIMINAR** `professor_name` y `professor_email` todavía

**Referencia de código:** Ver plan V2 líneas 316-381

#### 1.3. Crear modelo Submission ✅
- [x] Crear archivo `backend/src/models/Submission.js`
- [x] Definir schema completo (ver estructura en sección "Modelos")
- [x] Agregar índices compuestos
- [x] Métodos estáticos: `generateSubmissionId()`, `findActive()`
- [x] Métodos de instancia: `softDelete()`, `restore()`, `updateStatus()`, `addCorrection()`
- [x] Pre-hook para excluir `deleted: true`

**Referencia de código:** Ver plan V2 líneas 383-571

#### 1.4. Crear middleware multi-tenant ✅
- [x] Crear archivo `backend/src/middleware/multiTenant.js`
- [x] Implementar `checkUniversityAccess()`
- [x] Implementar `checkProfessorAccess()`
- [x] Implementar `requireRoles(...roles)`

**Referencia de código:** Ver plan V2 líneas 580-696

#### 1.5. Actualizar middleware auth ✅
- [x] Abrir `backend/src/middleware/auth.js`
- [x] Agregar `university_id` a `req.user`
- [x] Crear función `requireUniversityAdmin()`
- [x] Actualizar `requireAdmin` para soportar nuevos roles (compatibilidad)

**Referencia de código:** Ver plan V2 líneas 704-723

#### 1.6. Testing de Modelos
- [ ] Iniciar MongoDB y backend
- [ ] Crear usuario `super-admin` sin `university_id` → ✅ Debe funcionar
- [ ] Crear usuario `professor` sin `university_id` → ❌ Debe fallar
- [ ] Crear usuario `professor` con `university_id` → ✅ Debe funcionar
- [ ] Asignar profesor a comisión → verificar array `professors`
- [ ] Crear submission → verificar índices y validaciones

**NOTA:** Testing pospuesto para después de completar controladores y rutas

---

## ✅ FASE 2: Backend - Controladores y Rutas (3-5 días) - ✅ COMPLETADO

**Fecha de completado:** 2025-11-10
**Commits:**
- `56b8456` - feat: FASE 2 - API de Submissions completa
- `060064c` - feat: FASE 2 Parte 2 - Asignación de Profesores a Comisiones
**Ramas:** `feature/submissions-api`, `feature/professor-assignment`

### 🎯 Objetivo
Crear endpoints para gestionar submissions y asignación de profesores a comisiones.

### 📋 Tareas

#### 2.1. Crear controlador de Submissions ✅
- [x] Crear archivo `backend/src/controllers/submissionController.js`

**Funciones a implementar:**
- [x] `getAllSubmissions(req, res)` - Listar con filtros multi-tenant
  - super-admin: ve todo
  - university-admin: solo su universidad
  - professor: solo sus comisiones
  - user: rechazar acceso
- [x] `getSubmissionById(req, res)` - Obtener una con validación de acceso
- [x] `createSubmission(req, res)` - Subir archivo .txt con Multer
  - Validar profesor tiene acceso a comisión
  - Obtener `drive_folder_id` de rúbrica
  - Generar nombre de archivo: `alumno-{student_name}.txt`
  - Guardar temporal
  - Llamar a `uploadFileToDrive()` del driveService
  - Crear registro Submission en BD
  - Eliminar archivo temporal
- [x] `updateSubmission(req, res)` - Actualizar estado o corrección
- [x] `deleteSubmission(req, res)` - Soft delete

**Referencia de código:** Ver plan V2 líneas 770-1101

#### 2.2. Actualizar driveService ✅
- [x] Abrir `backend/src/services/driveService.js`
- [x] Agregar imports: FormData, fs
- [x] Agregar función `uploadFileToDrive(filePath, fileName, rubricDriveFolderId)`
  - Llama a webhook n8n con FormData
  - Retorna `{ success, drive_file_id, drive_file_url }`

**Referencia de código:** Ver plan V2 líneas 1109-1157

#### 2.3. Crear rutas de Submissions ✅
- [x] Crear archivo `backend/src/routes/submissionRoutes.js`
- [x] Configurar Multer para upload de .txt (destino: `uploads/temp/`, max 10MB)
- [x] Rutas:
  - `GET /api/submissions` → `authenticate` + `requireRoles(...)` → `getAllSubmissions`
  - `GET /api/submissions/:id` → `authenticate` + `requireRoles(...)` → `getSubmissionById`
  - `POST /api/submissions` → `authenticate` + `requireRoles(...)` + `upload.single('file')` + `checkProfessorAccess` → `createSubmission`
  - `PUT /api/submissions/:id` → `authenticate` + `requireRoles(...)` → `updateSubmission`
  - `DELETE /api/submissions/:id` → `authenticate` + `requireRoles(...)` → `deleteSubmission`

**Referencia de código:** Ver plan V2 líneas 1165-1224

#### 2.4. Registrar rutas en app.js ✅
- [x] Abrir `backend/src/app.js`
- [x] Importar `submissionRoutes`
- [x] Registrar: `app.use('/api/submissions', submissionRoutes)`
- [x] Actualizar versión a 2.3.0
- [x] Agregar endpoint en lista de endpoints

#### 2.5. Actualizar controlador de Commission ✅
- [x] Abrir `backend/src/controllers/commissionController.js`
- [x] Agregar import de User model
- [x] Agregar función `assignProfessor(req, res)`
  - Validar que profesor exista y sea de la misma universidad
  - Validar rol de profesor
  - Validar multi-tenant
  - Llamar a `commission.assignProfessor(professor_id)`
  - Populate de profesores en respuesta
- [x] Agregar función `removeProfessor(req, res)`
  - Validar multi-tenant
  - Llamar a `commission.removeProfessor(professorId)`
- [x] Agregar función `getMyCommissions(req, res)` - Para profesores
  - Validar rol profesor
  - Usar método `findByProfessor()`
- [x] Exportar nuevas funciones

**Referencia de código:** Ver plan V2 líneas 1247-1394

#### 2.6. Actualizar rutas de Commission ✅
- [x] Abrir `backend/src/routes/commissionRoutes.js`
- [x] Importar `assignProfessor`, `removeProfessor`, `getMyCommissions`
- [x] Importar `requireRoles` de multiTenant middleware
- [x] Agregar rutas:
  - `GET /api/commissions/my-commissions` → `authenticate` → `getMyCommissions` (ANTES de `/:id`)
  - `POST /api/commissions/:id/assign-professor` → `authenticate` + `requireRoles('super-admin', 'university-admin')` → `assignProfessor`
  - `DELETE /api/commissions/:id/professors/:professorId` → `authenticate` + `requireRoles('super-admin', 'university-admin')` → `removeProfessor`

#### 2.7. Variables de Entorno ✅
- [x] Abrir `backend/.env.example`
- [x] Agregar: `N8N_UPLOAD_FILE_TO_DRIVE_WEBHOOK=https://tu-servidor.n8n.example/webhook/upload-file-to-drive`
- [ ] Actualizar tu `.env` local (manual por el usuario)

#### 2.8. Testing de Endpoints
- [ ] Login como admin → crear profesor
- [ ] Asignar profesor a comisión → `POST /api/commissions/:id/assign-professor`
- [ ] Login como profesor → `GET /api/commissions/my-commissions` → verificar respuesta
- [ ] Subir entrega .txt → `POST /api/submissions` con FormData
- [ ] Verificar submission en BD
- [ ] Verificar archivo en Google Drive
- [ ] Listar submissions → `GET /api/submissions?commission_id=...`

**NOTA:** Testing pospuesto para después de completar n8n webhook (FASE 3)

---

## ✅ FASE 3: n8n - Webhook Upload a Drive (1-2 días)

### 🎯 Objetivo
Crear flujo n8n simplificado para subir archivos .txt directamente a carpeta de rúbrica en Drive.

### 📋 Tareas

#### 3.1. Crear flujo n8n
- [ ] Crear archivo `n8n-workflows/flujo_upload_file_drive.json`

**Nodos del flujo:**
1. **Webhook** (POST `/webhook/upload-file-to-drive`)
   - Recibe: `file` (multipart), `fileName`, `folderId`
2. **Google Drive - Upload File**
   - Parent Folder ID: `{{ $json.folderId }}`
   - File Name: `{{ $json.fileName }}`
   - Binary Data: `file`
3. **Respond to Webhook**
   - Body: `{ "success": true, "drive_file_id": "{{ $node['Google Drive'].json.id }}", "drive_file_url": "{{ $node['Google Drive'].json.webViewLink }}" }`

**Diagrama:**
```
Webhook → Google Drive Upload → Respond
```

#### 3.2. Importar y Configurar en n8n
- [ ] Abrir instancia de n8n
- [ ] Importar workflow desde JSON
- [ ] Configurar credenciales de Google Drive (OAuth2 o Service Account)
- [ ] Activar workflow
- [ ] Copiar URL del webhook

#### 3.3. Actualizar Backend
- [ ] Pegar URL en `backend/.env` → `N8N_UPLOAD_FILE_TO_DRIVE_WEBHOOK=...`
- [ ] Reiniciar backend: `npm run dev`

#### 3.4. Testing del Flujo
- [ ] Usar Thunder Client / Postman
- [ ] POST al webhook con FormData:
  - `file`: archivo .txt
  - `fileName`: "test-upload.txt"
  - `folderId`: ID de carpeta de prueba en Drive
- [ ] Verificar respuesta: `{ success: true, drive_file_id, drive_file_url }`
- [ ] Verificar archivo en Google Drive

---

## ✅ FASE 4: Frontend - Sistema de Tooltips (2 días) - ✅ COMPLETADO (Componentes Base)

**Fecha de completado:** 2025-11-10
**Commit:** `6ad7005` - feat: FASE 4 - Sistema de Tooltips
**Rama:** `feature/tooltips`

### 🎯 Objetivo
Crear componentes reutilizables de tooltips y agregarlos a formularios existentes.

### 📋 Tareas

#### 4.1. Crear componente Tooltip ✅
- [x] Crear archivo `frontend/src/components/shared/Tooltip.tsx`
- [x] Props: `children`, `content`, `position` (top/bottom/left/right)
- [x] Estado: `isVisible` (hover con onMouseEnter/onMouseLeave)
- [x] Estilos: Dark theme, flecha posicional, animaciones suaves (fadeIn)
- [x] Posicionamiento dinámico según prop
- [x] Max-width para contenido largo

**Referencia de código:** Ver plan V2 líneas 1557-1617

#### 4.2. Crear componente TooltipIcon ✅
- [x] Crear archivo `frontend/src/components/shared/TooltipIcon.tsx`
- [x] Icono SVG ℹ️ (info circle)
- [x] Usa componente `Tooltip` internamente
- [x] Props: `content`, `position`
- [x] Hover effect en icono

**Referencia de código:** Ver plan V2 líneas 1624-1654

#### 4.3. Actualizar componente Input ✅
- [x] Abrir `frontend/src/components/shared/Input.tsx`
- [x] Importar `TooltipIcon`
- [x] Agregar prop `tooltip?: string`
- [x] Renderizar `<TooltipIcon content={tooltip} />` junto al label si `tooltip` está presente
- [x] Label con flex layout para alinear texto + icono

**Referencia de código:** Ver plan V2 líneas 1662-1693

#### 4.4. Actualizar componente Select ✅
- [x] Abrir `frontend/src/components/shared/Select.tsx`
- [x] Importar `TooltipIcon`
- [x] Agregar prop `tooltip?: string`
- [x] Renderizar `TooltipIcon` junto al label
- [x] Label con flex layout

#### 4.5. Agregar tooltips a formularios existentes
- [ ] `UniversitiesManager.tsx`:
  - Campo `university_id`: "Identificador único en formato kebab-case. Ej: utn-frm"
  - Campo `name`: "Nombre completo de la universidad. Ej: UTN - Facultad Regional Mendoza"
- [ ] `CoursesManager.tsx`:
  - Campo `course_id`: "ID único del curso en formato kebab-case. Ej: programacion-1"
- [ ] `RubricsManager.tsx`:
  - Campo `rubric_type`: "TP: Trabajo Práctico | Parcial: Examen | Final: Examen Final | Global: Rúbrica general"
- [ ] `UsersManager.tsx`:
  - Campo `role`: "super-admin: acceso global | university-admin: su universidad | professor: sus comisiones | user: solo corrección"
  - Campo `university_id`: "Universidad a la que pertenece el usuario (no requerido para super-admin)"

**Ejemplos:** Ver plan V2 líneas 1705-1725

**NOTA:** Los componentes base están listos. La tarea 4.5 se puede completar en FASE 6 al actualizar Admin Panel.

---

## ✅ FASE 5: Frontend - Actualizar Admin Panel (2-3 días)

### 🎯 Objetivo
Actualizar managers existentes para soportar nuevos roles y asignación de profesores.

### 📋 Tareas

#### 5.1. Actualizar UsersManager
- [ ] Abrir `frontend/src/components/admin/UsersManager.tsx`
- [ ] Actualizar select de rol con opciones: `super-admin`, `university-admin`, `professor`, `user`
- [ ] Agregar campo `university_id` (Select con universidades disponibles)
- [ ] Validación condicional: `university_id` obligatorio si `role !== 'super-admin'`
- [ ] Agregar tooltips a todos los campos

#### 5.2. Actualizar CommissionsManager
- [ ] Abrir `frontend/src/components/admin/CommissionsManager.tsx`
- [ ] Agregar sección "Profesores asignados" en modal de editar comisión
  - Lista de profesores asignados (con botón "Remover")
  - Select para agregar nuevo profesor (filtrado por universidad)
  - Botón "Asignar Profesor"
- [ ] Crear funciones:
  - `handleAssignProfessor()` → `POST /api/commissions/:id/assign-professor`
  - `handleRemoveProfessor()` → `DELETE /api/commissions/:id/professors/:professorId`

#### 5.3. Testing
- [ ] Login como `super-admin`
- [ ] Crear usuario con rol `professor` y `university_id`
- [ ] Asignar profesor a comisión
- [ ] Verificar que aparezca en lista de profesores asignados
- [ ] Remover profesor
- [ ] Validar que no se pueda crear usuario sin `university_id` (excepto super-admin)

---

## ✅ FASE 6: Frontend - Vista de Profesor (4-5 días)

### 🎯 Objetivo
Crear vista completa para que profesores gestionen entregas de alumnos en sus comisiones.

### 📋 Tareas

#### 6.1. Crear servicio submissionService
- [ ] Crear archivo `frontend/src/services/submissionService.ts`
- [ ] Métodos:
  - `getAll(filters)` → `GET /api/submissions?commission_id=...&rubric_id=...`
  - `getById(id)` → `GET /api/submissions/:id`
  - `create(formData)` → `POST /api/submissions` (multipart/form-data)
  - `update(id, data)` → `PUT /api/submissions/:id`
  - `delete(id)` → `DELETE /api/submissions/:id`

#### 6.2. Crear componente ProfessorView
- [ ] Crear archivo `frontend/src/components/professor/ProfessorView.tsx`

**Estructura:**
```tsx
<Layout>
  <div className="flex">
    {/* Sidebar: Mis Comisiones */}
    <aside>
      {commissions.map(commission => (
        <CommissionCard
          commission={commission}
          onSelectRubric={handleSelectRubric}
        />
      ))}
    </aside>

    {/* Panel principal */}
    <main>
      {selectedRubric ? (
        <>
          <RubricInfo rubric={selectedRubric} />
          <SubmissionsList submissions={submissions} />
          <Button onClick={openUploadModal}>
            + Subir Entrega
          </Button>
        </>
      ) : (
        <EmptyState message="Selecciona una rúbrica" />
      )}
    </main>
  </div>
</Layout>
```

#### 6.3. Crear componente UploadSubmissionModal
- [ ] Crear archivo `frontend/src/components/professor/UploadSubmissionModal.tsx`

**Campos:**
- [ ] Input: `student_name` (ej: "juan-perez") + tooltip
- [ ] Input: `student_id` (legajo/DNI, opcional) + tooltip
- [ ] FileInput: `file` (solo .txt, max 10MB) + tooltip
- [ ] Preview del contenido del archivo (primeros 20 líneas)
- [ ] Botón "Subir a Drive"

**Flujo:**
1. Usuario selecciona archivo .txt
2. Frontend lee contenido para preview
3. Al hacer submit:
   - Crear FormData con `file`, `student_name`, `student_id`, `rubric_id`
   - `POST /api/submissions` con `multipart/form-data`
   - Mostrar loading
   - Al terminar: cerrar modal, recargar lista de submissions, mostrar toast de éxito

#### 6.4. Crear componente SubmissionsList
- [ ] Crear archivo `frontend/src/components/professor/SubmissionsList.tsx`
- [ ] Tabla con columnas:
  - Alumno
  - Legajo
  - Archivo
  - Fecha de subida
  - Estado (badge: uploaded/corrected/failed)
  - Acciones: "Ver en Drive", "Eliminar"

#### 6.5. Integración del Consolidador (DUAL MODE)

**Modo 1: Consolidador Público (YA EXISTE)**
- [ ] Mantener `/consolidator` como herramienta standalone
- [ ] Sin cambios

**Modo 2: Consolidador en Vista de Profesor (NUEVO - OPCIONAL para Fase 7)**
- [ ] Agregar tab "Consolidador" en ProfessorView
- [ ] Formulario:
  - Upload de .zip del proyecto
  - Seleccionar modo de consolidación (Java, Python, Web, etc.)
  - Preview del .txt generado
  - Botón "Asignar a Rúbrica" → abre modal con select de comisión + rúbrica + datos de alumno
- [ ] Al confirmar: genera .txt en memoria, crea FormData, llama a `POST /api/submissions`

**Decisión de implementación:**
- ⚠️ **Si Fase 6 se alarga, posponer Modo 2 para Fase 7 o Fase 8**
- ✅ Priorizar subida manual de .txt primero (Modo 1 + UploadSubmissionModal)

#### 6.6. Testing
- [ ] Login como profesor
- [ ] Ver "Mis Comisiones" → debe listar solo comisiones donde está asignado
- [ ] Seleccionar rúbrica
- [ ] Subir entrega de alumno (.txt)
- [ ] Verificar que aparezca en lista
- [ ] Ver archivo en Drive (link funcional)
- [ ] Eliminar entrega
- [ ] Login como otro profesor → NO debe ver comisiones del primero

---

## ✅ FASE 7: Routing y Navegación (1 día)

### 🎯 Objetivo
Actualizar rutas y navegación para soportar rol de profesor.

### 📋 Tareas

#### 7.1. Actualizar App.tsx
- [ ] Abrir `frontend/src/App.tsx`
- [ ] Agregar ruta `/professor` protegida:
  ```tsx
  <Route element={<ProtectedRoute requireRole="professor" />}>
    <Route path="/professor" element={<ProfessorView />} />
  </Route>
  ```

#### 7.2. Actualizar Login
- [ ] Abrir `frontend/src/components/auth/Login.tsx`
- [ ] Redirección post-login según rol:
  ```tsx
  if (user.role === 'super-admin' || user.role === 'university-admin') {
    navigate('/admin');
  } else if (user.role === 'professor') {
    navigate('/professor');
  } else {
    navigate('/');
  }
  ```

#### 7.3. Actualizar Navbar
- [ ] Abrir `frontend/src/components/layout/Navbar.tsx` (o equivalente)
- [ ] Links dinámicos según rol:
  ```tsx
  {user.role === 'super-admin' || user.role === 'university-admin' ? (
    <NavLink to="/admin">Admin Panel</NavLink>
  ) : null}

  {user.role === 'professor' ? (
    <NavLink to="/professor">Mis Comisiones</NavLink>
  ) : null}

  <NavLink to="/">Corrección</NavLink>
  <NavLink to="/consolidator">Consolidador</NavLink>
  ```

#### 7.4. Testing
- [ ] Login como cada rol, verificar redirección correcta
- [ ] Verificar que links del navbar sean correctos por rol
- [ ] Intentar acceder a `/admin` como profesor → debe redirigir a login o 403
- [ ] Intentar acceder a `/professor` como user → debe redirigir

---

## ✅ FASE 8: Testing e Integración (3-4 días)

### 🎯 Objetivo
Validar flujo completo end-to-end de cada rol.

### 📋 Tareas

#### 8.1. Crear usuarios de prueba
- [ ] Super-admin: `superadmin` / `superadmin123`
- [ ] University-admin (UTN-FRM): `admin-frm` / `admin123`
- [ ] University-admin (UTN-FRSN): `admin-frsn` / `admin123`
- [ ] Professor (UTN-FRM, Prog 1): `profesor-prog1` / `profesor123`
- [ ] Professor (UTN-FRM, Prog 2): `profesor-prog2` / `profesor123`
- [ ] User: `alumno` / `alumno123`

#### 8.2. Testing de Super-Admin
- [ ] Login como `superadmin`
- [ ] Acceder a Admin Panel
- [ ] Ver todas las universidades
- [ ] Crear nueva universidad
- [ ] Crear universidad-admin para nueva universidad
- [ ] Ver comisiones de todas las universidades
- [ ] Ver submissions de todas las universidades

#### 8.3. Testing de University-Admin
- [ ] Login como `admin-frm`
- [ ] Acceder a Admin Panel
- [ ] Verificar que SOLO ve datos de UTN-FRM
- [ ] Intentar crear recurso con `university_id` de otra universidad → debe fallar
- [ ] Crear profesor para su universidad
- [ ] Asignar profesor a comisión
- [ ] Verificar que profesor aparezca en lista de profesores de la comisión

#### 8.4. Testing de Professor
- [ ] Login como `profesor-prog1`
- [ ] Acceder a `/professor`
- [ ] Verificar que SOLO ve comisiones donde está asignado
- [ ] Seleccionar rúbrica "TP-1"
- [ ] Subir entrega de alumno:
  - student_name: "juan-perez"
  - student_id: "12345"
  - file: archivo .txt generado con consolidador
- [ ] Verificar que submission aparezca en lista
- [ ] Abrir link "Ver en Drive" → debe abrir archivo en Drive
- [ ] Verificar estructura en Drive:
  ```
  UTN-FRM/
    └── Ingenieria/
        └── Sistemas/
            └── Programacion-1/
                └── 2025-Prog1-Com1/
                    └── {rubric_folder_id}/
                        └── alumno-juan-perez.txt  ← Archivo subido
  ```
- [ ] Subir otra entrega: "maria-gomez"
- [ ] Verificar que ambos archivos están en la misma carpeta de rúbrica
- [ ] Eliminar entrega de "juan-perez"
- [ ] Verificar que desapareció de la lista
- [ ] Logout → Login como `profesor-prog2` → NO debe ver comisiones de `profesor-prog1`

#### 8.5. Testing de User
- [ ] Login como `alumno`
- [ ] Acceder a `/` (UserView)
- [ ] Verificar que NO tiene acceso a `/admin`
- [ ] Verificar que NO tiene acceso a `/professor`
- [ ] Usar flujo de corrección normal (sin cambios)

#### 8.6. Testing de Flujo Completo (Caso de Uso Real)
**Escenario:** Nueva comisión de Programación 1, año 2025
1. [ ] Super-admin crea universidad "UNC - Córdoba"
2. [ ] Super-admin crea university-admin para UNC
3. [ ] Login como admin de UNC → crea facultad, carrera, curso, comisión
4. [ ] Admin de UNC crea profesor "Prof. Carlos Ruiz"
5. [ ] Admin de UNC asigna "Prof. Carlos Ruiz" a comisión "Prog 1 - Com 1 - 2025"
6. [ ] Admin de UNC crea rúbrica "TP-1: Listas" para la comisión (con PDF, genera carpeta en Drive)
7. [ ] Login como "Prof. Carlos Ruiz"
8. [ ] Prof. Ruiz ve comisión "Prog 1 - Com 1 - 2025" en su vista
9. [ ] Prof. Ruiz selecciona rúbrica "TP-1: Listas"
10. [ ] Prof. Ruiz sube entrega de "Ana Martínez" (archivo .txt)
11. [ ] Verificar archivo en Drive dentro de carpeta de rúbrica
12. [ ] Prof. Ruiz sube entrega de "Luis Fernández"
13. [ ] Verificar que ambos archivos estén en la misma carpeta
14. [ ] Super-admin accede a `/admin` → ve submissions de todas las universidades
15. [ ] Admin de UNC accede → SOLO ve submissions de UNC

---

## ✅ FASE 9: Documentación Final (2 días)

### 🎯 Objetivo
Actualizar todos los READMEs y crear guías de usuario por rol.

### 📋 Tareas

#### 9.1. Actualizar README principal
- [ ] Abrir `README.md` en raíz del proyecto
- [ ] Actualizar sección "Roles del Sistema" con tabla:
  | Rol | Permisos | Acceso |
  |-----|----------|--------|
  | super-admin | Todo el sistema | Todas las universidades |
  | university-admin | Su universidad | Solo datos de su universidad |
  | professor | Sus comisiones | Comisiones donde está asignado |
  | user | Solo corrección | Vista de corrección |
- [ ] Actualizar sección "Arquitectura" con nuevo flujo de profesor
- [ ] Agregar sección "Subida de Entregas de Alumnos"

#### 9.2. Actualizar backend/README.md
- [ ] Documentar cambios en modelo User (nuevos roles, `university_id`)
- [ ] Documentar cambios en modelo Commission (array `professors`)
- [ ] Documentar modelo Submission (nuevo)
- [ ] Documentar middleware multi-tenant
- [ ] Documentar nuevos endpoints:
  - `GET /api/commissions/my-commissions`
  - `POST /api/commissions/:id/assign-professor`
  - `DELETE /api/commissions/:id/professors/:professorId`
  - CRUD completo de `/api/submissions`

#### 9.3. Actualizar frontend/README.md
- [ ] Documentar ProfessorView
- [ ] Documentar componentes Tooltip y TooltipIcon
- [ ] Actualizar rutas con `/professor`
- [ ] Actualizar tabla de componentes con nuevos componentes

#### 9.4. Actualizar n8n-workflows/README.md
- [ ] Documentar webhook `/upload-file-to-drive`
- [ ] Agregar diagrama de flujo
- [ ] Input/Output esperado
- [ ] Ejemplos de testing con curl

#### 9.5. Crear guías de usuario
- [ ] Crear `GUIA_SUPER_ADMIN.md`:
  - Cómo crear universidades
  - Cómo crear admins de universidad
  - Acceso global a datos
- [ ] Crear `GUIA_UNIVERSITY_ADMIN.md`:
  - Cómo gestionar su universidad
  - Cómo crear profesores
  - Cómo asignar profesores a comisiones
  - Limitaciones de acceso
- [ ] Crear `GUIA_PROFESSOR.md`:
  - Cómo acceder a sus comisiones
  - Cómo subir entregas de alumnos
  - Cómo usar el consolidador (dual mode)
  - Cómo ver entregas en Drive

---

## 📊 RESUMEN DEL PROYECTO

### Cambios Clave

| Aspecto | Antes | Después |
|---------|-------|---------|
| Roles | `admin`, `user` | `super-admin`, `university-admin`, `professor`, `user` |
| Multi-Tenancy | No | Sí (por `university_id`) |
| Profesores | Strings en Commission | Array de ObjectIds |
| Entregas de Alumnos | No existe | Modelo Submission + Vista de Profesor |
| Estructura Drive | Solo rúbricas | Rúbricas + entregas de alumnos |
| Tooltips | No | Sí (en todos los formularios) |

### Duración Estimada

| Fase | Días |
|------|------|
| Fase 0: Migración | 1-2 |
| Fase 1: Modelos | 2-3 |
| Fase 2: Controladores | 3-5 |
| Fase 3: n8n | 1-2 |
| Fase 4: Tooltips | 2 |
| Fase 5: Admin Panel | 2-3 |
| Fase 6: Vista Profesor | 4-5 |
| Fase 7: Routing | 1 |
| Fase 8: Testing | 3-4 |
| Fase 9: Documentación | 2 |

**Total:** 25-35 días (~5-7 semanas)

---

## ⚠️ ADVERTENCIAS Y MEJORES PRÁCTICAS

### Durante la Implementación

1. **GIT: Commits frecuentes**
   - Commit después de cada sub-tarea completada
   - Mensajes descriptivos: "feat: add university_id to User model"
   - Crear rama: `feature/multi-tenant-professor`

2. **Backup: Antes de cada fase de BD**
   - Fase 0, 1, 2: Backup antes de modificar modelos
   - Comando: `mongodump --uri="..." --out=./backup-fase-X`

3. **Testing: Después de cada endpoint**
   - No avanzar a siguiente endpoint sin probar el anterior
   - Usar Thunder Client / Postman
   - Documentar casos de prueba

4. **NO ELIMINAR: Campos viejos hasta validar migración**
   - `professor_name` y `professor_email` en Commission: eliminar SOLO en Fase 8 después de validar que todo funciona

5. **Variables de Entorno: Validar antes de ejecutar**
   - Verificar que todos los webhooks de n8n estén configurados
   - Probar conexión a MongoDB
   - Probar credenciales de Google Drive

### Problemas Comunes y Soluciones

| Problema | Causa | Solución |
|----------|-------|----------|
| Error "university_id required" al crear usuario | Validación pre-save activada | Agregar `university_id` en request |
| Profesor no ve comisiones | No está en array `professors` | Asignar con `POST /commissions/:id/assign-professor` |
| Upload falla con 403 | Middleware `checkProfessorAccess` bloquea | Verificar que profesor esté asignado a la comisión |
| Archivo no aparece en Drive | Webhook n8n no configurado | Verificar `.env`, activar workflow en n8n |
| Tooltip no aparece | Falta importar `TooltipIcon` | Importar: `import { TooltipIcon } from '...'` |

---

## 📚 REFERENCIAS DE CÓDIGO COMPLETO

Cuando necesites implementar código específico, consulta el plan V2 original (`PROYECTO_PLAN_REFACTORIZACION.md`):

| Componente | Líneas en Plan V2 |
|------------|-------------------|
| Modelo User (modificado) | 262-314 |
| Modelo Commission (modificado) | 316-381 |
| Modelo Submission (completo) | 383-571 |
| Middleware multiTenant | 580-696 |
| Middleware auth (actualizado) | 704-723 |
| Controller Submission (completo) | 770-1101 |
| driveService.uploadFileToDrive | 1109-1157 |
| Routes Submission | 1165-1224 |
| Controller Commission (asignación profesores) | 1247-1394 |
| Routes Commission (nuevas rutas) | 1402-1428 |
| Componente Tooltip | 1557-1617 |
| Componente TooltipIcon | 1624-1654 |
| Input con tooltip | 1662-1693 |

---

## 🎯 CHECKLIST RÁPIDO

### Backend ✅
- [ ] User: roles + university_id + validaciones
- [ ] Commission: array professors + métodos
- [ ] Submission: modelo completo
- [ ] Middleware: multiTenant.js
- [ ] Controller: submissionController.js
- [ ] Routes: submissionRoutes.js
- [ ] Service: uploadFileToDrive()

### Frontend ✅
- [ ] Tooltip + TooltipIcon
- [ ] Input/Select con tooltips
- [ ] UsersManager: nuevo rol + university_id
- [ ] CommissionsManager: asignar profesores
- [ ] ProfessorView completo
- [ ] UploadSubmissionModal
- [ ] SubmissionsList
- [ ] Routing: /professor

### n8n ✅
- [ ] Webhook: upload-file-to-drive
- [ ] Flujo: 2 pasos (recibir → subir a Drive)

### Documentación ✅
- [ ] README.md principal
- [ ] backend/README.md
- [ ] frontend/README.md
- [ ] n8n-workflows/README.md
- [ ] Guías de usuario (3 archivos)

---

## 🚀 PRÓXIMOS PASOS

1. **Revisar y aprobar este plan**
2. **Crear rama Git:** `git checkout -b feature/multi-tenant-professor`
3. **Ejecutar Fase 0:** Backup + migración de datos
4. **Comenzar Fase 1:** Modificar modelos

---

**Última actualización:** Noviembre 2025
**Versión:** 3.0
**Estado:** Pendiente de aprobación

---

**¿Todo claro? ¿Alguna modificación antes de empezar?** 🎯
