# 📋 PLAN DE MIGRACIÓN: De Drive/Sheets a MongoDB

**Versión:** 1.0
**Fecha:** 2025-12-12
**Tipo:** Refactorización Arquitectónica Mayor
**Duración estimada:** 4-6 semanas
**Estado inicial:** Sistema híbrido Drive + MongoDB

---

## 🎯 OBJETIVOS PRINCIPALES

### Problemas Actuales
- ✗ Entregas de alumnos dependen de n8n para subir a Drive
- ✗ Creación de rúbricas llama a n8n para crear carpetas en Drive
- ✗ Corrección masiva lee de Drive y guarda solo en Sheets
- ✗ PDFs de devolución dependen de webhook n8n para leer Sheets
- ✗ MongoDB no es la fuente de verdad (Sheets lo es)
- ✗ Workflows n8n innecesarios para organización de carpetas

### Objetivos de la Migración
- ✅ MongoDB como única fuente de verdad
- ✅ Subida de entregas directo a DB (sin n8n)
- ✅ Creación de rúbricas sin crear carpetas Drive
- ✅ Corrección masiva lee archivos y guarda resultados en DB
- ✅ PDFs generados desde datos en MongoDB
- ✅ Drive solo como almacenamiento opcional de archivos
- ✅ Eliminar workflows n8n obsoletos
- ✅ Workflows de corrección refactorizados para trabajar con DB

---

## 🏗️ ARQUITECTURA OBJETIVO

### Antes (Sistema Actual)
```
Usuario → Backend → n8n → Drive → Sheets (fuente de verdad)
                      ↓
                   MongoDB (metadata incompleta)
```

### Después (Sistema Migrado)
```
Usuario → Backend → MongoDB (fuente de verdad única)
                      ↓
                   Drive (storage opcional)
                      ↓
                   n8n (solo corrección con Gemini)
```

---

## 📦 CAMBIOS EN MODELOS DE DATOS

### Submission (EXTENDER)

**Nuevos campos necesarios:**
```javascript
// Archivo almacenado
file_path: String,              // Ruta local/storage del archivo
file_storage_type: String,      // "local" | "drive" | "s3"
file_mime_type: String,         // "application/pdf", "application/zip"

// Corrección extendida
correction: {
  // ... campos existentes ...

  // NUEVOS campos detallados
  criteria: [{
    id: String,
    name: String,
    score: Number,
    max_score: Number,
    status: String,           // "ok" | "error" | "warning"
    feedback: String
  }],
  strengths_list: [String],
  recommendations_list: [String],
  general_feedback: String,
  raw_response: Object        // Respuesta completa de Gemini
}
```

### Rubric (MODIFICAR)

**Campos a ELIMINAR:**
```javascript
// YA NO NECESARIOS
drive_folder_id: String,        // ✗ Eliminar
spreadsheet_file_id: String,    // ✗ Eliminar
spreadsheet_file_url: String,   // ✗ Eliminar
sheet_id: String                // ✗ Eliminar
```

**Campos a MANTENER:**
```javascript
// MANTENER para compatibilidad temporal
rubric_json: Object,            // ✓ La rúbrica completa
rubric_file_url: String,        // ✓ PDF original (Drive)
```

---

## 📅 FASES DE IMPLEMENTACIÓN

---

## 🔷 FASE 1: Preparación de Infraestructura (Semana 1)

### Objetivo
Preparar modelos, servicios y estructura para soportar nueva arquitectura sin romper la actual.

### Tareas

#### 1.1 Actualizar Modelo Submission
- [ ] Agregar campo `file_path` (String, opcional)
- [ ] Agregar campo `file_storage_type` (String, enum: local/drive/s3, default: "drive")
- [ ] Agregar campo `file_mime_type` (String, opcional)
- [ ] Extender objeto `correction.criteria` (Array de objetos con id, name, score, max_score, status, feedback)
- [ ] Agregar `correction.strengths_list` (Array de strings)
- [ ] Agregar `correction.recommendations_list` (Array de strings)
- [ ] Agregar `correction.general_feedback` (String)
- [ ] Agregar `correction.raw_response` (Mixed, para guardar respuesta completa de Gemini)
- [ ] Crear método `submission.updateCorrectionDetailed(correctionData)` para actualizar con datos extendidos
- [ ] Ejecutar migración de datos existentes (agregar campos vacíos)

**Archivo:** `backend/src/models/Submission.js`

#### 1.2 Crear Servicio de Almacenamiento
- [ ] Crear `backend/src/services/fileStorageService.js`
- [ ] Implementar `saveSubmissionFile(file, submission)` que retorna `{ path, storageType, mimeType }`
- [ ] Implementar `getSubmissionFile(submission)` que retorna stream del archivo
- [ ] Implementar `deleteSubmissionFile(submission)` para limpieza
- [ ] Soportar almacenamiento local en `uploads/submissions/{commission_id}/{rubric_id}/{student_name}/`
- [ ] Opcional: soportar Drive como fallback (para transición)
- [ ] Crear directorio `uploads/submissions/` en el backend

**Archivo:** `backend/src/services/fileStorageService.js`

#### 1.3 Variables de Entorno
- [ ] Agregar `FILE_STORAGE_TYPE=local` (o "drive" o "s3") a `.env.example`
- [ ] Agregar `UPLOAD_MAX_SIZE=50000000` (50MB) a `.env.example`
- [ ] Agregar `UPLOAD_PATH=./uploads` a `.env.example`
- [ ] Documentar variables en README

**Archivos:** `.env.example`, `README.md`

---

## 🔷 FASE 2: Migrar Subida de Entregas (Semana 1-2)

### Objetivo
Eliminar dependencia de n8n para subir entregas de alumnos. Backend guarda archivos directamente.

### Tareas

#### 2.1 Refactorizar Endpoint de Subida
- [ ] Modificar `POST /api/commissions/:commissionId/rubrics/:rubricId/submissions`
- [ ] **ANTES** llamaba a `uploadFileToDrive()` + guardaba en DB
- [ ] **AHORA** llamar a `fileStorageService.saveSubmissionFile()` + guardar path en DB
- [ ] Actualizar validaciones (permitir PDF, ZIP, etc.)
- [ ] Agregar límite de tamaño de archivo (50MB)
- [ ] Guardar `file_path`, `file_storage_type`, `file_mime_type` en Submission
- [ ] Mantener campos `drive_file_id`, `drive_file_url` como null (para transición)
- [ ] Retornar respuesta con submission completa

**Archivo:** `backend/src/controllers/submissionController.js`

#### 2.2 Actualizar Frontend de Subida
- [ ] Modificar componente `SubmissionUpload.tsx` (o similar)
- [ ] Verificar que siga funcionando upload multipart/form-data
- [ ] Actualizar mensajes de éxito (no mencionar Drive)
- [ ] Agregar validación de tipo de archivo en cliente
- [ ] Agregar validación de tamaño (50MB max)
- [ ] Mostrar progreso de subida

**Archivo:** `frontend/src/components/submissions/SubmissionUpload.tsx`

#### 2.3 Testing de Subida
- [ ] Probar subida de archivo PDF individual
- [ ] Probar subida de archivo ZIP
- [ ] Verificar que se guarde correctamente en `uploads/submissions/`
- [ ] Verificar que se guarde metadata en MongoDB
- [ ] Verificar límite de tamaño funciona
- [ ] Verificar validación de tipos de archivo

---

## 🔷 FASE 3: Eliminar Creación de Carpetas Drive (Semana 2)

### Objetivo
Cuando se crea una rúbrica, NO llamar a n8n para crear carpetas en Drive.

### Tareas

#### 3.1 Refactorizar Creación de Rúbricas
- [ ] Modificar `POST /api/commissions/:commissionId/rubrics`
- [ ] **ELIMINAR** llamadas a servicios de creación de carpetas Drive
- [ ] **ELIMINAR** llamadas a servicios de creación de Sheets
- [ ] Guardar solo metadata de rúbrica en MongoDB
- [ ] Mantener campo `rubric_json` con la rúbrica completa
- [ ] **NO** guardar `drive_folder_id`, `spreadsheet_file_id`, `sheet_id` (dejar null)
- [ ] Actualizar respuesta exitosa (no mencionar Drive/Sheets)

**Archivo:** `backend/src/controllers/rubricController.js`

#### 3.2 Actualizar Frontend de Creación de Rúbricas
- [ ] Modificar componente de creación de rúbricas
- [ ] Eliminar menciones a "creando carpeta en Drive"
- [ ] Eliminar mensajes de "creando spreadsheet"
- [ ] Actualizar loader/spinner con mensajes apropiados
- [ ] Verificar que muestre éxito correctamente

**Archivo:** `frontend/src/components/rubrics/CreateRubric.tsx` (o similar)

#### 3.3 Migración de Rúbricas Existentes
- [ ] Crear script de migración `backend/scripts/migrateRubrics.js`
- [ ] Listar rúbricas con `drive_folder_id` poblado
- [ ] Para cada rúbrica, setear `drive_folder_id = null` (marcar como migrada)
- [ ] NO eliminar archivos de Drive (solo desconectar)
- [ ] Generar reporte de rúbricas migradas
- [ ] Ejecutar script en ambiente de desarrollo
- [ ] Revisar resultados antes de aplicar a producción

**Archivo:** `backend/scripts/migrateRubrics.js`

#### 3.4 Testing
- [ ] Crear rúbrica nueva desde frontend
- [ ] Verificar que se cree sin errores
- [ ] Verificar que NO se llame a n8n
- [ ] Verificar que se guarde correctamente en MongoDB
- [ ] Verificar que campos Drive estén en null

---

## 🔷 FASE 4: Refactorizar Servicio de Corrección (Semana 2-3)

### Objetivo
Modificar workflow n8n de corrección para que reciba archivo desde backend y devuelva corrección completa estructurada.

### Tareas

#### 4.1 Crear Endpoint Backend para Corrección Individual
- [ ] Crear `POST /api/submissions/:submissionId/correct`
- [ ] Validar que submission exista y tenga archivo
- [ ] Obtener rúbrica asociada
- [ ] Leer archivo desde `fileStorageService.getSubmissionFile()`
- [ ] Llamar a workflow n8n de corrección (pasar archivo + rúbrica)
- [ ] Recibir respuesta estructurada de n8n
- [ ] Parsear respuesta y extraer: `grade`, `criteria[]`, `strengths_list[]`, `recommendations_list[]`, `general_feedback`
- [ ] Actualizar submission con `submission.updateCorrectionDetailed()`
- [ ] Cambiar `status` a "corrected"
- [ ] Retornar submission actualizada

**Archivo:** `backend/src/controllers/submissionController.js`

#### 4.2 Modificar Workflow n8n de Corrección Individual
- [ ] Modificar workflow actual de corrección
- [ ] **INPUT**: Recibir archivo binario + rubric_json (no usar Drive)
- [ ] Subir archivo a Gemini
- [ ] Ejecutar corrección con rúbrica
- [ ] Parsear respuesta de Gemini
- [ ] **OUTPUT**: Retornar JSON estructurado:
  ```json
  {
    "grade": 85,
    "criteria": [
      { "id": "c1", "name": "Funcionalidad", "score": 20, "max_score": 25, "status": "ok", "feedback": "..." },
      { "id": "c2", "name": "Código", "score": 15, "max_score": 20, "status": "warning", "feedback": "..." }
    ],
    "strengths_list": ["Buena estructura", "Código limpio"],
    "recommendations_list": ["Agregar validaciones", "Mejorar tests"],
    "general_feedback": "Buen trabajo en general..."
  }
  ```
- [ ] NO guardar en Sheets
- [ ] NO leer/escribir en Drive

**Archivo:** `n8n-workflows/flujo_correccion_individual.json` (NUEVO)

#### 4.3 Testing Corrección Individual
- [ ] Subir entrega de prueba
- [ ] Ejecutar corrección desde backend
- [ ] Verificar que n8n reciba archivo correctamente
- [ ] Verificar que Gemini procese archivo
- [ ] Verificar que respuesta sea estructurada
- [ ] Verificar que se guarde en MongoDB correctamente
- [ ] Verificar que campos `criteria`, `strengths_list`, etc. tengan datos

---

## 🔷 FASE 5: Refactorizar Corrección Masiva (Semana 3-4)

### Objetivo
Modificar corrección batch para leer submissions desde MongoDB, corregir una por una, y guardar resultados en DB.

### Tareas

#### 5.1 Crear Endpoint Backend para Corrección Masiva
- [ ] Crear `POST /api/commissions/:commissionId/rubrics/:rubricId/correct-batch`
- [ ] Obtener todas las submissions con status "uploaded" o "pending-correction"
- [ ] Obtener rúbrica asociada
- [ ] Para cada submission:
  - [ ] Cambiar status a "pending-correction"
  - [ ] Leer archivo desde `fileStorageService.getSubmissionFile()`
  - [ ] Llamar a workflow n8n de corrección individual
  - [ ] Actualizar submission con resultado
  - [ ] Cambiar status a "corrected" o "failed"
  - [ ] Manejar errores (continuar con siguiente)
- [ ] Retornar resumen: `{ total, corrected, failed, errors: [...] }`
- [ ] Implementar como proceso asíncrono (job queue) si hay muchas submissions

**Archivo:** `backend/src/controllers/submissionController.js`

#### 5.2 Modificar Workflow n8n de Corrección Masiva
- [ ] **OPCIÓN 1**: Eliminar workflow masivo, usar corrección individual N veces desde backend
- [ ] **OPCIÓN 2**: Refactorizar workflow masivo para recibir array de submissions desde backend
- [ ] Decidir cuál opción usar (Recomendación: Opción 1 - más simple)
- [ ] Si Opción 2: Modificar workflow para recibir array y procesar c/u
- [ ] Asegurar que cada corrección se procese independientemente
- [ ] Retornar array de resultados

**Archivo:** `n8n-workflows/flujo_correccion_masiva.json` (MODIFICAR o ELIMINAR)

#### 5.3 Actualizar Frontend - Corrección Masiva
- [ ] Modificar componente que dispara corrección masiva
- [ ] Cambiar de llamada directa a n8n → llamada a backend `/correct-batch`
- [ ] Mostrar progreso de corrección (X de Y corregidos)
- [ ] Mostrar errores si los hay
- [ ] Actualizar lista de submissions al finalizar
- [ ] Agregar botón de cancelar (si es proceso largo)

**Archivo:** `frontend/src/pages/professor/CommissionDetail.tsx` (o similar)

#### 5.4 Testing Corrección Masiva
- [ ] Subir 5 entregas de prueba
- [ ] Ejecutar corrección masiva
- [ ] Verificar que todas se corrijan
- [ ] Verificar progreso en tiempo real
- [ ] Verificar que se guarden correctamente en MongoDB
- [ ] Simular error en una corrección (verificar que continúe con otras)
- [ ] Verificar resumen final

---

## 🔷 FASE 6: Migrar PDFs de Devolución a MongoDB (Semana 4)

### Objetivo
Generar PDFs de devolución leyendo datos directamente de MongoDB, sin llamar a n8n/Sheets.

### Tareas

#### 6.1 Actualizar Servicio de PDF Individual
- [ ] Modificar `devolutionPdfService.js`
- [ ] Leer submission desde MongoDB (con corrección completa)
- [ ] Extraer `correction.criteria`, `correction.strengths_list`, etc.
- [ ] Generar PDF con todos los detalles estructurados
- [ ] Mejorar diseño del PDF:
  - [ ] Usar colores según `status` (ok=verde, error=rojo, warning=amarillo)
  - [ ] Mostrar score/max_score por criterio
  - [ ] Listar fortalezas con bullet points
  - [ ] Listar recomendaciones numeradas
  - [ ] Incluir feedback general al final
- [ ] Retornar Buffer del PDF

**Archivo:** `backend/src/services/devolutionPdfService.js`

#### 6.2 Eliminar Servicio Obsoleto
- [ ] **ELIMINAR** `nodeDevolutionService.js` (lee de Sheets)
- [ ] Verificar que no se use en ningún endpoint
- [ ] Eliminar imports en controladores

**Archivo:** `backend/src/services/nodeDevolutionService.js` (ELIMINAR)

#### 6.3 Actualizar Endpoints de Descarga PDF
- [ ] Modificar `GET /api/submissions/:submissionId/devolution-pdf`
- [ ] Usar únicamente `devolutionPdfService.generateDevolutionPdf()`
- [ ] NO llamar a webhook n8n
- [ ] Retornar PDF directamente
- [ ] Agregar validación: submission debe estar "corrected"

**Archivo:** `backend/src/controllers/devolutionController.js`

#### 6.4 Actualizar Descarga Batch de PDFs
- [ ] Modificar `POST /api/commissions/:commissionId/rubrics/:rubricId/generate-devolution-pdfs`
- [ ] Obtener todas las submissions "corrected" desde MongoDB
- [ ] Generar PDF para cada una con `devolutionPdfService.generateDevolutionPdf()`
- [ ] Comprimir todos los PDFs en un ZIP
- [ ] Retornar ZIP
- [ ] NO llamar a webhook n8n

**Archivo:** `backend/src/controllers/devolutionController.js`

#### 6.5 Testing PDFs
- [ ] Descargar PDF individual de submission corregida
- [ ] Verificar que muestre toda la información
- [ ] Verificar colores y formato
- [ ] Descargar ZIP batch con 3 submissions
- [ ] Verificar que ZIP contenga todos los PDFs
- [ ] Verificar nombres de archivos correctos

---

## 🔷 FASE 7: Limpieza de Código y Workflows (Semana 5)

### Objetivo
Eliminar código obsoleto, workflows n8n innecesarios, y dependencias a Drive/Sheets.

### Tareas

#### 7.1 Identificar Workflows n8n Obsoletos
- [ ] Listar todos los workflows en `n8n-workflows/`
- [ ] Identificar workflows que crean carpetas Drive
- [ ] Identificar workflows que crean/leen Sheets
- [ ] Identificar workflows que suben archivos a Drive
- [ ] Marcar workflows a eliminar vs. workflows a modificar

**Archivo:** `docs/workflows-analysis.md` (crear documento)

#### 7.2 Eliminar Workflows Obsoletos
- [ ] Mover workflows obsoletos a `n8n-workflows/deprecated/`
- [ ] Documentar por qué cada uno fue deprecado
- [ ] Verificar que no estén referenciados en backend
- [ ] Actualizar README de n8n

**Directorio:** `n8n-workflows/deprecated/`

#### 7.3 Eliminar Servicios Backend Obsoletos
- [ ] Revisar `backend/src/services/driveService.js`
- [ ] Eliminar funciones que crean carpetas
- [ ] Mantener solo funciones de lectura (si se usan para migración)
- [ ] O eliminar archivo completo si no se usa
- [ ] Eliminar `nodeDevolutionService.js` (ya hecho en Fase 6)

**Archivo:** `backend/src/services/driveService.js` (MODIFICAR o ELIMINAR)

#### 7.4 Limpiar Variables de Entorno
- [ ] Revisar `.env.example`
- [ ] Eliminar variables de webhooks n8n obsoletos:
  - [ ] `N8N_WEBHOOK_GET_CORRECTIONS`
  - [ ] Variables de webhooks de carpetas Drive
- [ ] Mantener solo:
  - [ ] `N8N_RUBRIC_WEBHOOK_URL` (generación de rúbrica desde PDF)
  - [ ] `N8N_GRADING_WEBHOOK_URL` (corrección)
- [ ] Actualizar documentación

**Archivo:** `.env.example`

#### 7.5 Actualizar Documentación
- [ ] Actualizar `README.md` principal
- [ ] Eliminar secciones sobre configuración de Drive
- [ ] Actualizar diagrama de arquitectura
- [ ] Crear documento de migración en `docs/migration/`
- [ ] Documentar workflows n8n que SÍ se mantienen
- [ ] Documentar estructura de almacenamiento de archivos

**Archivos:** `README.md`, `docs/ARCHITECTURE.md`, `docs/migration/drive-to-db.md`

---

## 🔷 FASE 8: Testing Integral y Regresión (Semana 5-6)

### Objetivo
Asegurar que todo el flujo funcione correctamente sin Drive/Sheets.

### Tareas

#### 8.1 Testing End-to-End - Flujo Completo
- [ ] Crear universidad, facultad, carrera, curso, comisión
- [ ] Crear rúbrica desde PDF (o JSON)
- [ ] Verificar que rúbrica se cree sin Drive
- [ ] Subir 5 entregas de alumnos
- [ ] Verificar que archivos se guarden localmente
- [ ] Verificar que se guarden en MongoDB
- [ ] Ejecutar corrección masiva
- [ ] Verificar que todas se corrijan
- [ ] Descargar PDF individual
- [ ] Descargar ZIP batch
- [ ] Verificar que PDFs tengan todos los datos

#### 8.2 Testing de Roles y Permisos
- [ ] Profesor puede subir entregas
- [ ] Profesor puede ver entregas de su comisión
- [ ] Profesor puede descargar PDFs de su comisión
- [ ] Profesor NO puede ver entregas de otras comisiones
- [ ] University-admin puede ver todo de su universidad
- [ ] Super-admin puede ver todo

#### 8.3 Testing de Performance
- [ ] Subir 50 entregas
- [ ] Medir tiempo de subida
- [ ] Ejecutar corrección masiva de 50 entregas
- [ ] Medir tiempo total de corrección
- [ ] Generar ZIP con 50 PDFs
- [ ] Medir tiempo de generación
- [ ] Verificar uso de memoria y CPU

#### 8.4 Testing de Errores
- [ ] Intentar subir archivo demasiado grande (>50MB)
- [ ] Intentar subir archivo de tipo no permitido
- [ ] Simular error de Gemini en corrección
- [ ] Simular error de n8n caído
- [ ] Verificar que errores se manejen correctamente
- [ ] Verificar mensajes de error claros al usuario

#### 8.5 Checklist de Regresión
- [ ] Login y autenticación funciona
- [ ] Gestión de universidades funciona
- [ ] Gestión de comisiones funciona
- [ ] Gestión de rúbricas funciona
- [ ] Creación de usuarios funciona
- [ ] Panel de profesor funciona
- [ ] Panel de admin funciona
- [ ] Todos los endpoints responden correctamente

---

## 🔷 FASE 9: Migración de Datos Históricos (Opcional - Semana 6)

### Objetivo
Migrar submissions existentes que tienen archivos en Drive hacia almacenamiento local/DB.

### Tareas

#### 9.1 Análisis de Datos Existentes
- [ ] Contar submissions con `drive_file_id` poblado
- [ ] Contar submissions con correcciones en Sheets (vía rubric spreadsheet_id)
- [ ] Decidir si vale la pena migrar o dejar como legacy
- [ ] Documentar decisión

#### 9.2 Script de Migración de Archivos (si se decide migrar)
- [ ] Crear `backend/scripts/migrateSubmissionsFromDrive.js`
- [ ] Para cada submission con `drive_file_id`:
  - [ ] Descargar archivo de Drive
  - [ ] Guardar en almacenamiento local con `fileStorageService`
  - [ ] Actualizar submission con nuevo `file_path`
  - [ ] Mantener `drive_file_id` como backup
- [ ] Ejecutar en lotes pequeños (10-20 a la vez)
- [ ] Generar log de migración
- [ ] Manejar errores (archivos no encontrados, sin permisos)

**Archivo:** `backend/scripts/migrateSubmissionsFromDrive.js`

#### 9.3 Script de Migración de Correcciones (si se decide migrar)
- [ ] Crear `backend/scripts/migrateCorrectionsFromSheets.js`
- [ ] Para cada rubric con `spreadsheet_file_id`:
  - [ ] Leer datos de Google Sheets
  - [ ] Parsear correcciones (alumno, puntaje, criterios, fortalezas, recomendaciones)
  - [ ] Buscar submission correspondiente
  - [ ] Actualizar con `updateCorrectionDetailed()`
- [ ] Ejecutar script
- [ ] Generar reporte de correcciones migradas

**Archivo:** `backend/scripts/migrateCorrectionsFromSheets.js`

#### 9.4 Verificación Post-Migración
- [ ] Verificar que archivos migrados se puedan descargar
- [ ] Verificar que correcciones migradas generen PDFs correctamente
- [ ] Comparar PDFs generados con datos de Sheets (spot check)

---

## 🔷 FASE 10: Deploy y Monitoreo (Semana 6)

### Objetivo
Desplegar cambios a producción y monitorear estabilidad.

### Tareas

#### 10.1 Preparación Pre-Deploy
- [ ] Crear rama `migration/drive-to-mongodb`
- [ ] Merge de todas las fases completadas
- [ ] Ejecutar tests completos
- [ ] Generar build de producción
- [ ] Revisar logs de build (sin errores)
- [ ] Crear backup completo de MongoDB producción
- [ ] Crear backup de archivos Drive (export si es necesario)

#### 10.2 Deploy Gradual
- [ ] Desplegar backend a staging
- [ ] Ejecutar tests en staging
- [ ] Desplegar frontend a staging
- [ ] Testing manual completo en staging
- [ ] Validar con usuarios beta (2-3 profesores)
- [ ] Recoger feedback
- [ ] Ajustar si es necesario

#### 10.3 Deploy a Producción
- [ ] Coordinar ventana de mantenimiento (avisar usuarios)
- [ ] Desplegar backend a producción
- [ ] Ejecutar migraciones de DB si las hay
- [ ] Desplegar frontend a producción
- [ ] Verificar n8n workflows actualizados están activos
- [ ] Verificar que webhooks apunten a endpoints correctos

#### 10.4 Monitoreo Post-Deploy
- [ ] Monitorear logs de backend primeras 24h
- [ ] Monitorear uso de disco (almacenamiento archivos)
- [ ] Monitorear errores de corrección
- [ ] Monitorear performance de generación de PDFs
- [ ] Crear alertas para errores críticos
- [ ] Responder a issues de usuarios rápidamente

#### 10.5 Documentación Final
- [ ] Actualizar changelog con cambios de migración
- [ ] Crear guía de troubleshooting
- [ ] Documentar rollback plan (si algo falla)
- [ ] Actualizar documentación de deployment
- [ ] Crear post-mortem document

---

## ✅ CRITERIOS DE ÉXITO

### Técnicos
- [ ] 0 llamadas a workflows n8n de carpetas/sheets
- [ ] 100% de nuevas submissions se guardan en storage local
- [ ] 100% de correcciones se guardan en MongoDB
- [ ] PDFs se generan desde MongoDB sin webhooks
- [ ] Tiempo de corrección batch ≤ 2x tiempo actual
- [ ] Storage local < 10GB para 1000 submissions
- [ ] 0 errores críticos en producción primera semana

### Funcionales
- [ ] Profesores pueden subir entregas sin problemas
- [ ] Corrección masiva funciona correctamente
- [ ] PDFs de devolución tienen toda la información
- [ ] No hay regresiones en funcionalidades existentes
- [ ] UX es igual o mejor que antes

### Negocio
- [ ] Reducción de dependencia de Google APIs (solo Drive como backup opcional)
- [ ] Reducción de costos de n8n (menos workflows activos)
- [ ] Mayor control sobre datos (todo en MongoDB)
- [ ] Mejor performance (menos llamadas HTTP externas)

---

## 🚨 RIESGOS Y MITIGACIONES

### Riesgo 1: Pérdida de datos durante migración
**Mitigación:**
- Backup completo antes de cada fase
- Mantener campos Drive/Sheets durante transición
- Migración incremental, no eliminar datos legacy

### Riesgo 2: Storage local se llena
**Mitigación:**
- Límite de 50MB por archivo
- Monitoreo de uso de disco
- Implementar limpieza de submissions antiguas (>1 año)
- Plan B: migrar a S3 si crece mucho

### Riesgo 3: Workflow n8n de corrección falla más
**Mitigación:**
- Mantener retry logic robusta
- Implementar queue de correcciones con reintentos
- Logs detallados de errores
- Rollback rápido a sistema anterior si >10% falla

### Riesgo 4: Performance de corrección masiva se degrada
**Mitigación:**
- Implementar corrección en paralelo (3-5 a la vez)
- Implementar job queue (Bull, BullMQ)
- Monitorear tiempos de respuesta
- Optimizar workflow n8n si es necesario

---

## 📊 MÉTRICAS DE SEGUIMIENTO

### Durante la Migración
- Número de submissions migradas vs total
- Errores de migración por fase
- Tiempo invertido por fase vs estimado
- Cobertura de tests (mantener >80%)

### Post-Migración
- Tasa de éxito de subida de entregas (objetivo: >99%)
- Tasa de éxito de corrección (objetivo: >95%)
- Tiempo promedio de corrección por submission
- Uso de storage (GB/mes)
- Errores de generación de PDFs (objetivo: <1%)
- Tiempo promedio de generación de PDF batch

---

## 📝 NOTAS FINALES

### Workflows n8n que SE MANTIENEN
- `flujo_generacion_rubrica.json` (generar rúbrica desde PDF con Gemini)
- `flujo_correccion_individual.json` (corregir con Gemini - MODIFICADO)

### Workflows n8n que SE ELIMINAN/DEPRECAN
- `flujo_creacion_carpetas_drive.json`
- `flujo_creacion_spreadsheet.json`
- `flujo_subida_entregas_drive.json`
- `flujo_correccion_masiva.json` (si se reemplaza por llamadas individuales desde backend)
- Cualquier otro workflow relacionado con organización de Drive

### Compatibilidad hacia atrás
- Submissions antiguas con `drive_file_id` seguirán funcionando (lectura)
- Rubrics antiguas con `spreadsheet_file_id` seguirán siendo válidas (pero no se usarán)
- No se eliminan datos, solo se dejan de usar

---

**FIN DEL PLAN**
