# Migración de Flujos n8n a MongoDB

Este documento describe la migración de los flujos n8n desde Google Drive/Sheets a MongoDB.

## Resumen de Cambios

Se crearon dos nuevos flujos n8n que reemplazan completamente la dependencia de Google Drive y Google Sheets, utilizando ahora la API del backend con MongoDB:

- **Flujo Principal**: `flujo-correcion-automatica-mongodb.json`
- **Flujo Secundario**: `flujo-correcion-masiva-mongodb.json`

## Diferencias con los Flujos Anteriores

### Flujo Principal (Antes vs Ahora)

**ANTES** (`flujo-correcion-automatica-principal.json`):
- 12 nodos
- 6 búsquedas jerárquicas en Google Drive (universidad → facultad → carrera → materia → comisión → trabajo)
- Requería `spreadsheet_id` y `rubric_folder_id`
- Retornaba `spreadsheet_id` en la respuesta

**AHORA** (`flujo-correcion-automatica-mongodb.json`):
- 5 nodos (simplificado)
- Sin dependencias de Google Drive
- Requiere `commission_id`, `rubric_id`, `backend_url`, `auth_token`
- Retorna `alumnos_corregidos`, `commission_id`, `rubric_id`

### Flujo Secundario (Antes vs Ahora)

**ANTES** (`flujo-correcion-masiva-llamada.json`):
- Leía Google Sheets para verificar duplicados
- Buscaba carpetas de alumnos en Google Drive
- Descargaba archivos desde Drive
- Guardaba correcciones en Google Sheets
- Insertaba registros en n8n Data Table

**AHORA** (`flujo-correcion-masiva-mongodb.json`):
- Obtiene submissions pendientes desde MongoDB (vía API backend)
- Descarga archivos desde el backend
- Guarda correcciones directamente en MongoDB (vía API PUT)
- Sin dependencia de Google Sheets o n8n Data Table
- La verificación de duplicados se maneja automáticamente (campo `status`)

## Instalación

### 1. Importar los Flujos en n8n

1. Acceder a n8n (por defecto: http://localhost:5678)
2. Ir a "Workflows" → "Add workflow" → "Import from file"
3. Importar **primero** el flujo secundario: `flujo-correcion-masiva-mongodb.json`
4. Copiar el **Workflow ID** del flujo secundario (se encuentra en la URL o en configuración)
5. Importar el flujo principal: `flujo-correcion-automatica-mongodb.json`
6. Abrir el flujo principal y buscar el nodo "Llamar: Corrección Masiva MongoDB"
7. En la configuración del nodo, reemplazar `REPLACE_WITH_SECONDARY_WORKFLOW_ID` con el ID real del flujo secundario

### 2. Configurar Credenciales

Los nuevos flujos **no requieren credenciales de Google**. Solo necesitan:
- URL del backend (por defecto: `http://localhost:5000`)
- Token de autenticación JWT (generado al hacer login en el sistema)

## Uso del Flujo

### Webhook del Flujo Principal

**Endpoint**: `POST http://localhost:5678/webhook/automatico-mongodb`

**Headers**:
```
Content-Type: application/json
```

**Body** (JSON):
```json
{
  "commission_id": "675a1b2c3d4e5f6a7b8c9d0e",
  "rubric_id": "675a1b2c3d4e5f6a7b8c9d0f",
  "gemini_api_key": "AIzaSy...",
  "rubric_json": {
    "criterios": [
      {
        "nombre": "Funcionalidad",
        "puntaje_max": 40,
        "descripcion": "..."
      }
    ]
  },
  "backend_url": "http://localhost:5000",
  "auth_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Parámetros Requeridos**:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `commission_id` | string | ID de la comisión en MongoDB |
| `rubric_id` | string | ID de la rúbrica en MongoDB |
| `gemini_api_key` | string | API Key de Google Gemini |
| `rubric_json` | object | Objeto JSON con la rúbrica completa |
| `backend_url` | string | URL del backend (opcional, default: `http://localhost:5000`) |
| `auth_token` | string | Token JWT de autenticación |

**Respuesta Exitosa**:
```json
{
  "success": true,
  "alumnos_corregidos": 15,
  "commission_id": "675a1b2c3d4e5f6a7b8c9d0e",
  "rubric_id": "675a1b2c3d4e5f6a7b8c9d0f",
  "message": "Corrección automática completada desde MongoDB"
}
```

## Endpoints del Backend Utilizados

El flujo secundario utiliza los siguientes endpoints del backend:

### 1. Listar Submissions Pendientes
```
GET /api/submissions?commission_id={commission_id}&rubric_id={rubric_id}&status=uploaded
Headers: Authorization: Bearer {auth_token}
```

Retorna array de submissions con estado "uploaded" (pendientes de corrección).

### 2. Descargar Archivo de Submission
```
GET /api/submissions/{id}/file
Headers: Authorization: Bearer {auth_token}
```

Descarga el archivo .txt de la entrega del alumno.

### 3. Actualizar Submission con Corrección
```
PUT /api/submissions/{id}
Headers:
  Authorization: Bearer {auth_token}
  Content-Type: application/json

Body:
{
  "status": "corrected",
  "correction": {
    "grade": 85,
    "criteria_summary": "...",
    "strengths": "...",
    "recommendations": "...",
    "raw_response": { ... }
  }
}
```

Guarda la corrección en MongoDB y actualiza el estado a "corrected".

## Flujo de Datos Completo

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Frontend/API llama al webhook del Flujo Principal           │
│    POST /webhook/automatico-mongodb                              │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Flujo Principal extrae datos y llama al Flujo Secundario    │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Flujo Secundario obtiene submissions desde MongoDB          │
│    GET /api/submissions?commission_id=X&status=uploaded         │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Loop: Por cada submission                                    │
│    a) Descargar archivo: GET /api/submissions/:id/file         │
│    b) Subir a Gemini                                            │
│    c) Enviar prompt de corrección a Gemini                      │
│    d) Guardar corrección: PUT /api/submissions/:id             │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Retornar cantidad de alumnos corregidos                      │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Flujo Principal retorna respuesta al webhook                │
│    { alumnos_corregidos: 15, commission_id, rubric_id }        │
└─────────────────────────────────────────────────────────────────┘
```

## Lógica de Gemini (Sin Cambios)

La lógica de corrección con Gemini **se mantiene idéntica** a la versión anterior:

1. **Upload del archivo** a Gemini File API
2. **Construcción del prompt** con protección contra inyección de prompts
3. **Llamada a Gemini 2.5 Flash** con:
   - `temperature: 0` (determinismo)
   - `responseMimeType: "application/json"`
   - Schema estricto: `{ alumno, puntaje_total, criterios, fortalezas, recomendaciones }`
4. **Parsing de respuesta** JSON

## Ventajas del Nuevo Flujo

1. **Sin dependencias externas**: No requiere configurar credenciales de Google Drive/Sheets
2. **Más simple**: 5 nodos vs 12 en el principal
3. **Más rápido**: Sin búsquedas jerárquicas de carpetas
4. **Más confiable**: MongoDB maneja transaccionalidad y consistencia
5. **Mejor trazabilidad**: Todos los datos en una sola base de datos
6. **Más seguro**: Autenticación JWT centralizada en el backend

## Testing

### Prerequisitos

1. Backend corriendo en `http://localhost:5000`
2. MongoDB corriendo con datos de prueba
3. n8n corriendo en `http://localhost:5678`
4. API Key de Gemini válida
5. Token JWT válido (obtenido desde POST `/api/auth/login`)

### Pasos de Testing

1. **Crear datos de prueba**:
   ```bash
   # Crear universidad, facultad, carrera, materia, comisión, rúbrica
   # Subir submissions de prueba con status="uploaded"
   ```

2. **Obtener token JWT**:
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"profesor@test.com","password":"password123"}'
   ```

3. **Llamar al webhook**:
   ```bash
   curl -X POST http://localhost:5678/webhook/automatico-mongodb \
     -H "Content-Type: application/json" \
     -d '{
       "commission_id": "675a1b2c3d4e5f6a7b8c9d0e",
       "rubric_id": "675a1b2c3d4e5f6a7b8c9d0f",
       "gemini_api_key": "AIzaSy...",
       "rubric_json": {...},
       "auth_token": "eyJhbGciOiJIUzI1NiIs..."
     }'
   ```

4. **Verificar resultados**:
   - Revisar logs de n8n
   - Verificar en MongoDB que las submissions tienen `status="corrected"`
   - Verificar que el campo `correction` contiene los datos esperados

## Troubleshooting

### Error: "No tiene acceso a esta submission"
- Verificar que el token JWT sea válido
- Verificar que el usuario tenga rol `professor`, `university-admin` o `super-admin`
- Verificar que el profesor esté asignado a la comisión

### Error: "Submission no encontrada"
- Verificar que existan submissions con `status="uploaded"` para la comisión/rúbrica
- Verificar los IDs de commission_id y rubric_id

### Error: "REPLACE_WITH_SECONDARY_WORKFLOW_ID"
- Olvidaste reemplazar el ID del flujo secundario en el flujo principal
- Ver sección "Instalación" paso 7

### El flujo no encuentra submissions
- Verificar que las submissions tengan `status="uploaded"`
- Verificar que `commission_id` y `rubric_id` coincidan exactamente
- Revisar logs del backend: `docker logs -f proyecto-correccion-backend-1`

## Migración desde Flujos Antiguos

Si tienes correcciones almacenadas en Google Sheets:

1. **No elimines** los flujos antiguos inmediatamente
2. Los nuevos flujos son **independientes** y pueden coexistir
3. Para migrar datos históricos, necesitarás un script de migración (no incluido)
4. Considera mantener los Sheets antiguos como respaldo

## Archivos Relacionados

- `flujo-correcion-automatica-mongodb.json` - Flujo principal (MongoDB)
- `flujo-correcion-masiva-mongodb.json` - Flujo secundario (MongoDB)
- `flujo-correcion-automatica-principal.json` - Flujo principal antiguo (Google Drive)
- `flujo-correcion-masiva-llamada.json` - Flujo secundario antiguo (Google Drive)
- `backend/src/controllers/submissionController.js` - Controller con endpoints
- `backend/src/routes/submissionRoutes.js` - Rutas de submissions

## Soporte

Para problemas o preguntas sobre los flujos, revisar:
- Logs de n8n: Panel de ejecuciones en n8n UI
- Logs del backend: `docker logs -f proyecto-correccion-backend-1`
- Documentación de n8n: https://docs.n8n.io
- Documentación de Gemini: https://ai.google.dev/docs
