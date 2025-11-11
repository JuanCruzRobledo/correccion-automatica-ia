# ⚠️ TAREAS PENDIENTES - Sistema Multi-Tenant

**Última actualización:** 11 de Noviembre, 2025

---

## 🎯 RESUMEN EJECUTIVO

### ✅ Lo que ya funciona (100% código)
- Backend multi-tenant con 4 roles
- Frontend con sistema de permisos completo
- Vista de profesor
- Routing por rol
- Sistema de tooltips

### ❌ Lo que falta hacer
1. **Ejecutar seed de base de datos** (5 minutos)
2. **Configurar n8n** (15-30 minutos)
3. **Testing manual** (2-3 horas)
4. **Actualizar documentación** (1-2 días)

---

## 🚀 TAREAS INMEDIATAS (Orden de prioridad)

### 1️⃣ CRÍTICO: Ejecutar Seed (5 minutos)

**¿Por qué es necesario?**
- Crea usuarios de prueba con todos los roles
- Crea estructura de universidades, facultades, carreras, etc.
- Sin esto, no puedes probar el sistema

**Pasos:**
```bash
# 1. Asegurarse que MongoDB está corriendo
# 2. Ir a carpeta backend
cd backend

# 3. Ejecutar seed
node src/scripts/seedMultiTenant.js

# 4. Verificar en MongoDB que se crearon los usuarios
```

**Usuarios creados:**
- `superadmin` / `admin123` (super-admin, acceso global)
- `admin-utn` / `admin123` (university-admin, solo UTN)
- `prof-garcia` / `prof123` (professor, asignado a 3 comisiones de UTN)
- `test` / `test123` (user regular)

**Nota:** Si ya tienes datos en la BD, el script limpia todo antes de crear los nuevos.

---

### 2️⃣ CRÍTICO: Configurar n8n (15-30 minutos)

**¿Por qué es necesario?**
- El upload de archivos .txt de entregas se hace vía n8n a Google Drive
- Sin esto, profesores no pueden subir entregas

**Pasos:**

#### A. Importar Workflow
1. Abrir tu instancia de n8n (ej: https://tu-instancia.n8n.cloud)
2. Ir a "Workflows" → "Import from File"
3. Seleccionar: `n8n-workflows/upload-file-to-drive.json`
4. Click "Import"

#### B. Configurar Credenciales de Google Drive
1. En el workflow, hacer click en el nodo "Google Drive"
2. Click en "Create New Credential"
3. Elegir método:
   - **OAuth2** (recomendado para testing)
   - **Service Account** (recomendado para producción)
4. Seguir wizard de autenticación
5. Probar conexión

#### C. Activar Workflow
1. Click en toggle "Active" (arriba a la derecha)
2. Copiar URL del webhook (se muestra al activar)
   - Ejemplo: `https://tu-instancia.n8n.cloud/webhook/abc123xyz`

#### D. Configurar Backend
1. Abrir `backend/.env`
2. Agregar/actualizar línea:
   ```
   N8N_UPLOAD_FILE_TO_DRIVE_WEBHOOK=https://tu-instancia.n8n.cloud/webhook/abc123xyz
   ```
3. Reiniciar backend:
   ```bash
   cd backend
   npm run dev
   ```

#### E. Probar (Opcional pero recomendado)
```bash
# Usar Thunder Client o Postman
# POST https://tu-instancia.n8n.cloud/webhook/abc123xyz
# Body: multipart/form-data
# - file: [archivo test.txt]
# - fileName: "test-upload.txt"
# - folderId: [ID de una carpeta de Drive]

# Respuesta esperada:
# { "success": true, "drive_file_id": "...", "drive_file_url": "..." }
```

---

### 3️⃣ OPCIONAL: Testing Manual (2-3 horas)

**Una vez ejecutado seed y configurado n8n:**

#### Test 1: Super-Admin (10 min)
```bash
# 1. Login: superadmin / admin123
# 2. Ir a /admin
# 3. Verificar:
#    - Ve tab "Universidades"
#    - Ve datos de UTN y UBA
#    - Puede crear recursos en ambas universidades
#    - Ve todos los usuarios
```

#### Test 2: University-Admin (20 min)
```bash
# 1. Login: admin-utn / admin123
# 2. Ir a /admin
# 3. Verificar:
#    - NO ve tab "Universidades"
#    - Solo ve datos de UTN (no UBA)
#    - Filtros se habilitan automáticamente
#    - Puede crear facultad, carrera, materia, comisión
#    - Universidad aparece como "UTN" (read-only)
#    - Puede crear usuarios "user" y "professor" (no university-admin)
#    - Puede asignar profesores a comisiones
```

#### Test 3: Professor (30 min)
```bash
# 1. Login: prof-garcia / prof123
# 2. Ir a /professor (debe redirigir automáticamente)
# 3. Verificar:
#    - Ve 3 comisiones: 1K1, 2K1, 3K1 de FRM
#    - Puede seleccionar rúbrica "TP Listas"
#    - Puede subir entrega de alumno:
#      - student_name: "juan-perez"
#      - file: archivo .txt
#    - Aparece en lista de entregas
#    - Puede ver archivo en Drive (click en link)
#    - Puede eliminar entrega
#    - NO ve comisiones de otros profesores
```

#### Test 4: User (5 min)
```bash
# 1. Login: test / test123
# 2. Verificar:
#    - Redirige a /
#    - NO puede acceder a /admin (redirige a login)
#    - NO puede acceder a /professor (redirige a login)
#    - Puede usar flujo de corrección normal
```

---

### 4️⃣ OPCIONAL: Documentación (1-2 días)

**READMEs a actualizar:**

#### backend/README.md
- [ ] Documentar cambios en modelo User (nuevos roles, university_id)
- [ ] Documentar cambios en modelo Commission (array professors)
- [ ] Documentar modelo Submission
- [ ] Documentar middleware multi-tenant
- [ ] Documentar endpoints nuevos:
  - `GET /api/commissions/my-commissions`
  - `POST /api/commissions/:id/assign-professor`
  - `DELETE /api/commissions/:id/professors/:professorId`
  - `GET /api/submissions` (con filtros)
  - `POST /api/submissions` (multipart/form-data)
  - `DELETE /api/submissions/:id`

#### frontend/README.md
- [ ] Documentar ProfessorView
- [ ] Documentar UploadSubmissionModal
- [ ] Documentar SubmissionsList
- [ ] Documentar submissionService
- [ ] Actualizar rutas con /professor
- [ ] Documentar sistema de permisos

#### n8n-workflows/README.md
- [ ] Documentar webhook upload-file-to-drive
- [ ] Diagrama de flujo
- [ ] Input/Output esperado
- [ ] Ejemplos de testing

#### Guías de Usuario (CREAR NUEVAS)
- [ ] GUIA_SUPER_ADMIN.md
- [ ] GUIA_UNIVERSITY_ADMIN.md
- [ ] GUIA_PROFESSOR.md

---

## 📋 CHECKLIST DE VERIFICACIÓN

### Antes de considerar el proyecto completado:

- [ ] Seed ejecutado correctamente
- [ ] n8n configurado y funcionando
- [ ] Login funciona con todos los roles
- [ ] Super-admin ve todas las universidades
- [ ] University-admin solo ve su universidad
- [ ] University-admin NO puede crear university-admin o super-admin
- [ ] Professor ve solo sus comisiones
- [ ] Professor puede subir entregas
- [ ] Archivos .txt aparecen en Google Drive
- [ ] User no tiene acceso a /admin ni /professor
- [ ] Routing redirige correctamente por rol
- [ ] READMEs actualizados
- [ ] Guías de usuario creadas

---

## 🆘 PROBLEMAS COMUNES

### Seed falla con error de conexión
**Solución:** Verificar que MongoDB esté corriendo
```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
```

### n8n: "Cannot upload to Drive"
**Solución:**
1. Verificar credenciales de Google Drive
2. Verificar permisos de la carpeta destino
3. Verificar que el workflow esté activado

### Frontend: "university_id required"
**Solución:** Ejecutar seed nuevamente, el script actualizado incluye university_id

### Backend: "Cannot POST /api/submissions"
**Solución:** Verificar que `N8N_UPLOAD_FILE_TO_DRIVE_WEBHOOK` esté en `.env`

### Login: "Invalid credentials"
**Solución:** Usar usuarios del seed:
- superadmin / admin123
- admin-utn / admin123
- prof-garcia / prof123
- test / test123

---

## 📞 CONTACTO Y SOPORTE

**En la próxima sesión:**
Si tienes dudas o problemas, simplemente lee:
1. `ESTADO_ACTUAL.md` - Para entender qué está hecho
2. `PENDIENTE.md` (este archivo) - Para saber qué falta
3. `PLAN_REFACTORIZACION_V3.md` - Para detalles técnicos completos

**Todo está documentado.**
