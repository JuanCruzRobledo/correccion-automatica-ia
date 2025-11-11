# 🔄 Flujos de n8n - Sistema de Corrección Automática

Flujos de automatización para el sistema de corrección automática que integran Google Gemini AI, Google Sheets y gestión de archivos en Google Drive.

---

## 📋 Tabla de Contenidos

- [Descripción General](#-descripción-general)
- [Archivo de Flujos](#-archivo-de-flujos)
- [Webhooks Principales](#-webhooks-principales)
- [Webhooks de Gestión de Carpetas](#-webhooks-de-gestión-de-carpetas)
- [Requisitos](#-requisitos)
- [Instalación y Configuración](#-instalación-y-configuración)
- [Uso desde el Sistema](#-uso-desde-el-sistema)
- [Estructura de Datos](#-estructura-de-datos)
- [Troubleshooting](#-troubleshooting)

---

## 🎯 Descripción General

Los flujos de n8n actúan como **orquestador central** del sistema, conectando:

- **Frontend/Backend** → Recibe solicitudes vía webhooks
- **Google Gemini 2.5 Flash** → Procesa PDFs y evalúa entregas con IA
- **Google Sheets** → Persiste resultados de correcciones
- **Google Drive** → Organiza archivos en estructura de carpetas

### Arquitectura de Integración

```
Backend API / Frontend
    ↓
┌─────────────────────────────────────┐
│         n8n Workflows               │
│                                     │
│  Webhook → Process → AI → Response │
└─────────────────────────────────────┘
    ↓           ↓           ↓
Google      Google      Google
Gemini      Sheets      Drive
```

---

## 📦 Organización de Archivos

Esta carpeta contiene los workflows de n8n organizados de **dos formas**:

### 🎯 Opción 1: Archivo Consolidado (Recomendado para inicio rápido)

**`workflows-en-un-archivo.json`**: Contiene **todos los flujos** del sistema en un único archivo exportado de n8n.

**Ventajas:**
- ✅ Importación rápida: Un solo archivo para configurar todo
- ✅ Ideal para desarrollo y testing inicial
- ✅ Mantiene todas las dependencias juntas

**Webhooks incluidos:**
1. ✨ **Flujos principales de corrección**
   - `/rubrica` - Genera rúbricas desde PDF
   - `/corregir` - Evalúa entregas de alumnos (manual individual)
   - `/spreadsheet` - Sube resultados a Google Sheets
   - `/automatico` - Corrección automática batch (múltiples entregas)

2. 📤 **Flujo de upload de archivos** (NUEVO)
   - `/upload-file-to-drive` - Sube archivos .txt de entregas a Drive

3. 📁 **Flujos de gestión de carpetas en Drive**
   - `/create-university-folder` - Crea carpeta de universidad
   - `/create-faculty-folder` - Crea carpeta de facultad
   - `/create-career-folder` - Crea carpeta de carrera
   - `/create-course-folder` - Crea carpeta de curso
   - `/create-commission-folder` - Crea carpeta de comisión + subcarpetas

---

### 🔧 Opción 2: Flujos Separados (Recomendado para producción)

Cada workflow está en su propio archivo para facilitar mantenimiento y versionado independiente.

#### Flujos de Corrección:

| Archivo | Webhook | Descripción |
|---------|---------|-------------|
| `flujo_correccion_manual.json` | `/corregir` | Corrección individual de una entrega |
| `flujo_correccion_masiva.json` | `/automatico` | Corrección batch de múltiples entregas |

#### Flujo de Upload de Archivos (NUEVO):

| Archivo | Webhook | Descripción |
|---------|---------|-------------|
| `upload-file-to-drive.json` | `/upload-file-to-drive` | Sube archivos .txt de entregas a Google Drive |

**Documentación completa**: Ver `UPLOAD_FILE_WORKFLOW.md`

#### Flujos de Gestión de Carpetas en Google Drive:

| Archivo | Webhook | Descripción |
|---------|---------|-------------|
| `create-university-folder.json` | `/create-university-folder` | Crea carpeta de universidad |
| `create-faculty-folder.json` | `/create-faculty-folder` | Crea carpeta de facultad |
| `create-career-folder.json` | `/create-career-folder` | Crea carpeta de carrera |
| `create-course-folder.json` | `/create-course-folder` | Crea carpeta de curso |
| `create-commission-folder.json` | `/create-commission-folder` | Crea carpeta de comisión |
| `Create Commission Folder.json` | (duplicado) | Versión alternativa de comisión |

**Ventajas:**
- ✅ Control granular: Actualiza solo el flujo que necesitas
- ✅ Mejor para trabajo en equipo: Menos conflictos en Git
- ✅ Facilita debugging: Problemas aislados por flujo
- ✅ Escalabilidad: Agrega nuevos flujos sin afectar existentes

---

### 💡 ¿Cuál usar?

**Para empezar (desarrollo local):**
```bash
# Importar archivo consolidado
workflows-en-un-archivo.json
```

**Para producción o equipo:**
```bash
# Importar flujos separados según necesidad
flujo_correccion_manual.json
flujo_correccion_masiva.json
create-university-folder.json
# ... etc
```

---

## ✨ Webhooks Principales

### 1. **Generación de Rúbricas desde PDF** - `/rubrica`

**¿Qué hace?**
Convierte un PDF de consigna de trabajo práctico/parcial/final en una rúbrica JSON estructurada y verificable usando Google Gemini AI.

**¿Cómo se activa?**
- **Desde Backend**: Endpoint `POST /api/rubrics/from-pdf`
- **Usuario**: Admin crea rúbrica desde PDF en Admin Panel → Tab Rúbricas → "+ Desde PDF"

**Flujo de ejecución**:
1. **Recibe**: PDF del trabajo práctico/examen (multipart/form-data, campo `pdf`)
2. **Procesa con Gemini 2.5 Flash**: Analiza contenido del PDF con prompt especializado
   - Extrae objetivos, consignas, criterios de evaluación
   - Infiere tipo de evaluación (tp/parcial/final)
   - Detecta lenguaje/stack tecnológico (Python, Java, SQL, etc.)
   - Genera criterios con pesos que suman 1.0
   - Crea matriz de evaluación completa
3. **Extrae JSON**: Parsea respuesta de Gemini eliminando markdown fences (```)
4. **Valida**: Verifica estructura JSON correcta
5. **Devuelve**: Rúbrica en formato JSON canónico

**Entrada**:
```javascript
// POST /webhook/rubrica
Content-Type: multipart/form-data
{
  pdf: File (PDF del TP/Parcial/Final)
}
```

**Salida**:
```json
{
  "rubric_id": "string-kebab-case",
  "title": "Trabajo Práctico: Listas en Python",
  "version": "1.0",
  "assessment_type": "tp",
  "course": "Programación 1",
  "language_or_stack": ["python"],
  "grading": {
    "policy": "weighted_average",
    "total_points": 100
  },
  "criteria": [
    {
      "id": "C1",
      "name": "Correctitud",
      "weight": 0.35,
      "description": "Funcionalidades implementadas correctamente"
    },
    {
      "id": "C2",
      "name": "Calidad de Código",
      "weight": 0.25,
      "description": "Legibilidad, nomenclatura, estilo"
    }
  ],
  "tasks": [...],
  "penalties": [...],
  "metadata": {...}
}
```

---

### 2. **Corrección de Entregas** - `/corregir`

**¿Qué hace?**
Evalúa el archivo entregado por un alumno contra una rúbrica específica usando IA.

**¿Cómo se activa?**
- **Desde Frontend**: UserView → Sección "Subir Archivo a Corregir" → Botón "Corregir"
- **Usuario**: Selecciona universidad/materia/rúbrica, sube archivo del alumno (.py, .java, .pdf, etc.)

**Flujo de ejecución**:
1. **Recibe**:
   - `rubric`: JSON de la rúbrica seleccionada (string)
   - `submission`: Archivo del alumno (File)
2. **Procesa con IA**: Evalúa el archivo contra cada criterio de la rúbrica
   - Verifica cumplimiento de consignas
   - Analiza correctitud funcional
   - Evalúa calidad de código, eficiencia, validaciones
   - Detecta errores, malas prácticas, código duplicado
   - Calcula nota ponderada según criterios y pesos
3. **Genera feedback estructurado**:
   - **Nota final** (sobre 100 puntos)
   - **Resumen por criterios** (desglose de puntos por criterio)
   - **Fortalezas** detectadas en el código
   - **Recomendaciones** de mejora específicas
4. **Devuelve**: Objeto JSON con evaluación completa

**Entrada**:
```javascript
// POST /webhook/corregir
Content-Type: multipart/form-data
{
  rubric: '{"rubric_id": "...", "criteria": [...]}',
  submission: File (código/documento del alumno)
}
```

**Salida**:
```json
{
  "nota": 85,
  "resumen": "**Correctitud (35%)**: 30/35 puntos. El código cumple con 4 de 5 funcionalidades solicitadas...\n\n**Calidad (25%)**: 22/25 puntos. Código legible con buenas prácticas de nomenclatura...\n\n**Validaciones (20%)**: 15/20 puntos. Faltan validaciones de entrada en función filtrar()...\n\n**Eficiencia (20%)**: 18/20 puntos. Algoritmos eficientes, complejidad O(n) aceptable.",
  "fortalezas": "- Implementación correcta de funciones principales (sumar_elementos, filtrar_pares)\n- Uso apropiado de estructuras de datos (listas, diccionarios)\n- Código bien comentado y legible\n- Nomenclatura descriptiva de variables y funciones\n- Manejo correcto de casos básicos",
  "recomendaciones": "- Agregar validación de tipos de entrada con isinstance()\n- Implementar manejo de excepciones (try/except) en función leer_archivo()\n- Agregar docstrings a todas las funciones según PEP257\n- Optimizar función filtrar_mayores() en línea 45 usando list comprehension\n- Considerar casos edge: listas vacías, valores None, tipos incorrectos"
}
```

**Nota**: El frontend parsea automáticamente estos campos y los muestra en la interfaz.

---

### 3. **Subida a Google Sheets** - `/spreadsheet`

**¿Qué hace?**
Sube los resultados de la corrección a una planilla de Google Sheets para registro y seguimiento.

**¿Cómo se activa?**
- **Desde Frontend**: UserView → Sección "Subir Resultados a Planilla" → Botón "Subir a Planilla"
- **Usuario**: Completa datos de la planilla (URL, hoja, alumno) y confirma

**Flujo de ejecución**:
1. **Recibe**:
   - URL del Google Spreadsheet
   - Nombre de la hoja
   - Datos del alumno (nombre, legajo/DNI)
   - Resultados de la corrección (nota, resumen, fortalezas, recomendaciones)
2. **Conecta con Google Sheets API**
3. **Escribe fila nueva** con timestamp y todos los datos
4. **Devuelve**: Confirmación de escritura exitosa

**Entrada**:
```javascript
// POST /webhook/spreadsheet
Content-Type: application/json
{
  "spreadsheetUrl": "https://docs.google.com/spreadsheets/d/ABC123...",
  "sheetName": "Programacion1-2025",
  "studentName": "Juan Pérez",
  "studentId": "12345678",
  "grade": 85,
  "summary": "Resumen detallado por criterios...",
  "strengths": "Fortalezas del código...",
  "recommendations": "Recomendaciones de mejora..."
}
```

**Columnas en Google Sheets**:
| Fecha | Alumno | Legajo | Nota | Resumen | Fortalezas | Recomendaciones |
|-------|--------|--------|------|---------|------------|-----------------|
| 2025-11-07 14:30 | Juan Pérez | 12345678 | 85 | ... | ... | ... |

---

### 4. **Corrección Automática Batch** - `/automatico`

**¿Qué hace?**
Procesa múltiples entregas de alumnos en lote (batch) y sube resultados automáticamente a Google Sheets.

**¿Cómo se activa?**
- **Desde Frontend**: UserView → Funcionalidad de corrección automática batch
- **Usuario**: Sube múltiples archivos de alumnos y el sistema los procesa en lote

**Flujo de ejecución**:
1. **Recibe**:
   - Múltiples archivos de entregas (zip con todos los archivos de alumnos)
   - Rúbrica a aplicar
   - Datos de la planilla destino
2. **Procesa cada entrega**: Itera sobre todos los archivos y evalúa cada uno con IA
3. **Genera resultados consolidados**: Crea un reporte con todas las correcciones
4. **Sube automáticamente a Google Sheets**: Escribe todas las notas en la planilla
5. **Devuelve**: Resumen del procesamiento batch (total procesados, errores, éxitos)

**Entrada**:
```javascript
// POST /webhook/automatico
Content-Type: multipart/form-data
{
  rubric: JSON.stringify(rubricObject),
  submissions: [File1, File2, File3, ...], // Múltiples archivos
  spreadsheetUrl: "https://docs.google.com/spreadsheets/d/...",
  sheetName: "Programacion1-2025"
}
```

**Salida**:
```json
{
  "totalProcessed": 25,
  "successful": 23,
  "failed": 2,
  "results": [
    {
      "student": "alumno1.py",
      "grade": 85,
      "status": "success"
    },
    {
      "student": "alumno2.py",
      "grade": 72,
      "status": "success"
    },
    {
      "student": "alumno3.py",
      "error": "Archivo corrupto",
      "status": "failed"
    }
  ],
  "spreadsheetUpdated": true
}
```

**Ventajas**:
- Ahorra tiempo al corregir todas las entregas de una vez
- Sube automáticamente a Google Sheets sin intervención manual
- Genera reporte consolidado de la comisión completa

---

## 📁 Webhooks de Gestión de Carpetas

Estos webhooks crean automáticamente la estructura de carpetas en Google Drive cuando se crean entidades en el Admin Panel.

### Estructura de carpetas resultante:

```
📁 ROOT DRIVE (configurado en variable de entorno)
├── 📁 utn-frm (universidad)
│   ├── 📁 ingenieria-frm (facultad)
│   │   ├── 📁 isi-frm (carrera)
│   │   │   ├── 📁 2025-programacion-1 (curso)
│   │   │   │   ├── 📁 2025-programacion-1-comision-1 (comisión)
│   │   │   │   │   ├── 📁 Entregas
│   │   │   │   │   └── 📁 Rubricas
```

### Webhooks de carpetas disponibles:

| Webhook | Función | Input | Carpeta creada |
|---------|---------|-------|----------------|
| `/create-university-folder` | Crea carpeta universidad | `university_id` | `utn-frm` |
| `/create-faculty-folder` | Crea carpeta facultad | `faculty_id`, `university_id` | `ingenieria-frm` |
| `/create-career-folder` | Crea carpeta carrera | `career_id`, `faculty_id` | `isi-frm` |
| `/create-course-folder` | Crea carpeta curso | `course_id`, `career_id` | `2025-programacion-1` |
| `/create-commission-folder` | Crea carpeta comisión + subcarpetas | `commission_id`, `course_id` | `2025-prog1-com1` + `Entregas` + `Rubricas` |
| `/create-submission-folder` | Crea carpeta de entrega | `submission_id`, `commission_id` | Carpeta individual de alumno |

**Comportamiento**:
- Se ejecutan automáticamente al crear entidades desde el Admin Panel
- **No bloqueantes**: Si falla la creación de carpeta, la entidad se crea igual en MongoDB
- Orden jerárquico: Universidad → Facultad → Carrera → Curso → Comisión

---

## 📦 Requisitos

### Servicios externos necesarios:

1. **n8n** (self-hosted o cloud)
   - Plan gratuito: 5,000 executions/mes
   - URL: https://n8n.io

2. **Cuenta de Google Cloud** con APIs habilitadas:
   - **Google Generative AI API** (Gemini)
   - **Google Sheets API**
   - **Google Drive API**

3. **Credenciales OAuth2** para Google Workspace

### Variables de entorno requeridas:

**En n8n**:
```bash
GOOGLE_GEMINI_API_KEY=tu-api-key-de-gemini
GOOGLE_DRIVE_ROOT_FOLDER_ID=id-de-carpeta-raiz-en-drive
```

**En Backend** (`backend/.env`):
```bash
# n8n Webhooks principales
N8N_RUBRIC_WEBHOOK_URL=https://tu-n8n.com/webhook/rubrica
N8N_GRADING_WEBHOOK_URL=https://tu-n8n.com/webhook/corregir
N8N_SPREADSHEET_WEBHOOK_URL=https://tu-n8n.com/webhook/spreadsheet

# n8n Webhooks de carpetas
N8N_CREATE_UNIVERSITY_FOLDER_WEBHOOK=https://tu-n8n.com/webhook/create-university-folder
N8N_CREATE_FACULTY_FOLDER_WEBHOOK=https://tu-n8n.com/webhook/create-faculty-folder
N8N_CREATE_CAREER_FOLDER_WEBHOOK=https://tu-n8n.com/webhook/create-career-folder
N8N_CREATE_COURSE_FOLDER_WEBHOOK=https://tu-n8n.com/webhook/create-course-folder
N8N_CREATE_COMMISSION_FOLDER_WEBHOOK=https://tu-n8n.com/webhook/create-commission-folder

# Google Drive
GOOGLE_DRIVE_ROOT_FOLDER_ID=id-de-carpeta-raiz
```

**En Frontend** (`frontend/.env`):
```bash
VITE_N8N_GRADING_WEBHOOK=https://tu-n8n.com/webhook/corregir
VITE_N8N_SPREADSHEET_WEBHOOK=https://tu-n8n.com/webhook/spreadsheet
```

---

## 🚀 Instalación y Configuración

### Paso 1: Importar flujos en n8n

Tienes dos opciones para importar los workflows:

#### Opción A: Importar archivo consolidado (Recomendado para inicio rápido)

1. Accede a tu instancia de n8n
2. Ve a **Workflows** → **Import from File**
3. Selecciona el archivo **`workflows-en-un-archivo.json`**
4. Confirma la importación (importará todos los webhooks a la vez)

**Resultado**: Todos los workflows estarán disponibles de inmediato.

#### Opción B: Importar flujos separados (Recomendado para producción)

1. Accede a tu instancia de n8n
2. Ve a **Workflows** → **Import from File**
3. Importa cada archivo según necesites:
   - **Corrección manual**: `flujo_correccion_manual.json`
   - **Corrección masiva**: `flujo_correccion_masiva.json`
   - **Carpetas de Drive**:
     - `create-university-folder.json`
     - `create-faculty-folder.json`
     - `create-career-folder.json`
     - `create-course-folder.json`
     - `create-commission-folder.json`
4. Repite el proceso para cada archivo que necesites

**Resultado**: Workflows organizados individualmente, fácil de mantener.

### Paso 2: Configurar credenciales de Google

#### A. Google Gemini API

1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crea una API Key
3. En n8n → **Credentials** → Crea **Google PaLM API**
4. Pega tu API Key
5. Asigna esta credencial al nodo **"Analyze document"** (Google Gemini)

#### B. Google Sheets

1. En n8n → **Credentials** → Crea **Google Sheets API**
2. Configura OAuth2:
   - Sigue el proceso de autenticación
   - Autoriza acceso a Google Sheets
3. Asigna esta credencial a todos los nodos de Google Sheets

#### C. Google Drive

1. En n8n → **Credentials** → Crea **Google Drive API**
2. Configura OAuth2 (mismo proceso)
3. Autoriza acceso a Google Drive
4. Asigna esta credencial a todos los nodos de Google Drive

### Paso 3: Configurar variables de entorno en n8n

1. Ve a **Settings** → **Environments** (o en tu `.env` si es self-hosted)
2. Agrega:
   ```
   GOOGLE_DRIVE_ROOT_FOLDER_ID=id-de-tu-carpeta-raiz
   GOOGLE_GEMINI_API_KEY=tu-api-key
   ```
3. Reinicia n8n

### Paso 4: Obtener URLs de webhooks

Para cada webhook del flujo:

1. Abre el workflow en n8n
2. Busca los nodos **Webhook** (hay varios)
3. Para cada uno:
   - Haz clic en el nodo
   - Copia la **Production URL**
   - Ejemplo: `https://tu-n8n.cloud/webhook/rubrica`

**URLs a copiar**:
- `/rubrica`
- `/corregir`
- `/spreadsheet`
- `/automatico`
- `/create-university-folder`
- `/create-faculty-folder`
- `/create-career-folder`
- `/create-course-folder`
- `/create-commission-folder`
- `/create-submission-folder`

### Paso 5: Configurar Backend

1. Abre `backend/.env`
2. Pega las URLs copiadas en las variables correspondientes
3. Reinicia el backend: `npm run dev`

### Paso 6: Configurar Frontend

1. Abre `frontend/.env`
2. Configura las URLs de webhooks que el frontend usa directamente
3. Reinicia el frontend: `npm run dev`

### Paso 7: Activar el workflow en n8n

1. En n8n, abre el workflow importado
2. Haz clic en **Activate** (toggle arriba a la derecha)
3. Los webhooks ahora están listos para recibir peticiones

---

## 💡 Uso desde el Sistema

### Desde el Backend (Node.js)

```javascript
// backend/src/services/n8nService.js

// Generar rúbrica desde PDF
const formData = new FormData();
formData.append('pdf', pdfFile);

const response = await axios.post(
  process.env.N8N_RUBRIC_WEBHOOK_URL,
  formData,
  { headers: { 'Content-Type': 'multipart/form-data' } }
);

const rubricJson = response.data;
```

### Desde el Frontend (React + TypeScript)

```typescript
// frontend/src/components/user/UserView.tsx

// Corregir entrega
const formData = new FormData();
formData.append('rubric', JSON.stringify(selectedRubric));
formData.append('submission', fileFromInput);

const response = await axios.post(
  import.meta.env.VITE_N8N_GRADING_WEBHOOK,
  formData
);

const { nota, resumen, fortalezas, recomendaciones } = response.data;
```

---

## 📊 Estructura de Datos Completa

### Rúbrica JSON Canónica

El esquema completo de una rúbrica generada incluye:

```json
{
  "rubric_id": "utn-frm-prog1-tp-listas-1730000000-a1b2c3",
  "title": "Trabajo Práctico: Listas en Python",
  "version": "1.0",
  "assessment_type": "tp",
  "course": "Programación 1",
  "language_or_stack": ["python"],
  "submission": {
    "single_file": true,
    "accepted_extensions": [".py", ".ipynb"],
    "delivery_channel": "plataforma",
    "constraints": [
      "El archivo debe llamarse tp_listas.py",
      "No usar librerías externas excepto las especificadas"
    ]
  },
  "grading": {
    "policy": "weighted_average",
    "rounding": "half_up",
    "total_points": 100
  },
  "criteria": [
    {
      "id": "C1",
      "name": "Correctitud Funcional",
      "weight": 0.35,
      "description": "Funcionalidades implementadas correctamente según consignas",
      "subcriteria": [
        {
          "name": "Funciones obligatorias presentes",
          "weight": 0.20,
          "evidence": ["Función sumar_elementos()", "Función filtrar_pares()"]
        },
        {
          "name": "Lógica correcta",
          "weight": 0.15,
          "evidence": ["Resultados correctos en casos de prueba"]
        }
      ]
    },
    {
      "id": "C2",
      "name": "Calidad y Legibilidad",
      "weight": 0.25,
      "description": "Código limpio, bien estructurado y legible"
    },
    {
      "id": "C3",
      "name": "Validaciones y Manejo de Errores",
      "weight": 0.20,
      "description": "Validación de entradas y manejo de casos edge"
    },
    {
      "id": "C4",
      "name": "Eficiencia",
      "weight": 0.20,
      "description": "Complejidad algorítmica razonable"
    }
  ],
  "global_descriptors": {
    "Excelente": "90–100: Implementación completa, código de calidad profesional, validaciones exhaustivas",
    "Muy Bueno": "80–89: Cumple todos los requisitos, código legible y eficiente, validaciones presentes",
    "Aprobado": "60–79: Funcionalidades presentes, código funcional con mejoras necesarias",
    "Insuficiente": "<60: Incompleto, errores graves o código no funcional"
  },
  "penalties": [
    {
      "description": "Uso de librerías prohibidas (pandas, numpy)",
      "penalty_percent": 20
    },
    {
      "description": "Entrega fuera de término (por día de retraso)",
      "penalty_percent": 10
    },
    {
      "description": "Código sin comentarios ni docstrings",
      "penalty_percent": 5
    }
  ],
  "mandatory_fail_conditions": [
    {
      "pattern": "import pandas|import numpy",
      "max_final_score": 40,
      "reason": "Uso de librerías prohibidas explícitamente en el enunciado"
    },
    {
      "pattern": "def .*pass\\s*$",
      "max_final_score": 0,
      "reason": "Funciones vacías sin implementación"
    }
  ],
  "scoring_notes": [
    "Ejecutar el código con Python 3.8 o superior",
    "Verificar que pase todos los casos de prueba del enunciado",
    "Penalizar hardcodeo de resultados (ej: return 42 sin cálculo)",
    "Valorar positivamente el uso de list comprehensions cuando sea apropiado"
  ],
  "tasks": [
    {
      "label": "T1",
      "prompt_excerpt": "Implementar función sumar_elementos(lista) que retorne la suma de todos los elementos",
      "points": 20,
      "links_to_criteria": ["C1", "C2"]
    },
    {
      "label": "T2",
      "prompt_excerpt": "Implementar función filtrar_pares(lista) que retorne lista con solo números pares",
      "points": 20,
      "links_to_criteria": ["C1", "C2", "C4"]
    },
    {
      "label": "T3",
      "prompt_excerpt": "Implementar función buscar_maximo(lista) con manejo de lista vacía",
      "points": 20,
      "links_to_criteria": ["C1", "C3"]
    },
    {
      "label": "T4",
      "prompt_excerpt": "Implementar función invertir_lista(lista) sin usar reverse()",
      "points": 20,
      "links_to_criteria": ["C1", "C4"]
    },
    {
      "label": "T5",
      "prompt_excerpt": "Programa principal con menú interactivo y validación de opciones",
      "points": 20,
      "links_to_criteria": ["C2", "C3"]
    }
  ],
  "metadata": {
    "institution": "UTN - Facultad Regional Mendoza",
    "instructor": "Ing. Juan Pérez",
    "date": "2025-10-15",
    "source_pdf_title": "TP_Listas_Programacion1_2025.pdf",
    "pages_parsed": [1, 2, 3],
    "notes": [
      "Rúbrica generada automáticamente con Google Gemini 2.5 Flash",
      "Revisada y ajustada según criterios de la cátedra"
    ]
  }
}
```

---

## 🐛 Troubleshooting

### Error: "No se encontró un bloque entre ```...```"

**Causa**: Gemini devolvió respuesta sin markdown fences o en formato incorrecto

**Solución**: Modificar el nodo "Code" en n8n:
```javascript
// Agregar fallback para JSON directo
if (!m) {
  try {
    item.json.rubric_raw = JSON.parse(text);
  } catch (e) {
    throw new Error("Respuesta no es JSON válido: " + text.substring(0, 200));
  }
}
```

### Error: "Webhook timeout"

**Causa**: Gemini tarda más de 30 segundos en procesar PDFs largos

**Solución**:
- En n8n → Workflow Settings → Execution Timeout → Aumentar a 120 segundos
- Dividir PDFs muy largos (>10 páginas) en secciones

### Error: "Google Sheets API not enabled"

**Solución**:
1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Selecciona tu proyecto
3. Ve a **APIs & Services** → **Library**
4. Busca "Google Sheets API" y habilítala
5. Repite para "Google Drive API"
6. Reconfigura credenciales en n8n

### Error: "Credenciales de Google inválidas"

**Solución**:
1. En n8n → Settings → Credentials
2. Elimina las credenciales de Google existentes
3. Créalas nuevamente siguiendo el proceso OAuth2
4. Asegúrate de autorizar todos los permisos solicitados

### Error: "Carpeta padre no encontrada" (webhooks de Drive)

**Solución**:
- Verifica que `GOOGLE_DRIVE_ROOT_FOLDER_ID` esté correctamente configurado
- Verifica que la carpeta padre exista (ej: para crear Facultad, la Universidad debe existir)
- Respeta el orden jerárquico de creación

### Error: "Cannot read property 'rubric_raw'"

**Causa**: El nodo "Code" no pudo parsear la respuesta de Gemini

**Solución**:
- Ve a n8n → Workflow → Execution log
- Revisa la respuesta de Gemini en el nodo "Analyze document"
- Ajusta el regex en el nodo "Code" según el formato real

---

## 📝 Notas Importantes

1. **Límites de API**:
   - Google Gemini 2.5 Flash: 60 requests/minuto (tier gratuito)
   - Google Sheets API: 100 requests/100 segundos por usuario
   - n8n Cloud (free): 5,000 executions/mes

2. **Costos** (verificar pricing actual):
   - Google Gemini 2.5 Flash: Gratuito hasta cierto límite
   - n8n Cloud: Plan gratuito disponible, planes pagos desde $20/mes
   - Google Workspace APIs: Gratuito dentro de cuotas

3. **Seguridad**:
   - Los webhooks de n8n son públicos por defecto
   - **Recomendación**: Configurar autenticación (Header Auth o Basic Auth) en production
   - No exponer API keys en código frontend

4. **Performance**:
   - Generación de rúbrica: ~5-15 segundos (depende de tamaño del PDF)
   - Corrección de entrega: ~10-30 segundos (depende de tamaño del archivo)
   - Subida a Sheets: ~1-3 segundos

5. **Webhooks de carpetas NO son bloqueantes**:
   - Si falla la creación en Drive, la entidad se crea igual en MongoDB
   - Esto evita que errores de Drive bloqueen operaciones críticas

---

## 📚 Referencias y Recursos

- [Documentación de n8n](https://docs.n8n.io/)
- [Google Gemini API](https://ai.google.dev/docs)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [Google Drive API](https://developers.google.com/drive)
- [Webhook node en n8n](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [Google Gemini node en n8n](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.lmgooglegemini/)

---

**Última actualización**: Noviembre 2025
**Versión**: 1.0
