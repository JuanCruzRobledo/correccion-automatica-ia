# ⚠️ TAREAS PENDIENTES - Sistema Multi-Tenant V4

**Última actualización:** 17 de Noviembre, 2025
**Plan actual:** PLAN_REFACTORIZACION_V4.md

---

## 🎯 RESUMEN EJECUTIVO

### ✅ Lo que está COMPLETADO (70% del Plan V4)

**FASE 10-11: Backend Multi-Tenant Jerárquico** ✅
- Modelo User con 6 roles (super-admin, university-admin, faculty-admin, professor-admin, professor, user)
- Middleware multiTenant.js con validación jerárquica
- 6 Controllers actualizados con permisos multi-tenant
- Campos: faculty_id, course_ids, first_login

**FASE 12: Frontend - Permisos y Filtros Dinámicos** ✅
- roleHelper.ts con lógica centralizada de permisos
- 6 Managers actualizados con auto-filtrado por contexto
- AdminPanel con títulos dinámicos según rol
- Tabs filtrados por permisos de usuario

**FASE 13: Seguridad - Cambio de Contraseña Obligatorio** ✅
- Backend: endpoint POST /api/auth/change-password
- Frontend: ChangePasswordModal con dos modos (obligatorio/opcional)
- Login detecta first_login y bloquea acceso hasta cambiar contraseña
- UserProfile con botón "Cambiar Contraseña"

**FASE 14: Seguridad - Desactivar Registro Público** ✅
- Ruta /register comentada en App.tsx
- Link "Regístrate" oculto en Login.tsx
- Solo admins pueden crear usuarios desde UsersManager

**FASE 16.1: Seed Database Actualizado** ✅
- Usuarios faculty-admin: admin-frm, admin-frsn
- Usuarios professor-admin: jefe-prog1-frm, jefe-prog2-frm, jefe-multi-frsn
- Todos con first_login=true

### ❌ Lo que FALTA hacer (30% restante)

**FASE 15: Recuperación de Contraseña** ⏸️
- Estado: PENDIENTE DE DEFINIR (email vs manual)
- No es bloqueante para continuar

**FASE 16.2: Testing Manual Completo** ⏳
- Testing de faculty-admin (crear carreras, cursos, usuarios)
- Testing de professor-admin (CRUD rúbricas, gestionar comisiones)
- Testing de professor (CRUD rúbricas solamente)
- Testing de aislamiento multi-tenant (cada admin ve solo su scope)
- Testing de cambio de contraseña obligatorio
- Testing de creación jerárquica de usuarios
- Estimado: 4-5 días

**FASE 17: Documentación Final** ⏳
- Actualizar README.md principal
- Crear GUIA_ROLES_V4.md con jerarquía completa
- Actualizar GUIA_CONFIGURACION_Y_DESPLIEGUE.md
- Estimado: 2-3 días

---

## 📊 PROGRESO DEL PLAN V4

| Fase | Nombre | Estado | Progreso |
|------|--------|--------|----------|
| FASE 10 | Backend - Modelo User y Middleware | ✅ Completada | 100% |
| FASE 11 | Backend - Controllers y Rutas | ✅ Completada | 100% |
| FASE 12 | Frontend - Permisos y Filtros | ✅ Completada | 100% |
| FASE 13 | Seguridad - Cambio Contraseña | ✅ Completada | 100% |
| FASE 14 | Seguridad - Registro Desactivado | ✅ Completada | 100% |
| FASE 15 | Recuperación de Contraseña | ⏸️ Pendiente | 0% |
| FASE 16 | Testing Completo | 🔄 En progreso | 20% |
| FASE 17 | Documentación Final | ⏳ Pendiente | 0% |

**Progreso General:** ~70% completado (5 de 7 fases principales)

---

## 🔐 JERARQUÍA DE ROLES (V4)

### Niveles de Administración

```
1. Super-Admin
   └─ Acceso global a todo el sistema

2. University-Admin
   └─ Acceso a su universidad completa

3. Faculty-Admin (NUEVO en V4)
   └─ Acceso a su facultad completa

4. Professor-Admin (NUEVO en V4)
   └─ Acceso a sus cursos específicos

5. Professor
   └─ CRUD de rúbricas en sus comisiones

6. User (Alumno)
   └─ Sin acceso administrativo
```

### Permisos de Creación de Usuarios

| Rol | Puede Crear | Alcance |
|-----|-------------|---------|
| **Super-admin** | Todos los roles | Global |
| **University-admin** | faculty-admin, professor-admin, professor, user | Su universidad |
| **Faculty-admin** | professor-admin, professor, user | Su facultad |
| **Professor-admin** | professor, user | Sus cursos |
| **Professor** | - | NO puede crear usuarios |
| **User** | - | NO puede crear usuarios |

---

## 👥 USUARIOS DE PRUEBA (seedDatabase.js)

### Super-Admin
- **Usuario:** `superadmin` / **Contraseña:** `admin123`
- **Acceso:** Global, todas las universidades

### University-Admin
- **UTN:** `admin-utn` / `admin123`
- **UNLaM:** `admin-unlam` / `admin123`
- **Acceso:** Solo su universidad

### Faculty-Admin (NUEVOS)
- **FRM:** `admin-frm` / `admin123` (first_login: true)
- **FRSN:** `admin-frsn` / `admin123` (first_login: true)
- **Acceso:** Solo su facultad

### Professor-Admin (NUEVOS)
- **Prog 1 FRM:** `jefe-prog1-frm` / `admin123` (first_login: true)
- **Prog 2 FRM:** `jefe-prog2-frm` / `admin123` (first_login: true)
- **Multi FRSN:** `jefe-multi-frsn` / `admin123` (first_login: true)
- **Acceso:** Solo sus cursos

### Professors
- **Profesor García (UTN-FRM):** `prof-garcia` / `prof123`
- **Profesor Rodríguez (UTN-FRSN):** `prof-rodriguez` / `prof123`
- **Profesora Martínez (UNLaM):** `prof-martinez` / `prof123`

### Users (Alumnos)
- **Test User:** `test` / `test123`

---

## 📁 ESTRUCTURA DE DOCUMENTACIÓN

### Documentos Activos (raíz del proyecto)
- `README.md` - Descripción general del proyecto
- `ESTADO_ACTUAL.md` - Estado actual detallado (última actualización)
- `PENDIENTE.md` - Este archivo, tareas pendientes
- `PLAN_REFACTORIZACION_V4.md` - Plan completo de refactorización
- `GUIA_TESTING.md` - Guía de testing manual
- `GUIA_CONFIGURACION_Y_DESPLIEGUE.md` - Configuración y despliegue

### Documentos Archivados
- `docs/archive/` - Planes antiguos (V1, V2, V3)
- `docs/completed-phases/` - Fases completadas (FASE_12, 13, 14)

---

## 🚀 PRÓXIMOS PASOS PARA LA SIGUIENTE SESIÓN

### Opción A: Continuar con Testing (FASE 16.2)
**Estimado:** 4-5 días

**Tareas:**
1. Testing de faculty-admin:
   - Login con `admin-frm`
   - Debe ver solo FRM en AdminPanel
   - Crear una carrera en FRM
   - Crear un curso en FRM
   - Crear un usuario professor en FRM
   - Verificar que NO puede crear usuarios en FRSN

2. Testing de professor-admin:
   - Login con `jefe-prog1-frm`
   - Debe ver solo sus cursos en AdminPanel
   - CRUD de rúbricas en sus comisiones
   - Gestionar comisiones de sus cursos
   - Verificar que NO puede ver otras comisiones

3. Testing de professor (CRUD rúbricas):
   - Login con `prof-garcia`
   - Verificar acceso solo a vista /professor
   - CRUD de rúbricas en sus comisiones
   - Verificar que NO tiene acceso a /admin

4. Testing de aislamiento multi-tenant:
   - Verificar que admin-frm NO ve datos de FRSN
   - Verificar que jefe-prog1-frm NO ve datos de jefe-prog2-frm
   - Verificar filtros automáticos en todos los managers

5. Testing de seguridad:
   - Login con usuario first_login=true
   - Verificar modal obligatorio de cambio de contraseña
   - Verificar que NO puede acceder sin cambiar contraseña
   - Cambio de contraseña desde perfil

6. Testing de creación jerárquica:
   - faculty-admin crea professor-admin
   - professor-admin crea professor
   - Verificar restricciones de alcance

**Ver:** `GUIA_TESTING.md` para instrucciones detalladas

### Opción B: Continuar con Documentación (FASE 17)
**Estimado:** 2-3 días

**Tareas:**
1. Actualizar README.md principal
2. Crear GUIA_ROLES_V4.md con jerarquía completa
3. Actualizar GUIA_CONFIGURACION_Y_DESPLIEGUE.md
4. Crear guías por rol (opcional):
   - GUIA_SUPER_ADMIN.md
   - GUIA_UNIVERSITY_ADMIN.md
   - GUIA_FACULTY_ADMIN.md
   - GUIA_PROFESSOR_ADMIN.md

### Opción C: Definir FASE 15 (Recuperación de Contraseña)
**Estimado:** 1-2 días

**Decisiones pendientes:**
- ¿Recuperación por email automático?
- ¿Recuperación manual por admin?
- ¿Ambas opciones?

---

## 🔧 CONFIGURACIÓN REQUERIDA

### Backend (.env)
```env
MONGODB_URI=mongodb://localhost:27017/proyecto-correccion
JWT_SECRET=tu-secreto-jwt
N8N_UPLOAD_FILE_TO_DRIVE_WEBHOOK=http://localhost:5678/webhook/...
PORT=3000
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000/api
```

### n8n
- Workflow `upload-file-to-drive.json` importado
- Credenciales de Google Drive configuradas
- Workflow activado

---

## ✅ CHECKLIST DE VERIFICACIÓN

### Sistema Base (V1-V3) - COMPLETADO ✅
- [x] Seed ejecutado correctamente
- [x] n8n configurado y funcionando
- [x] Login funciona con todos los roles
- [x] Super-admin ve todas las universidades
- [x] University-admin solo ve su universidad
- [x] Professor ve solo sus comisiones
- [x] User no tiene acceso a /admin ni /professor
- [x] Routing redirige correctamente por rol
- [x] Upload de archivos a Drive funcionando

### Sistema Multi-Tenant V4 - EN PROGRESO (70%) 🔄
- [x] Modelo User con 6 roles
- [x] Middleware con validación jerárquica
- [x] Controllers con permisos multi-tenant
- [x] Frontend con permisos dinámicos
- [x] roleHelper.ts con lógica centralizada
- [x] Managers con auto-filtrado por contexto
- [x] Cambio de contraseña obligatorio
- [x] Registro público desactivado
- [x] Seed con usuarios de nuevos roles
- [ ] Testing manual completo (PENDIENTE)
- [ ] Documentación final (PENDIENTE)

---

## 🐛 PROBLEMAS CONOCIDOS

### Ninguno
Todos los bugs de sesiones anteriores han sido corregidos.

---

## 📝 NOTAS TÉCNICAS

### Cambios Importantes en V4

1. **Auto-filtrado por Contexto:**
   - `faculty-admin` → filterFacultyId inicializado con su faculty_id
   - `professor-admin` → filterCourseIds inicializado con sus course_ids
   - Formularios pre-rellenados con contexto del usuario

2. **Títulos Dinámicos:**
   - `super-admin` → "Panel de Administración"
   - `university-admin` → "Gestión de UTN"
   - `faculty-admin` → "Gestión de FRM"
   - `professor-admin` → "Gestión de Programación 1"

3. **Tabs Filtrados:**
   - `super-admin` → 7 tabs (todos)
   - `university-admin` → 6 tabs (sin Universidades)
   - `faculty-admin` → 5 tabs (sin Universidades, sin Facultades)
   - `professor-admin` → 3 tabs (Comisiones, Rúbricas, Usuarios)
   - `professor` → 1 tab (Rúbricas)

4. **Seguridad Mejorada:**
   - `first_login` obliga cambio de contraseña
   - Registro público desactivado
   - Solo admins crean usuarios
   - Validación de contraseña (min 8 chars, diferente a actual)

---

## 📞 CONTACTO Y SOPORTE

**Para la próxima sesión:**

1. Lee `ESTADO_ACTUAL.md` para entender el estado del proyecto
2. Lee `PENDIENTE.md` (este archivo) para saber qué falta
3. Lee `PLAN_REFACTORIZACION_V4.md` para detalles técnicos completos
4. Lee `docs/completed-phases/FASE_XX_COMPLETADA.md` para ver qué se hizo en cada fase

**Todo está documentado y organizado.**

---

## 🎯 RECOMENDACIÓN PARA PRÓXIMA SESIÓN

**Prioridad ALTA:** Completar FASE 16.2 (Testing Manual)
- Es crítico validar que el sistema multi-tenant jerárquico funciona correctamente
- El testing revelará si hay bugs o ajustes necesarios antes de la documentación final

**Prioridad MEDIA:** FASE 17 (Documentación Final)
- Solo después de confirmar que todo funciona con el testing

**Prioridad BAJA:** FASE 15 (Recuperación de Contraseña)
- Puede ser implementada después si es necesaria
- No es bloqueante para el sistema base

---

**Última actualización:** 17 de Noviembre, 2025
**Documento generado automáticamente al finalizar FASE 14**
