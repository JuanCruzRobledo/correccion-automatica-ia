# ✅ REFACTORIZACIÓN COMPLETADA - Excel por Rúbrica

**Fecha de completación**: 2025-12-02
**Fases completadas**: 5/7 (71%)
**Estado**: Listo para testing por el usuario

---

## 📋 RESUMEN DE CAMBIOS

### ✅ FASE 1: Workflow `create-submission-folder` modificado
**Archivo**: `n8n-workflows/create-submission-folder.json`

**Cambios realizados**:
- Agregado nodo "Create Entregas Spreadsheet" (líneas 271-300) que crea el archivo `entregas`
- Spreadsheet creado con headers automáticos (línea 280): `alumno,puntaje_total,criterios,fortalezas,recomendaciones`
- Agregado nodo "Move Spreadsheet to Folder" (líneas 301-335) que mueve el spreadsheet a la carpeta de la rúbrica
- El nodo "Respond Success5" ahora devuelve:
  - `folder_id` (carpeta de Drive)
  - `spreadsheet_id` (ID del Excel en Drive)
  - `spreadsheet_url` (URL directa al Excel)

**Flujo actualizado** (líneas 337-447):
```
Create submission Folder
  → Create Entregas Spreadsheet (con headers)
  → Move Spreadsheet to Folder (mueve a carpeta correcta)
  → Respond Success5
```

**IMPORTANTE**: El spreadsheet se crea con la primera fila de headers automáticamente configurada en `sheetsUi.sheetValues.headerRow`.

---

### ✅ FASE 2: Workflow `flujo_correccion_masiva` refactorizado
**Archivo**: `n8n-workflows/flujo_correccion_masiva.json`

**Nodos eliminados** (4 total):
1. `Search files and folders23` - Búsqueda del Excel
2. `If` - Condicional de existencia
3. `Create spreadsheet` - Creación del Excel
4. `Move file` - Movimiento a carpeta

**Nodo modificado**:
- `Append row in sheet2`:
  - **ANTES**: `$('Search files and folders23').item.json.id || $('Create spreadsheet').item.json.spreadsheetId`
  - **DESPUÉS**: `$('DATOS2').item.json.spreadsheet_id`

**Resultado**: El workflow ya NO intenta crear el Excel, solo lo usa si viene en el payload.

---

### ✅ FASE 3: Modelo `Rubric` actualizado
**Archivo**: `backend/src/models/Rubric.js`

**Campos agregados** (líneas 102-113):
```javascript
// ID del archivo entregas.xlsx en Google Drive
spreadsheet_file_id: {
  type: String,
  trim: true,
  default: null,
  index: true,
},

// URL directa al archivo entregas.xlsx
spreadsheet_file_url: {
  type: String,
  trim: true,
  default: null,
},
```

---

### ✅ FASE 4: Controller `rubricController` actualizado
**Archivo**: `backend/src/controllers/rubricController.js`

**Funciones modificadas** (2):

#### 4.1. `createRubric` (líneas 314-330)
Ahora guarda los IDs del spreadsheet cuando se crea la rúbrica:
```javascript
if (driveResponse.spreadsheet_id) {
  rubric.spreadsheet_file_id = driveResponse.spreadsheet_id;
  rubric.spreadsheet_file_url = driveResponse.spreadsheet_url;
  console.log(`✅ Spreadsheet creado: ${driveResponse.spreadsheet_id}`);
}
```

#### 4.2. `createRubricFromPDF` (líneas 499-515)
Mismo cambio aplicado para rúbricas creadas desde PDF.

---

### ✅ FASE 5: Frontend `UserView` actualizado
**Archivo**: `frontend-correccion-automatica-n8n/src/components/user/UserView.tsx`

**Función modificada**: `handleBatchGrading` (líneas 440-472)

**Cambios**:

1. **Validación agregada** (líneas 452-455):
```typescript
// Verificar que la rúbrica tiene spreadsheet_id (FASE 5)
if (!rubric.spreadsheet_file_id) {
  throw new Error('La rúbrica no tiene un archivo de entregas configurado. Por favor, recrea la rúbrica.');
}
```

2. **Payload actualizado** (línea 471):
```typescript
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

---

## 🎯 SIGUIENTE PASO: TESTING (FASE 6)

Ahora debes realizar el testing integral siguiendo estos pasos:

### 1. Importar workflows en n8n

```bash
# Workflows a importar:
- n8n-workflows/create-submission-folder.json
- n8n-workflows/flujo_correccion_masiva.json
```

**Pasos**:
1. Abrir n8n
2. Ir a Workflows → Import from File
3. Importar ambos workflows
4. Activar ambos workflows
5. Verificar que tienen los webhooks configurados

### 2. Reiniciar el backend

```bash
cd backend
npm run dev
```

**Verificar en logs**:
- Modelos cargados correctamente
- MongoDB conectado
- Sin errores de sintaxis

### 3. Reiniciar el frontend

```bash
cd frontend-correccion-automatica-n8n
npm run dev
```

### 4. Testing End-to-End

#### 4.1. Crear una rúbrica nueva

1. Ir al Admin Panel
2. Crear rúbrica de prueba (manual o desde PDF)
3. **VERIFICAR en logs del backend**:
   ```
   ✅ Spreadsheet creado: 1abc...xyz
   ✅ folder_id guardado en rúbrica: 1def...uvw
   ```
4. **VERIFICAR en MongoDB**:
   - La rúbrica debe tener:
     - `drive_folder_id`: "1def..."
     - `spreadsheet_file_id`: "1abc..."
     - `spreadsheet_file_url`: "https://docs.google.com/spreadsheets/d/..."

5. **VERIFICAR en Google Drive**:
   - Existe la carpeta de la rúbrica
   - Dentro hay un archivo `entregas.xlsx` o `entregas`
   - El Excel tiene headers: `alumno | puntaje_total | criterios | fortalezas | recomendaciones`

#### 4.2. Probar corrección masiva

1. Ir a `UserView` (vista de usuario)
2. Seleccionar: Universidad → Facultad → Carrera → Materia → Comisión → Rúbrica (la que creaste)
3. Click en "Iniciar Corrección Automática"

4. **VERIFICAR en DevTools → Network**:
   - POST a `VITE_BATCH_GRADING_WEBHOOK_URL`
   - Payload incluye: `spreadsheet_id: "1abc...xyz"`

5. **VERIFICAR en n8n**:
   - Workflow `flujo_correccion_masiva` se ejecuta
   - Nodo `DATOS2` recibe el campo `spreadsheet_id`
   - **NO se ejecutan** los nodos eliminados (Search, If, Create, Move)
   - Nodo `Append row in sheet2` usa el `spreadsheet_id` correctamente

6. **VERIFICAR en Google Drive**:
   - Abrir el Excel de la rúbrica
   - Debe tener filas nuevas con:
     - alumno: nombre del alumno
     - puntaje_total: nota
     - criterios: resumen
     - fortalezas: texto
     - recomendaciones: texto

7. **VERIFICAR que NO hay errores**:
   - No aparece "spreadsheet not found"
   - No se crea un nuevo Excel
   - Las filas se escriben en el Excel correcto

#### 4.3. Probar con rúbrica antigua (sin spreadsheet_id)

1. Si tienes rúbricas creadas ANTES de esta refactorización
2. Intentar hacer corrección masiva
3. **DEBE mostrar error claro**:
   ```
   La rúbrica no tiene un archivo de entregas configurado. Por favor, recrea la rúbrica.
   ```

---

## ⚠️ IMPORTANTE: Rúbricas Antiguas

Las rúbricas creadas **antes** de esta refactorización NO tienen `spreadsheet_file_id`. Tienes 2 opciones:

### Opción 1: Recrear las rúbricas (Recomendado)
- Simplemente crea las rúbricas nuevamente desde el Admin Panel
- Las nuevas rúbricas tendrán el spreadsheet automáticamente

### Opción 2: Script de migración (Avanzado - fuera del scope actual)
- Crear un script que:
  1. Busque todas las rúbricas con `drive_folder_id` pero sin `spreadsheet_file_id`
  2. Cree el spreadsheet en cada carpeta
  3. Guarde los IDs en MongoDB

---

## 📊 ARCHIVOS MODIFICADOS

### Workflows de n8n:
- ✅ `n8n-workflows/create-submission-folder.json`
- ✅ `n8n-workflows/flujo_correccion_masiva.json`

### Backend:
- ✅ `backend/src/models/Rubric.js`
- ✅ `backend/src/controllers/rubricController.js`
- ✅ `backend/scripts/modify-workflow.js` (nuevo - script de automatización)

### Frontend:
- ✅ `frontend-correccion-automatica-n8n/src/components/user/UserView.tsx`

---

## 🔍 CHECKLIST DE VERIFICACIÓN

Antes de marcar como completado, verifica:

- [ ] Workflows importados en n8n y activados
- [ ] Backend reiniciado sin errores
- [ ] Frontend compilado sin errores TypeScript
- [ ] Rúbrica nueva creada correctamente
- [ ] MongoDB tiene los 3 campos: `drive_folder_id`, `spreadsheet_file_id`, `spreadsheet_file_url`
- [ ] Google Drive tiene carpeta + Excel con headers
- [ ] Corrección masiva funciona end-to-end
- [ ] Filas se escriben en el Excel correcto
- [ ] NO se crea Excel duplicado
- [ ] Rúbricas antiguas muestran error claro

---

## 🎉 RESULTADO ESPERADO

**ANTES de la refactorización**:
- ❌ Cada corrección masiva intentaba buscar/crear el Excel
- ❌ Buscaba en la ubicación incorrecta
- ❌ Generaba errores de "spreadsheet not found"

**DESPUÉS de la refactorización**:
- ✅ El Excel se crea UNA VEZ al crear la rúbrica
- ✅ Se guarda el ID del Excel en la rúbrica (MongoDB)
- ✅ La corrección masiva usa el ID directamente
- ✅ No hay errores de búsqueda/creación
- ✅ Cada rúbrica tiene su propio Excel independiente

---

**Estado del plan**: Consultar `PLAN_REFACTORIZACION_EXCEL_POR_RUBRICA.md` para detalles completos.
