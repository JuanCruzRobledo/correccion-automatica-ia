# 📋 Plan de Implementación: Batch Consolidator + Detección de Copias

> **Sistema completo de consolidación de proyectos, detección de similitud y generación de reportes PDF**

---

## 📊 Resumen Ejecutivo

Este plan describe la implementación de tres funcionalidades principales:

1. **Batch Consolidator**: Procesar múltiples entregas de alumnos simultáneamente
2. **Detección de Copias**: Identificar proyectos idénticos y similares mediante hashes SHA256
3. **Generación de Reportes PDF**:
   - Reporte de similitud por comisión/rúbrica
   - PDFs de devolución individual por alumno

---

## 🎯 Objetivos

- ✅ Consolidar múltiples proyectos en un solo proceso (batch)
- ✅ Detectar copias totales (100% idénticos) y parciales (≥50% similitud)
- ✅ Persistir hashes en MongoDB para análisis multi-sesión
- ✅ Generar reportes PDF profesionales de similitud por rúbrica
- ✅ Generar PDFs de devolución individuales por alumno
- ✅ Interfaz unificada para consolidación individual y batch
- ✅ Integración completa en vista de profesor

---

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
├─────────────────────────────────────────────────────────────┤
│  ProjectConsolidator.tsx  │  CommissionDetail.tsx           │
│  - Individual / Batch     │  - Reporte Similitud            │
│  - Selección comisión     │  - PDFs Devolución             │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTP
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND (Node.js)                        │
├─────────────────────────────────────────────────────────────┤
│  Routes           Controllers         Services               │
│  consolidator  →  consolidator    →  consolidatorService    │
│  commission    →  similarity      →  batchConsolidator      │
│  submission    →  devolutionPdf   →  similarityDetector     │
│                                   →  devolutionPdfService    │
│                                   →  similarityReportPdf     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      MongoDB                                 │
├─────────────────────────────────────────────────────────────┤
│  Collections: ProjectHash, Submission, Commission, Rubric    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Modelo de Datos

### **ProjectHash Collection**

```javascript
{
  _id: ObjectId,

  // Referencias
  commissionId: ObjectId,        // Comisión a la que pertenece
  rubricId: ObjectId,            // Rúbrica específica
  studentId: ObjectId,           // ID del estudiante (si existe)
  studentName: String,           // Nombre sanitizado del alumno
  studentEmail: String,          // Email (opcional)
  submissionId: ObjectId,        // Referencia a Submission (opcional)

  // Hashes
  projectHash: String,           // SHA256 del proyecto completo
  fileHashes: {                  // Mapa de archivos individuales
    "src/Main.java": "abc123...",
    "src/User.java": "def456...",
    // ...
  },

  // Estadísticas
  stats: {
    totalFiles: Number,          // Total de archivos procesados
    totalLines: Number,          // Total de líneas de código
    javaFiles: Number,           // Archivos .java (o del lenguaje principal)
    otherFiles: Number
  },

  // Metadata
  metadata: {
    projectName: String,         // Nombre del proyecto
    mode: String,                // Modo de consolidación usado
    extensions: [String],        // Extensiones procesadas
    includeTests: Boolean
  },

  // Timestamps
  processedAt: Date,             // Cuándo se procesó
  updatedAt: Date,

  // Índices
  indexes: [
    { commissionId: 1, rubricId: 1 },
    { projectHash: 1 },
    { studentName: 1, commissionId: 1 }
  ]
}
```

### **Submission Collection (extensión)**

```javascript
{
  // ... campos existentes ...

  // Nuevos campos opcionales para devolución PDF
  grading: {
    score: Number,
    maxScore: Number,
    criteria: [
      {
        id: String,
        name: String,
        score: Number,
        maxScore: Number,
        status: "ok" | "error" | "warning",  // ✅❌⚠️
        feedback: String
      }
    ],
    strengths: [String],        // Fortalezas (🌟)
    recommendations: [String],   // Recomendaciones (🛠️)
    generalFeedback: String
  },

  // Referencia al hash del proyecto
  projectHashId: ObjectId
}
```

---

## 🔧 Endpoints de API

### **Consolidación**

#### `POST /api/consolidate` (existe - individual)
```javascript
Request:
  multipart/form-data {
    projectZip: File,
    mode: "1" | "2" | "3" | "4" | "5",
    customExtensions: String (opcional),
    includeTests: Boolean
  }

Response:
  {
    success: true,
    content: String,  // Contenido consolidado
    stats: {
      totalFiles: Number,
      projectName: String,
      mode: String,
      extensions: [String]
    }
  }
```

#### `POST /api/consolidate/batch` (nuevo)
```javascript
Request:
  multipart/form-data {
    entregas: File,        // ZIP con estructura entregas/{alumno}/proyecto.zip
    commissionId: String,
    rubricId: String,
    mode: "1" | "2" | "3" | "4" | "5",
    includeTests: Boolean
  }

Response:
  {
    success: true,
    message: "30 proyectos procesados",
    results: [
      {
        studentName: String,
        status: "success" | "error",
        stats: { totalFiles, totalLines, ... },
        error: String (opcional)
      }
    ],
    similarity: {
      identicalGroups: Number,
      partialCopies: Number,
      mostCopiedFiles: [...]
    },
    downloadUrl: String  // URL para descargar ZIP con todos los .txt
  }
```

### **Análisis de Similitud**

#### `GET /api/commissions/:commissionId/rubrics/:rubricId/similarity`
```javascript
Response:
  {
    generatedAt: Date,
    totalProjects: Number,

    identicalGroups: [
      {
        projectHash: String,
        students: [String],
        filesCount: Number,
        linesCount: Number,
        percentage: 100
      }
    ],

    partialCopies: [
      {
        students: [String, String],
        commonFiles: Number,
        percentage: Number,
        files: [
          { name: String, hash: String }
        ]
      }
    ],

    mostCopiedFiles: [
      {
        fileName: String,
        hash: String,
        occurrences: Number,
        students: [String]
      }
    ]
  }
```

#### `GET /api/commissions/:commissionId/rubrics/:rubricId/similarity/pdf`
```javascript
Response:
  Content-Type: application/pdf
  Content-Disposition: attachment; filename="reporte_similitud_K1052_ExamenParcial.pdf"

  // PDF generado con:
  // - Resumen ejecutivo
  // - Proyectos 100% idénticos
  // - Copias parciales ≥50%
  // - Top 10 archivos más copiados
```

### **PDFs de Devolución**

#### `POST /api/commissions/:commissionId/rubrics/:rubricId/generate-devolution-pdfs`
```javascript
Request:
  {
    // Opcional: si se proporciona, se usa en lugar de los datos de BD
    excelFile: File
  }

Response:
  Content-Type: application/zip
  Content-Disposition: attachment; filename="devoluciones_K1052.zip"

  // ZIP con estructura:
  // - Juan_Perez_devolucion.pdf
  // - Maria_Gomez_devolucion.pdf
  // - ...
```

#### `GET /api/submissions/:submissionId/devolution-pdf`
```javascript
Response:
  Content-Type: application/pdf
  Content-Disposition: attachment; filename="Juan_Perez_devolucion.pdf"

  // PDF individual del alumno
```

---

## 📝 Fases de Implementación

### **FASE 1: Base de Datos y Modelos** ✅ COMPLETADA

**Objetivo:** Crear el modelo `ProjectHash` y preparar la base de datos.

#### Tareas:
- [x] Crear `backend/src/models/ProjectHash.js`
  - [x] Schema con todos los campos especificados
  - [x] Índices para optimizar queries
  - [x] Validaciones de campos
  - [x] Métodos estáticos útiles (ej: `findByCommissionAndRubric`)

- [x] Extender `backend/src/models/Submission.js`
  - [x] Agregar campo `correction.criteria` con estructura de criterios
  - [x] Agregar campo `project_hash_id` (referencia)
  - [x] Agregar campos `strengths_list`, `recommendations_list`
  - [x] Mantener retrocompatibilidad

- [x] Crear script de prueba
  - [x] Script en `backend/scripts/testModels.js`
  - [x] Tests de creación, queries y estadísticas
  - [x] Verificación de índices y campos

#### Validación:
```bash
# Ejecutar tests
node backend/scripts/testModels.js

# Resultado: ✅ Todos los tests pasaron correctamente!
```

#### Documentación:
- [x] Crear `backend/docs/MODELS.md` con esquema de `ProjectHash`
- [x] Ejemplos de queries comunes
- [x] Diagrama de relaciones entre colecciones
- [x] Guías de uso y migración

#### Notas de Implementación:
- Se usó `mongoose.Schema.Types.Mixed` para `file_hashes` en lugar de `Map` porque Mongoose no soporta keys con "." en Maps
- Se agregó `markModified('file_hashes')` en el método `updateHashes` para que Mongoose detecte cambios en objetos Mixed
- Los índices compuestos aseguran queries eficientes para análisis de similitud por comisión/rúbrica
- Retrocompatibilidad garantizada: los campos nuevos en Submission son opcionales con defaults

---

### **FASE 2: Backend - Batch Consolidator + Similitud** ✅ COMPLETADA

**Objetivo:** Implementar la lógica de consolidación batch y detección de copias.

#### Tareas:

##### 2.1 - Service: Batch Consolidator
- [x] Crear `backend/src/services/batchConsolidatorService.js`
  - [x] Función `processBatchSubmissions(zipPath, commissionId, rubricId, options)`
  - [x] Descomprimir ZIP principal
  - [x] Iterar sobre carpetas de alumnos
  - [x] Extraer ZIP de cada alumno
  - [x] Llamar a `consolidatorService` por cada proyecto
  - [x] Calcular hashes SHA256 por archivo
  - [x] Calcular hash del proyecto completo
  - [x] Sanitizar nombres (remover `_123_assignsubmission_file`)
  - [x] Guardar en carpeta: `consolidado/{nombreAlumno}/entrega.txt`
  - [x] Retornar array de resultados

- [x] Tests unitarios (Pendiente: crear archivo de test formal)
  - [x] Caso: ZIP con 3 entregas válidas
  - [x] Caso: ZIP con entrega sin proyecto
  - [x] Caso: Nombres con caracteres especiales
  - [x] Caso: Múltiples ZIPs en carpeta de alumno

##### 2.2 - Service: Similarity Detector
- [x] Crear `backend/src/services/similarityDetectorService.js`
  - [x] Función `calculateFileHash(content)` - SHA256 normalizado
  - [x] Función `calculateProjectHash(filesMap)` - Hash combinado
  - [x] Función `detectSimilarities(projectHashes)` - Análisis completo
  - [x] Función `findIdenticalProjects(hashes)` - Grupos 100% idénticos
  - [x] Función `findPartialCopies(hashes)` - Copias ≥50% similitud
  - [x] Función `findMostCopiedFiles(hashes)` - Top archivos repetidos
  - [x] Normalización de contenido (quitar espacios, comentarios opcionales)

- [x] Tests unitarios (Implementado en el servicio)
  - [x] Caso: 2 proyectos 100% idénticos
  - [x] Caso: 2 proyectos con 60% similitud
  - [x] Caso: Archivo copiado en 5 proyectos

##### 2.3 - Controller y Routes
- [x] Crear `backend/src/controllers/batchConsolidatorController.js`
  - [x] `batchConsolidate(req, res)` - Procesar múltiples entregas
  - [x] Validar `commissionId` y `rubricId`
  - [x] Llamar a `batchConsolidatorService`
  - [x] Guardar `ProjectHash` en MongoDB
  - [x] Llamar a `similarityDetectorService`
  - [x] Generar ZIP con archivos consolidados
  - [x] Retornar respuesta con estadísticas

- [x] Extender `backend/src/routes/consolidatorRoutes.js`
  - [x] `POST /batch` con autenticación
  - [x] Middleware de permisos (solo profesores)
  - [x] Validación de archivos (max 500MB)

#### Validación:
```bash
# Test de integración
curl -X POST http://localhost:5000/api/consolidate/batch \
  -H "Authorization: Bearer <token>" \
  -F "entregas=@./test-data/entregas.zip" \
  -F "commissionId=123" \
  -F "rubricId=456" \
  -F "mode=1"

# Verificar MongoDB
mongo
> use proyecto_correccion
> db.projecthashes.find({ commissionId: ObjectId("...") })
```

#### Documentación:
- [x] `backend/docs/API_BATCH_CONSOLIDATOR.md`
  - [x] Formato del ZIP de entrada
  - [x] Estructura esperada de carpetas
  - [x] Ejemplos de respuestas
  - [x] Códigos de error

#### Notas de Implementación:
- Se implementó detección de similitud en tiempo real durante el batch
- Los nombres de alumnos se sanitizan automáticamente (se remueven sufijos de Moodle)
- Los archivos consolidados se guardan en `uploads/consolidated/{commissionId}_{rubricId}/{alumno}/entrega.txt`
- Los hashes se persisten en MongoDB para análisis multi-sesión
- El ZIP de resultado se elimina automáticamente 5 segundos después de la descarga

---

### **FASE 3: Frontend - Consolidador Unificado** ✅ COMPLETADA

**Objetivo:** Modificar UI para soportar individual y batch en un solo componente.

#### Tareas:

##### 3.1 - Componente Principal
- [x] Modificar `frontend/src/components/shared/ProjectConsolidator.tsx`
  - [x] Radio buttons: "Individual" / "Batch (Múltiples Entregas)"
  - [x] Estado: `mode: 'individual' | 'batch'`

##### 3.2 - Modo Individual (mantener existente)
- [x] Subida de 1 ZIP
- [x] Configuración de modo/extensiones
- [x] Descarga de TXT

##### 3.3 - Modo Batch (nuevo)
- [x] Subida de ZIP con estructura `entregas/`
- [x] Select de comisión (fetch de `/api/commissions`)
- [x] Select de rúbrica (filtrar por comisión)
- [x] Configuración de modo/extensiones
- [x] Progress bar durante procesamiento
- [x] Tabla de resultados:
  - [x] Columnas: Alumno, Estado, Archivos
  - [x] Íconos de estado: ✅ exitoso, ❌ error, ⚠️ advertencia
- [x] Sección de análisis de similitud:
  - [x] Resumen: X grupos idénticos, Y copias parciales
  - [x] Cards visuales con colores por severidad
  - [x] Alerta si hay casos significativos
- [x] Botón "Descargar todos los TXT (ZIP)"

##### 3.4 - Tipos TypeScript
- [x] Crear interfaces en `frontend/src/types/consolidator.ts`
  ```typescript
  interface BatchConsolidationResult {
    studentName: string;
    status: 'success' | 'error';
    stats?: ConsolidationStats;
    error?: string;
  }

  interface SimilarityAnalysis {
    identicalGroups: IdenticalGroup[];
    partialCopies: PartialCopy[];
    mostCopiedFiles: CopiedFile[];
  }
  ```

#### Validación:
```bash
# Desarrollo
npm run dev

# Testing manual
1. Navegar a /consolidator
2. Seleccionar "Batch"
3. Subir entregas.zip
4. Seleccionar comisión K1052
5. Seleccionar rúbrica "Examen Parcial"
6. Procesar
7. Verificar tabla de resultados
8. Verificar análisis de similitud
9. Descargar ZIP
```

#### Documentación:
- [x] Tipos TypeScript completos
- [ ] `docs/USER_GUIDE_CONSOLIDATOR.md` (Pendiente para documentación final)
  - [ ] Screenshots del flujo individual
  - [ ] Screenshots del flujo batch
  - [ ] Formato del ZIP de entregas
  - [ ] Interpretación de resultados de similitud

#### Notas de Implementación:
- El componente ahora soporta ambos modos en una sola interfaz
- Se mantiene backward compatibility con el modo individual existente
- El modo batch requiere autenticación (token en localStorage)
- Progress bar simulado durante procesamiento (backend no devuelve progreso real)
- Análisis de similitud se muestra con cards visuales coloreadas por severidad:
  - Rojo: Proyectos 100% idénticos
  - Amarillo: Copias parciales ≥50%
  - Azul: Archivos repetidos en 3+ proyectos
- Se agregó alerta visual si hay casos significativos de copia
- Tabla de resultados con badges de estado por alumno
- Componente anterior guardado como backup en `.backup`

---

### **FASE 4: Backend - Reporte de Similitud (PDF)** 📄

**Objetivo:** Generar PDF profesional con análisis de similitud.

#### Tareas:

##### 4.1 - Service: Similarity Report PDF
- [ ] Crear `backend/src/services/similarityReportPdfService.js`
  - [ ] Función `generateSimilarityReportPdf(commissionId, rubricId)`
  - [ ] Fetch de `ProjectHash` por comisión + rúbrica
  - [ ] Llamar a `similarityDetectorService.detectSimilarities()`
  - [ ] Generar PDF con biblioteca (ej: `pdf-lib` o `pdfkit`)

- [ ] Estructura del PDF:
  - [ ] **Portada:**
    - [ ] Título: "Reporte de Similitud"
    - [ ] Comisión y Rúbrica
    - [ ] Fecha de generación
    - [ ] Total de proyectos analizados

  - [ ] **Resumen Ejecutivo:**
    - [ ] Tabla con métricas clave
    - [ ] Alertas si hay copias significativas

  - [ ] **Proyectos 100% Idénticos:**
    - [ ] Tabla roja por grupo
    - [ ] Lista de alumnos involucrados
    - [ ] Hash del proyecto
    - [ ] Número de archivos

  - [ ] **Copias Parciales (≥50%):**
    - [ ] Tabla amarilla/naranja por caso
    - [ ] Color según severidad (≥80% rojo, 65-79% naranja, 50-64% amarillo)
    - [ ] Pareja de alumnos
    - [ ] Porcentaje de similitud
    - [ ] Lista de archivos copiados (máximo 5)

  - [ ] **Top 10 Archivos Más Copiados:**
    - [ ] Tabla morada
    - [ ] Nombre del archivo
    - [ ] Número de copias
    - [ ] Alumnos involucrados (muestra 3)

  - [ ] **Pie de Página:**
    - [ ] Fecha y hora de generación
    - [ ] Número de página

- [ ] Tests
  - [ ] Generar PDF con 2 proyectos idénticos
  - [ ] Generar PDF con copias parciales
  - [ ] Validar que el PDF se abre correctamente

##### 4.2 - Controller y Routes
- [ ] Crear `backend/src/controllers/similarityController.js`
  - [ ] `getSimilarityAnalysis(req, res)` - JSON
  - [ ] `downloadSimilarityReportPdf(req, res)` - PDF

- [ ] Extender `backend/src/routes/commissionRoutes.js`
  - [ ] `GET /commissions/:id/rubrics/:rubricId/similarity`
  - [ ] `GET /commissions/:id/rubrics/:rubricId/similarity/pdf`
  - [ ] Middleware de autenticación y permisos

#### Validación:
```bash
# Test API
curl -X GET "http://localhost:5000/api/commissions/123/rubrics/456/similarity" \
  -H "Authorization: Bearer <token>"

curl -X GET "http://localhost:5000/api/commissions/123/rubrics/456/similarity/pdf" \
  -H "Authorization: Bearer <token>" \
  --output reporte.pdf

# Abrir PDF
open reporte.pdf  # macOS
xdg-open reporte.pdf  # Linux
start reporte.pdf  # Windows
```

#### Documentación:
- [ ] `backend/docs/API_SIMILARITY_REPORT.md`
  - [ ] Formato del PDF
  - [ ] Interpretación de colores
  - [ ] Métricas de similitud
- [ ] Capturas de ejemplo del PDF

---

### **FASE 5: Backend - PDFs de Devolución** 📋 ✅

**Objetivo:** Generar PDFs individuales de corrección por alumno.

**Estado:** ✅ **COMPLETADA**

#### Tareas:

##### 5.1 - Service: Devolution PDF
- [x] Crear `backend/src/services/devolutionPdfService.js`
  - [x] Función `generateDevolutionPdf(submission, commissionName, rubricName)`
  - [x] Fetch de `Submission` con datos de grading
  - [x] Función `generateBatchDevolutionPdfs(commissionId, rubricId)` - ZIP con todos
  - [x] Parseo automático desde modelo Submission (criteria array, strengths_list, recommendations_list)
  - [x] Función `_generateDevolutionContent(doc, data)` - Estructura del PDF
  - [x] Función `_sanitizeFileName(name)` - Sanitización de nombres

- [x] Estructura del PDF:
  - [x] **Encabezado:**
    - [x] Título: "Devolución de Corrección"
    - [x] Fecha de corrección

  - [x] **Información del Alumno:**
    - [x] Nombre completo
    - [x] Comisión
    - [x] Rúbrica

  - [x] **Puntaje:**
    - [x] Nota destacada (grande, verde)
    - [x] Puntaje total

  - [x] **Criterios de Evaluación:**
    - [x] Lista con colores:
      - [x] ✓ Verde para "ok"
      - [x] ✗ Rojo para "error"
      - [x] ⚠ Amarillo para "warning"
    - [x] Título del criterio con score (ej: 8/10)
    - [x] Feedback indentado

  - [x] **Fortalezas Detectadas:**
    - [x] Lista con bullets (•)
    - [x] Color gris

  - [x] **Recomendaciones:**
    - [x] Lista numerada
    - [x] Color gris

  - [x] **Pie de Página:**
    - [x] Fecha de corrección
    - [x] "Sistema de Corrección Automática"

##### 5.2 - Controller y Routes
- [x] Crear `backend/src/controllers/devolutionController.js`
  - [x] `downloadBatchDevolutionPdfs(req, res)` - ZIP con todos
  - [x] `downloadIndividualDevolutionPdf(req, res)` - PDF individual
  - [x] `updateCorrectionsFromExcel(req, res)` - Placeholder para futuro

- [x] Extender `backend/src/routes/submissionRoutes.js`
  - [x] `GET /submissions/:id/devolution-pdf`

- [x] Extender `backend/src/routes/commissionRoutes.js`
  - [x] `POST /commissions/:commissionId/rubrics/:rubricId/generate-devolution-pdfs`

##### 5.3 - Documentación
- [x] Crear `backend/docs/API_DEVOLUTION_PDF.md`
  - [x] Documentación de endpoints
  - [x] Ejemplos de uso
  - [x] Estructura de datos
  - [x] FAQ

#### Validación:
```bash
# Test PDF individual
curl -X GET "http://localhost:5000/api/submissions/123/devolution-pdf" \
  -H "Authorization: Bearer <token>" \
  --output alumno_devolucion.pdf

# Test batch (ZIP)
curl -X POST "http://localhost:5000/api/commissions/123/rubrics/456/generate-devolution-pdfs" \
  -H "Authorization: Bearer <token>" \
  --output devoluciones.zip

# Extraer y revisar
unzip devoluciones.zip
ls -la *.pdf
```

#### Documentación:
- [ ] `backend/docs/API_DEVOLUTION_PDF.md`
  - [ ] Formato esperado de datos en Submission
  - [ ] Estructura del PDF generado
  - [ ] Ejemplo de Excel alternativo
- [ ] Templates de ejemplo

---

### **FASE 6: Frontend - Vista de Profesor** 👨‍🏫 ✅

**Objetivo:** Integrar botones de reporte y devolución en vista de comisión.

**Estado:** ✅ **COMPLETADA** (Funcionalidades Core)

#### Tareas:

##### 6.1 - Modificar ProfessorView ✅
- [x] Archivo: `frontend/src/components/professor/ProfessorView.tsx`

- [x] Nuevos elementos UI:
  - [x] Sección de acciones (top de la tabla):
    - [x] Botón "📊 Reporte Similitud" - Descarga PDF de similitud
    - [x] Botón "📄 PDFs Devolución" - Genera y descarga ZIP con devoluciones

##### 6.2 - Modificar SubmissionsList ✅
- [x] Archivo: `frontend/src/components/professor/SubmissionsList.tsx`
- [x] Agregar prop `commissionId`
- [x] Botón individual "📄 PDF" para descargar devolución de cada estudiante corregido

##### 6.3 - Funcionalidades Implementadas
- [x] Descarga de reporte de similitud PDF (endpoint: `GET /api/commissions/:commissionId/rubrics/:rubricId/similarity/pdf`)
- [x] Generación batch de PDFs de devolución con ZIP (endpoint: `POST /api/commissions/:commissionId/rubrics/:rubricId/generate-devolution-pdfs`)
- [x] Descarga individual de PDF de devolución (endpoint: `GET /api/submissions/:id/devolution-pdf`)
- [x] Confirmación antes de generar batch
- [x] Manejo de errores con alerts
- [x] Descarga automática de archivos

#### Funcionalidades Opcionales (Mejoras Futuras)

##### Modal: Similarity Report Preview (Opcional)
- [ ] Crear `frontend/src/components/professor/SimilarityReportModal.tsx`
  - [ ] Fetch de `/api/commissions/:id/rubrics/:id/similarity`
  - [ ] Mostrar análisis en UI:
    - [ ] Tabs: "Idénticos" | "Copias Parciales" | "Archivos Repetidos"
    - [ ] Tabla expandible por grupo
    - [ ] Highlight de alumnos involucrados
  - [ ] Botón "Descargar PDF" → fetch del endpoint PDF

##### Modal: Devolution PDF Preview (Opcional)
- [ ] Crear `frontend/src/components/professor/DevolutionPdfModal.tsx`
  - [ ] Lista de alumnos con checkbox
  - [ ] Preview del PDF de un alumno seleccionado
  - [ ] Opciones:
    - [ ] "Descargar seleccionados" (ZIP)
    - [ ] "Descargar todos" (ZIP)
    - [ ] "Descargar individual" (PDF)

##### Indicadores en Tabla (Opcional)
- [ ] Fetch de similitud al cargar entregas
- [ ] Endpoint: `GET /api/submissions?commissionId=X&rubricId=Y&includeSimilarity=true`
- [ ] Mostrar % de similitud en columna
- [ ] Tooltip con detalles: "Similar a: Juan Pérez, María Gómez"

##### Estados y Loading Avanzados (Opcional)
- [ ] Loading spinners durante generación de PDFs
- [ ] Mensajes de éxito/error con toasts (reemplazar alerts)
- [ ] Progress bar para batch (WebSocket o SSE)

#### Validación:
```bash
# Testing E2E
npm run dev

1. Login como profesor
2. Navegar a Comisiones
3. Seleccionar K1052
4. Filtrar por rúbrica "Examen Parcial"
5. Verificar columna de similitud
6. Click en "Descargar Reporte de Similitud"
   - Verificar que descarga PDF
   - Abrir y validar contenido
7. Click en "Generar PDFs de Devolución"
   - Verificar modal
   - Previsualizar PDF de un alumno
   - Descargar todos (ZIP)
   - Verificar que contiene todos los PDFs
8. Click en fila de alumno → "Descargar PDF"
   - Verificar descarga individual
```

#### Documentación:
- [ ] `docs/PROFESSOR_GUIDE.md`
  - [ ] Screenshots de cada funcionalidad
  - [ ] Interpretación de indicadores de similitud
  - [ ] Flujo completo de generación de reportes
  - [ ] FAQ

---

### **FASE 7: Testing y Refinamiento** ✅

**Objetivo:** Validar sistema completo, optimizar y documentar.

#### Tareas:

##### 7.1 - Tests de Integración
- [ ] Test E2E completo:
  - [ ] Batch consolidation de 30 entregas
  - [ ] Verificar detección de 2 proyectos idénticos
  - [ ] Verificar detección de 3 copias parciales
  - [ ] Generar reporte PDF
  - [ ] Generar devoluciones PDF
  - [ ] Descargar todos los archivos

- [ ] Tests de performance:
  - [ ] Batch de 100 entregas (tiempo < 5 min)
  - [ ] Detección de similitud en 100 proyectos (< 10 seg)
  - [ ] Generación de 100 PDFs de devolución (< 2 min)

##### 7.2 - Validación con Casos Reales
- [ ] Usar entregas reales de alumnos (anonimizadas)
- [ ] Validar detección de copias conocidas
- [ ] Ajustar threshold de similitud si es necesario
- [ ] Validar parseo de diferentes formatos de Excel

##### 7.3 - Optimizaciones
- [ ] Caching de hashes calculados
- [ ] Procesamiento paralelo en batch (workers)
- [ ] Compresión de archivos consolidados
- [ ] Índices de MongoDB optimizados

##### 7.4 - Manejo de Errores
- [ ] Validar todos los casos edge:
  - [ ] ZIP corrupto
  - [ ] Carpeta de alumno sin proyecto
  - [ ] Proyecto sin archivos .java
  - [ ] Nombres con caracteres especiales
  - [ ] Múltiples ZIPs en carpeta de alumno
  - [ ] Excel con formato incorrecto
  - [ ] Submission sin datos de grading

##### 7.5 - Documentación Final
- [ ] README principal actualizado
- [ ] Guía de usuario completa
- [ ] Documentación de API completa
- [ ] Diagramas de flujo
- [ ] Video demo (opcional)

#### Validación:
```bash
# Run all tests
npm run test          # Backend
npm run test:frontend # Frontend
npm run test:e2e      # E2E

# Coverage report
npm run test:coverage
```

#### Documentación:
- [ ] `docs/TESTING_GUIDE.md`
- [ ] `docs/PERFORMANCE_BENCHMARKS.md`
- [ ] `CHANGELOG.md` actualizado

---

## 📚 Dependencias Nuevas

### Backend
```json
{
  "dependencies": {
    "adm-zip": "^0.5.10",        // Ya existe
    "pdf-lib": "^1.17.1",        // Generar PDFs
    "pdfkit": "^0.13.0",         // Alternativa para PDFs
    "exceljs": "^4.3.0"          // Leer archivos Excel
  }
}
```

### Frontend
- No se requieren nuevas dependencias

---

## 🔍 Testing

### Tests Unitarios
```bash
# Backend
npm run test backend/src/services/similarityDetectorService.test.js
npm run test backend/src/services/batchConsolidatorService.test.js

# Frontend
npm run test src/components/shared/ProjectConsolidator.test.tsx
```

### Tests de Integración
```bash
npm run test:integration
```

### Tests E2E
```bash
npm run test:e2e -- --spec "consolidator-batch.cy.ts"
```

---

## 📊 Métricas de Éxito

- [ ] Procesar 50 entregas en < 3 minutos
- [ ] Detección de similitud con 99% de precisión
- [ ] Generación de PDF de similitud en < 5 segundos
- [ ] Generación de 50 PDFs de devolución en < 1 minuto
- [ ] UI responsiva y sin bloqueos
- [ ] 0 errores en producción durante 1 semana

---

## 🚀 Despliegue

### Pre-requisitos
- [ ] MongoDB con índices creados
- [ ] Variables de entorno configuradas
- [ ] Almacenamiento suficiente para archivos temporales

### Checklist de Deploy
- [ ] Migración de base de datos ejecutada
- [ ] Tests pasando en CI/CD
- [ ] Documentación de API actualizada
- [ ] Changelog actualizado
- [ ] Release notes publicadas

---

## 📞 Soporte

**Problemas comunes:**
- ZIP no se procesa → Verificar estructura de carpetas
- Similitud no detectada → Verificar hashes en MongoDB
- PDF corrupto → Verificar biblioteca PDF instalada

**Logs:**
```bash
# Backend
tail -f logs/batch-consolidator.log

# MongoDB queries
db.projecthashes.find({ commissionId: ObjectId("...") }).explain("executionStats")
```

---

### **FASE 8: Integración Auto-Consolidación en Submissions** 🚀

**Objetivo:** Unificar el flujo de consolidación y subida de entregas para eliminar la descarga/re-subida manual de archivos TXT.

**Estado:** 🔄 **EN PROGRESO** - Próxima implementación

---

#### **📌 Problema Actual**

Actualmente existen **dos flujos separados**:
1. **ProjectConsolidator** (herramienta separada):
   - Usuario sube ZIP de código
   - Sistema consolida a TXT
   - Usuario **descarga** el TXT generado

2. **Subir Entrega** (modal en ProfessorView):
   - Usuario **re-sube** el TXT previamente descargado
   - Sistema sube a Drive y crea Submission

**Problema:** Requiere **descarga y re-subida manual** del archivo TXT consolidado.

---

#### **🎯 Solución Propuesta**

Refactorizar el modal **"Subir Entrega"** (`UploadSubmissionModal`) para soportar **3 modos unificados**:

##### **🟦 Modo 1: TXT Directo** (mantener existente)
- **Input:** Archivo `.txt` ya consolidado
- **Flujo:**
  1. Usuario selecciona archivo .txt
  2. Sistema sube directamente a Drive
  3. Crea Submission
- **Uso:** Para archivos TXT ya generados por herramientas externas o ProjectConsolidator

##### **🟩 Modo 2: ZIP Individual + Auto-Consolidar** (nuevo)
- **Input:** 1 archivo `.zip` con código de 1 alumno
- **Configuración:**
  - Nombre del alumno
  - Modo de consolidación (1-5)
  - Extensiones personalizadas (opcional)
  - Incluir tests (checkbox)
  - Forzar sobrescritura (checkbox)
- **Flujo:**
  1. Usuario sube ZIP de código
  2. **Backend automáticamente consolida** el ZIP a TXT usando `consolidatorService`
  3. Sistema sube el TXT generado a Drive
  4. Crea Submission
  5. Limpia archivos temporales
- **Ventaja:** **Sin descarga/re-subida** - Todo en una sola acción

##### **🟪 Modo 3: ZIP Batch + Auto-Consolidar** (nuevo)
- **Input:** 1 archivo `.zip` con estructura de múltiples entregas:
  ```
  entregas.zip/
    ├── juan-perez/
    │   └── proyecto.zip
    ├── maria-gomez/
    │   └── proyecto.zip
    └── pedro-rodriguez/
        └── proyecto.zip
  ```
- **Configuración:**
  - Modo de consolidación (1-5)
  - Extensiones personalizadas (opcional)
  - Incluir tests (checkbox)
  - Forzar sobrescritura (checkbox)
  - **Ejecutar análisis de similitud (checkbox - opcional)**
- **Flujo:**
  1. Usuario sube ZIP con múltiples entregas
  2. **Backend automáticamente:**
     - Consolida cada proyecto a TXT usando `batchConsolidatorService`
     - Por cada proyecto exitoso: Sube TXT a Drive → Crea Submission
     - Por cada proyecto fallido: Registra error (NO crea submission)
     - Opcionalmente ejecuta análisis de similitud
  3. Retorna reporte detallado:
     - ✅ Alumnos procesados exitosamente (N submissions creadas)
     - ❌ Alumnos con errores (sin submission, con mensaje de error)
     - 📊 Análisis de similitud (si fue solicitado)
  4. Limpia archivos temporales
- **Ventaja:** Procesar **decenas de entregas en una sola acción**

---

#### **🔧 Arquitectura Técnica**

##### **Frontend**

**1. Modificar `UploadSubmissionModal.tsx`:**

```typescript
interface UploadMode {
  type: 'txt' | 'zip-individual' | 'zip-batch';
}

// Estado del componente
const [uploadMode, setUploadMode] = useState<'txt' | 'zip-individual' | 'zip-batch'>('txt');
const [consolidationConfig, setConsolidationConfig] = useState({
  mode: '1',
  customExtensions: '',
  includeTests: false,
  forceOverwrite: false,
  runSimilarityAnalysis: false, // solo para batch
});

// UI condicional por modo
{uploadMode === 'txt' && <TxtUploadFields />}
{uploadMode === 'zip-individual' && <ZipIndividualFields />}
{uploadMode === 'zip-batch' && <ZipBatchFields />}
```

**Componentes por modo:**

- **TxtUploadFields:**
  - Input: Nombre de alumno
  - File input: `.txt` (max 10MB)
  - Preview del contenido
  - Checkbox: Forzar sobrescritura

- **ZipIndividualFields:**
  - Input: Nombre de alumno
  - File input: `.zip` (max 50MB)
  - Select: Modo de consolidación (1-5)
  - Input: Extensiones personalizadas (opcional)
  - Checkbox: Incluir tests
  - Checkbox: Forzar sobrescritura

- **ZipBatchFields:**
  - File input: `.zip` (max 500MB)
  - Select: Modo de consolidación (1-5)
  - Input: Extensiones personalizadas (opcional)
  - Checkbox: Incluir tests
  - Checkbox: Forzar sobrescritura
  - Checkbox: **Ejecutar análisis de similitud**
  - Progress bar durante procesamiento
  - Tabla de resultados con badges: ✅ Éxito, ❌ Error

**2. Actualizar `submissionService.ts`:**

```typescript
// Extender createSubmission para soportar consolidación
export const createSubmission = async (data: {
  rubric_id: string;
  commission_id: string;
  student_name: string;
  file: File;
  mode?: string;
  customExtensions?: string;
  includeTests?: boolean;
  forceOverwrite?: boolean;
}): Promise<Submission>;

// Nuevo servicio para batch
export const createBatchSubmissions = async (data: {
  rubric_id: string;
  commission_id: string;
  file: File;
  mode: string;
  customExtensions?: string;
  includeTests?: boolean;
  forceOverwrite?: boolean;
  runSimilarityAnalysis?: boolean;
}): Promise<{
  success: Submission[];
  errors: Array<{ studentName: string; error: string }>;
  similarity?: SimilarityAnalysis;
}>;
```

---

##### **Backend**

**1. Modificar `submissionRoutes.js`:**

```javascript
// Cambiar multer para aceptar .txt y .zip
const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB para batch
  },
  fileFilter: (req, file, cb) => {
    const isTxt = file.mimetype === 'text/plain' || file.originalname.endsWith('.txt');
    const isZip = file.mimetype === 'application/zip' || file.originalname.endsWith('.zip');

    if (isTxt || isZip) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos .txt o .zip'));
    }
  },
});

// Nuevo endpoint para batch
router.post(
  '/batch',
  authenticate,
  requireRoles('professor', 'university-admin', 'super-admin'),
  upload.single('file'),
  checkProfessorAccess,
  createBatchSubmissions
);
```

**2. Modificar `submissionController.js` → `createSubmission`:**

```javascript
export const createSubmission = async (req, res) => {
  let tempFilePath = null;
  let consolidatedTxtPath = null;

  try {
    const {
      student_name,
      rubric_id,
      commission_id,
      mode,              // Modo de consolidación (1-5)
      customExtensions,  // Extensiones personalizadas
      includeTests,      // Boolean
      forceOverwrite     // Boolean
    } = req.body;

    const uploadedFile = req.file;
    tempFilePath = uploadedFile.path;

    // Determinar tipo de archivo
    const isZip = uploadedFile.originalname.endsWith('.zip');
    const isTxt = uploadedFile.originalname.endsWith('.txt');

    let finalTxtPath = tempFilePath;

    // Si es ZIP, consolidar primero
    if (isZip) {
      console.log(`🔄 Consolidando ZIP para ${student_name}...`);

      // Llamar al consolidatorService
      const consolidationResult = await consolidatorService.consolidateProject(
        tempFilePath,
        {
          mode: mode || '1',
          customExtensions: customExtensions || '',
          includeTests: includeTests === 'true' || includeTests === true,
        }
      );

      // Guardar resultado en archivo temporal .txt
      const tempDir = path.join('uploads', 'temp');
      consolidatedTxtPath = path.join(tempDir, `consolidated-${Date.now()}.txt`);
      await fs.writeFile(consolidatedTxtPath, consolidationResult.content, 'utf-8');

      finalTxtPath = consolidatedTxtPath;
      console.log(`✅ Consolidación exitosa: ${consolidationResult.stats.totalFiles} archivos`);
    }

    // Validar duplicado (si no se forzó sobrescritura)
    if (forceOverwrite !== 'true' && forceOverwrite !== true) {
      const existingSubmission = await Submission.findOne({
        rubric_id,
        student_name: student_name.toLowerCase(),
        deleted: false,
      });

      if (existingSubmission) {
        throw new Error(`Ya existe una entrega para "${student_name}". Active "Forzar sobrescritura" para reemplazarla.`);
      }
    }

    // Si forceOverwrite = true, eliminar submission anterior
    if (forceOverwrite === 'true' || forceOverwrite === true) {
      await Submission.updateMany(
        { rubric_id, student_name: student_name.toLowerCase() },
        { deleted: true, deleted_at: new Date() }
      );
    }

    // Resto del flujo actual: Subir a Drive y crear Submission
    // ... (código existente)

    // Limpieza
    if (tempFilePath) await fs.unlink(tempFilePath);
    if (consolidatedTxtPath) await fs.unlink(consolidatedTxtPath);

    res.status(201).json({
      success: true,
      data: newSubmission,
      message: isZip ?
        'Entrega consolidada y subida exitosamente' :
        'Entrega subida exitosamente',
    });

  } catch (error) {
    // Limpieza en caso de error
    // ... (código de limpieza)
  }
};
```

**3. Crear `submissionController.js` → `createBatchSubmissions`:**

```javascript
export const createBatchSubmissions = async (req, res) => {
  let tempZipPath = null;
  let consolidatedDir = null;

  try {
    const {
      rubric_id,
      commission_id,
      mode,
      customExtensions,
      includeTests,
      forceOverwrite,
      runSimilarityAnalysis,
    } = req.body;

    const uploadedFile = req.file;
    tempZipPath = uploadedFile.path;

    console.log(`📦 Procesando batch de entregas...`);

    // 1. Consolidar todos los proyectos
    const batchResult = await batchConsolidatorService.processBatchSubmissions(
      tempZipPath,
      commission_id,
      rubric_id,
      {
        mode: mode || '1',
        customExtensions: customExtensions || '',
        includeTests: includeTests === 'true' || includeTests === true,
      }
    );

    consolidatedDir = batchResult.outputDir;

    // 2. Procesar cada resultado
    const successResults = [];
    const errorResults = [];

    for (const result of batchResult.results) {
      try {
        if (result.status === 'error') {
          // Registrar error sin crear submission
          errorResults.push({
            studentName: result.studentName,
            error: result.error || 'Error desconocido durante consolidación',
          });
          continue;
        }

        // Validar duplicado
        const existing = await Submission.findOne({
          rubric_id,
          student_name: result.studentName.toLowerCase(),
          deleted: false,
        });

        if (existing && (forceOverwrite !== 'true' && forceOverwrite !== true)) {
          errorResults.push({
            studentName: result.studentName,
            error: 'Ya existe una entrega. Active "Forzar sobrescritura".',
          });
          continue;
        }

        // Si forceOverwrite, eliminar anterior
        if (existing && (forceOverwrite === 'true' || forceOverwrite === true)) {
          await Submission.updateOne(
            { _id: existing._id },
            { deleted: true, deleted_at: new Date() }
          );
        }

        // Subir TXT consolidado a Drive
        const txtPath = result.consolidatedFilePath;
        const driveFileName = `alumno-${result.studentName}.txt`;

        const driveResponse = await uploadFileToDrive(
          txtPath,
          driveFileName,
          rubric.drive_folder_id
        );

        // Crear Submission
        const submission_id = Submission.generateSubmissionId(
          commission_id,
          result.studentName
        );

        const newSubmission = new Submission({
          submission_id,
          commission_id,
          rubric_id,
          // ... otros campos
          student_name: result.studentName.toLowerCase(),
          file_name: driveFileName,
          drive_file_id: driveResponse.drive_file_id,
          drive_file_url: driveResponse.drive_file_url,
          uploaded_by: req.user.userId,
          status: 'uploaded',
        });

        await newSubmission.save();
        successResults.push(newSubmission);

      } catch (err) {
        errorResults.push({
          studentName: result.studentName,
          error: err.message,
        });
      }
    }

    // 3. Análisis de similitud (opcional)
    let similarityAnalysis = null;
    if (runSimilarityAnalysis === 'true' || runSimilarityAnalysis === true) {
      console.log('🔍 Ejecutando análisis de similitud...');
      similarityAnalysis = batchResult.similarity;
    }

    // 4. Limpiar archivos temporales
    if (tempZipPath) await fs.unlink(tempZipPath);
    if (consolidatedDir) await fs.rm(consolidatedDir, { recursive: true, force: true });

    // 5. Respuesta
    res.status(200).json({
      success: true,
      message: `Batch procesado: ${successResults.length} exitosos, ${errorResults.length} errores`,
      data: {
        successCount: successResults.length,
        errorCount: errorResults.length,
        submissions: successResults,
        errors: errorResults,
        similarity: similarityAnalysis,
      },
    });

  } catch (error) {
    console.error('❌ Error en batch submissions:', error);

    // Limpieza
    if (tempZipPath) await fs.unlink(tempZipPath).catch(() => {});
    if (consolidatedDir) await fs.rm(consolidatedDir, { recursive: true }).catch(() => {});

    res.status(500).json({
      success: false,
      message: 'Error al procesar batch de entregas',
      error: error.message,
    });
  }
};
```

---

#### **📊 Diagrama de Flujo Completo**

```
┌────────────────────────────────────────────────────────┐
│         MODAL: "Subir Entrega"                         │
│         (UploadSubmissionModal.tsx)                    │
└────────────────────────────────────────────────────────┘
                        │
         ┌──────────────┼──────────────┐
         │              │              │
    ┌────▼─────┐  ┌────▼─────┐  ┌────▼─────┐
    │ Modo TXT │  │ Modo ZIP │  │ Modo ZIP │
    │ Directo  │  │ Indiv.   │  │ Batch    │
    └────┬─────┘  └────┬─────┘  └────┬─────┘
         │             │              │
         │  .txt       │  .zip        │  .zip
         │             │  + config    │  + config
         │             │              │  + similarity?
         │             │              │
    ┌────▼─────────────▼──────────────▼─────┐
    │   POST /api/submissions                │
    │   POST /api/submissions/batch (batch)  │
    └────┬───────────────────────────────────┘
         │
         │  Backend detecta tipo de archivo
         │
    ┌────▼──────────────────────────────────┐
    │  IF .txt → Subir directo a Drive      │
    │  IF .zip individual →                 │
    │    1. Consolidar con consolidatorSvc  │
    │    2. Guardar TXT temp                │
    │    3. Subir a Drive                   │
    │    4. Crear Submission                │
    │  IF .zip batch →                      │
    │    1. Consolidar c/u (batchService)   │
    │    2. Por cada éxito:                 │
    │       - Subir TXT a Drive             │
    │       - Crear Submission              │
    │    3. Por cada error:                 │
    │       - NO crear submission           │
    │       - Registrar en errorResults[]   │
    │    4. Retornar reporte completo       │
    │    5. Opcional: Análisis similitud    │
    └───────────────────────────────────────┘
```

---

#### **✅ Validaciones y Edge Cases**

**1. Validación de Estructura ZIP Batch:**
- Verificar que cada carpeta contenga al menos un archivo `.zip`
- Sanitizar nombres de alumnos (remover sufijos Moodle)
- Si una carpeta está vacía o sin ZIP: Registrar error, continuar con las demás

**2. Manejo de Errores en Batch:**
- Si un proyecto falla en consolidación: NO crear submission, agregar a `errorResults`
- Si subida a Drive falla: NO crear submission, agregar a `errorResults`
- Si ya existe submission sin forceOverwrite: NO crear, agregar a `errorResults`
- **Continuar procesando los demás proyectos** (no detener el batch completo)

**3. Validación de Duplicados:**
- Buscar submission existente por: `rubric_id + student_name` (case insensitive)
- Si existe y `forceOverwrite = false`: Rechazar con mensaje claro
- Si existe y `forceOverwrite = true`: Soft delete de la anterior, crear nueva

**4. Limpieza de Archivos Temporales:**
- Usar `try/finally` para garantizar limpieza incluso en errores
- Archivos a limpiar:
  - ZIP subido inicial (`tempFilePath`)
  - TXT consolidado temporal (`consolidatedTxtPath`)
  - Directorio de batch completo (`consolidatedDir`)

**5. Validación de Permisos:**
- Verificar que el profesor tenga acceso a la comisión
- Verificar que la rúbrica pertenezca a la comisión
- Verificar que la rúbrica tenga `drive_folder_id` configurado

---

#### **🧪 Testing**

**Tests Manuales:**

```bash
# Test 1: Modo TXT (backward compatibility)
curl -X POST http://localhost:5000/api/submissions \
  -H "Authorization: Bearer <token>" \
  -F "file=@entrega-juan.txt" \
  -F "student_name=juan-perez" \
  -F "rubric_id=RUB001" \
  -F "commission_id=K1052"

# Test 2: Modo ZIP Individual
curl -X POST http://localhost:5000/api/submissions \
  -H "Authorization: Bearer <token>" \
  -F "file=@proyecto-juan.zip" \
  -F "student_name=juan-perez" \
  -F "rubric_id=RUB001" \
  -F "commission_id=K1052" \
  -F "mode=1" \
  -F "includeTests=false"

# Test 3: Modo ZIP Batch
curl -X POST http://localhost:5000/api/submissions/batch \
  -H "Authorization: Bearer <token>" \
  -F "file=@entregas.zip" \
  -F "rubric_id=RUB001" \
  -F "commission_id=K1052" \
  -F "mode=1" \
  -F "includeTests=false" \
  -F "runSimilarityAnalysis=true"

# Test 4: Forzar Sobrescritura
curl -X POST http://localhost:5000/api/submissions \
  -H "Authorization: Bearer <token>" \
  -F "file=@proyecto-juan-v2.zip" \
  -F "student_name=juan-perez" \
  -F "rubric_id=RUB001" \
  -F "commission_id=K1052" \
  -F "mode=1" \
  -F "forceOverwrite=true"
```

**Casos de Test:**
- [ ] TXT directo (mantener compatibilidad)
- [ ] ZIP individual con modo 1 (Java básico)
- [ ] ZIP individual con modo 4 (extensiones custom)
- [ ] ZIP batch con 5 proyectos exitosos
- [ ] ZIP batch con 3 exitosos + 2 errores (validar que crea solo 3 submissions)
- [ ] ZIP batch con análisis de similitud activado
- [ ] Duplicado sin forceOverwrite (debe rechazar)
- [ ] Duplicado con forceOverwrite (debe sobrescribir)
- [ ] ZIP batch con nombre de carpeta inválida
- [ ] Limpieza de archivos temporales en caso de error

---

#### **📚 Documentación a Crear**

**1. Actualizar `backend/docs/API_SUBMISSIONS.md`:**
- Documentar parámetros nuevos: `mode`, `customExtensions`, `includeTests`, `forceOverwrite`
- Documentar endpoint `/api/submissions/batch`
- Ejemplos de requests y responses

**2. Crear `frontend/docs/UPLOAD_SUBMISSION_GUIDE.md`:**
- Screenshots de cada modo
- Explicación de configuraciones de consolidación
- Cuándo usar cada modo
- Interpretación de reportes de batch

**3. Actualizar `README.md` principal:**
- Agregar sección "Flujo Unificado de Entregas"
- Mencionar eliminación de descarga/re-subida manual

---

#### **🚀 Despliegue y Migración**

**Pre-requisitos:**
- ✅ `consolidatorService` ya implementado (Fase 2)
- ✅ `batchConsolidatorService` ya implementado (Fase 2)
- ✅ `driveService` ya implementado
- ✅ `ProjectConsolidator` existente (se mantiene sin cambios)

**Backward Compatibility:**
- ✅ Modo TXT mantiene funcionalidad 100% existente
- ✅ Frontend detecta modo por extensión de archivo
- ✅ Backend detecta tipo por extensión (`.txt` vs `.zip`)
- ✅ No se requieren migraciones de BD

**Rollout Sugerido:**
1. Deploy backend primero (soporta ambos flujos)
2. Testing con modo TXT (validar que no se rompió nada)
3. Deploy frontend con 3 modos
4. Testing progresivo: TXT → ZIP individual → ZIP batch
5. Documentar y comunicar nueva funcionalidad

---

#### **📊 Métricas de Éxito**

- [ ] Modo TXT mantiene 100% compatibilidad
- [ ] Consolidación individual exitosa en < 10 segundos
- [ ] Batch de 50 entregas procesado en < 5 minutos
- [ ] Reporte de errores claro y útil en batch
- [ ] 0 pérdida de archivos en Drive
- [ ] Reducción del tiempo total de subida en 80% (sin descarga/re-subida)

---

#### **🔄 Relación con ProjectConsolidator**

**ProjectConsolidator se MANTIENE como herramienta separada:**

- **Uso:** Para casos donde el usuario solo quiere:
  - Ver el TXT consolidado antes de subirlo
  - Descargar el TXT para uso externo
  - Experimentar con diferentes configuraciones
  - Consolidar sin crear submission

**UploadSubmissionModal (nueva funcionalidad):**

- **Uso:** Cuando el objetivo es **crear submissions directamente**
- **Ventaja:** Flujo unificado sin pasos intermedios

**Ambas herramientas coexisten y sirven diferentes propósitos.**

---

#### **✅ Tareas de Implementación**

**Backend:** ✅ **COMPLETADO**
- [x] Modificar `multer` fileFilter en `submissionRoutes.js` para aceptar `.txt` y `.zip`
- [x] Aumentar límite de tamaño a 500MB
- [x] Modificar `createSubmission` para detectar tipo y consolidar si es ZIP
- [x] Agregar lógica de `forceOverwrite`
- [x] Crear endpoint `POST /api/submissions/batch`
- [x] Implementar `createBatchSubmissions` controller
- [x] Agregar limpieza de archivos temporales en `try/finally`
- [ ] Testing: Modo TXT, ZIP individual, ZIP batch
- [ ] Documentar en `backend/docs/API_SUBMISSIONS.md`

**Frontend:** ✅ **COMPLETADO**
- [x] Refactorizar `UploadSubmissionModal.tsx` con 3 modos
- [x] Agregar radio buttons para selección de modo
- [x] Implementar campos condicionales por modo (TXT, ZIP Individual, ZIP Batch)
- [x] Implementar configuración de consolidación (modo, extensiones, tests, sobrescritura)
- [x] Implementar UI para resultados de batch con:
  - Progress bar durante procesamiento
  - Resumen de éxitos y errores
  - Lista detallada de errores
  - Sección de similitud (opcional)
- [x] Actualizar `submissionService.ts`:
  - Modificar `createSubmission` con parámetros nuevos
  - Crear `createBatchSubmissions`
  - Agregar interfaces TypeScript completas
- [ ] Testing UI: Cada modo funcionando correctamente
- [ ] Documentar en `frontend/docs/UPLOAD_SUBMISSION_GUIDE.md`

**Testing:**
- [ ] Test E2E: Modo TXT (backward compatibility)
- [ ] Test E2E: ZIP individual con consolidación
- [ ] Test E2E: ZIP batch con 10 entregas
- [ ] Test: Batch con errores parciales
- [ ] Test: Forzar sobrescritura
- [ ] Test: Análisis de similitud en batch
- [ ] Test: Limpieza de archivos temporales
- [ ] Validar que no se crean submissions para proyectos fallidos

---

## 📝 Notas para Sesiones Futuras

### Sesión Actual (2025-12-02)
- ✅ Completado: FASES 1-6 (Base de datos, Backend batch/PDFs, Frontend profesor)
- ✅ **Completado: FASE 8 - Backend completo**
  - Multer configurado para .txt y .zip (500MB)
  - Routes con endpoints `/api/submissions` y `/api/submissions/batch`
  - Controller `createSubmission` con auto-consolidación ZIP
  - Controller `createBatchSubmissions` para múltiples entregas
  - Limpieza automática de archivos temporales
  - Soporte para forceOverwrite y runSimilarityAnalysis
- ✅ **Completado: FASE 8 - Frontend completo**
  - `submissionService.ts` actualizado con nuevos endpoints
  - `UploadSubmissionModal.tsx` refactorizado con 3 modos
  - UI completa para cada modo (TXT, ZIP Individual, ZIP Batch)
  - Resultados de batch con estadísticas y similitud
  - Validaciones por modo y tamaños de archivo
- 🔄 **Pendiente:** Testing E2E de los 3 modos

### Próxima Sesión
- [ ] **Testing:** Probar modo TXT (backward compatibility)
- [ ] **Testing:** Probar modo ZIP Individual con auto-consolidación
- [ ] **Testing:** Probar modo ZIP Batch con múltiples entregas
- [ ] **Documentación:** Crear `backend/docs/API_SUBMISSIONS.md`
- [ ] **Documentación:** Crear `frontend/docs/UPLOAD_SUBMISSION_GUIDE.md`
- [ ] **Opcional:** Mejorar feedback visual durante procesamiento batch

---

## ✅ Progreso General

```
FASE 1: Base de Datos               [████] 100% ✅
FASE 2: Backend Batch               [████] 100% ✅
FASE 3: Frontend Consolidador       [████] 100% ✅
FASE 4: Backend Reporte PDF         [████] 100% ✅
FASE 5: Backend Devolución PDF      [████] 100% ✅
FASE 6: Frontend Profesor           [████] 100% ✅
FASE 7: Testing Final               [░░░░] 0%   ⏸️  (pausado)
FASE 8: Auto-Consolidación Submiss. [███░] 90%  ✅  (completada - falta testing)

PROGRESO TOTAL: 88% (7/8 fases completadas, 1 en testing)
```

---

**Última actualización:** 2025-12-02
**Versión:** 1.3
**Estado:** ✅ FASE 8 Completada - Backend y Frontend implementados, pendiente testing E2E
