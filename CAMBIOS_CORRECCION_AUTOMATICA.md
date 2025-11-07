# 📝 DOCUMENTACIÓN - Cambios en Sistema de Corrección

> **Fecha**: 26 de Octubre, 2025
> **Cambios realizados**: Refactorización del sistema de corrección con dos divs lado a lado (Automática vs Manual)

---

## 🎯 Resumen de Cambios

Se refactorizó el componente `UserView.tsx` para separar claramente dos flujos de corrección:

1. **Corrección Manual Individual** (Izquierda): Corrige un alumno a la vez con archivo subido manualmente
2. **Corrección Automática Masiva** (Derecha): Corrige TODOS los alumnos pendientes automáticamente

### Cambios principales:

- ✅ **Paso 2 ahora son dos Cards lado a lado**: "Corrección Manual" (izquierda) y "Corrección Automática" (derecha)
- ✅ **Paso 3 es condicional**: Solo aparece después de una corrección manual exitosa
- ✅ **Nuevo webhook**: `VITE_BATCH_GRADING_WEBHOOK_URL` para corrección masiva
- ✅ **Eliminado**: Sistema de corrección manual por criterios (no se necesitaba)
- ✅ **Diseño responsivo**: En pantallas pequeñas las cards se apilan verticalmente

---

## 📌 Versiones Disponibles

### Rama `main` (ACTUAL)
- **Diseño**: Dos divs lado a lado (grid con 2 columnas)
- **Izquierda**: Corrección Manual
- **Derecha**: Corrección Automática
- **Responsivo**: Se apilan en pantallas pequeñas

### Rama `feature/tabs-correccion`
- **Diseño**: Sistema de tabs
- **Tab 1**: Corrección Automática
- **Tab 2**: Corrección Manual
- **Navegación**: Usuario cambia entre tabs con clicks

---

## 🏗️ Estructura Nueva del UserView (Versión Main - Divs Lado a Lado)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Paso 1: Contexto Académico                                        │
│  - Universidad                                                       │
│  - Materia                                                           │
│  - Rúbrica                                                           │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────┬──────────────────────────────────────┐
│  Paso 2: Corrección Manual   │  Paso 2: Corrección Automática      │
│  ────────────────────────────  │  ──────────────────────────────────  │
│  📝 Corrección Individual     │  ⚡ Corrección Masiva                │
│                               │                                      │
│  • Descripción                │  • Descripción del proceso           │
│  • Input para subir archivo   │  • Botón: "Iniciar Corrección"       │
│  • Botón: "Corregir Archivo"  │  • Mensaje: "✅ X estudiantes"       │
│  • Mensaje de error           │  • Mensaje de error                  │
│                               │                                      │
│  ✓ Muestra resultado          │  ✗ NO muestra resultado individual   │
│  ✓ Habilita Paso 3            │  ✗ NO habilita Paso 3                │
└──────────────────────────────┴──────────────────────────────────────┘
     (Izquierda - sky)                 (Derecha - purple)

┌─────────────────────────────────────────────────┐
│  Resultado de Corrección                        │
│  (solo aparece en corrección manual)            │
│  - Resultado en HTML                             │
│  - Botón: Exportar como PDF                      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Paso 3: Subir Resultados a Planilla           │
│  (solo si hay resultado de corrección manual)   │
│  - URL Spreadsheet                               │
│  - Nombre de Hoja                                │
│  - Alumno                                        │
│  - Nota                                          │
│  - Resumen, Fortalezas, Recomendaciones         │
│  - Botón: "Subir a Planilla"                     │
└─────────────────────────────────────────────────┘
```

---

## 🔌 Nuevo Webhook - Corrección Automática Masiva

### Variable de entorno

```bash
VITE_BATCH_GRADING_WEBHOOK_URL=https://tu-servidor.n8n.example/webhook/batch-grading
```

### Request (POST)

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "university_id": "utn-frm",
  "course_id": "prog-1",
  "rubric_id": "507f1f77bcf86cd799439011",
  "rubric_json": {
    "criteria": [
      {
        "name": "Completitud",
        "description": "...",
        "weight": 0.3
      },
      {
        "name": "Funcionalidad",
        "description": "...",
        "weight": 0.4
      },
      {
        "name": "Calidad de código",
        "description": "...",
        "weight": 0.3
      }
    ]
  }
}
```

### Response Esperada (Success)

**Status:** `200 OK`

**Body:**
```json
{
  "success": true,
  "count": 15,
  "message": "Se procesaron correctamente 15 estudiantes de un total de 15 entregas."
}
```

#### Campos de la respuesta:

- `success` (boolean): Indica si el proceso fue exitoso
- `count` (number): Cantidad de estudiantes corregidos exitosamente
- `message` (string, opcional): Mensaje adicional descriptivo

### Response Esperada (Error)

**Status:** `400 Bad Request` o `500 Internal Server Error`

**Body:**
```json
{
  "error": true,
  "message": "No se encontraron entregas pendientes para corregir"
}
```

---

## 📋 Webhooks Actuales del Sistema

### 1. Generar Rúbrica desde PDF
- **Variable**: `VITE_RUBRIC_WEBHOOK_URL`
- **Uso**: Admin Panel → Crear rúbrica desde PDF
- **Request**: `multipart/form-data` con archivo PDF
- **Response**: JSON con la rúbrica generada

### 2. Corrección Individual (Manual)
- **Variable**: `VITE_GRADING_WEBHOOK_URL`
- **Uso**: UserView → Tab "Corrección Manual"
- **Request**: `multipart/form-data` con `rubric` (JSON) y `submission` (archivo)
- **Response**: HTML/texto con el resultado de la corrección

### 3. Corrección Masiva (Automática) ⭐ NUEVO
- **Variable**: `VITE_BATCH_GRADING_WEBHOOK_URL`
- **Uso**: UserView → Tab "Corrección Automática"
- **Request**: JSON con `university_id`, `course_id`, `rubric_id`, `rubric_json`
- **Response**: JSON con `success`, `count`, `message`

### 4. Subir a Planilla
- **Variable**: `VITE_SPREADSHEET_WEBHOOK_URL`
- **Uso**: UserView → Paso 3 (después de corrección manual)
- **Request**: JSON con `spreadsheet_url`, `sheet_name`, `alumno`, `nota`, etc.
- **Response**: Confirmación de éxito

---

## 🎨 Comportamiento de la UI

### Tab "Corrección Automática"
1. Usuario selecciona Universidad, Materia, Rúbrica (Paso 1)
2. Hace clic en tab "Corrección Automática"
3. Lee la descripción: "Este proceso corregirá automáticamente TODOS los alumnos pendientes"
4. Hace clic en "Iniciar Corrección Automática"
5. Botón muestra loading: "Corrigiendo todos los alumnos…"
6. Al terminar, muestra mensaje verde: "✅ Se corrigieron exitosamente 15 estudiantes."
7. **NO** aparece el Paso 3 (planilla)

### Tab "Corrección Manual"
1. Usuario selecciona Universidad, Materia, Rúbrica (Paso 1)
2. Hace clic en tab "Corrección Manual"
3. Sube archivo del alumno
4. Hace clic en "Corregir Archivo"
5. Botón muestra loading: "Corrigiendo…"
6. Al terminar, aparece card "Resultado de la Corrección" con:
   - Contenido HTML del resultado
   - Botón "Exportar como PDF"
7. **SÍ** aparece el Paso 3 (planilla) con campos auto-llenados
8. Usuario completa campos faltantes y hace clic en "Subir a Planilla"

---

## 🔧 Archivos Modificados

### Frontend

1. **`frontend-correccion-automatica-n8n/.env.example`**
   - Agregada variable: `VITE_BATCH_GRADING_WEBHOOK_URL`

2. **`frontend-correccion-automatica-n8n/src/components/user/UserView.tsx`**
   - Agregado estado para tabs: `activeTab`
   - Agregado estado para corrección masiva: `isBatchGrading`, `batchGradingResult`, `batchGradingError`
   - Agregada función: `handleBatchGrading()`
   - Refactorizado Paso 2 con tabs
   - Hecho condicional el Paso 3 (solo si `gradingResult` existe)

---

## 🧪 Testing

### Test 1: Corrección Automática Masiva
1. ✅ Seleccionar universidad, materia, rúbrica
2. ✅ Ir a tab "Corrección Automática"
3. ✅ Verificar que botón está habilitado si hay rúbrica seleccionada
4. ✅ Hacer clic en "Iniciar Corrección Automática"
5. ✅ Verificar loading state del botón
6. ✅ Verificar respuesta del webhook (mock si es necesario)
7. ✅ Verificar mensaje de éxito con cantidad de estudiantes
8. ✅ Verificar que NO aparece Paso 3

### Test 2: Corrección Manual Individual
1. ✅ Seleccionar universidad, materia, rúbrica
2. ✅ Ir a tab "Corrección Manual"
3. ✅ Subir archivo
4. ✅ Hacer clic en "Corregir Archivo"
5. ✅ Verificar loading state del botón
6. ✅ Verificar que aparece resultado de corrección
7. ✅ Verificar que SÍ aparece Paso 3
8. ✅ Verificar auto-llenado de campos (nota, resumen, etc.)
9. ✅ Completar campos faltantes
10. ✅ Hacer clic en "Subir a Planilla"
11. ✅ Verificar mensaje de éxito

### Test 3: Cambio entre tabs
1. ✅ Ir a "Corrección Automática" → cambiar a "Corrección Manual"
2. ✅ Verificar que el contenido cambia correctamente
3. ✅ Verificar que el estado visual del tab activo es correcto
4. ✅ Subir archivo en Manual → cambiar a Automática → volver a Manual
5. ✅ Verificar que el archivo sigue seleccionado

---

## 💡 Notas Importantes

### Para el desarrollador del webhook de n8n:

1. **Corrección Automática Masiva** debe:
   - Obtener todas las entregas pendientes de corrección
   - Corregirlas automáticamente usando la rúbrica proporcionada
   - **NO** requiere que el frontend suba archivos individuales
   - Devolver la cantidad total de estudiantes corregidos
   - Manejar errores si no hay entregas pendientes

2. **Diferencia con Corrección Manual**:
   - Manual: Recibe 1 archivo → Devuelve 1 resultado HTML
   - Automática: Recibe contexto (universidad/materia/rúbrica) → Devuelve cantidad de estudiantes procesados

3. **Integración con planilla**:
   - La corrección automática NO sube resultados individuales a planilla
   - Solo la corrección manual permite subir a planilla (Paso 3)

---

## 🔄 Migración desde versión anterior

Si tienes un `.env` existente, agrega:

```bash
# En tu archivo .env
VITE_BATCH_GRADING_WEBHOOK_URL=https://tu-servidor.n8n.example/webhook/batch-grading
```

No se requieren cambios en el backend (MongoDB) ni en otros componentes.

---

## 📚 Referencias

- Componente: `frontend-correccion-automatica-n8n/src/components/user/UserView.tsx`
- Variables de entorno: `frontend-correccion-automatica-n8n/.env.example`
- Plan del proyecto: `PROYECTO_PLAN.md`

---

**Última actualización**: 26 de Octubre, 2025
**Versión**: 1.0
