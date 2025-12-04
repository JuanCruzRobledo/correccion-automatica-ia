# Plan: Integración de Creación de Carpetas en Drive durante Seed

**Objetivo:** Hacer que el comando `npm run seed` cree automáticamente la jerarquía completa de carpetas en Google Drive, sincronizando la estructura de MongoDB con la organización de archivos en Drive.

**Fecha de creación:** Diciembre 2025
**Estado:** ⏳ Pendiente
**Prioridad:** Alta

---

## Contexto

Actualmente, el script `seedDatabase.js` crea las entidades en MongoDB (Universidades, Facultades, Carreras, Cursos, Comisiones), pero **NO** crea las carpetas correspondientes en Google Drive. Esto significa que al ejecutar el seed en un entorno nuevo, la estructura de Drive queda vacía y debe crearse manualmente a medida que se usan los endpoints de la aplicación.

Este plan busca **automatizar completamente** la creación de la jerarquía de carpetas en Drive durante el seed, haciendo el proyecto 100% portable y fácil de ejecutar.

---

## Alcance Reducido del Seed

Para simplificar el seed y hacerlo más manejable, la nueva versión creará **únicamente**:

### Estructura Simplificada

```
Universidad: UTN
└── Facultad: FRM (Facultad Regional Mendoza)
    ├── Carrera: Ingeniería en Sistemas de Información
    │   └── Materias:
    │       ├── Programación 1 (2025)
    │       │   ├── Comisión 1
    │       │   │   ├── Entregas/
    │       │   │   └── Rubricas/
    │       │   ├── Comisión 2
    │       │   │   ├── Entregas/
    │       │   │   └── Rubricas/
    │       │   ├── Comisión 3
    │       │   │   ├── Entregas/
    │       │   │   └── Rubricas/
    │       │   └── Comisión 4
    │       │       ├── Entregas/
    │       │       └── Rubricas/
    │       ├── Programación 2 (2025)
    │       │   ├── Comisión 1
    │       │   │   ├── Entregas/
    │       │   │   └── Rubricas/
    │       │   ├── Comisión 2
    │       │   │   ├── Entregas/
    │       │   │   └── Rubricas/
    │       │   ├── Comisión 3
    │       │   │   ├── Entregas/
    │       │   │   └── Rubricas/
    │       │   └── Comisión 4
    │       │       ├── Entregas/
    │       │       └── Rubricas/
    │       └── Programación 3 (2025)
    │           ├── Comisión 1
    │           │   ├── Entregas/
    │           │   └── Rubricas/
    │           ├── Comisión 2
    │           │   ├── Entregas/
    │           │   └── Rubricas/
    │           ├── Comisión 3
    │           │   ├── Entregas/
    │           │   └── Rubricas/
    │           └── Comisión 4
    │               ├── Entregas/
    │               └── Rubricas/
    │
    └── Carrera: Tecnicatura en Programación
        └── Materias:
            ├── Programación 1 (2025)
            │   ├── Comisión 1
            │   │   ├── Entregas/
            │   │   └── Rubricas/
            │   ├── Comisión 2
            │   │   ├── Entregas/
            │   │   └── Rubricas/
            │   ├── Comisión 3
            │   │   ├── Entregas/
            │   │   └── Rubricas/
            │   └── Comisión 4
            │       ├── Entregas/
            │       └── Rubricas/
            ├── Programación 2 (2025)
            │   ├── Comisión 1
            │   │   ├── Entregas/
            │   │   └── Rubricas/
            │   ├── Comisión 2
            │   │   ├── Entregas/
            │   │   └── Rubricas/
            │   ├── Comisión 3
            │   │   ├── Entregas/
            │   │   └── Rubricas/
            │   └── Comisión 4
            │       ├── Entregas/
            │       └── Rubricas/
            └── Programación 3 (2025)
                ├── Comisión 1
                │   ├── Entregas/
                │   └── Rubricas/
                ├── Comisión 2
                │   ├── Entregas/
                │   └── Rubricas/
                ├── Comisión 3
                │   ├── Entregas/
                │   └── Rubricas/
                └── Comisión 4
                    ├── Entregas/
                    └── Rubricas/
```

**Total de carpetas a crear:**
- 1 Universidad
- 1 Facultad
- 2 Carreras
- 6 Materias (3 por carrera)
- 24 Comisiones (4 por materia)
- 48 Subcarpetas (Entregas + Rubricas por comisión)

**Total:** ~82 carpetas

---

## Arquitectura de la Solución

### Variables de Entorno Necesarias

**Backend `.env`:**
```env
# Modo de seed
SEED_CREATE_DRIVE_FOLDERS=true  # true: crea carpetas, false: solo MongoDB

# Webhooks de n8n para creación de carpetas
N8N_CREATE_UNIVERSITY_FOLDER_WEBHOOK=http://localhost:5678/webhook/create-university-folder
N8N_CREATE_FACULTY_FOLDER_WEBHOOK=http://localhost:5678/webhook/create-faculty-folder
N8N_CREATE_CAREER_FOLDER_WEBHOOK=http://localhost:5678/webhook/create-career-folder
N8N_CREATE_COURSE_FOLDER_WEBHOOK=http://localhost:5678/webhook/create-course-folder
N8N_CREATE_COMMISSION_FOLDER_WEBHOOK=http://localhost:5678/webhook/create-commission-folder
```

**n8n variables de entorno:**
```env
GOOGLE_DRIVE_ROOT_FOLDER_ID=1abc...xyz  # ID de la carpeta raíz en Drive
GOOGLE_GEMINI_API_KEY=tu-api-key
```

### Flujo del Seed Modificado

```
1. Conectar a MongoDB
2. Limpiar base de datos (dropDatabase)

3. UNIVERSIDADES:
   a. Insertar en MongoDB
   b. Si SEED_CREATE_DRIVE_FOLDERS: crear carpetas en Drive
   c. Mostrar resumen

4. FACULTADES:
   a. Insertar en MongoDB
   b. Si SEED_CREATE_DRIVE_FOLDERS: crear carpetas en Drive
   c. Mostrar resumen

5. CARRERAS:
   a. Insertar en MongoDB
   b. Si SEED_CREATE_DRIVE_FOLDERS: crear carpetas en Drive
   c. Mostrar resumen

6. CURSOS/MATERIAS:
   a. Insertar en MongoDB
   b. Si SEED_CREATE_DRIVE_FOLDERS: crear carpetas en Drive
   c. Mostrar resumen

7. USUARIOS:
   a. Crear usuarios (sin cambios)

8. COMISIONES:
   a. Insertar en MongoDB
   b. Si SEED_CREATE_DRIVE_FOLDERS: crear carpetas en Drive
   c. Mostrar resumen (incluye Entregas + Rubricas)

9. RÚBRICAS:
   a. Insertar en MongoDB (sin cambios)

10. ASIGNAR PROFESORES:
    a. Asignar profesores a comisiones (sin cambios)

11. Mostrar resumen final consolidado
12. Desconectar de MongoDB
```

---

## Fases de Implementación

### FASE 1: Preparación y Configuración ⏳

**Objetivo:** Configurar las variables de entorno y validar que n8n esté listo.

#### Tareas

- [ ] **1.1** Agregar variable `SEED_CREATE_DRIVE_FOLDERS` a `.env.example` del backend
- [ ] **1.2** Agregar todas las URLs de webhooks de carpetas a `.env.example`
- [ ] **1.3** Copiar `.env.example` a `.env` y configurar con valores reales
- [ ] **1.4** Verificar que n8n esté corriendo (`http://localhost:5678`)
- [ ] **1.5** Verificar que los 5 workflows de creación de carpetas estén activos en n8n:
  - `create-university-folder`
  - `create-faculty-folder`
  - `create-career-folder`
  - `create-course-folder`
  - `create-commission-folder`
- [ ] **1.6** Verificar que `GOOGLE_DRIVE_ROOT_FOLDER_ID` esté configurado en n8n
- [ ] **1.7** Verificar credenciales de Google Drive en n8n

**Entregables:**
- `.env` configurado con webhooks de n8n
- n8n operativo con workflows activos
- Carpeta raíz en Drive identificada y accesible

**Criterio de completitud:**
✅ Todos los webhooks responden correctamente con un POST de prueba (usar Thunder Client/Postman)

---

### FASE 2: Simplificación de Datos del Seed ⏳

**Objetivo:** Reducir el alcance del seed a solo UTN → FRM → 2 carreras → 3 materias → 4 comisiones.

#### Tareas

- [ ] **2.1** Modificar array `universities` en `seedDatabase.js`:
  - Dejar solo UTN
  - Eliminar UBA
- [ ] **2.2** Modificar array `faculties` en `seedDatabase.js`:
  - Dejar solo FRM (Facultad Regional Mendoza)
  - Eliminar FRSN, FRA, FRBA, FIUBA, FCEyN
- [ ] **2.3** Modificar array `careers` en `seedDatabase.js`:
  - Dejar solo:
    - `isi-frm` (Ingeniería en Sistemas de Información)
    - `tup-frm` (Tecnicatura en Programación) [NUEVO]
  - Eliminar todas las demás carreras
- [ ] **2.4** Modificar array `courses` en `seedDatabase.js`:
  - Para ISI-FRM: Programación 1, 2, 3
  - Para TUP-FRM: Programación 1, 2, 3
  - Eliminar Bases de Datos, Diseño de Sistemas y todas las de UBA
- [ ] **2.5** Modificar la creación de comisiones en `seedDatabase.js`:
  - Cambiar el loop para crear 4 comisiones por curso (actualmente crea 2)
  - Mantener nomenclatura: `comision-1`, `comision-2`, `comision-3`, `comision-4`
- [ ] **2.6** Ajustar creación de usuarios:
  - Eliminar usuarios de UBA
  - Mantener solo: superadmin, admin-utn, admin-frm, profesores de FRM, usuario regular
- [ ] **2.7** Ajustar asignación de profesores:
  - Solo asignar a comisiones de FRM

**Entregables:**
- `seedDatabase.js` simplificado con estructura reducida
- Datos de seed validados manualmente (revisar arrays)

**Criterio de completitud:**
✅ Ejecutar `npm run seed` (sin Drive aún) y verificar que MongoDB tenga:
  - 1 universidad (UTN)
  - 1 facultad (FRM)
  - 2 carreras
  - 6 cursos/materias (3 por carrera)
  - 24 comisiones (4 por materia)

---

### FASE 3: Integración de Drive en el Seed - Universidades y Facultades ⏳

**Objetivo:** Implementar la creación de carpetas de Universidades y Facultades durante el seed.

#### Tareas

- [ ] **3.1** Importar `driveService` en `seedDatabase.js`
  ```javascript
  import * as driveService from '../src/services/driveService.js';
  ```
- [ ] **3.2** Crear función auxiliar `createDriveFoldersIfEnabled()`:
  - Verificar si `process.env.SEED_CREATE_DRIVE_FOLDERS === 'true'`
  - Retornar `true` o `false`
- [ ] **3.3** Después de insertar universidades en MongoDB:
  - Si `createDriveFoldersIfEnabled()` es `true`:
    - Iterar sobre `createdUniversities`
    - Llamar a `driveService.createUniversityFolder(university.university_id)`
    - Usar `Promise.allSettled()` para no bloquear en errores
    - Mostrar logs por cada carpeta creada o fallida
- [ ] **3.4** Después de insertar facultades en MongoDB:
  - Si `createDriveFoldersIfEnabled()` es `true`:
    - Iterar sobre `createdFaculties`
    - Llamar a `driveService.createFacultyFolder(faculty.faculty_id, faculty.university_id)`
    - Usar `Promise.allSettled()`
    - Mostrar logs
- [ ] **3.5** Agregar contador de éxitos/fallos para el resumen final

**Entregables:**
- `seedDatabase.js` con integración de Drive para universidades y facultades
- Logs informativos durante la ejecución

**Criterio de completitud:**
✅ Ejecutar `npm run seed` y verificar:
  - MongoDB tiene 1 universidad y 1 facultad
  - Drive tiene la carpeta `utn/` y dentro `frm/`
  - Logs muestran "✅ Carpeta de universidad creada: utn"
  - Logs muestran "✅ Carpeta de facultad creada: frm (en utn)"

---

### FASE 4: Integración de Drive - Carreras y Materias ⏳

**Objetivo:** Implementar la creación de carpetas de Carreras y Materias/Cursos durante el seed.

#### Tareas

- [ ] **4.1** Después de insertar carreras en MongoDB:
  - Si `createDriveFoldersIfEnabled()` es `true`:
    - Iterar sobre `createdCareers`
    - Llamar a `driveService.createCareerFolder(career.career_id, career.faculty_id, career.university_id)`
    - Usar `Promise.allSettled()`
    - Mostrar logs
- [ ] **4.2** Después de insertar cursos en MongoDB:
  - Si `createDriveFoldersIfEnabled()` es `true`:
    - Iterar sobre `createdCourses`
    - Llamar a `driveService.createCourseFolder(course.course_id, course.career_id, course.faculty_id, course.university_id)`
    - Usar `Promise.allSettled()`
    - Mostrar logs
- [ ] **4.3** Agregar progreso visual (ej: "Creando carpetas de carreras... 1/2... 2/2")

**Entregables:**
- `seedDatabase.js` con integración de Drive para carreras y materias
- Logs con progreso visual

**Criterio de completitud:**
✅ Ejecutar `npm run seed` y verificar:
  - Drive tiene la estructura:
    ```
    utn/
    └── frm/
        ├── isi-frm/
        │   ├── 2025-isi-frm-programacion-1/
        │   ├── 2025-isi-frm-programacion-2/
        │   └── 2025-isi-frm-programacion-3/
        └── tup-frm/
            ├── 2025-tup-frm-programacion-1/
            ├── 2025-tup-frm-programacion-2/
            └── 2025-tup-frm-programacion-3/
    ```

---

### FASE 5: Integración de Drive - Comisiones (con Entregas y Rubricas) ⏳

**Objetivo:** Implementar la creación de carpetas de Comisiones durante el seed (incluye subcarpetas Entregas y Rubricas).

#### Tareas

- [ ] **5.1** Después de insertar comisiones en MongoDB:
  - Si `createDriveFoldersIfEnabled()` es `true`:
    - Iterar sobre `createdCommissions`
    - Llamar a `driveService.createCommissionFolder(commission.commission_id, commission.course_id, commission.career_id, commission.faculty_id, commission.university_id)`
    - Usar `Promise.allSettled()`
    - Mostrar logs indicando que también se crearon Entregas y Rubricas
- [ ] **5.2** Ajustar timeout en `driveService.createCommissionFolder()`:
  - Verificar que el timeout sea de al menos 45 segundos (crea 3 carpetas: comisión + Entregas + Rubricas)
- [ ] **5.3** Agregar indicador de progreso para las 24 comisiones (puede tardar ~2-3 minutos)

**Entregables:**
- `seedDatabase.js` con integración completa de Drive
- Logs detallados para las 24 comisiones

**Criterio de completitud:**
✅ Ejecutar `npm run seed` y verificar:
  - Drive tiene 24 carpetas de comisiones (4 por materia)
  - Cada comisión tiene 2 subcarpetas: `Entregas/` y `Rubricas/`
  - Logs muestran: "✅ Carpeta de comisión creada: [...] (con subcarpetas Entregas y Rubricas)"

---

### FASE 6: Resumen Final y Manejo de Errores ⏳

**Objetivo:** Implementar un resumen consolidado al final del seed y mejorar el manejo de errores.

#### Tareas

- [ ] **6.1** Crear objeto `driveStats` para trackear:
  ```javascript
  const driveStats = {
    universities: { success: 0, failed: 0 },
    faculties: { success: 0, failed: 0 },
    careers: { success: 0, failed: 0 },
    courses: { success: 0, failed: 0 },
    commissions: { success: 0, failed: 0 }
  };
  ```
- [ ] **6.2** Actualizar `driveStats` después de cada llamada a Drive con `Promise.allSettled()`
- [ ] **6.3** Al final del seed, mostrar resumen consolidado:
  ```
  ==========================================================
  ✅ MIGRACIÓN COMPLETADA EXITOSAMENTE
  ==========================================================
  📊 Resumen MongoDB:
     - Universidades: 1
     - Facultades: 1
     - Carreras: 2
     - Cursos: 6
     - Comisiones: 24
     - Rúbricas: X
     - Usuarios: X

  📊 Resumen Google Drive:
     - Carpetas creadas: 82/82 (100%)
     - Universidades: 1/1
     - Facultades: 1/1
     - Carreras: 2/2
     - Materias: 6/6
     - Comisiones: 24/24 (con Entregas y Rubricas)
     - Fallos: 0
  ==========================================================
  ```
- [ ] **6.4** Si `SEED_CREATE_DRIVE_FOLDERS` es `false`, mostrar mensaje informativo:
  ```
  ⚠️  SEED_CREATE_DRIVE_FOLDERS está desactivado. Solo se creó la estructura en MongoDB.
  ```
- [ ] **6.5** Si alguna carpeta falla, mostrar warning específico:
  ```
  ⚠️  Advertencias:
     - Falló carpeta de universidad: utn (Error: ...)
  ```

**Entregables:**
- Resumen final detallado con estadísticas de MongoDB y Drive
- Manejo robusto de errores sin bloquear el seed

**Criterio de completitud:**
✅ Ejecutar `npm run seed` y verificar:
  - Resumen final muestra estadísticas completas
  - Si hay errores, se muestran warnings pero el seed continúa
  - MongoDB queda consistente incluso si Drive falla parcialmente

---

### FASE 7: Testing y Validación ⏳

**Objetivo:** Validar que el seed funciona correctamente en diferentes escenarios.

#### Tareas

- [ ] **7.1** Testear seed con `SEED_CREATE_DRIVE_FOLDERS=true`:
  - Ejecutar `npm run seed`
  - Verificar estructura completa en MongoDB
  - Verificar estructura completa en Drive (manualmente desde Google Drive UI)
  - Verificar que no hay carpetas duplicadas
- [ ] **7.2** Testear seed con `SEED_CREATE_DRIVE_FOLDERS=false`:
  - Ejecutar `npm run seed`
  - Verificar que solo se crea estructura en MongoDB
  - Verificar que Drive no se toca
- [ ] **7.3** Testear seed con n8n apagado (con `SEED_CREATE_DRIVE_FOLDERS=true`):
  - Apagar n8n
  - Ejecutar `npm run seed`
  - Verificar que MongoDB se crea correctamente
  - Verificar que se muestran warnings sobre Drive
  - Verificar que el seed no se bloquea
- [ ] **7.4** Testear re-ejecución del seed:
  - Ejecutar `npm run seed` dos veces seguidas
  - Verificar comportamiento con carpetas existentes en Drive
  - Documentar si es necesario limpiar Drive manualmente
- [ ] **7.5** Verificar que los endpoints de la aplicación siguen funcionando:
  - Login con usuarios del seed
  - Ver comisiones filtradas correctamente
  - Crear una rúbrica (debería usar carpetas existentes en Drive)
- [ ] **7.6** Testear tiempos de ejecución:
  - Medir cuánto tarda el seed completo con Drive
  - Medir cuánto tarda sin Drive
  - Documentar tiempos esperados

**Entregables:**
- Reporte de testing con resultados de todos los escenarios
- Documentación de tiempos de ejecución
- Identificación de issues (si los hay)

**Criterio de completitud:**
✅ Todos los tests pasaron exitosamente
✅ Seed funciona en modo con Drive y sin Drive
✅ Seed es robusto ante fallos de n8n o Drive

---

### FASE 8: Documentación y Actualización de READMEs ⏳

**Objetivo:** Actualizar la documentación del proyecto con las nuevas capacidades del seed.

#### Tareas

- [ ] **8.1** Actualizar `README.md` principal (raíz del proyecto):
  - Sección "Inicio Rápido" → agregar prerequisito de n8n activo
  - Sección "Configurar Backend" → agregar variables de entorno de Drive
  - Agregar nota sobre `SEED_CREATE_DRIVE_FOLDERS`
  - Actualizar tiempos de ejecución del seed
- [ ] **8.2** Actualizar `backend/README.md`:
  - Agregar sección sobre configuración de variables de entorno para Drive
  - Documentar el nuevo comportamiento del seed
  - Agregar troubleshooting para errores comunes con Drive
- [ ] **8.3** Actualizar `.env.example` del backend:
  - Agregar todas las nuevas variables:
    ```env
    # Seed configuration
    SEED_CREATE_DRIVE_FOLDERS=true

    # n8n webhooks for Drive folder creation
    N8N_CREATE_UNIVERSITY_FOLDER_WEBHOOK=http://localhost:5678/webhook/create-university-folder
    N8N_CREATE_FACULTY_FOLDER_WEBHOOK=http://localhost:5678/webhook/create-faculty-folder
    N8N_CREATE_CAREER_FOLDER_WEBHOOK=http://localhost:5678/webhook/create-career-folder
    N8N_CREATE_COURSE_FOLDER_WEBHOOK=http://localhost:5678/webhook/create-course-folder
    N8N_CREATE_COMMISSION_FOLDER_WEBHOOK=http://localhost:5678/webhook/create-commission-folder
    ```
- [ ] **8.4** Actualizar `docs/TROUBLESHOOTING.md`:
  - Agregar sección "Problemas con el Seed y Drive"
  - Documentar errores comunes:
    - n8n no está corriendo
    - Webhooks mal configurados
    - Credenciales de Google inválidas
    - Carpetas duplicadas en Drive
    - Timeouts en la creación de carpetas
- [ ] **8.5** Crear/actualizar `docs/PARA_PROXIMA_SESION.md`:
  - Documentar que el seed ahora crea carpetas en Drive
  - Agregar notas sobre limpieza manual de Drive si es necesario
- [ ] **8.6** Actualizar `n8n-workflows/README.md`:
  - Agregar sección sobre la importancia de tener workflows activos para el seed
  - Documentar que los workflows deben estar activos **antes** de ejecutar el seed

**Entregables:**
- README.md actualizado
- backend/README.md actualizado
- .env.example actualizado
- TROUBLESHOOTING.md actualizado
- PARA_PROXIMA_SESION.md actualizado
- n8n-workflows/README.md actualizado

**Criterio de completitud:**
✅ Un nuevo desarrollador puede leer los READMEs y ejecutar el seed con Drive exitosamente sin ayuda externa

---

## Resumen de Cambios

### Archivos Modificados

1. **`backend/scripts/seedDatabase.js`**
   - Reducir datos a: UTN → FRM → 2 carreras → 6 materias → 24 comisiones
   - Importar `driveService`
   - Agregar lógica de creación de carpetas en Drive después de cada inserción en MongoDB
   - Agregar variable de entorno `SEED_CREATE_DRIVE_FOLDERS`
   - Implementar `Promise.allSettled()` para paralelizar sin bloquear
   - Agregar resumen final consolidado

2. **`backend/.env.example`**
   - Agregar `SEED_CREATE_DRIVE_FOLDERS`
   - Agregar 5 webhooks de n8n para creación de carpetas

3. **`README.md`** (raíz)
   - Actualizar sección "Inicio Rápido" con prerequisitos de n8n
   - Actualizar sección "Configurar Backend" con nuevas variables
   - Agregar nota sobre portabilidad del seed

4. **`backend/README.md`**
   - Documentar nuevo comportamiento del seed
   - Agregar guía de configuración de Drive

5. **`docs/TROUBLESHOOTING.md`**
   - Agregar sección de problemas con el seed y Drive

6. **`docs/PARA_PROXIMA_SESION.md`**
   - Documentar estado actual del seed con Drive

7. **`n8n-workflows/README.md`**
   - Agregar instrucciones sobre workflows activos para el seed

### Archivos Creados

1. **`docs/plans/PLAN_SEED_CON_DRIVE_FOLDERS.md`** (este archivo)
   - Plan detallado con fases y checks

---

## Criterios de Éxito Global

Al completar todas las fases, el proyecto debe cumplir:

✅ **Portabilidad 100%:** Clonar el repo + configurar .env + `npm run seed` → sistema completo funcionando

✅ **Flexibilidad:** Seed funciona con o sin Drive (`SEED_CREATE_DRIVE_FOLDERS`)

✅ **Robustez:** Seed no se bloquea si n8n falla o Drive tiene problemas

✅ **Feedback Claro:** Logs informativos muestran progreso y errores en tiempo real

✅ **Documentación Completa:** Cualquier desarrollador nuevo puede seguir los READMEs y tener el sistema funcionando

✅ **Testing Exitoso:** Seed testeado en múltiples escenarios (con Drive, sin Drive, n8n apagado, re-ejecución)

✅ **Estructura Simplificada:** Seed crea solo UTN → FRM → 2 carreras → 6 materias → 24 comisiones (82 carpetas en total)

---

## Estimación de Tiempos

| Fase | Tiempo estimado | Complejidad |
|------|-----------------|-------------|
| Fase 1 | 30 minutos | Baja |
| Fase 2 | 45 minutos | Media |
| Fase 3 | 1 hora | Media |
| Fase 4 | 45 minutos | Media |
| Fase 5 | 1 hora | Media |
| Fase 6 | 45 minutos | Media |
| Fase 7 | 1.5 horas | Alta |
| Fase 8 | 1 hora | Baja |
| **TOTAL** | **~7 horas** | - |

**Tiempo de ejecución del seed completo con Drive:** ~3-5 minutos (crear 82 carpetas)

**Tiempo de ejecución del seed sin Drive:** ~5-10 segundos (solo MongoDB)

---

## Notas Importantes

### Dependencias Críticas

1. **n8n debe estar corriendo** antes de ejecutar el seed con `SEED_CREATE_DRIVE_FOLDERS=true`
2. **Workflows de n8n deben estar activos:**
   - `create-university-folder`
   - `create-faculty-folder`
   - `create-career-folder`
   - `create-course-folder`
   - `create-commission-folder`
3. **Credenciales de Google Drive** deben estar configuradas en n8n
4. **Variable `GOOGLE_DRIVE_ROOT_FOLDER_ID`** debe estar en n8n

### Limitaciones Conocidas

- **Idempotencia:** Si se ejecuta el seed dos veces, se crearán carpetas duplicadas en Drive. Es necesario limpiar Drive manualmente antes de re-ejecutar.
- **Timeouts:** Si la red es lenta o Google Drive tiene alta latencia, algunas carpetas pueden fallar. El seed continuará pero mostrará warnings.
- **Orden estricto:** Las carpetas deben crearse en orden jerárquico (Universidad → Facultad → Carrera → Materia → Comisión). No se puede crear una Facultad antes de su Universidad.

### Posibles Mejoras Futuras

- [ ] Agregar flag `--clean-drive` para limpiar Drive automáticamente antes del seed
- [ ] Implementar verificación de carpetas existentes antes de crear (evitar duplicados)
- [ ] Agregar retry automático para carpetas que fallan
- [ ] Crear script de validación post-seed (`npm run validate-seed`) que compare MongoDB vs Drive
- [ ] Agregar barra de progreso visual en consola durante creación de carpetas
- [ ] Paralelizar creación de comisiones (actualmente secuencial por seguridad)

---

## Checklist General de Progreso

### Preparación
- [ ] Plan leído y comprendido
- [ ] n8n instalado y corriendo
- [ ] Workflows de n8n importados y activos
- [ ] Variables de entorno configuradas
- [ ] Google Drive accesible

### Implementación
- [ ] Fase 1 completada ✅
- [ ] Fase 2 completada ✅
- [ ] Fase 3 completada ✅
- [ ] Fase 4 completada ✅
- [ ] Fase 5 completada ✅
- [ ] Fase 6 completada ✅
- [ ] Fase 7 completada ✅
- [ ] Fase 8 completada ✅

### Validación Final
- [ ] Seed ejecutado exitosamente con Drive
- [ ] Estructura verificada en MongoDB
- [ ] Estructura verificada en Google Drive (visualmente)
- [ ] READMEs actualizados y revisados
- [ ] Troubleshooting documentado
- [ ] Testing en múltiples escenarios completado

---

**Estado del Plan:** ⏳ Pendiente de inicio

**Próximo paso:** Comenzar con Fase 1 - Preparación y Configuración

**Última actualización:** Diciembre 2025
