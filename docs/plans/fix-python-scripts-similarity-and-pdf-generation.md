# Plan: Corregir Scripts de Python para Similitud y Generación de PDFs

**Fecha de creación:** 2025-12-04
**Estado:** Pendiente
**Prioridad:** Alta

---

## Resumen Ejecutivo

Este plan tiene como objetivo replicar fielmente los scripts de Python de referencia para:
1. **Análisis de Similitud**: Generar reportes de similitud entre entregas usando hashes SHA256
2. **Generación de PDFs**: Crear PDFs de devolución individuales y batch desde datos de corrección

Actualmente, el backend genera scripts diferentes a los originales, y el sistema de generación de PDFs no accede correctamente a Drive para obtener los datos de corrección.

---

## Contexto y Problema

### Situación Actual
- **ProfessorView** tiene dos botones:
  - "Reporte Similitud": Descarga PDF con análisis de similitud
  - "PDFs Devolución": Genera ZIP con PDFs para todos los alumnos

### Problemas Identificados
1. Los scripts de Python generados por el backend NO replican fielmente la lógica de los scripts de referencia
2. La generación de PDFs no accede a Drive para obtener datos de corrección
3. Falta funcionalidad para generar PDF individual por alumno

### Scripts de Referencia
- **Similitud**: `E:\ESCRITORIO\programar\2025\Implementaciones-Pendientes\convertir-en-un-archivo\batch_consolidator.py`
  - Calcula hashes SHA256 de archivos Java
  - Detecta copias totales (100% idénticas)
  - Detecta copias parciales (≥50% similitud)
  - Genera reporte JSON con estadísticas

- **PDFs**: `E:\ESCRITORIO\programar\2025\Implementaciones-Pendientes\convertir-planilla-en-pdf\generar_pdfs.py`
  - Lee Excel con correcciones (columnas: Alumno, Nota, Criterios, Fortalezas, Recomendaciones)
  - Genera PDFs con ReportLab
  - Parsea criterios con emojis (✅, ❌, ⚠️)
  - Aplica colores según estado (verde, rojo, amarillo)

---

## Arquitectura Actual vs Deseada

### Arquitectura Actual (Backend Node.js)
```
ProfessorView (Frontend)
    ↓
Routes (commissionRoutes.js)
    ↓
Controllers (similarityController.js / devolutionController.js)
    ↓
Services (similarityDetectorService.js / devolutionPdfService.js)
    ↓
MongoDB (ProjectHash / Submission)
```

**Problema**: Los servicios de Node.js no replican la lógica exacta de los scripts de Python.

### Arquitectura Deseada (Híbrida: Node.js + Python + N8N)
```
ProfessorView (Frontend)
    ↓
Routes (commissionRoutes.js)
    ↓
Controllers (similarityController.js / devolutionController.js)
    ↓
Python Scripts (batch_consolidator.py / generar_pdfs.py)
    ↓
MongoDB + N8N Workflow (Google Sheets)
    ↓
Google Drive (Spreadsheet con correcciones)
```

**Decisión**: Usar N8N para evitar configuración de credenciales OAuth2 en el backend.

---

## Fases del Plan

### ✅ FASE 1: Análisis y Preparación
**Objetivo**: Entender arquitectura actual y scripts de referencia

#### Tareas
- [x] Leer script de similitud de referencia (`batch_consolidator.py`)
- [x] Leer script de PDFs de referencia (`generar_pdfs.py`)
- [x] Analizar servicios actuales de Node.js
- [x] Identificar diferencias entre lógica actual y esperada
- [x] Documentar formato de datos en MongoDB vs Excel esperado
- [x] Decidir enfoque de integración (N8N vs Google Sheets API)

**Checks**:
- [x] Scripts de referencia leídos y comprendidos
- [x] Diferencias identificadas
- [x] Formato de datos documentado
- [x] Enfoque N8N seleccionado

---

### 🔄 FASE 2: Crear N8N Workflow para Google Sheets (EN PROGRESO)
**Objetivo**: Crear workflow N8N que busca fila de alumno en Google Sheets

**Estado**: Workflow diseñado y exportado. Pendiente: Importar y activar en N8N.

#### ¿Por qué N8N?
**Ventajas**:
- No requiere configuración de credenciales OAuth2 en backend
- Interfaz visual fácil de mantener
- Credenciales de Google manejadas solo en N8N
- Reutilizable para múltiples operaciones

**Desventajas**:
- Dependencia externa (debe estar corriendo N8N)

#### Workflow N8N: "Obtener Correcciones de Drive"

**Entrada (Webhook)**:
```json
{
  "spreadsheet_id": "1ABC...",
  "student_name": "Juan Pérez"  // Opcional
}
```

**Salida**:
- Si `student_name` está presente: Retorna JSON con datos de ESA fila
- Si `student_name` es null: Retorna JSON con TODAS las filas

**Nodos del Workflow**:
1. **Webhook** - Recibe parámetros (POST)
2. **IF** - ¿Viene student_name?
   - **SI** → Google Sheets (Buscar fila por nombre)
   - **NO** → Google Sheets (Leer todas las filas)
3. **Function** - Normalizar formato de salida
4. **Respond to Webhook** - Retornar JSON

**Formato de Salida Esperado**:
```json
{
  "success": true,
  "data": [
    {
      "alumno": "Juan Pérez",
      "puntaje_total": "85/100",
      "criterios": "✅C1: OK · Buen trabajo\n❌C2: Error · Falta validación",
      "fortalezas": "🌟 Código limpio\n🌟 Buena estructura",
      "recomendaciones": "1. Agregar tests\n2. Mejorar docs"
    }
  ]
}
```

#### Tareas - Diseño del Workflow
- [x] Diseñar estructura del workflow (Webhook → IF → Google Sheets → Function → Respond)
- [x] Definir entrada del webhook (spreadsheet_id, student_name opcional)
- [x] Definir formato de salida esperado (JSON normalizado)
- [x] Crear archivo JSON del workflow: `n8n-flows/get-student-corrections.json`
- [x] Crear README con instrucciones de instalación: `n8n-flows/README.md`
- [x] Documentar formato esperado de la planilla de Google Sheets
- [x] Documentar ejemplos de testing (cURL, Postman)

#### Tareas - Implementación en N8N (Pendiente)
- [ ] Abrir N8N (http://localhost:5678)
- [ ] Importar workflow desde `n8n-flows/get-student-corrections.json`
- [ ] Configurar credenciales de Google OAuth2 en N8N
- [ ] Actualizar IDs de credenciales en los nodos de Google Sheets
- [ ] Activar workflow
- [ ] Copiar URL del webhook de producción
- [ ] Agregar webhook URL al `.env` del backend:
  ```
  N8N_WEBHOOK_GET_CORRECTIONS=http://localhost:5678/webhook/get-student-corrections
  ```
- [ ] Testear con cURL (un alumno)
- [ ] Testear con cURL (todos los alumnos)

**Checks**:
- [x] Workflow diseñado y exportado a JSON
- [x] README de instalación creado
- [x] Formato de planilla documentado
- [ ] Workflow importado y activado en N8N
- [ ] Credenciales de Google configuradas
- [ ] Webhook funciona con Postman/curl
- [ ] Retorna datos correctamente (1 alumno)
- [ ] Retorna datos correctamente (todos los alumnos)
- [ ] URL configurada en `.env`

**Archivos creados**:
- [x] `n8n-flows/get-student-corrections.json`
- [x] `n8n-flows/README.md`
- [ ] Actualizar `backend/.env` con webhook URL (pendiente)

---

### ⏳ FASE 3: Replicar Script de Similitud
**Objetivo**: Generar reportes de similitud idénticos al script de referencia

#### Enfoque: Crear script Python standalone
El backend ejecutará el script Python usando `child_process` de Node.js.

#### Tareas
- [ ] Copiar `batch_consolidator.py` a `backend/scripts/python/similarity/`
- [ ] Adaptar script para:
  - Recibir parámetros: `--commission-id`, `--rubric-id`, `--output-dir`
  - Conectar a MongoDB para obtener ProjectHashes
  - Generar JSON con análisis de similitud
  - Generar PDF con reportlab (replicar formato del script original)
- [ ] Instalar dependencias Python en el servidor:
  ```bash
  pip install pymongo reportlab
  ```
- [ ] Crear wrapper en Node.js: `backend/src/services/pythonSimilarityService.js`
  - Ejecutar script Python con `child_process.spawn()`
  - Pasar parámetros por línea de comandos
  - Capturar salida (JSON) y PDF generado
  - Manejar errores y timeouts
- [ ] Actualizar `similarityController.js` para usar el nuevo servicio Python

**Checks**:
- [ ] Script Python adaptado y funcional
- [ ] Wrapper de Node.js ejecuta script correctamente
- [ ] Genera JSON idéntico al script original
- [ ] Genera PDF idéntico al script original
- [ ] Manejo de errores robusto

**Archivos a crear/modificar**:
- `backend/scripts/python/similarity/batch_consolidator.py` (adaptado)
- `backend/scripts/python/similarity/requirements.txt`
- `backend/src/services/pythonSimilarityService.js` (nuevo)
- `backend/src/controllers/similarityController.js` (modificar)

---

### ⏳ FASE 4: Replicar Script de Generación de PDFs con N8N
**Objetivo**: Generar PDFs de devolución idénticos al script de referencia usando N8N

#### Enfoque: Script Python llama a N8N Webhook para obtener datos

#### Flujo de Trabajo:
1. **Backend Node.js** recibe request para generar PDF(s)
2. **Backend** ejecuta script Python con parámetros
3. **Script Python** llama al webhook de N8N con `spreadsheet_id` y `student_name`
4. **N8N** busca en Google Sheets y retorna JSON con datos
5. **Script Python** genera PDF(s) usando ReportLab
6. **Script Python** retorna PDF/ZIP al backend
7. **Backend** envía PDF/ZIP al frontend

#### Tareas
- [ ] Copiar `generar_pdfs.py` a `backend/scripts/python/devolution/`
- [ ] Adaptar script para:
  - Recibir parámetros: `--commission-id`, `--rubric-id`, `--spreadsheet-id`, `--student-name` (opcional), `--n8n-webhook-url`
  - Si `--student-name` está presente:
    - Llamar a N8N webhook: `POST /webhook/get-student-corrections` con `{ spreadsheet_id, student_name }`
    - Parsear JSON de respuesta (1 fila)
    - Generar PDF individual
    - Guardar en `./output/individual/`
  - Si NO está presente:
    - Llamar a N8N webhook: `POST /webhook/get-student-corrections` con `{ spreadsheet_id }` (sin student_name)
    - Parsear JSON de respuesta (todas las filas)
    - Generar PDF por cada fila (loop)
    - Comprimir todos los PDFs en ZIP
    - Guardar en `./output/batch/`
- [ ] Instalar dependencias Python:
  ```bash
  pip install reportlab requests
  ```
- [ ] Crear wrapper en Node.js: `backend/src/services/pythonDevolutionService.js`
  - Método `generateIndividualPdf(commissionId, rubricId, studentName, spreadsheetId)`:
    - Ejecutar: `python generar_pdfs.py --commission-id X --rubric-id Y --spreadsheet-id Z --student-name "Juan" --n8n-webhook-url $N8N_WEBHOOK_GET_CORRECTIONS`
    - Leer PDF desde `./output/individual/`
    - Retornar buffer del PDF
  - Método `generateBatchPdfs(commissionId, rubricId, spreadsheetId)`:
    - Ejecutar: `python generar_pdfs.py --commission-id X --rubric-id Y --spreadsheet-id Z --n8n-webhook-url $N8N_WEBHOOK_GET_CORRECTIONS`
    - Leer ZIP desde `./output/batch/`
    - Retornar buffer del ZIP
- [ ] Actualizar `devolutionController.js` para:
  - `downloadIndividualDevolutionPdf`: Usar nuevo servicio Python
  - `downloadBatchDevolutionPdfs`: Usar nuevo servicio Python

**Checks**:
- [ ] Script Python adaptado y funcional
- [ ] Llama correctamente a N8N webhook
- [ ] Genera PDFs idénticos al script original (con colores, emojis, formato)
- [ ] Parsea criterios, fortalezas y recomendaciones correctamente
- [ ] Loop funciona para batch (todos los alumnos)
- [ ] ZIP se genera correctamente
- [ ] Wrapper de Node.js ejecuta script correctamente
- [ ] Manejo de errores robusto

**Archivos a crear/modificar**:
- `backend/scripts/python/devolution/generar_pdfs.py` (adaptado)
- `backend/scripts/python/devolution/requirements.txt`
- `backend/src/services/pythonDevolutionService.js` (nuevo)
- `backend/src/services/n8nService.js` (agregar método helper opcional)
- `backend/src/controllers/devolutionController.js` (modificar)

---

### ⏳ FASE 5: Integración de Spreadsheet ID en Frontend
**Objetivo**: Permitir que profesores configuren el spreadsheet ID de Google Sheets

#### Tareas
- [ ] Agregar campo `google_sheets_spreadsheet_id` al modelo `Rubric`
- [ ] Crear endpoint para actualizar spreadsheet ID:
  - `PUT /api/rubrics/:rubricId/spreadsheet`
  - Body: `{ spreadsheet_id: "..." }`
- [ ] Actualizar frontend (`ProfessorView.tsx`):
  - Agregar input para configurar spreadsheet ID por rúbrica
  - Mostrar botón "Configurar Planilla de Drive"
  - Al hacer clic en "PDFs Devolución", verificar que exista spreadsheet ID

**Checks**:
- [ ] Campo agregado al modelo Rubric
- [ ] Endpoint de configuración funcional
- [ ] Frontend permite configurar spreadsheet ID
- [ ] Validación de spreadsheet ID antes de generar PDFs

**Archivos a crear/modificar**:
- `backend/src/models/Rubric.js` (modificar)
- `backend/src/routes/rubricRoutes.js` (agregar ruta)
- `backend/src/controllers/rubricController.js` (agregar método)
- `frontend/src/components/professor/ProfessorView.tsx` (modificar)

---

### ⏳ FASE 6: Implementar PDF Individual por Alumno
**Objetivo**: Permitir descargar PDF de devolución de un alumno específico

#### Tareas
- [ ] Agregar endpoint individual:
  - `GET /api/commissions/:commissionId/rubrics/:rubricId/students/:studentName/devolution-pdf`
  - Llama a `pythonDevolutionService.generateIndividualPdf()`
- [ ] Actualizar `SubmissionsList.tsx` (frontend):
  - Agregar botón "📄 Descargar PDF" por cada alumno
  - Al hacer clic, descargar PDF individual

**Checks**:
- [ ] Endpoint individual funcional
- [ ] Frontend permite descargar PDF por alumno
- [ ] PDF individual se genera correctamente

**Archivos a crear/modificar**:
- `backend/src/routes/commissionRoutes.js` (agregar ruta)
- `backend/src/controllers/devolutionController.js` (agregar método)
- `frontend/src/components/professor/SubmissionsList.tsx` (modificar)

---

### ⏳ FASE 7: Testing y Validación
**Objetivo**: Garantizar que todo funciona correctamente

#### Tareas de Testing
- [ ] **Test de Similitud**:
  - Subir 3 entregas (2 iguales, 1 diferente)
  - Generar reporte de similitud
  - Verificar que detecta copias 100% y parciales
  - Comparar salida con script original

- [ ] **Test de PDFs**:
  - Crear planilla de Google Sheets con 5 alumnos
  - Configurar spreadsheet ID en rúbrica
  - Generar PDF individual para 1 alumno
  - Verificar formato, colores, emojis, contenido
  - Generar batch de PDFs (ZIP con 5 PDFs)
  - Verificar que todos los PDFs se generan correctamente

- [ ] **Test de Errores**:
  - Probar con spreadsheet ID inválido
  - Probar con alumno no existente
  - Probar sin credenciales de Google
  - Verificar mensajes de error claros

**Checks**:
- [ ] Todos los tests pasan
- [ ] Salidas idénticas a scripts originales
- [ ] Manejo de errores robusto
- [ ] Performance aceptable (< 5 seg por PDF)

---

### ⏳ FASE 8: Documentación y Limpieza
**Objetivo**: Documentar cambios y limpiar código obsoleto

#### Tareas
- [ ] Documentar en README:
  - Configuración de Google Sheets API
  - Variables de entorno necesarias
  - Instalación de dependencias Python
  - Flujo de generación de PDFs

- [ ] Crear guía para profesores:
  - Cómo configurar spreadsheet ID
  - Formato esperado de la planilla de Google Sheets
  - Cómo generar reportes de similitud
  - Cómo descargar PDFs individuales y batch

- [ ] Limpiar código obsoleto:
  - Eliminar servicios antiguos si no se usan
  - Remover dependencias no utilizadas
  - Actualizar `.gitignore` para excluir credenciales

**Checks**:
- [ ] README actualizado
- [ ] Guía para profesores creada
- [ ] Código limpio y documentado

**Archivos a crear/modificar**:
- `backend/README.md` (actualizar)
- `docs/GOOGLE_SHEETS_SETUP.md` (nuevo)
- `docs/PROFESSOR_GUIDE.md` (nuevo)

---

## Decisiones Técnicas

### 1. Google Sheets API vs N8N
**Decisión**: Usar N8N Workflow
**Razón**: Evita configuración de credenciales OAuth2 en backend, fácil de mantener visualmente, credenciales manejadas solo en N8N

### 2. Python Scripts vs Reescribir en Node.js
**Decisión**: Usar scripts Python standalone
**Razón**: Fidelidad al 100% con scripts de referencia, evita bugs por reescritura

### 3. Comunicación Backend-N8N
**Decisión**: Webhook HTTP (POST) desde Python
**Razón**: Simple, estándar, fácil de depurar, permite retry logic

### 4. Formato de Planilla de Google Sheets
**Decisión**: Columnas esperadas:
- `Alumno` (obligatorio)
- `puntaje_total` o `Nota`
- `criterios` o `Resumen por criterios`
- `fortalezas` o `Fortalezas`
- `recomendaciones` o `Recomendaciones`

**Razón**: Compatible con script de referencia

---

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Credenciales de Google inválidas | Media | Alto | Validar credenciales en setup, mensajes claros de error |
| Performance lenta con muchos alumnos | Media | Medio | Implementar procesamiento batch con progreso |
| Formato de planilla incorrecto | Alta | Medio | Documentar formato claramente, validar columnas antes de procesar |
| Scripts Python fallan en producción | Baja | Alto | Testing exhaustivo, manejo de errores robusto |

---

## Dependencias

### Python
- `pymongo` - Conexión a MongoDB
- `reportlab` - Generación de PDFs
- `requests` - Llamadas HTTP a N8N webhook

### Node.js
- `archiver` - Compresión de ZIPs (ya instalado)
- `axios` - Cliente HTTP para llamar a N8N (ya instalado probablemente)

### N8N
- Google Sheets Node (integrado en N8N)
- Credenciales de Google OAuth2 configuradas en N8N

---

## Variables de Entorno

Agregar al `.env` del backend:

```bash
# N8N Webhooks
N8N_WEBHOOK_GET_CORRECTIONS=http://localhost:5678/webhook/get-student-corrections
N8N_BASE_URL=http://localhost:5678

# Nota: Las credenciales de Google se configuran SOLO en N8N, no en el backend
```

---

## Cronograma Estimado

| Fase | Duración Estimada | Dependencias |
|------|-------------------|--------------|
| Fase 1 | ✅ Completado | - |
| Fase 2 | 2-3 horas | Fase 1 |
| Fase 3 | 3-4 horas | Fase 1 |
| Fase 4 | 4-5 horas | Fase 2 |
| Fase 5 | 2 horas | Fase 4 |
| Fase 6 | 1-2 horas | Fase 4, 5 |
| Fase 7 | 3-4 horas | Fase 2-6 |
| Fase 8 | 2 horas | Fase 7 |
| **TOTAL** | **17-22 horas** | - |

---

## Notas Adicionales

### Estructura de Directorios Propuesta

```
backend/
├── scripts/
│   └── python/
│       ├── similarity/
│       │   ├── batch_consolidator.py
│       │   └── requirements.txt
│       └── devolution/
│           ├── generar_pdfs.py
│           └── requirements.txt
├── src/
│   ├── services/
│   │   ├── googleSheetsService.js (NUEVO)
│   │   ├── pythonSimilarityService.js (NUEVO)
│   │   └── pythonDevolutionService.js (NUEVO)
│   └── controllers/
│       ├── similarityController.js (MODIFICAR)
│       └── devolutionController.js (MODIFICAR)
└── config/
    └── google-credentials.json (GITIGNORED)
```

### Testing Manual Recomendado

1. **Crear planilla de Google Sheets de prueba** con 5 alumnos:
   - 2 con notas altas (criterios ✅)
   - 2 con notas medias (criterios ⚠️)
   - 1 con nota baja (criterios ❌)

2. **Subir 5 entregas de prueba**:
   - 2 entregas idénticas (copias 100%)
   - 2 entregas con 70% similitud (copias parciales)
   - 1 entrega única

3. **Verificar flujo completo**:
   - Configurar spreadsheet ID
   - Generar reporte de similitud
   - Descargar PDF individual
   - Generar batch de PDFs
   - Verificar contenido de PDFs

---

## Checklist Final de Implementación

- [x] Fase 1: Análisis completado ✅
- [ ] Fase 2: N8N Workflow diseñado ✅ → Pendiente: Importar y activar
- [ ] Fase 3: Script de similitud Python funcional
- [ ] Fase 4: Script de PDFs Python funcional
- [ ] Fase 5: Configuración de spreadsheet ID en frontend
- [ ] Fase 6: PDF individual por alumno implementado
- [ ] Fase 7: Testing exhaustivo completado
- [ ] Fase 8: Documentación completa

---

## Próximos Pasos Inmediatos

1. ✅ **Decisión tomada**: Usar N8N para Google Sheets
2. **Importar workflow de N8N** desde `n8n-flows/get-student-corrections.json`
3. **Configurar credenciales de Google en N8N** (OAuth2)
4. **Activar workflow y copiar webhook URL**
5. **Adaptar scripts Python de referencia** para llamar a N8N
6. **Crear wrappers de Node.js** para ejecutar scripts Python
7. **Testing end-to-end** con planilla de prueba

---

## Archivos Creados

### Workflows N8N
- ✅ `n8n-flows/get-student-corrections.json` - Workflow para obtener correcciones de Drive
- ✅ `n8n-flows/README.md` - Guía de instalación y uso del workflow

### Plan
- ✅ `docs/plans/fix-python-scripts-similarity-and-pdf-generation.md` - Este documento

### Pendientes (a crear en las próximas fases)
- [ ] `backend/scripts/python/similarity/batch_consolidator.py` (adaptado)
- [ ] `backend/scripts/python/devolution/generar_pdfs.py` (adaptado)
- [ ] `backend/src/services/pythonSimilarityService.js`
- [ ] `backend/src/services/pythonDevolutionService.js`
- [ ] `docs/GOOGLE_SHEETS_SETUP.md`
- [ ] `docs/PROFESSOR_GUIDE.md`

---

**Última actualización**: 2025-12-04
**Responsable**: Equipo de Desarrollo
**Revisión**: Plan corregido con enfoque N8N
**Estado**: ✅ Fase 1 completada, workflows N8N creados
