# 📋 Plan de Refactorización: Excel por Rúbrica (CORREGIDO Y VALIDADO)

## 🎯 Objetivo

**PROBLEMA ACTUAL:**
- El workflow `flujo_correccion_masiva` intenta crear el archivo `entregas.xlsx` si no existe
- Esto genera errores porque busca/crea el Excel en el lugar incorrecto
- El frontend NO está enviando el `spreadsheet_id` al webhook

**SOLUCIÓN:**
1. **Crear el `entregas.xlsx` al momento de crear la carpeta de la rúbrica** (en `create-submission-folder`)
2. **Modificar el workflow de corrección masiva** para que use el Excel existente (sin intentar crearlo)
3. **Actualizar el frontend** para que envíe el `spreadsheet_id` al iniciar corrección automática

---

## 📁 Flujo ANTES vs DESPUÉS

### ❌ ANTES (Actual - CON ERROR)

```
1. Admin crea Rúbrica → Workflow: create-submission-folder
   └─ Crea carpeta "global-mutantes-..."
   └─ NO crea Excel

2. Profesor hace "Corrección Masiva" → Workflow: flujo_correccion_masiva
   └─ Busca Excel en la carpeta
   └─ Si NO existe, intenta crearlo ← ERROR AQUÍ
   └─ Escribe fila por cada alumno
```

### ✅ DESPUÉS (Nuevo - SIN ERROR)

```
1. Admin crea Rúbrica → Workflow: create-submission-folder
   └─ Crea carpeta "global-mutantes-..."
   └─ Crea Excel "entregas.xlsx" con headers ← SE MUEVE AQUÍ
   └─ Devuelve: folder_id + spreadsheet_id + spreadsheet_url

2. Profesor hace "Corrección Masiva" → Workflow: flujo_correccion_masiva
   └─ Recibe spreadsheet_id (ya existe)
   └─ Por cada alumno: escribe fila en el Excel
   └─ NO intenta crear el Excel
```

---

## 📊 Estructura del Excel

**Archivo**: `entregas.xlsx` (dentro de la carpeta de cada rúbrica)

**Columnas**:

| alumno | puntaje_total | criterios | fortalezas | recomendaciones |
|--------|---------------|-----------|------------|-----------------|
| juan-perez | 85 | {...} | Buen código... | Mejorar... |
| maria-garcia | 92 | {...} | Excelente... | Agregar tests... |

---

## 🚀 Fases de Implementación

---

### **FASE 1: Modificar Workflow `create-submission-folder` - Agregar Creación de Excel** ✅

**Objetivo**: Al crear una carpeta de rúbrica, también crear el archivo `entregas.xlsx` con headers.

**Archivo a modificar**: `n8n-workflows/create-submission-folder.json`

**Cambios a realizar**:
1. **Después** del nodo que crea la carpeta de la rúbrica
2. **Agregar** nodo "Google Sheets" → "Create Spreadsheet"
3. **Configurar**:
   - Nombre: `entregas.xlsx`
   - Ubicación: Dentro de la carpeta creada (`folder_id`)
   - Primera fila (headers): `alumno | puntaje_total | criterios | fortalezas | recomendaciones`
4. **Modificar** el nodo final "Respond Success" para devolver:
   ```json
   {
     "success": true,
     "folder_id": "ID_CARPETA_RUBRICA",
     "spreadsheet_id": "ID_DEL_EXCEL",
     "spreadsheet_url": "URL_DEL_EXCEL"
   }
   ```

**Testing**:
- [ ] Importar workflow modificado en n8n
- [ ] Activar el workflow
- [ ] Probar manualmente desde n8n (botón "Test Workflow")
- [ ] Verificar que se cree:
  - [ ] Carpeta de rúbrica
  - [ ] Archivo `entregas.xlsx` dentro de la carpeta
  - [ ] Excel con headers correctos
- [ ] Copiar URL del webhook de producción

**Estado**: [✅] Completado

**Notas**:
```
Fecha de inicio: 2025-12-02
Fecha de finalización: 2025-12-02
URL del webhook: (configurar en n8n después de importar)
Cambios realizados:
- Agregado nodo "Create Entregas Spreadsheet" después de "Create submission Folder"
- Spreadsheet creado con headers: alumno,puntaje_total,criterios,fortalezas,recomendaciones
- Nodo "Respond Success5" modificado para devolver spreadsheet_id y spreadsheet_url
- Flujo actualizado: Create submission Folder → Create Entregas Spreadsheet → Respond Success5

Problemas encontrados:


Soluciones aplicadas:


```

---

### **FASE 2: Modificar Workflow `flujo_correccion_masiva` - Quitar Creación de Excel** ✅

**Objetivo**: Eliminar la lógica que intenta crear el Excel si no existe. El Excel YA debe existir.

**Archivo a modificar**: `n8n-workflows/flujo_correccion_masiva.json`

**Nodos a ELIMINAR (nombres exactos):**
1. **`Search files and folders23`** (línea ~532-553)
   - Busca archivo "Entregas" en la carpeta de comisión
   - Query: `"Entregas"`

2. **`If`** (línea ~570-594)
   - Verifica si `$json.name` existe
   - Condicional que decide crear o usar Excel existente

3. **`Create spreadsheet`** (línea ~56-82)
   - Crea spreadsheet con título "Entregas"
   - Solo se ejecuta si el IF detecta que no existe

4. **`Move file`** (línea ~84-116)
   - Mueve el spreadsheet creado a la carpeta correcta

**Nodo a MODIFICAR:**
5. **`Append row in sheet2`** (línea ~596-634)
   - **ANTES (línea ~600):**
     ```javascript
     documentId: {
       value: "={{ $('Search files and folders23').item.json.id || $('Create spreadsheet').item.json.spreadsheetId }}"
     }
     ```
   - **DESPUÉS:**
     ```javascript
     documentId: {
       value: "={{ $('DATOS2').item.json.spreadsheet_id }}"
     }
     ```

**Lógica ANTES (a eliminar)**:
```
Search files and folders23 → buscar "Entregas"
  ↓
If → ¿existe?
  ├─ NO → Create spreadsheet → Move file
  └─ SÍ → continuar
  ↓
Append row (usa ID del Search o del Create)
```

**Lógica DESPUÉS (nueva)**:
```
DATOS2 (webhook input) → contiene spreadsheet_id
  ↓
Append row (usa spreadsheet_id directamente)
```

**Testing**:
- [ ] Importar workflow modificado en n8n
- [ ] Activar el workflow
- [ ] Probar con un `spreadsheet_id` existente
- [ ] Verificar que:
  - [ ] NO intenta crear el Excel
  - [ ] SÍ escribe las filas correctamente
  - [ ] Funciona con múltiples alumnos

**Estado**: [✅] Completado

**Notas**:
```
Fecha de inicio: 2025-12-02
Fecha de finalización: 2025-12-02
Método utilizado: Script automatizado (backend/scripts/modify-workflow.js)
Nodos eliminados: Search files and folders23, If, Create spreadsheet, Move file
Cambios realizados:
- Eliminados 4 nodos y sus conexiones
- Modificado "Append row in sheet2":
  * ANTES: $('Search files and folders23').item.json.id || $('Create spreadsheet').item.json.spreadsheetId
  * DESPUÉS: $('DATOS2').item.json.spreadsheet_id
- Nodos totales: 30 (era 34)

Testing pendiente por el usuario:
- Importar workflow en n8n
- Probar corrección masiva end-to-end

Problemas encontrados:


Soluciones aplicadas:


```

---

### **FASE 3: Actualizar Modelo de Rúbrica - Agregar Campos de Excel** ✅

**Objetivo**: Almacenar el ID y URL del Excel en cada rúbrica.

**Archivo a modificar**: `backend/src/models/Rubric.js`

**Cambios a realizar**:
1. Agregar campo `spreadsheet_file_id` (String, default: null)
2. Agregar campo `spreadsheet_file_url` (String, default: null)
3. Agregar comentarios explicativos

**Código a agregar** (después del campo `drive_folder_id`):
```javascript
// ID del archivo entregas.xlsx en Google Drive
spreadsheet_file_id: {
  type: String,
  default: null
},

// URL directa al archivo entregas.xlsx
spreadsheet_file_url: {
  type: String,
  default: null
},
```

**Testing**:
- [✅] Código sin errores de sintaxis
- [ ] Reiniciar backend (pendiente por el usuario)
- [ ] Verificar que MongoDB acepta los nuevos campos
- [ ] Crear rúbrica de prueba (los campos pueden ser null)

**Estado**: [✅] Completado

**Notas**:
```
Fecha de inicio: 2025-12-02
Fecha de finalización: 2025-12-02
Errores de sintaxis: NO
Backend reiniciado: PENDIENTE (debe hacerlo el usuario)
Cambios realizados:
- Agregados dos campos nuevos al schema después de drive_folder_id:
  * spreadsheet_file_id (String, default: null, indexed)
  * spreadsheet_file_url (String, default: null)
- Ambos campos incluyen comentarios explicativos

Problemas encontrados:


Soluciones aplicadas:


```

---

### **FASE 4: Modificar Controller de Rúbricas - Guardar IDs del Excel** ✅

**Objetivo**: Al crear una rúbrica, guardar el `spreadsheet_id` y `spreadsheet_url` devueltos por n8n.

**Archivo a modificar**: `backend/src/controllers/rubricController.js`

**Funciones a modificar (2):**

#### 4.1. Función `createRubric`

**Ubicación**: Buscar donde se guarda `drive_folder_id` (aprox. línea 312-314)

**ANTES:**
```javascript
if (driveResponse.success && driveResponse.folder_id) {
  newRubric.drive_folder_id = driveResponse.folder_id;
  newRubric.drive_folder_url = driveResponse.folder_url;
}
```

**DESPUÉS:**
```javascript
if (driveResponse.success && driveResponse.folder_id) {
  newRubric.drive_folder_id = driveResponse.folder_id;
  newRubric.drive_folder_url = driveResponse.folder_url;

  // Guardar IDs del spreadsheet (agregado en FASE 1)
  if (driveResponse.spreadsheet_id) {
    newRubric.spreadsheet_file_id = driveResponse.spreadsheet_id;
    newRubric.spreadsheet_file_url = driveResponse.spreadsheet_url;
    console.log(`✅ Spreadsheet creado: ${driveResponse.spreadsheet_id}`);
  } else {
    console.warn('⚠️ El workflow no devolvió spreadsheet_id (verifica FASE 1)');
  }
}
```

#### 4.2. Función `createRubricFromPDF`

**Ubicación**: Buscar donde se guarda `drive_folder_id` en esta función

**Aplicar el mismo cambio** que en 4.1

**Testing**:
- [ ] Crear rúbrica de prueba desde el frontend (Admin Panel) [PENDIENTE - usuario]
- [ ] Verificar en logs del backend que se guardaron los IDs [PENDIENTE - usuario]
- [ ] Verificar en MongoDB que la rúbrica tiene los campos [PENDIENTE - usuario]
- [ ] Abrir Google Drive y verificar el Excel [PENDIENTE - usuario]

**Estado**: [✅] Completado

**Notas**:
```
Fecha de inicio: 2025-12-02
Fecha de finalización: 2025-12-02
Cambios realizados:
- Modificada función createRubric (líneas 314-330):
  * Agregado código para guardar spreadsheet_file_id y spreadsheet_file_url
  * Agregado console.log para debugging
  * Agregado warning si el workflow no devuelve spreadsheet_id
- Modificada función createRubricFromPDF (líneas 499-515):
  * Mismos cambios que en createRubric
  * Ambas funciones ahora guardan los 3 IDs: folder_id, spreadsheet_id, spreadsheet_url

Testing pendiente por el usuario:
- Reiniciar backend
- Crear rúbrica de prueba
- Verificar logs y MongoDB

Problemas encontrados:


Soluciones aplicadas:


```

---

### **FASE 5: Modificar Frontend - Pasar spreadsheet_id al Webhook** ✅

**Objetivo**: Cuando se haga click en "Iniciar Corrección Automática", enviar el `spreadsheet_id` al webhook.

**Archivo a modificar**: `frontend-correccion-automatica-n8n/src/components/user/UserView.tsx`

**Función a modificar**: `handleBatchGrading` (línea 428-488)

**Cambios a realizar**:

1. **Ubicar la sección de payload** (línea 457-466):
   ```javascript
   const response = await axios.post(webhookUrl, {
     university_id: selectedUniversityId,
     faculty_id: selectedFacultyId,
     career_id: selectedCareerId,
     course_id: selectedCourseId,
     commission_id: selectedCommissionId,
     rubric_id: rubric.rubric_id,
     rubric_json: rubric.rubric_json,
     gemini_api_key: userProfile.gemini_api_key,
   });
   ```

2. **AGREGAR** el campo `spreadsheet_file_id`:
   ```javascript
   const response = await axios.post(webhookUrl, {
     university_id: selectedUniversityId,
     faculty_id: selectedFacultyId,
     career_id: selectedCareerId,
     course_id: selectedCourseId,
     commission_id: selectedCommissionId,
     rubric_id: rubric.rubric_id,
     rubric_json: rubric.rubric_json,
     gemini_api_key: userProfile.gemini_api_key,
     spreadsheet_id: rubric.spreadsheet_file_id, // ← NUEVO CAMPO
   });
   ```

3. **Agregar validación** antes de enviar (línea 447-450):
   ```javascript
   // Verificar que la rúbrica tiene spreadsheet_id
   if (!rubric.spreadsheet_file_id) {
     throw new Error('La rúbrica no tiene un archivo de entregas configurado. Por favor, recrea la rúbrica.');
   }
   ```

**Nota**: El webhook espera que el campo se llame `spreadsheet_id` (sin el prefijo `file_`), por eso mapeamos `rubric.spreadsheet_file_id` → `spreadsheet_id`

**Testing**:
- [ ] Reiniciar el frontend (`npm run dev`)
- [ ] Desde UserView, seleccionar una rúbrica
- [ ] Click en "Iniciar Corrección Automática"
- [ ] Abrir DevTools → Network → Ver el payload del POST
- [ ] Verificar que incluye: `spreadsheet_id: "1abc...xyz"`
- [ ] Verificar en n8n que el nodo DATOS2 recibe el campo `spreadsheet_id`
- [ ] Verificar que las filas se escriben en el Excel correcto (el de esa rúbrica)
- [ ] **CRÍTICO**: Si la rúbrica no tiene `spreadsheet_file_id` (es vieja), debe mostrar error claro

**Estado**: [✅] Completado

**Notas**:
```
Fecha de inicio: 2025-12-02
Fecha de finalización: 2025-12-02
Cambios realizados:
- Agregada validación en handleBatchGrading (líneas 452-455):
  * Verifica que rubric.spreadsheet_file_id existe
  * Muestra error claro si la rúbrica no tiene spreadsheet configurado
- Agregado campo al payload (línea 471):
  * spreadsheet_id: rubric.spreadsheet_file_id
  * Se envía junto con los demás datos al webhook

Testing pendiente por el usuario:
- Reiniciar frontend (npm run dev)
- Probar con rúbrica nueva (con spreadsheet_id)
- Verificar en DevTools que se envía el campo

Problemas encontrados:


Soluciones aplicadas:


```

---

### **FASE 6: Testing Integral del Sistema** ⏳

**Objetivo**: Probar todo el flujo end-to-end.

**Escenarios de prueba**:

#### 6.1. Crear Nueva Rúbrica
- [ ] Admin crea rúbrica "TP-Test-Refactor" desde Admin Panel
- [ ] Se crea carpeta en Google Drive
- [ ] Se crea archivo `entregas.xlsx` dentro de la carpeta
- [ ] Excel tiene headers: `alumno | puntaje_total | criterios | fortalezas | recomendaciones`
- [ ] MongoDB: Rúbrica tiene `spreadsheet_file_id` y `spreadsheet_file_url`

#### 6.2. Subir Entregas Individuales
- [ ] Profesor sube entrega de "alumno-test-1"
- [ ] Se crea carpeta del alumno
- [ ] Se sube `entrega.txt`
- [ ] Submission se guarda en MongoDB

#### 6.3. Corrección Masiva (END-TO-END CRÍTICO)
- [ ] Ir a `UserView` (frontend)
- [ ] Seleccionar: Universidad → Facultad → Carrera → Materia → Comisión → Rúbrica
- [ ] Click en "Iniciar Corrección Automática" (botón derecho)
- [ ] Abrir DevTools → Network:
  - [ ] Verificar POST a `VITE_BATCH_GRADING_WEBHOOK_URL`
  - [ ] Payload incluye `spreadsheet_id: "1abc...xyz"`
- [ ] Verificar en n8n:
  - [ ] Nodo `DATOS2` recibe el campo `spreadsheet_id`
  - [ ] NO se ejecutan los nodos eliminados (Search, If, Create, Move)
  - [ ] Nodo `Append row in sheet2` usa `$('DATOS2').item.json.spreadsheet_id`
- [ ] Verificar en Google Drive:
  - [ ] Abrir el Excel de la rúbrica (`entregas.xlsx`)
  - [ ] Verificar filas con: alumno | puntaje_total | criterios | fortalezas | recomendaciones
  - [ ] Una fila por cada alumno corregido
- [ ] **CRÍTICO**: NO se crea un nuevo Excel (usa el existente de FASE 1)
- [ ] **CRÍTICO**: NO hay errores de "spreadsheet not found"
- [ ] **CRÍTICO**: Si la rúbrica es vieja (sin `spreadsheet_file_id`), muestra error claro

#### 6.4. Múltiples Rúbricas
- [ ] Crear segunda rúbrica "Parcial-Test-Refactor"
- [ ] Verificar que tiene su propio `entregas.xlsx` independiente
- [ ] Subir entregas a ambas rúbricas
- [ ] Hacer corrección masiva en ambas
- [ ] Verificar que cada Excel tiene solo las filas de su rúbrica
- [ ] NO hay mezcla de datos entre rúbricas

#### 6.5. Manejo de Errores
- [ ] ¿Qué pasa si una rúbrica NO tiene `spreadsheet_file_id`?
  - [ ] El sistema debe mostrar error claro
  - [ ] O debe fallar gracefully sin romper todo
- [ ] ¿Qué pasa si el archivo Excel se borra manualmente de Drive?
  - [ ] El sistema debe manejar el error
  - [ ] Mostrar mensaje al usuario

**Estado**: [ ] Completado

**Notas**:
```
Fecha de inicio: ____/____/____
Fecha de finalización: ____/____/____

Escenario 6.1: [PASS / FAIL]
Escenario 6.2: [PASS / FAIL]
Escenario 6.3: [PASS / FAIL]  ← MÁS CRÍTICO
Escenario 6.4: [PASS / FAIL]
Escenario 6.5: [PASS / FAIL]

Problemas críticos encontrados:


Soluciones aplicadas:


```

---

### **FASE 7: Documentación y Cleanup** ⏳

**Objetivo**: Documentar los cambios y limpiar código antiguo.

**Tareas**:

#### 7.1. Actualizar README de workflows
- [ ] Actualizar `n8n-workflows/README.md`
- [ ] Documentar que `create-submission-folder` ahora crea el Excel
- [ ] Documentar que `flujo_correccion_masiva` espera recibir `spreadsheet_id`

#### 7.2. Actualizar MODELS.md
- [ ] Actualizar `backend/docs/MODELS.md`
- [ ] Agregar campos nuevos al modelo Rubric:
  - `spreadsheet_file_id`
  - `spreadsheet_file_url`

#### 7.3. Limpiar código deprecado
- [ ] Buscar comentarios TODO/FIXME relacionados
- [ ] Eliminar logs de debugging innecesarios
- [ ] Verificar que no queden referencias al sistema antiguo

**Estado**: [ ] Completado

**Notas**:
```
Fecha de inicio: ____/____/____
Fecha de finalización: ____/____/____
Documentos actualizados:
- [ ] n8n-workflows/README.md
- [ ] backend/docs/MODELS.md

Código limpiado: [SÍ / NO]
```

---

## 📂 RESUMEN DE ARCHIVOS Y RUTAS

### Archivos del Proyecto a Modificar:

| Fase | Archivo | Ubicación Exacta | Cambio |
|------|---------|------------------|--------|
| 1 | `create-submission-folder.json` | `n8n-workflows/` | Agregar creación de spreadsheet |
| 2 | `flujo_correccion_masiva.json` | `n8n-workflows/` | Eliminar 4 nodos + modificar 1 |
| 3 | `Rubric.js` | `backend/src/models/` | Agregar 2 campos nuevos |
| 4 | `rubricController.js` | `backend/src/controllers/` | Guardar IDs en 2 funciones |
| 5 | `UserView.tsx` | `frontend-correccion-automatica-n8n/src/components/user/` | Modificar función `handleBatchGrading` |

### Nodos del Workflow (FASE 2) a Eliminar:

| Nodo | Línea | Descripción |
|------|-------|-------------|
| `Search files and folders23` | ~532 | Busca archivo "Entregas" |
| `If` | ~570 | Verifica si existe |
| `Create spreadsheet` | ~56 | Crea si no existe |
| `Move file` | ~84 | Mueve a carpeta correcta |

### Nodos del Workflow (FASE 2) a Modificar:

| Nodo | Línea | Campo | Cambio |
|------|-------|-------|--------|
| `Append row in sheet2` | ~600 | `documentId.value` | De: `$('Search files...').item.json.id` → A: `$('DATOS2').item.json.spreadsheet_id` |

### Variables de Entorno Requeridas:

| Variable | Ubicación | Propósito |
|----------|-----------|-----------|
| `N8N_CREATE_SUBMISSION_FOLDER_WEBHOOK` | `backend/.env` | URL del workflow de FASE 1 |
| `VITE_BATCH_GRADING_WEBHOOK_URL` | `frontend/.env` | URL del workflow de FASE 2 |

---

## 📊 Resumen de Progreso

**Última actualización**: 2025-12-02

| Fase | Nombre | Estado | Fecha |
|------|--------|--------|-------|
| 1 | Modificar `create-submission-folder` (crear Excel) | ✅ | 2025-12-02 |
| 2 | Modificar `flujo_correccion_masiva` (eliminar 4 nodos) | ✅ | 2025-12-02 |
| 3 | Actualizar Modelo Rubric (2 campos nuevos) | ✅ | 2025-12-02 |
| 4 | Modificar Controller Rubric (guardar IDs en 2 funciones) | ✅ | 2025-12-02 |
| 5 | Modificar Frontend UserView (enviar spreadsheet_id) | ✅ | 2025-12-02 |
| 6 | Testing Integral End-to-End | ⏳ | ____/____/____ |
| 7 | Documentación y Cleanup | ⏳ | ____/____/____ |

**Progreso total**: 5 / 7 fases completadas (71%)

**Orden de implementación recomendado**: 1 → 3 → 4 → 5 → 2 → 6 → 7

---

## 🎯 Criterios de Éxito

Al finalizar, el sistema debe cumplir:

- ✅ Cada rúbrica tiene su propio `entregas.xlsx` creado al momento de crear la rúbrica
- ✅ El Excel se crea EN LA CARPETA DE LA RÚBRICA (no en otro lado)
- ✅ El workflow de corrección masiva NO intenta crear el Excel
- ✅ El workflow de corrección masiva SÍ escribe filas correctamente
- ✅ NO hay errores de "spreadsheet not found"
- ✅ Múltiples rúbricas funcionan independientemente
- ✅ El sistema maneja errores gracefully
- ✅ La documentación está actualizada

---

## 🐛 Registro de Problemas Comunes

**Problema**: El Excel no se crea al crear la rúbrica
- **Causa posible**: Workflow de n8n no activado o error en FASE 1
- **Solución**: Verificar que el workflow `create-submission-folder` está activo en n8n

**Problema**: Error "spreadsheet not found" al hacer corrección masiva
- **Causa posible**:
  1. La rúbrica no tiene `spreadsheet_file_id` guardado
  2. El Excel se borró manualmente de Drive
- **Solución**:
  1. Verificar FASE 4 (que se guarden los IDs)
  2. Recrear el Excel manualmente o agregar manejo de errores

**Problema**: El workflow de corrección masiva sigue intentando crear el Excel
- **Causa posible**: No se completó correctamente la FASE 2
- **Solución**: Verificar que se eliminaron los nodos de creación condicional

**Problema**: Las filas se escriben en el Excel incorrecto
- **Causa posible**: Se está pasando mal el `spreadsheet_id` en FASE 5
- **Solución**: Verificar logs del backend y payload enviado a n8n

---

## 📅 Timeline Estimado

**Tiempo estimado por fase**:
- Fase 1: 1-2 horas (modificar workflow crear carpeta + Excel)
- Fase 2: 1 hora (quitar creación de Excel del workflow masivo)
- Fase 3: 15 minutos (actualizar modelo)
- Fase 4: 30 minutos (guardar IDs en controller)
- Fase 5: 30 minutos (pasar spreadsheet_id al workflow)
- Fase 6: 2 horas (testing integral)
- Fase 7: 30 minutos (documentación)

**Total estimado**: 5-6 horas

---

## 🔍 HALLAZGOS DE LA VALIDACIÓN

### ✅ Confirmado:

1. **El workflow `flujo_correccion_masiva` SÍ se está usando**
   - Se dispara desde `UserView.tsx` (línea 428-488)
   - Botón: "Iniciar Corrección Automática"
   - Variable de entorno: `VITE_BATCH_GRADING_WEBHOOK_URL`

2. **El problema identificado es REAL**
   - El workflow busca/crea el spreadsheet si no existe (nodos: Search → If → Create)
   - Esto genera errores porque lo busca en la ubicación incorrecta

3. **El frontend NO está enviando `spreadsheet_id`**
   - Actualmente envía: university_id, faculty_id, career_id, course_id, commission_id, rubric_id, rubric_json, gemini_api_key
   - **FALTA**: spreadsheet_id (agregado en FASE 5)

### ⚠️ Puntos Críticos de Atención:

1. **Rúbricas antiguas NO tendrán `spreadsheet_file_id`**
   - Solo las rúbricas creadas DESPUÉS de FASE 1 tendrán el campo
   - Solución: Agregar validación en UserView (FASE 5) para mostrar error claro
   - Alternativa: Script de migración para agregar spreadsheets a rúbricas viejas (fuera del scope)

2. **El nodo `DATOS2` debe recibir el nuevo campo**
   - En n8n, el webhook input se mapea al nodo `DATOS2`
   - Este nodo debe tener acceso a `spreadsheet_id` para usarlo en `Append row`

3. **El workflow de FASE 1 debe devolver los IDs**
   - `create-submission-folder` debe devolver:
     - `folder_id` (ya lo hace)
     - `spreadsheet_id` (NUEVO - agregar en FASE 1)
     - `spreadsheet_url` (NUEVO - agregar en FASE 1)

4. **Orden de implementación es CRÍTICO**
   - **PRIMERO**: FASE 1 (crear spreadsheet en workflow)
   - **DESPUÉS**: FASE 3 y 4 (modelo y controller)
   - **DESPUÉS**: FASE 5 (frontend envía el ID)
   - **ÚLTIMO**: FASE 2 (eliminar creación en workflow masivo)
   - Si se hace en otro orden, el sistema se rompe

### 📋 Checklist Pre-Implementación:

Antes de empezar, verifica:

- [ ] Tienes acceso a n8n para modificar workflows
- [ ] Tienes los webhooks configurados en `.env` (backend y frontend)
- [ ] Tienes una rúbrica de prueba para testing
- [ ] Tienes entregas de prueba subidas
- [ ] Hiciste backup de los workflows actuales de n8n
- [ ] Tienes acceso a Google Drive para verificar los spreadsheets

---

**FIN DEL PLAN - VALIDADO Y CORREGIDO**

**Versión**: 2.0 (con validación completa de código)
**Última actualización**: 2025-12-02
**Estado**: ✅ Listo para implementación
