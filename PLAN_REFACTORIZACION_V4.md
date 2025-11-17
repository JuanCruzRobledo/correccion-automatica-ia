# 📋 PLAN DE REFACTORIZACIÓN V4 - Roles Jerárquicos y Seguridad

**Versión:** 4.0
**Fecha de inicio:** 13 de Noviembre, 2025
**Tipo:** Guía orientada a tareas (NO código completo)
**Duración estimada:** 20-25 días (~4-5 semanas)
**Estado inicial:** Sistema multi-tenant V3 completado al 95%

---

## 🎯 OBJETIVOS PRINCIPALES

### Nuevas Funcionalidades a Implementar

1. **Nuevos Roles Jerárquicos**
   - `faculty-admin`: Admin de Facultad (nivel intermedio entre university-admin y professor)
   - `professor-admin`: Profesor con permisos de gestión de rúbricas de su(s) materia(s)

2. **Mejoras de Seguridad**
   - Cambio de contraseña obligatorio en primer login
   - Recuperación de contraseña ("Olvidé mi contraseña") - **PENDIENTE DE DEFINIR**
   - Desactivar registro público de usuarios

3. **Mejoras de UX**
   - Títulos dinámicos por rol en el panel admin ("Gestión UTN", "Gestión de Ingeniería", etc.)
   - Subtítulos aclarando universidad/facultad según contexto

---

## 👥 JERARQUÍA COMPLETA DE ROLES (V4)

### Estructura de Permisos (De mayor a menor alcance)

```
┌─────────────────────────────────────────────────────────────┐
│ super-admin                                                  │
│ - Acceso global a TODAS las universidades                   │
│ - CRUD completo de todos los recursos                       │
│ - Puede crear: university-admins, faculty-admins, todos     │
│ - Título: "Panel de Administración Global"                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
           ┌───────────┴───────────┐
           │                       │
┌──────────▼──────────┐  ┌────────▼──────────┐
│ university-admin    │  │ university-admin   │
│ (UTN)               │  │ (UNLaM)            │
│                     │  │                    │
│ - Acceso a TODO     │  │ - Acceso a TODO    │
│   de UTN            │  │   de UNLaM         │
│ - CRUD de:          │  │ - CRUD de:         │
│   facultades        │  │   facultades       │
│   carreras          │  │   carreras         │
│   cursos            │  │   cursos           │
│   comisiones        │  │   comisiones       │
│   rúbricas          │  │   rúbricas         │
│   usuarios          │  │   usuarios         │
│ - Puede crear:      │  │ - Puede crear:     │
│   faculty-admins,   │  │   faculty-admins,  │
│   professors,       │  │   professors,      │
│   professor-admins, │  │   professor-admins,│
│   users             │  │   users            │
│ - Título:           │  │ - Título:          │
│   "Gestión UTN"     │  │   "Gestión UNLaM"  │
└──────────┬──────────┘  └────────┬───────────┘
           │                      │
    ┌──────┴──────┐        ┌──────┴──────┐
    │             │        │             │
┌───▼────┐  ┌────▼───┐ ┌──▼─────┐  ┌────▼───┐
│faculty │  │faculty │ │faculty │  │faculty │
│-admin  │  │-admin  │ │-admin  │  │-admin  │
│(FRM)   │  │(FRSN)  │ │(Ingen.)│  │(Exactas│
│        │  │        │ │        │  │        │
│- UTN   │  │- UTN   │ │- UNLaM │  │- UNLaM │
│- CRUD: │  │- CRUD: │ │- CRUD: │  │- CRUD: │
│  carreras│ │carreras│ │carreras│ │carreras│
│  cursos  │ │cursos  │ │cursos  │ │cursos  │
│  comis.  │ │comis.  │ │comis.  │ │comis.  │
│  rúbricas│ │rúbricas│ │rúbricas│ │rúbricas│
│  usuarios│ │usuarios│ │usuarios│ │usuarios│
│- Puede   │ │- Puede │ │- Puede │ │- Puede │
│  crear:  │ │  crear:│ │  crear:│ │  crear:│
│  profess.│ │ profess│ │profess.│ │profess.│
│  prof-adm│ │prof-adm│ │prof-adm│ │prof-adm│
│  users   │ │  users │ │  users │ │  users │
│- NO ve:  │ │- NO ve:│ │- NO ve:│ │- NO ve:│
│  FRSN    │ │  FRM   │ │Exactas │ │Ingen.  │
│- Título: │ │- Título│ │- Título│ │- Título│
│"Gestión  │ │"Gestión│ │"Gestión│ │"Gestión│
│de FRM"   │ │de FRSN"│ │de Ing."│ │Exactas"│
│Subtítulo:│ │Subtít.:│ │Subtít.:│ │Subtít.:│
│"Univ:UTN"│ │"Univ:  │ │"Univ:  │ │"Univ:  │
│          │ │UTN"    │ │UNLaM"  │ │UNLaM"  │
└────┬─────┘ └────┬───┘ └───┬────┘ └────┬───┘
     │            │         │           │
     └──────┬─────┴─────────┴───────────┘
            │
    ┌───────┴───────┐
    │               │
┌───▼──────┐  ┌────▼──────┐
│professor │  │professor  │
│-admin    │  │-admin     │
│          │  │           │
│(Jefe de  │  │(Jefe de   │
│Cátedra)  │  │Cátedra)   │
│          │  │           │
│(Prog 1)  │  │(Prog 2)   │
│          │  │           │
│- Materia │  │- Materia  │
│  asignada│  │  asignada │
│- CRUD:   │  │- CRUD:    │
│  COMISION│  │  COMISION │
│  ES de su│  │  ES de su │
│  materia │  │  materia  │
│- CRUD:   │  │- CRUD:    │
│  RÚBRICAS│  │  RÚBRICAS │
│  de TODAS│  │  de TODAS │
│  comis.  │  │  comis.   │
│  de su   │  │  de su    │
│  materia │  │  materia  │
│- Puede   │  │- Puede    │
│  crear   │  │  crear    │
│  profeso │  │  profeso  │
│  res     │  │  res      │
│  normales│  │  normales │
│  y asig- │  │  y asig-  │
│  narlos  │  │  narlos   │
│- NO puede│  │- NO puede │
│  crear   │  │  crear    │
│  otros   │  │  otros    │
│  prof-adm│  │  prof-adm │
│- SI está │  │- SI está  │
│  asignado│  │  asignado │
│  como    │  │  como     │
│  profesor│  │  profesor │
│  en comis│  │  en comis │
│  puede   │  │  puede    │
│  subir   │  │  subir    │
│  entregas│  │  entregas │
│- Tabs:   │  │- Tabs:    │
│  Comis., │  │  Comis.,  │
│  Rúbricas│  │  Rúbricas │
│  (filtro │  │  (filtro  │
│  por mat.│  │  por mat. │
│  si tiene│  │  si tiene │
│  varias) │  │  varias)  │
│- Título: │  │- Título:  │
│"Gestión  │  │"Gestión   │
│de Prog 1"│  │de Prog 2" │
└────┬─────┘  └────┬──────┘
     │             │
     └──────┬──────┘
            │
    ┌───────┴────────┐
    │                │
┌───▼────┐    ┌─────▼──┐
│professor│   │user    │
│(normal) │   │        │
│         │   │        │
│- Asignado│  │- Solo  │
│  a comis.│  │  acceso│
│  específ.│  │  a     │
│- Puede:  │  │  vista │
│  subir   │  │  de    │
│  entregas│  │  correc│
│- ⭐NUEVO │  │  ción  │
│  CRUD de │  │- NO    │
│  RÚBRICAS│  │  acceso│
│  de SUS  │  │  a     │
│  comisio │  │  /admin│
│  nes     │  │  (excep│
│  asignada│  │  to tab│
│  s       │  │  Rúbri-│
│- NO ve   │  │  cas)  │
│  rúbricas│  │- NO    │
│  de otras│  │  acceso│
│  comis.  │  │  a     │
│- Tab:    │  │  /prof │
│  Rúbricas│  │- Título│
│  (auto-  │  │  N/A   │
│  filtrado│  │        │
│  sin sel.│  │        │
│  filtros)│  │        │
│- Título: │  │        │
│"Gestión  │  │        │
│de Rúbri- │  │        │
│cas"      │  │        │
└──────────┘  └────────┘
```

### Resumen de Permisos por Rol

| Rol | Alcance | Puede crear | Puede gestionar | Vista |
|-----|---------|-------------|-----------------|-------|
| **super-admin** | Global (todas las universidades) | Todos los roles | Todo | `/admin` |
| **university-admin** | Su universidad | faculty-admin, professor-admin, professor, user | Facultades, Carreras, Cursos, Comisiones, Rúbricas, Usuarios | `/admin` |
| **faculty-admin** | Su facultad | professor-admin, professor, user | Carreras, Cursos, Comisiones, Rúbricas, Usuarios (solo de su facultad) | `/admin` |
| **professor-admin** | Su(s) materia(s) | professor, user | **Comisiones** de su materia, **Rúbricas** de todas las comisiones de su materia + subir entregas si está asignado | `/admin` (Tabs: Comisiones, Rúbricas) + `/professor` (si está asignado) |
| **professor** | Sus comisiones asignadas | N/A | **⭐ Rúbricas** de sus comisiones + Subir entregas de alumnos | `/admin` (Tab: Rúbricas) + `/professor` |
| **user** | Solo corrección | N/A | N/A | `/` |

---

## 🗂️ CAMBIOS EN MODELOS

### 1. User (MODIFICAR)

**Estado actual (V3):**
```javascript
role: String (enum: ['super-admin', 'university-admin', 'professor', 'user'])
university_id: String (required si role !== 'super-admin')
```

**Estado nuevo (V4):**
```javascript
role: String (enum: ['super-admin', 'university-admin', 'faculty-admin', 'professor-admin', 'professor', 'user'])
university_id: String (required si role !== 'super-admin')
faculty_id: String (required si role === 'faculty-admin')
course_ids: [String] (array de IDs de cursos/materias, solo para professor-admin)
first_login: Boolean (default: true, indica si debe cambiar contraseña)
```

**Cambios necesarios:**
- [ ] Agregar `'faculty-admin'` y `'professor-admin'` al enum de `role`
- [ ] Agregar campo `faculty_id` (String, required para faculty-admin)
- [ ] Agregar campo `course_ids` (Array de Strings, para professor-admin)
- [ ] Agregar campo `first_login` (Boolean, default: true)
- [ ] Validación pre-save:
  - `faculty_id` obligatorio si role === 'faculty-admin'
  - `course_ids` debe tener al menos 1 elemento si role === 'professor-admin'
- [ ] Método estático: `findByFaculty(faculty_id)`
- [ ] Método estático: `findProfessorAdminsByCourse(course_id)`

**Archivo:** `backend/src/models/User.js`

---

## 🔐 MIDDLEWARE MULTI-TENANT (ACTUALIZAR)

### Archivo: `backend/src/middleware/multiTenant.js`

**Funciones a actualizar:**

#### 1. `checkUniversityAccess(req, res, next)` (MODIFICAR)
- [ ] Agregar validación para `faculty-admin`:
  - Debe validar `university_id` de la facultad
  - Debe validar que el recurso pertenezca a su `faculty_id`
- [ ] Agregar validación para `professor-admin`:
  - Debe validar `university_id`
  - Debe validar que el recurso esté dentro de sus `course_ids`

#### 2. `checkFacultyAccess(req, res, next)` (CREAR NUEVO)
- [ ] Validar que el usuario tenga acceso a una facultad específica:
  - `super-admin`: pasa todo
  - `university-admin`: verifica que la facultad pertenezca a su universidad
  - `faculty-admin`: verifica que sea SU facultad
  - `professor-admin` y `professor`: verificar según sus asignaciones
  - `user`: rechaza

#### 3. `checkCourseAccess(req, res, next)` (CREAR NUEVO)
- [ ] Validar que el usuario tenga acceso a un curso/materia específico:
  - `super-admin`, `university-admin`, `faculty-admin`: pasa todo (según jerarquía)
  - `professor-admin`: verifica que el curso esté en sus `course_ids`
  - `professor`: verifica que tenga comisiones asignadas de ese curso
  - `user`: rechaza

#### 4. `requireRoles(...allowedRoles)` (YA EXISTE - ACTUALIZAR)
- [ ] Agregar `'faculty-admin'` y `'professor-admin'` en las validaciones donde corresponda

---

## 📅 FASES DEL PROYECTO

---

## 🚀 FASE 10: Backend - Actualizar Modelo User y Middleware (3-4 días)

### 🎯 Objetivo
Agregar nuevos roles al sistema y preparar el backend para validaciones jerárquicas.

### 📋 Tareas

#### 10.1. Actualizar Modelo User ✅ COMPLETADO
- [x] Abrir `backend/src/models/User.js`
- [x] Agregar `'faculty-admin'` y `'professor-admin'` al enum de `role`
- [x] Agregar campo `faculty_id` (String, solo required para faculty-admin)
- [x] Agregar campo `course_ids` (Array de Strings, para professor-admin)
- [x] Agregar campo `first_login` (Boolean, default: true)
- [x] Agregar validación pre-save:
  ```
  Si role === 'faculty-admin':
    - Validar que faculty_id esté presente
  Si role === 'professor-admin':
    - Validar que course_ids tenga al menos 1 elemento
  ```
- [x] Agregar método estático `findByFaculty(faculty_id)`
- [x] Agregar método estático `findProfessorAdminsByCourse(course_id)`
- [x] Actualizar índices con faculty_id y course_ids
- [x] Actualizar método toPublicJSON() con nuevos campos

**Tiempo estimado:** 1 día

---

#### 10.2. Actualizar Middleware Multi-Tenant ✅ COMPLETADO
- [x] Abrir `backend/src/middleware/multiTenant.js`

**Modificar `checkUniversityAccess()`:**
- [x] Agregar caso para `faculty-admin`:
  - Validar que `req.body.faculty_id` sea su facultad
- [x] Agregar caso para `professor-admin`:
  - Validar que el recurso pertenezca a uno de sus `course_ids`

**Crear nueva función `checkFacultyAccess(req, res, next)`:**
- [x] `super-admin`: pasa todo
- [x] `university-admin`: validar que la facultad pertenezca a su universidad
- [x] `faculty-admin`: validar que sea SU `faculty_id`
- [x] `professor-admin`: validar que la facultad pertenezca a su universidad
- [x] `professor` y `user`: rechazar (403)

**Crear nueva función `checkCourseAccess(req, res, next)`:**
- [x] `super-admin`: pasa todo
- [x] `university-admin`: validar que el curso pertenezca a su universidad
- [x] `faculty-admin`: validar que el curso pertenezca a su universidad
- [x] `professor-admin`: validar que `course_id` esté en sus `course_ids`
- [x] `professor`: validar que tenga comisiones asignadas de ese curso
- [x] `user`: rechazar (403)

**Actualizar `requireRoles(...allowedRoles)`:**
- [x] Ya soporta los nuevos roles (funciona con cualquier rol en el enum)

**Tiempo estimado:** 2 días

---

#### 10.3. Testing de Middleware ⏳
- [ ] Crear usuario `faculty-admin` de prueba (script temporal o seed)
- [ ] Crear usuario `professor-admin` de prueba
- [ ] Usar Thunder Client o Postman:
  - [ ] `faculty-admin` intenta crear carrera de SU facultad → debe funcionar
  - [ ] `faculty-admin` intenta crear carrera de OTRA facultad → debe fallar (403)
  - [ ] `professor-admin` intenta crear rúbrica de SU materia → debe funcionar
  - [ ] `professor-admin` intenta crear rúbrica de OTRA materia → debe fallar (403)

**Tiempo estimado:** 1 día

---

## 🎨 FASE 11: Backend - Controllers y Rutas (4-5 días)

### 🎯 Objetivo
Actualizar controladores para soportar los nuevos roles y sus restricciones.

### 📋 Tareas

#### 11.1. Actualizar userController ✅ COMPLETADO
- [x] Abrir `backend/src/controllers/userController.js`

**Modificar función `createUser()`:**
- [x] Validar que quien crea el usuario tenga permiso:
  - `super-admin`: puede crear cualquier rol
  - `university-admin`: puede crear `faculty-admin`, `professor-admin`, `professor`, `user`
  - `faculty-admin`: puede crear `professor-admin`, `professor`, `user`
  - Otros roles: no pueden crear usuarios (403)
- [x] Si se crea `faculty-admin`:
  - Validar que `req.body.faculty_id` esté presente
  - Validar que la facultad pertenezca a la universidad correcta
- [x] Si se crea `professor-admin`:
  - Validar que `req.body.course_ids` esté presente (array con al menos 1 curso)
  - Validar alcance según quien crea

**Modificar función `getUsers()` (GET /api/users):**
- [x] Filtrar usuarios según rol:
  - `super-admin`: ve todos
  - `university-admin`: solo usuarios de su universidad
  - `faculty-admin`: solo usuarios de su facultad
  - Otros roles: no tienen acceso (403)

**Modificar función `updateUser()`:**
- [x] Validar que quien actualiza tenga permiso sobre el usuario
- [x] Validar cambios de rol (no permitir escalar privilegios)
- [x] Soporte para actualizar `faculty_id` y `course_ids`

**Tiempo estimado:** 2 días

---

#### 11.2. Actualizar facultyController ✅ COMPLETADO
- [x] Abrir `backend/src/controllers/facultyController.js`

**Modificar función `getFaculties()` (GET /api/faculties):**
- [x] Filtrar facultades según rol:
  - `super-admin`: todas
  - `university-admin`: solo de su universidad
  - `faculty-admin`: solo SU facultad (array de 1 elemento)
  - `professor-admin` y `professor`: de su universidad
  - `user`: acceso denegado (403)

**Modificar función `createFaculty()`:**
- [x] Validar permisos:
  - `super-admin`: puede crear en cualquier universidad
  - `university-admin`: solo en su universidad
  - Otros roles: no pueden crear (403)

**Tiempo estimado:** 1 día

---

#### 11.3. Actualizar careerController ⏳
- [ ] Abrir `backend/src/controllers/careerController.js`

**Modificar función `getCareers()` (GET /api/careers):**
- [ ] Filtrar carreras según rol:
  - `super-admin`: todas
  - `university-admin`: solo de su universidad
  - `faculty-admin`: solo de SU facultad
  - `professor-admin`: carreras de sus cursos
  - `professor`: carreras de sus comisiones

**Modificar función `createCareer()`:**
- [ ] Validar permisos:
  - `super-admin`: puede crear en cualquier facultad
  - `university-admin`: solo en facultades de su universidad
  - `faculty-admin`: solo en SU facultad
  - Otros: no pueden crear (403)
- [ ] Validar que `req.body.faculty_id` sea correcto según el rol del usuario

**Tiempo estimado:** 1 día

---

#### 11.4. Actualizar courseController ⏳
- [ ] Abrir `backend/src/controllers/courseController.js`

**Modificar función `getCourses()` (GET /api/courses):**
- [ ] Filtrar cursos según rol:
  - `super-admin`: todos
  - `university-admin`: solo de su universidad
  - `faculty-admin`: solo de su facultad
  - `professor-admin`: solo sus cursos asignados (basado en `course_ids`)
  - `professor`: cursos de sus comisiones

**Modificar función `createCourse()`:**
- [ ] Validar permisos:
  - `super-admin`: puede crear en cualquier carrera
  - `university-admin`: solo en carreras de su universidad
  - `faculty-admin`: solo en carreras de su facultad
  - `professor-admin`: no puede crear cursos (403)
- [ ] Validar que `req.body.career_id` pertenezca a la facultad/universidad correcta

**Tiempo estimado:** 1 día

---

#### 11.5. Actualizar commissionController ⏳
- [ ] Abrir `backend/src/controllers/commissionController.js`

**Modificar función `getCommissions()` (GET /api/commissions):**
- [ ] Filtrar comisiones según rol:
  - `super-admin`: todas
  - `university-admin`: solo de su universidad
  - `faculty-admin`: solo de su facultad
  - `professor-admin`: solo comisiones de sus cursos (`course_ids`)
  - `professor`: solo comisiones donde está asignado (ya existe en V3)

**Modificar función `createCommission()`:**
- [ ] Validar permisos:
  - `super-admin`: puede crear en cualquier curso
  - `university-admin`: solo en cursos de su universidad
  - `faculty-admin`: solo en cursos de su facultad
  - `professor-admin`: no puede crear comisiones (403)

**Tiempo estimado:** 1 día

---

#### 11.6. Actualizar rubricController ⏳
- [ ] Abrir `backend/src/controllers/rubricController.js`

**Modificar función `getRubrics()` (GET /api/rubrics):**
- [ ] Filtrar rúbricas según rol:
  - `super-admin`: todas
  - `university-admin`: solo de su universidad
  - `faculty-admin`: solo de su facultad
  - `professor-admin`: solo de comisiones de sus cursos (`course_ids`)
  - `professor`: solo de sus comisiones asignadas (ya existe en V3)

**Modificar función `createRubric()`:**
- [ ] Validar permisos:
  - `super-admin`, `university-admin`, `faculty-admin`: pueden crear en comisiones de su alcance
  - `professor-admin`: puede crear SOLO en comisiones de sus cursos asignados (`course_ids`)
  - **⭐ `professor`:** puede crear rúbricas SOLO en comisiones donde está asignado
- [ ] Validar que `req.body.commission_id` esté dentro del alcance del usuario
- [ ] Para `professor`: verificar que esté en `commission.professors` array

**Modificar función `updateRubric()`:**
- [ ] Validar permisos:
  - `super-admin`, `university-admin`, `faculty-admin`: pueden editar rúbricas de su alcance
  - `professor-admin`: puede editar rúbricas de sus cursos
  - **⭐ `professor`:** puede editar rúbricas SOLO de sus comisiones asignadas

**Modificar función `deleteRubric()`:**
- [ ] Validar permisos:
  - `super-admin`, `university-admin`, `faculty-admin`: pueden eliminar rúbricas de su alcance
  - `professor-admin`: puede eliminar rúbricas de sus cursos
  - **⭐ `professor`:** puede eliminar rúbricas SOLO de sus comisiones asignadas

**Tiempo estimado:** 1 día

---

#### 11.7. Testing de Controllers ⏳
- [ ] Crear usuarios de prueba con roles nuevos (seed temporal)
- [ ] Usar Thunder Client o Postman:

**faculty-admin:**
- [ ] GET /api/careers → solo ve carreras de su facultad
- [ ] POST /api/careers (de su facultad) → funciona
- [ ] POST /api/careers (de otra facultad) → falla (403)
- [ ] GET /api/courses → solo ve cursos de su facultad
- [ ] POST /api/commissions (de su facultad) → funciona
- [ ] GET /api/rubrics → solo ve rúbricas de su facultad

**professor-admin:**
- [ ] GET /api/commissions → solo ve comisiones de sus cursos
- [ ] POST /api/commissions (de su curso) → funciona
- [ ] POST /api/commissions (de otro curso) → falla (403)
- [ ] PUT /api/commissions/:id (de su curso) → funciona
- [ ] DELETE /api/commissions/:id (de su curso) → funciona
- [ ] GET /api/rubrics → solo ve rúbricas de sus cursos
- [ ] POST /api/rubrics (de su curso) → funciona
- [ ] POST /api/rubrics (de otro curso) → falla (403)
- [ ] PUT /api/rubrics/:id (de su curso) → funciona
- [ ] DELETE /api/rubrics/:id (de su curso) → funciona
- [ ] POST /api/users (crear professor) → funciona
- [ ] POST /api/users (crear professor-admin) → falla (403)

**professor (normal):**
- [ ] GET /api/rubrics → solo ve rúbricas de sus comisiones asignadas
- [ ] POST /api/rubrics (de su comisión) → funciona
- [ ] POST /api/rubrics (de otra comisión) → falla (403)
- [ ] PUT /api/rubrics/:id (de su comisión) → funciona
- [ ] DELETE /api/rubrics/:id (de su comisión) → funciona
- [ ] POST /api/commissions → falla (403, no puede crear comisiones)

**Tiempo estimado:** 1 día (en paralelo con otras tareas)

---

## 🎨 FASE 12: Frontend - Sistema de Permisos y Filtros (5-6 días)

### 🎯 Objetivo
Actualizar todos los managers del admin panel para soportar los nuevos roles y sus restricciones de visibilidad.

### 📋 Tareas

#### 12.1. Actualizar AuthContext ⏳
- [ ] Abrir `frontend/src/contexts/AuthContext.tsx`
- [ ] Asegurar que `user.role` pueda ser `'faculty-admin'` o `'professor-admin'`
- [ ] Asegurar que `user.faculty_id` y `user.course_ids` se incluyan en el contexto

**Tiempo estimado:** 0.5 días

---

#### 12.2. Crear Helper para Títulos Dinámicos ⏳
- [ ] Crear archivo `frontend/src/utils/roleHelper.ts` (si no existe)
- [ ] Crear función `getAdminPanelTitle(user, selectedResource?)`:
  ```
  Devuelve título y subtítulo según rol:
  - super-admin: "Panel de Administración Global" (sin subtítulo)
  - university-admin: "Gestión UTN" (buscar nombre de universidad_id)
  - faculty-admin: "Gestión de Ingeniería" + subtítulo "Universidad: UTN"
  - professor-admin: "Gestión de Programación 1" (buscar nombre de course_ids[0] si hay 1, o "Gestión de Rúbricas" si hay múltiples)
  ```
- [ ] La función debe hacer fetch de nombres de universidad/facultad/curso según sea necesario
- [ ] Retornar objeto: `{ title: string, subtitle?: string }`

**Tiempo estimado:** 1 día

---

#### 12.3. Actualizar AdminPanel.tsx con Títulos Dinámicos ⏳
- [ ] Abrir `frontend/src/components/admin/AdminPanel.tsx`
- [ ] Importar `getAdminPanelTitle` de `utils/roleHelper`
- [ ] En el componente, llamar a `getAdminPanelTitle(user)` al cargar
- [ ] Mostrar título dinámico en el header del panel:
  ```html
  <h1>{title}</h1>
  {subtitle && <p className="subtitle">{subtitle}</p>}
  ```
- [ ] Actualizar tabs dinámicos según rol:
  - `super-admin`: Universidades, Facultades, Carreras, Cursos, Comisiones, Rúbricas, Usuarios
  - `university-admin`: Facultades, Carreras, Cursos, Comisiones, Rúbricas, Usuarios (sin Universidades)
  - `faculty-admin`: Carreras, Cursos, Comisiones, Rúbricas, Usuarios (sin Universidades, sin Facultades)
  - `professor-admin`: Comisiones, Rúbricas (con filtro por materia si tiene varias)
  - `professor`: Rúbricas (SOLO esta pestaña, auto-filtrado por sus comisiones)

**Tiempo estimado:** 1 día

---

#### 12.4. Actualizar FacultiesManager.tsx ⏳
- [ ] Abrir `frontend/src/components/admin/FacultiesManager.tsx`

**Cambios:**
- [ ] `faculty-admin` NO debería acceder a este manager (ocultar tab en AdminPanel)
- [ ] Si accidentalmente entra, mostrar mensaje: "No tienes permisos para gestionar facultades"
- [ ] Mantener lógica actual para `super-admin` y `university-admin`

**Tiempo estimado:** 0.5 días

---

#### 12.5. Actualizar CareersManager.tsx ⏳
- [ ] Abrir `frontend/src/components/admin/CareersManager.tsx`

**Cambios para faculty-admin:**
- [ ] Ocultar select de "Facultad" en filtros (auto-filtrar por su `faculty_id`)
- [ ] En formulario de creación:
  - [ ] Ocultar select de "Universidad" (auto-llenar con `user.university_id`)
  - [ ] Ocultar select de "Facultad" (auto-llenar con `user.faculty_id`)
  - [ ] Mostrar como read-only: "Facultad: Ingeniería (UTN)"
- [ ] Filtros inicializados con `user.faculty_id`
- [ ] useEffect para sincronizar filtros cuando auth carga

**Tiempo estimado:** 1 día

---

#### 12.6. Actualizar CoursesManager.tsx ⏳
- [ ] Abrir `frontend/src/components/admin/CoursesManager.tsx`

**Cambios para faculty-admin:**
- [ ] Ocultar select de "Universidad" en filtros (auto-filtrar por universidad de su facultad)
- [ ] Ocultar select de "Facultad" en filtros (auto-filtrar por su `faculty_id`)
- [ ] En formulario de creación:
  - [ ] Ocultar select de "Universidad" y "Facultad"
  - [ ] Mostrar como read-only: "Facultad: Ingeniería (UTN)"
  - [ ] Solo mostrar carreras de SU facultad en el select de "Carrera"
- [ ] Filtros inicializados con `user.university_id` y `user.faculty_id`

**Cambios para professor-admin:**
- [ ] `professor-admin` NO debería acceder a este manager (no puede crear cursos)
- [ ] Si accidentalmente entra, mostrar mensaje: "No tienes permisos para gestionar cursos"

**Tiempo estimado:** 1 día

---

#### 12.7. Actualizar CommissionsManager.tsx ⏳
- [ ] Abrir `frontend/src/components/admin/CommissionsManager.tsx`

**Cambios para faculty-admin:**
- [ ] Ocultar select de "Universidad" y "Facultad" en filtros
- [ ] Auto-filtrar por su `faculty_id`
- [ ] En formulario de creación:
  - [ ] Ocultar select de "Universidad", "Facultad"
  - [ ] Mostrar como read-only: "Facultad: Ingeniería (UTN)"
  - [ ] Solo mostrar carreras y cursos de SU facultad

**Cambios para professor-admin:**
- [ ] **SÍ debe acceder a este manager** (puede hacer CRUD de comisiones de su materia)
- [ ] Ocultar select de "Universidad", "Facultad", "Carrera"
- [ ] Mostrar select de "Curso/Materia" con SOLO sus cursos asignados (de `user.course_ids`)
  - [ ] Si tiene 1 solo curso: auto-seleccionar y ocultar filtro
  - [ ] Si tiene múltiples cursos: mostrar filtro para seleccionar
- [ ] En formulario de creación/edición:
  - [ ] Solo mostrar cursos de sus materias asignadas
  - [ ] Validar que la comisión pertenezca a uno de sus cursos antes de enviar
- [ ] Puede asignar profesores a las comisiones de su materia
- [ ] Solo ve comisiones de sus cursos (`course_ids`)

**Cambios para professor:**
- [ ] `professor` NO debería acceder a este manager (no puede crear/editar comisiones)
- [ ] Si accidentalmente entra, mostrar mensaje: "No tienes permisos para gestionar comisiones"

**Tiempo estimado:** 1.5 días

---

#### 12.8. Actualizar RubricsManager.tsx ⏳
- [ ] Abrir `frontend/src/components/admin/RubricsManager.tsx`

**Cambios para faculty-admin:**
- [ ] Ocultar select de "Universidad" y "Facultad" en filtros
- [ ] Auto-filtrar por su `faculty_id`
- [ ] Solo mostrar comisiones de su facultad en el select de "Comisión"

**Cambios para professor-admin:**
- [ ] Ocultar select de "Universidad", "Facultad", "Carrera"
- [ ] Mostrar select de "Curso/Materia" con SOLO sus cursos asignados (de `user.course_ids`)
  - [ ] Si tiene 1 solo curso: auto-seleccionar y ocultar filtro
  - [ ] Si tiene múltiples cursos: mostrar filtro para seleccionar
- [ ] Una vez seleccionado el curso, mostrar select de "Comisión" con todas las comisiones de ese curso
- [ ] En formulario de creación/edición:
  - [ ] Solo puede crear rúbricas en comisiones de sus cursos asignados
  - [ ] Validar antes de enviar al backend

**Cambios para professor (normal):**
- [ ] **⭐ NUEVO:** Professor puede acceder a este manager
- [ ] Ocultar TODOS los filtros (no necesita seleccionar nada)
- [ ] Auto-filtrar por sus comisiones asignadas
- [ ] En formulario de creación/edición:
  - [ ] Select de "Comisión" SOLO muestra sus comisiones asignadas
  - [ ] NO puede crear/editar rúbricas de otras comisiones
  - [ ] Validar que la comisión esté en sus asignaciones antes de enviar
- [ ] Puede hacer CRUD completo de rúbricas de sus comisiones
- [ ] Título del panel: "Gestión de Rúbricas"

**Tiempo estimado:** 2.5 días

---

#### 12.9. Actualizar UsersManager.tsx ⏳
- [ ] Abrir `frontend/src/components/admin/UsersManager.tsx`

**Cambios generales:**
- [ ] Agregar `'faculty-admin'` y `'professor-admin'` al select de "Rol"

**Cambios para faculty-admin:**
- [ ] Ocultar select de "Universidad" en filtros (auto-filtrar por universidad de su facultad)
- [ ] Puede crear: `professor-admin`, `professor`, `user` (no roles de admin superiores)
- [ ] En formulario de creación:
  - [ ] Si crea `professor-admin`:
    - [ ] Mostrar select múltiple de "Cursos/Materias" (solo cursos de su facultad)
    - [ ] Campo `course_ids` requerido
  - [ ] Si crea `professor` o `user`:
    - [ ] Auto-llenar `university_id` y `faculty_id` del admin
- [ ] Filtrar usuarios: solo ve usuarios de su facultad

**Cambios para professor-admin:**
- [ ] **⭐ SÍ debe acceder** a este manager (puede crear profesores)
- [ ] Puede crear: `professor`, `user` (NO puede crear `professor-admin` ni roles superiores)
- [ ] En formulario de creación:
  - [ ] Ocultar select de "Universidad" (auto-llenar con su universidad)
  - [ ] Ocultar select de "Facultad" (auto-llenar con la facultad de sus cursos)
  - [ ] Si crea `professor`:
    - [ ] Mostrar opción para asignarlo a comisiones de sus cursos
  - [ ] Si crea `user`:
    - [ ] Auto-llenar datos básicos
- [ ] Filtrar usuarios: solo ve profesores y usuarios de sus cursos/comisiones

**Cambios para professor (normal):**
- [ ] `professor` NO debería acceder a este manager
- [ ] Si accidentalmente entra, mostrar mensaje: "No tienes permisos para gestionar usuarios"

**Tiempo estimado:** 2.5 días

---

## 🔐 FASE 13: Seguridad - Cambio de Contraseña Obligatorio (3-4 días)

### 🎯 Objetivo
Implementar cambio de contraseña obligatorio en el primer login.

### 📋 Tareas

#### 13.1. Backend - Crear Endpoint de Cambio de Contraseña ⏳
- [ ] Abrir o crear `backend/src/controllers/authController.js`
- [ ] Crear función `changePassword(req, res)`:
  ```
  - Recibe: currentPassword, newPassword
  - Valida que currentPassword sea correcta
  - Valida que newPassword cumpla requisitos (mínimo 8 caracteres, etc.)
  - Actualiza password hasheado
  - Actualiza user.first_login = false
  - Responde con éxito
  ```
- [ ] Crear ruta: `POST /api/auth/change-password` (requiere autenticación)
- [ ] Middleware: `requireAuth` (usuario debe estar logueado)

**Archivo:** `backend/src/routes/authRoutes.js`

**Tiempo estimado:** 1 día

---

#### 13.2. Frontend - Modal de Cambio de Contraseña ⏳
- [ ] Crear componente `frontend/src/components/auth/ChangePasswordModal.tsx`
- [ ] Props: `isOpen: boolean`, `onClose: () => void`, `isFirstLogin: boolean`
- [ ] Formulario con campos:
  - [ ] "Contraseña Actual" (input type="password")
  - [ ] "Nueva Contraseña" (input type="password")
  - [ ] "Confirmar Nueva Contraseña" (input type="password")
- [ ] Validaciones:
  - [ ] Nueva contraseña mínimo 8 caracteres
  - [ ] Nueva contraseña diferente a la actual
  - [ ] Confirmación coincide con nueva contraseña
- [ ] Si `isFirstLogin === true`:
  - [ ] Mostrar mensaje: "Por seguridad, debes cambiar tu contraseña en el primer inicio de sesión"
  - [ ] No mostrar botón "Cancelar" (obligatorio)
- [ ] Si `isFirstLogin === false`:
  - [ ] Mostrar botón "Cancelar"
- [ ] Al enviar:
  - [ ] POST /api/auth/change-password
  - [ ] Si éxito: cerrar modal y actualizar `user.first_login = false` en contexto
  - [ ] Si error: mostrar mensaje

**Tiempo estimado:** 1.5 días

---

#### 13.3. Integrar Modal en Login ⏳
- [ ] Abrir `frontend/src/pages/Login.tsx`
- [ ] Después de login exitoso:
  - [ ] Verificar si `user.first_login === true`
  - [ ] Si es true: abrir `ChangePasswordModal` con `isFirstLogin={true}`
  - [ ] Bloquear redirección hasta que se cambie la contraseña
  - [ ] Una vez cambiada, redirigir según rol

**Tiempo estimado:** 0.5 días

---

#### 13.4. Opción de Cambiar Contraseña en Settings ⏳
- [ ] Crear componente `frontend/src/pages/Settings.tsx` (si no existe)
- [ ] Agregar botón "Cambiar Contraseña"
- [ ] Al hacer click, abrir `ChangePasswordModal` con `isFirstLogin={false}`
- [ ] Agregar link en navbar o menú de usuario

**Tiempo estimado:** 1 día

---

## 🔒 FASE 14: Seguridad - Desactivar Registro Público (1 día)

### 🎯 Objetivo
Ocultar y desactivar la página de registro público de usuarios.

### 📋 Tareas

#### 14.1. Frontend - Comentar Ruta de Registro ⏳
- [ ] Abrir `frontend/src/App.tsx` (o archivo de rutas principal)
- [ ] Buscar la ruta `/register`
- [ ] Comentar la ruta completa:
  ```tsx
  {/* REGISTRO PÚBLICO DESACTIVADO - Solo admins pueden crear usuarios */}
  {/* <Route path="/register" element={<Register />} /> */}
  ```

**Tiempo estimado:** 0.1 días

---

#### 14.2. Frontend - Ocultar Link de Registro en Login ⏳
- [ ] Abrir `frontend/src/pages/Login.tsx`
- [ ] Buscar el mensaje: "¿No tienes cuenta? Regístrate aquí" (o similar)
- [ ] Comentar el mensaje y el link:
  ```tsx
  {/* REGISTRO PÚBLICO DESACTIVADO */}
  {/* <p>¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link></p> */}
  ```

**Tiempo estimado:** 0.1 días

---

#### 14.3. Backend - Desactivar Endpoint de Registro ⏳
- [ ] Abrir `backend/src/routes/authRoutes.js`
- [ ] Buscar la ruta `POST /api/auth/register`
- [ ] Comentar la ruta (NO eliminar):
  ```javascript
  // REGISTRO PÚBLICO DESACTIVADO - Solo admins pueden crear usuarios
  // router.post('/register', register);
  ```
- [ ] Agregar comentario indicando que se desactivó intencionalmente

**Alternativa con flag en .env (RECOMENDADO):**
- [ ] En `backend/.env`, agregar: `ENABLE_PUBLIC_REGISTRATION=false`
- [ ] En `authController.js`, agregar validación al inicio de `register()`:
  ```javascript
  if (process.env.ENABLE_PUBLIC_REGISTRATION !== 'true') {
    return res.status(403).json({ message: 'Registro público desactivado' });
  }
  ```
- [ ] Esto permite re-activarlo fácilmente cambiando el .env

**Tiempo estimado:** 0.3 días

---

#### 14.4. Testing ⏳
- [ ] Intentar acceder a `/register` en el navegador → debe redirigir a 404 o login
- [ ] Verificar que el link no aparezca en la página de login
- [ ] Intentar hacer POST a `/api/auth/register` con Postman → debe fallar (403)

**Tiempo estimado:** 0.5 días

---

## ⏸️ FASE 15: Recuperación de Contraseña (PENDIENTE DE DEFINIR)

### 🎯 Objetivo
Implementar flujo de "Olvidé mi contraseña".

### ⚠️ ESTADO: PENDIENTE

**Opciones a evaluar:**

#### Opción A: Recuperación por Email (Automática)
- Requiere configurar servicio de email (SendGrid, Nodemailer, etc.)
- Usuario ingresa email
- Se envía link con token de reset
- Token tiene expiración (ej: 1 hora)
- Usuario hace click en link, ingresa nueva contraseña

**Ventajas:** Más seguro, automático, mejor UX
**Desventajas:** Requiere configurar email, más complejo

#### Opción B: Recuperación Manual (Por Admin)
- Usuario contacta a su admin
- Admin usa botón "Resetear Contraseña" en UsersManager
- Se genera contraseña temporal
- Admin comunica contraseña temporal al usuario
- Usuario entra con temporal y se fuerza cambio

**Ventajas:** Simple, no requiere email
**Desventajas:** Requiere intervención manual, menos UX

#### Opción C: Combinación (Híbrida)
- Ofrecer ambas opciones según configuración
- Si `EMAIL_SERVICE_ENABLED=true`: usar opción A
- Si no: usar opción B

**Decisión:** ⏳ **PENDIENTE DE DEFINIR EN PRÓXIMA SESIÓN**

---

## 🧪 FASE 16: Testing Completo de Nuevos Roles (4-5 días)

### 🎯 Objetivo
Validar que todos los nuevos roles funcionen correctamente con sus restricciones.

### 📋 Tareas

#### 16.1. Actualizar Seed Database ⏳
- [ ] Abrir `backend/scripts/seedDatabase.js`
- [ ] Agregar usuarios de prueba con los nuevos roles:
  ```
  - faculty-admin-frm@utn.edu.ar (faculty_id: FRM - UTN)
  - faculty-admin-frsn@utn.edu.ar (faculty_id: FRSN - UTN)
  - faculty-admin-ing@unlam.edu.ar (faculty_id: Ingeniería - UNLaM)
  - prof-admin-prog1@utn.edu.ar (course_ids: [Programación 1], también asignado como profesor a comisión)
  - prof-admin-prog2@utn.edu.ar (course_ids: [Programación 2], NO asignado como profesor)
  ```
- [ ] Asegurar que cada usuario tenga `first_login: true` por defecto
- [ ] Ejecutar seed: `node scripts/seedDatabase.js`

**Tiempo estimado:** 1 día

---

#### 16.2. Testing Manual - faculty-admin ⏳

**Escenario: faculty-admin de FRM (UTN)**

- [ ] Login como `faculty-admin-frm@utn.edu.ar` / `admin123`
- [ ] Se abre modal de cambio de contraseña (first_login) → cambiar a `newpassword123`
- [ ] Redirige a `/admin`
- [ ] Verificar título: "Gestión de FRM" + subtítulo "Universidad: UTN"
- [ ] Verificar tabs visibles:
  - [ ] NO ve: Universidades, Facultades
  - [ ] SÍ ve: Carreras, Cursos, Comisiones, Rúbricas, Usuarios

**Tab Carreras:**
- [ ] Solo ve carreras de FRM (no ve carreras de FRSN)
- [ ] Puede crear carrera nueva en FRM
- [ ] En formulario de creación:
  - [ ] NO ve select de Universidad ni Facultad
  - [ ] Ve texto read-only: "Facultad: FRM (UTN)"
- [ ] Carrera creada aparece en la lista

**Tab Cursos:**
- [ ] Solo ve cursos de carreras de FRM
- [ ] Puede crear curso en carrera de FRM
- [ ] En formulario:
  - [ ] Solo ve carreras de FRM en el select
- [ ] Curso creado aparece

**Tab Comisiones:**
- [ ] Solo ve comisiones de cursos de FRM
- [ ] Puede crear comisión en curso de FRM
- [ ] Puede asignar profesores de su facultad

**Tab Rúbricas:**
- [ ] Solo ve rúbricas de comisiones de FRM
- [ ] Puede crear rúbrica en comisión de FRM
- [ ] Upload de PDF funciona

**Tab Usuarios:**
- [ ] Solo ve usuarios de FRM (o sin facultad asignada)
- [ ] Puede crear usuarios con roles: `professor-admin`, `professor`, `user`
- [ ] Al crear `professor-admin`:
  - [ ] Aparece select múltiple de "Cursos/Materias"
  - [ ] Solo ve cursos de FRM
  - [ ] Selecciona "Programación 3" y crea usuario
- [ ] NO puede crear `super-admin`, `university-admin`, `faculty-admin`

**Restricciones:**
- [ ] Intenta acceder manualmente a `/admin` con datos de otra facultad (usando devtools para manipular requests) → debe fallar (403)
- [ ] Logout

**Tiempo estimado:** 1.5 días

---

#### 16.3. Testing Manual - professor-admin ⏳

**Escenario A: professor-admin asignado como profesor a comisión**

- [ ] Login como `prof-admin-prog1@utn.edu.ar` / `admin123`
- [ ] Cambiar contraseña (first_login)
- [ ] Redirige a `/admin` (porque tiene tab de Rúbricas)
- [ ] Verificar título: "Gestión de Programación 1"
- [ ] Verificar tabs visibles:
  - [ ] SÍ ve: Comisiones, Rúbricas
  - [ ] NO ve: Universidades, Facultades, Carreras, Cursos, Usuarios

**Tab Comisiones:**
- [ ] Solo ve comisiones de Programación 1
- [ ] Puede crear comisión nueva en Programación 1
- [ ] Puede editar/eliminar comisiones de Programación 1
- [ ] Puede asignar profesores a sus comisiones
- [ ] NO ve comisiones de otras materias

**Tab Rúbricas:**
- [ ] Solo ve rúbricas de comisiones de Programación 1
- [ ] Puede crear rúbrica en cualquier comisión de Programación 1
- [ ] Puede editar/eliminar rúbricas de Programación 1
- [ ] NO ve rúbricas de Programación 2 u otras materias

**Navegación:**
- [ ] Aparece link en navbar: "Mis Comisiones" (porque está asignado como profesor)
- [ ] Click en "Mis Comisiones" → redirige a `/professor`
- [ ] En `/professor`:
  - [ ] Ve SOLO la comisión donde está asignado como profesor
  - [ ] Puede subir entregas de alumnos
  - [ ] Puede ver/eliminar entregas

**Escenario B: professor-admin NO asignado como profesor**

- [ ] Logout y login como `prof-admin-prog2@utn.edu.ar` / `admin123`
- [ ] Cambiar contraseña (first_login)
- [ ] Redirige a `/admin`
- [ ] Verificar título: "Gestión de Programación 2"
- [ ] Ve tabs: Comisiones, Rúbricas

**Tab Comisiones:**
- [ ] Solo ve comisiones de Programación 2
- [ ] Puede crear/editar comisiones de Programación 2

**Tab Rúbricas:**
- [ ] Solo ve rúbricas de Programación 2
- [ ] Puede crear/editar rúbricas de Programación 2

**Navegación:**
- [ ] NO aparece link "Mis Comisiones" en navbar (porque no está asignado como profesor)
- [ ] Intenta acceder manualmente a `/professor` → redirige a login o muestra mensaje "No tienes comisiones asignadas"

**Tiempo estimado:** 1.5 días

---

#### 16.4. Testing Manual - professor (normal) ⭐ NUEVO ⏳

**Escenario: Professor asignado a comisión específica**

- [ ] Crear usuario `professor1@utn.edu.ar` con rol `professor`
- [ ] Asignarlo a comisión "2025-Prog1-1K1" desde UsersManager o CommissionsManager
- [ ] Login como `professor1@utn.edu.ar` / `admin123`
- [ ] Cambiar contraseña (first_login)
- [ ] Redirige a `/admin` (porque tiene tab de Rúbricas)
- [ ] Verificar título: "Gestión de Rúbricas"
- [ ] Verificar tabs visibles:
  - [ ] SOLO ve: Rúbricas
  - [ ] NO ve: Universidades, Facultades, Carreras, Cursos, Comisiones, Usuarios

**Tab Rúbricas:**
- [ ] SOLO ve rúbricas de comisión "2025-Prog1-1K1"
- [ ] NO hay filtros visibles (auto-filtrado)
- [ ] Puede crear rúbrica nueva:
  - [ ] Select de "Comisión" SOLO muestra "2025-Prog1-1K1"
  - [ ] NO puede seleccionar otras comisiones
- [ ] Upload de PDF funciona
- [ ] Puede editar rúbricas de su comisión
- [ ] Puede eliminar rúbricas de su comisión
- [ ] NO ve rúbricas de otras comisiones (ni de Prog 1 ni de otras materias)

**Navegación:**
- [ ] Aparece link "Mis Comisiones" en navbar
- [ ] Click en "Mis Comisiones" → redirige a `/professor`
- [ ] En `/professor`:
  - [ ] Ve comisión "2025-Prog1-1K1"
  - [ ] Puede subir entregas de alumnos
  - [ ] Puede ver/eliminar entregas

**Restricciones:**
- [ ] Intenta crear rúbrica de otra comisión (manipulando request con devtools) → debe fallar (403)
- [ ] Intenta acceder a CommissionsManager → bloqueado o mensaje de error
- [ ] Intenta acceder a UsersManager → bloqueado o mensaje de error

**Tiempo estimado:** 1 día

---

#### 16.5. Testing de Aislamiento Multi-Tenant ⏳

**Validar restricciones estrictas:**

- [ ] Login como `faculty-admin-frm` → SOLO ve recursos de FRM
- [ ] Login como `faculty-admin-frsn` → SOLO ve recursos de FRSN (no ve FRM)
- [ ] Login como `faculty-admin-ing@unlam` → SOLO ve recursos de Ingeniería de UNLaM (no ve UTN)

**Intentos de acceso no autorizado (con Postman):**

- [ ] `faculty-admin-frm` intenta crear carrera en FRSN:
  ```
  POST /api/careers
  Body: { name: "Test", faculty_id: "id-de-FRSN" }
  Resultado: 403 Forbidden
  ```
- [ ] `professor-admin-prog1` intenta crear rúbrica de Programación 2:
  ```
  POST /api/rubrics
  Body: { name: "Test", commission_id: "comision-de-prog2" }
  Resultado: 403 Forbidden
  ```
- [ ] `faculty-admin-frm` intenta ver usuarios de FRSN:
  ```
  GET /api/users?faculty_id=id-de-FRSN
  Resultado: 403 o lista vacía (según implementación)
  ```

**Tiempo estimado:** 1 día

---

#### 16.5. Testing de Cambio de Contraseña ⏳

**First Login:**
- [ ] Crear usuario nuevo en UsersManager (cualquier rol)
- [ ] Asignarle contraseña: `temporal123`
- [ ] Logout y login como ese usuario
- [ ] Modal de cambio de contraseña aparece automáticamente
- [ ] Intentar cerrar modal → no se puede (obligatorio)
- [ ] Intentar ingresar contraseña débil ("123") → error de validación
- [ ] Cambiar a contraseña válida: `newpassword123`
- [ ] Modal se cierra, usuario es redirigido según su rol
- [ ] Logout y re-login → NO aparece modal (ya no es first_login)

**Cambio desde Settings:**
- [ ] Con cualquier usuario, acceder a Settings o perfil
- [ ] Click en "Cambiar Contraseña"
- [ ] Modal aparece (ahora con botón "Cancelar")
- [ ] Ingresar contraseña actual incorrecta → error
- [ ] Ingresar contraseña actual correcta + nueva contraseña
- [ ] Éxito → modal se cierra
- [ ] Logout y login con nueva contraseña → funciona

**Tiempo estimado:** 1 día

---

## 📝 FASE 17: Documentación (2-3 días)

### 🎯 Objetivo
Actualizar documentación del proyecto con los nuevos roles y features.

### 📋 Tareas

#### 17.1. Actualizar ESTADO_ACTUAL.md ⏳
- [ ] Abrir `ESTADO_ACTUAL.md`
- [ ] Actualizar versión: 3.2 → 4.0
- [ ] Actualizar progreso: 95% → considerando las nuevas features
- [ ] Agregar sección: "Nuevos Roles (V4)"
  - [ ] Describir `faculty-admin`
  - [ ] Describir `professor-admin`
  - [ ] Incluir jerarquía visual (copiar del diagrama de este plan)
- [ ] Agregar sección: "Mejoras de Seguridad (V4)"
  - [ ] Cambio de contraseña obligatorio
  - [ ] Desactivación de registro público
- [ ] Actualizar fecha a fecha de finalización

**Tiempo estimado:** 1 día

---

#### 17.2. Actualizar PENDIENTE.md ⏳
- [ ] Abrir `PENDIENTE.md`
- [ ] Marcar tareas de V4 como completadas:
  - [ ] Nuevos roles implementados
  - [ ] Seguridad mejorada
  - [ ] Testing completado
- [ ] Agregar sección: "Pendiente de V4"
  - [ ] Recuperación de contraseña (si aún no se definió)
  - [ ] Documentación técnica de módulos (si aplica)

**Tiempo estimado:** 0.5 días

---

#### 17.3. Crear GUIA_ROLES_V4.md (NUEVO) ⏳
- [ ] Crear archivo `GUIA_ROLES_V4.md` en raíz
- [ ] Documentar cada rol con:
  - [ ] Descripción
  - [ ] Permisos
  - [ ] Qué puede ver/hacer
  - [ ] Qué NO puede hacer
  - [ ] Capturas de pantalla (opcional pero recomendado)
- [ ] Incluir diagrama de jerarquía de este plan
- [ ] Ejemplos de uso:
  - [ ] Cómo crear un faculty-admin
  - [ ] Cómo asignar un professor-admin a múltiples materias
  - [ ] Flujo de cambio de contraseña

**Tiempo estimado:** 1 día

---

#### 17.4. Actualizar README.md principal ⏳
- [ ] Abrir `README.md` en raíz
- [ ] Actualizar tabla de roles (agregar faculty-admin y professor-admin)
- [ ] Agregar nota sobre registro público desactivado
- [ ] Agregar nota sobre cambio de contraseña obligatorio
- [ ] Actualizar sección de "Próximos pasos" si hay features pendientes

**Tiempo estimado:** 0.5 días

---

## 📊 RESUMEN DE FASES

| Fase | Nombre | Duración Estimada | Estado |
|------|--------|-------------------|--------|
| **FASE 10** | Backend - Modelo User y Middleware | 3-4 días | ✅ Completada |
| **FASE 11** | Backend - Controllers y Rutas | 4-5 días | ✅ Completada |
| **FASE 12** | Frontend - Permisos y Filtros | 5-6 días | ⏳ Pendiente |
| **FASE 13** | Seguridad - Cambio de Contraseña | 3-4 días | ⏳ Pendiente |
| **FASE 14** | Seguridad - Desactivar Registro | 1 día | ⏳ Pendiente |
| **FASE 15** | Recuperación de Contraseña | ⏸️ Pendiente definir | ⏸️ En espera |
| **FASE 16** | Testing Completo | 4-5 días | ⏳ Pendiente |
| **FASE 17** | Documentación | 2-3 días | ⏳ Pendiente |

**Duración Total Estimada:** 22-28 días (sin contar FASE 15)

---

## 🎯 CHECKLIST GENERAL DE VERIFICACIÓN

### Backend
- [x] Modelo User actualizado con nuevos roles y campos
- [x] Middleware multi-tenant soporta faculty-admin y professor-admin
- [ ] Todos los controllers filtran recursos según jerarquía de roles
- [ ] Validaciones de permisos funcionan correctamente
- [ ] Endpoint de cambio de contraseña implementado
- [ ] Registro público desactivado

### Frontend
- [ ] Títulos dinámicos implementados en AdminPanel
- [ ] Todos los managers filtran recursos según rol
- [ ] Tabs dinámicos según rol (faculty-admin solo ve sus tabs)
- [ ] professor-admin ve tabs: Comisiones, Rúbricas (con filtro por materia)
- [ ] **⭐ professor (normal) ve tab: Rúbricas (auto-filtrado por sus comisiones)**
- [ ] Modal de cambio de contraseña funciona (first_login)
- [ ] Link de registro eliminado/comentado en Login

### Testing
- [ ] faculty-admin solo accede a recursos de su facultad
- [ ] professor-admin accede a comisiones y rúbricas de sus materias
- [ ] professor-admin puede crear profesores normales
- [ ] professor-admin puede subir entregas SOLO si está asignado como profesor
- [ ] **⭐ professor (normal) puede hacer CRUD de rúbricas de sus comisiones**
- [ ] **⭐ professor (normal) NO ve rúbricas de otras comisiones**
- [ ] Cambio de contraseña obligatorio funciona en first_login
- [ ] Intentos de acceso no autorizado fallan correctamente (403)
- [ ] Aislamiento multi-tenant verificado entre facultades

### Documentación
- [ ] ESTADO_ACTUAL.md actualizado con V4
- [ ] PENDIENTE.md actualizado
- [ ] GUIA_ROLES_V4.md creada
- [ ] README.md actualizado

---

## 💡 NOTAS IMPORTANTES

### Sobre la Jerarquía de Roles
- **Cada admin puede gestionar TODO lo que le "pertenece" según su nivel:**
  - `super-admin`: TODAS las universidades y todo lo que contienen
  - `university-admin`: SU universidad y todo lo que contiene (facultades, carreras, etc.)
  - `faculty-admin`: SU facultad y todo lo que contiene (carreras de esa facultad, cursos, comisiones, etc.)
  - `professor-admin` (Jefe de Cátedra): Comisiones y Rúbricas de SUS materias asignadas + puede crear profesores
  - **⭐ `professor` (normal):** Rúbricas de SUS comisiones asignadas (NUEVO en V4)

### Sobre professor-admin (Jefe de Cátedra)
- Es un rol **híbrido** y de **gestión**:
  - Puede hacer CRUD de **comisiones** de su materia
  - Puede hacer CRUD de **rúbricas** de todas las comisiones de su materia
  - Puede **crear profesores normales** y asignarlos a comisiones
  - **NO** puede crear otros `professor-admin`
  - Si está asignado como profesor en alguna comisión → tiene acceso a `/professor` (subir entregas)
  - Siempre tiene acceso a `/admin` (tabs: Comisiones, Rúbricas)
- Puede ser admin de **múltiples materias** (array `course_ids`)
- Filtro por materia si tiene múltiples

### ⭐ Sobre professor (normal) - CAMBIO IMPORTANTE V4
- **ANTES (V3):** Solo podía subir entregas, NO podía gestionar rúbricas
- **AHORA (V4):**
  - Puede hacer **CRUD completo de rúbricas** de sus comisiones asignadas
  - Accede a `/admin` con tab "Rúbricas" (auto-filtrado, sin selects de filtros)
  - Solo ve/edita rúbricas de SUS comisiones (no ve otras)
  - También accede a `/professor` para subir entregas (como antes)

### Sobre Seguridad
- `first_login: true` se establece al crear usuario
- Se cambia a `false` después del primer cambio de contraseña exitoso
- Contraseñas deben cumplir requisitos mínimos (definir en validación)
- Recuperación de contraseña queda como **feature opcional/futura**

### Sobre Títulos Dinámicos
- Mejoran UX al dejar claro el contexto de gestión
- Subtítulos aclarar la universidad cuando es necesario
- Ayudan a evitar confusión en sistemas multi-tenant

---

## 📞 CONTACTO ENTRE SESIONES

Si retomas este proyecto en otra sesión, lee primero:
1. **Este archivo** (`PLAN_REFACTORIZACION_V4.md`) - Para saber qué falta
2. **ESTADO_ACTUAL.md** - Para ver el progreso actual
3. **PENDIENTE.md** - Para ver tareas inmediatas

Cada fase tiene checkboxes `[ ]` que debes marcar `[x]` al completarlas.

---

**Creado:** 13 de Noviembre, 2025
**Estado:** 🚀 **LISTO PARA INICIAR**
