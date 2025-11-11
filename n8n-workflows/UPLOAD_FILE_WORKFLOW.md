# 📤 Workflow: Upload File to Drive

## 🎯 Descripción

Este workflow permite subir archivos `.txt` de entregas de alumnos directamente a Google Drive en la carpeta de una rúbrica específica.

## 🔗 Webhook

**URL**: `POST /webhook/upload-file-to-drive`

**Tipo**: Multipart/form-data (para archivos) o JSON

## 📥 Entrada

### Parámetros requeridos:

```javascript
{
  "file": File,              // Archivo .txt (campo multipart/form-data)
  "fileName": "alumno-juan-perez.txt",  // Nombre del archivo en Drive
  "folderId": "1a2b3c4d5e6f..."        // ID de la carpeta de Drive (rubric.drive_folder_id)
}
```

### Ejemplo de uso desde Backend:

```javascript
// En submissionController.js (FASE 2)
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

const formData = new FormData();
formData.append('file', fs.createReadStream(tempFilePath));
formData.append('fileName', driveFileName);
formData.append('folderId', rubric.drive_folder_id);

const response = await axios.post(
  process.env.N8N_UPLOAD_FILE_TO_DRIVE_WEBHOOK,
  formData,
  {
    headers: { ...formData.getHeaders() },
    timeout: 60000
  }
);
```

## 📤 Salida

### Respuesta exitosa (200):

```json
{
  "success": true,
  "drive_file_id": "1XyZ...",
  "drive_file_url": "https://drive.google.com/file/d/1XyZ.../view",
  "file_name": "alumno-juan-perez.txt"
}
```

### Respuesta de error (500):

```json
{
  "success": false,
  "error": "Error message"
}
```

## 🔄 Flujo de Ejecución

1. **Webhook Trigger**: Recibe POST con archivo y metadata
2. **Set Variables**: Extrae fileName, folderId y fileData del body
3. **Upload to Google Drive**:
   - Sube archivo a la carpeta especificada
   - Tipo MIME: text/plain
   - Drive: My Drive
4. **Format Response**: Construye respuesta con file_id y URL
5. **Respond Success**: Devuelve JSON con datos del archivo subido
6. **Error Handling**: Si falla, devuelve error 500

## 🔧 Configuración en n8n

### 1. Importar workflow

```bash
# Desde UI de n8n:
Settings > Import from file > upload-file-to-drive.json
```

### 2. Configurar credenciales de Google Drive

1. En el nodo "Upload to Google Drive"
2. Click en "Create New Credential"
3. Seleccionar "Google Drive OAuth2 API"
4. Autorizar acceso a tu cuenta de Google
5. Guardar credenciales

### 3. Activar workflow

1. Click en el toggle "Active" en la esquina superior derecha
2. Copiar la URL del webhook generada
3. Agregar al `.env` del backend:

```bash
N8N_UPLOAD_FILE_TO_DRIVE_WEBHOOK=https://tu-n8n.example.com/webhook/upload-file-to-drive
```

## 🔐 Variables de Entorno Necesarias

### En Backend (.env):
```bash
N8N_UPLOAD_FILE_TO_DRIVE_WEBHOOK=https://tu-n8n.example.com/webhook/upload-file-to-drive
```

### En n8n:
- **Credenciales**: Google Drive OAuth2 API (configuradas en el nodo)

## 📋 Testing

### Desde Postman:

```bash
POST https://tu-n8n.example.com/webhook/upload-file-to-drive
Content-Type: multipart/form-data

Body (form-data):
- file: [seleccionar archivo .txt]
- fileName: "test-alumno.txt"
- folderId: "1a2b3c4d5e6f..." (ID de carpeta válida en Drive)
```

### Desde Backend:

```bash
# 1. Crear una entrega desde ProfessorView
# 2. Verificar logs del backend para ver la llamada al webhook
# 3. Verificar que el archivo aparece en Drive
```

## 🚨 Troubleshooting

### Error: "Invalid folderId"
- **Causa**: El folderId no existe o no tienes permisos
- **Solución**: Verificar que la rúbrica tiene `drive_folder_id` válido

### Error: "Unauthorized"
- **Causa**: Credenciales de Google Drive no configuradas o expiradas
- **Solución**: Re-autorizar en n8n > Credentials

### Error: "File too large"
- **Causa**: Archivo supera límite de n8n o Drive
- **Solución**: Verificar que el archivo .txt sea menor a 10MB

### Timeout
- **Causa**: Red lenta o archivo grande
- **Solución**: Aumentar timeout en el backend (actualmente 60s)

## 📊 Integración con el Sistema

Este webhook es llamado por:

1. **Backend**: `backend/src/controllers/submissionController.js`
   - Método: `createSubmission()`
   - Momento: Después de validar el archivo .txt del profesor

2. **Flujo**:
   ```
   Frontend (ProfessorView)
     → POST /api/submissions (Backend)
       → Valida archivo .txt
       → POST /webhook/upload-file-to-drive (n8n)
         → Sube a Drive
       ← Retorna file_id y URL
     ← Guarda Submission en MongoDB
   ← Retorna submission creado
   ```

## 🔗 Archivos Relacionados

- **Backend**: `backend/src/controllers/submissionController.js`
- **Backend**: `backend/src/services/driveService.js`
- **Backend**: `.env.example` (ejemplo de configuración)
- **Frontend**: `frontend/src/components/professor/UploadSubmissionModal.tsx`
- **Frontend**: `frontend/src/services/submissionService.ts`

## 📝 Notas

- El archivo se sube directamente a la carpeta de la rúbrica (no subcarpetas por alumno)
- El nombre del archivo debe seguir el formato: `alumno-{nombre-apellido}.txt`
- El tipo MIME es siempre `text/plain` para archivos .txt
- La URL del archivo permite visualizarlo directamente en Drive
- El workflow maneja errores y devuelve respuestas apropiadas

## 🎯 Próximos Pasos

1. Importar workflow en n8n
2. Configurar credenciales de Google Drive
3. Activar workflow y copiar URL del webhook
4. Actualizar `.env` del backend con la URL
5. Testing desde Postman
6. Testing desde el sistema completo
