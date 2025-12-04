# N8N Workflows - Sistema de Corrección Automática

Este directorio contiene los workflows de N8N utilizados por el sistema de corrección automática.

---

## 📋 Workflow: Obtener Correcciones de Drive

**Archivo**: `get-student-corrections.json`

### Propósito
Obtiene datos de correcciones desde una planilla de Google Sheets, ya sea para un alumno específico o para todos los alumnos.

### Entrada (Webhook)

**URL**: `http://localhost:5678/webhook/get-student-corrections`

**Método**: `POST`

**Body** (JSON):
```json
{
  "spreadsheet_id": "1ABC123XYZ...",
  "student_name": "Juan Pérez"  // OPCIONAL
}
```

### Salida

**Caso 1: Un solo alumno** (`student_name` está presente)
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "alumno": "Juan Pérez",
      "puntaje_total": "85/100",
      "criterios": "✅C1.1 — Validación: 10/10 · Excelente\n❌C1.2 — Testing: 5/10 · Faltan tests",
      "fortalezas": "🌟 Código limpio\n🌟 Buena estructura",
      "recomendaciones": "1. Agregar más tests unitarios\n2. Mejorar documentación"
    }
  ]
}
```

**Caso 2: Todos los alumnos** (`student_name` NO está presente)
```json
{
  "success": true,
  "count": 25,
  "data": [
    {
      "alumno": "Juan Pérez",
      "puntaje_total": "85/100",
      "criterios": "...",
      "fortalezas": "...",
      "recomendaciones": "..."
    },
    {
      "alumno": "María García",
      "puntaje_total": "92/100",
      "criterios": "...",
      "fortalezas": "...",
      "recomendaciones": "..."
    }
    // ... más alumnos
  ]
}
```

---

## 🚀 Cómo Importar el Workflow

### 1. Abrir N8N
```bash
# Si N8N está corriendo localmente
http://localhost:5678
```

### 2. Importar Workflow
1. Click en **"Workflows"** en el menú lateral
2. Click en **"Add Workflow"** → **"Import from File"**
3. Seleccionar el archivo `get-student-corrections.json`
4. Click en **"Import"**

### 3. Configurar Credenciales de Google Sheets

#### Opción A: Crear nuevas credenciales
1. En el workflow, hacer click en el nodo **"Google Sheets - Buscar Alumno"**
2. En la sección **"Credential to connect with"**, click en **"Create New"**
3. Seleccionar **"Google Sheets OAuth2 API"**
4. Seguir el flujo de autenticación con Google:
   - Click en **"Connect my account"**
   - Iniciar sesión con tu cuenta de Google
   - Autorizar acceso a Google Sheets
5. Guardar credenciales
6. **IMPORTANTE**: Copiar el **ID de credencial** generado

#### Opción B: Usar credenciales existentes
1. Si ya tienes credenciales de Google configuradas en N8N, selecciónalas del dropdown

### 4. Actualizar IDs de Credenciales en el Workflow
1. En el nodo **"Google Sheets - Buscar Alumno"**:
   - Reemplazar `YOUR_GOOGLE_CREDENTIALS_ID` con tu ID real
2. En el nodo **"Google Sheets - Leer Todas las Filas"**:
   - Reemplazar `YOUR_GOOGLE_CREDENTIALS_ID` con tu ID real

### 5. Activar el Workflow
1. Click en el toggle **"Active"** en la esquina superior derecha
2. El webhook ahora estará disponible en la URL configurada

### 6. Copiar URL del Webhook
1. Click en el nodo **"Webhook"**
2. Copiar la **"Production URL"**:
   ```
   http://localhost:5678/webhook/get-student-corrections
   ```
3. Agregar esta URL al `.env` del backend:
   ```bash
   N8N_WEBHOOK_GET_CORRECTIONS=http://localhost:5678/webhook/get-student-corrections
   ```

---

## 🧪 Testing del Workflow

### Test con cURL - Un solo alumno

```bash
curl -X POST http://localhost:5678/webhook/get-student-corrections \
  -H "Content-Type: application/json" \
  -d '{
    "spreadsheet_id": "1ABC123XYZ...",
    "student_name": "Juan Pérez"
  }'
```

### Test con cURL - Todos los alumnos

```bash
curl -X POST http://localhost:5678/webhook/get-student-corrections \
  -H "Content-Type: application/json" \
  -d '{
    "spreadsheet_id": "1ABC123XYZ..."
  }'
```

### Test con Postman

1. Crear nueva request POST
2. URL: `http://localhost:5678/webhook/get-student-corrections`
3. Headers:
   - `Content-Type: application/json`
4. Body (raw JSON):
   ```json
   {
     "spreadsheet_id": "TU_SPREADSHEET_ID",
     "student_name": "Nombre del Alumno"
   }
   ```
5. Send

---

## 📊 Formato de la Planilla de Google Sheets

### Columnas Requeridas

| Columna | Obligatorio | Descripción | Ejemplo |
|---------|-------------|-------------|---------|
| **Alumno** | ✅ Sí | Nombre completo del alumno | Juan Pérez |
| **puntaje_total** o **Nota** | ❌ No | Calificación obtenida | 85/100 o 8.5 |
| **criterios** o **Resumen por criterios** | ❌ No | Evaluación por criterio con emojis | ✅C1: OK · Excelente<br>❌C2: Error · Falta validación |
| **fortalezas** o **Fortalezas** | ❌ No | Puntos fuertes detectados | 🌟 Código limpio<br>🌟 Buena estructura |
| **recomendaciones** o **Recomendaciones** | ❌ No | Sugerencias de mejora | 1. Agregar tests<br>2. Mejorar docs |

### Ejemplo de Planilla

| Alumno | puntaje_total | criterios | fortalezas | recomendaciones |
|--------|---------------|-----------|------------|-----------------|
| Juan Pérez | 85/100 | ✅C1.1 — Validación: 10/10 · Excelente<br>❌C1.2 — Testing: 5/10 · Faltan tests | 🌟 Código limpio<br>🌟 Buena estructura | 1. Agregar más tests unitarios<br>2. Mejorar documentación |
| María García | 92/100 | ✅C1.1 — Validación: 10/10 · Perfecto<br>✅C1.2 — Testing: 10/10 · Completo | 🌟 Excelente cobertura de tests<br>🌟 Código muy limpio | 1. Optimizar performance en bucles |

### Notas Importantes

- **La primera fila (fila 1)** debe contener los encabezados de columnas
- **Los datos comienzan en la fila 2**
- El workflow normaliza automáticamente variantes de nombres de columnas:
  - `Alumno` = `alumno` = `ALUMNO`
  - `puntaje_total` = `Nota` = `nota` = `Puntaje`
  - `criterios` = `Criterios` = `Resumen por criterios`
  - etc.

---

## 🔧 Troubleshooting

### Error: "Invalid credentials"
- **Solución**: Re-autenticar credenciales de Google en N8N
- Ir a **Settings** → **Credentials** → Editar credencial → **Reconnect**

### Error: "Spreadsheet not found"
- **Solución**: Verificar que el `spreadsheet_id` es correcto
- El ID se encuentra en la URL de Google Sheets:
  ```
  https://docs.google.com/spreadsheets/d/[ESTE_ES_EL_ID]/edit
  ```

### Error: "Student not found"
- **Solución**: Verificar que el nombre del alumno es exacto (case-sensitive)
- El workflow busca coincidencia exacta en la columna "Alumno"

### Workflow no responde
- **Solución**: Verificar que el workflow está **Activo** (toggle verde)
- Revisar logs de ejecución en N8N: **Executions** → Ver detalles

### Datos vacíos en la respuesta
- **Solución**: Verificar formato de la planilla de Google Sheets
- Asegurar que la primera fila tiene los encabezados correctos
- Verificar que hay datos en la fila 2 en adelante

---

## 📝 Notas Adicionales

### Seguridad
- Las credenciales de Google se almacenan **solo en N8N**
- El backend NO tiene acceso directo a Google Sheets
- El webhook puede ser protegido con autenticación básica si es necesario

### Performance
- Para planillas grandes (>100 alumnos), el workflow puede tardar 3-5 segundos
- Considerar implementar caché en el backend para requests frecuentes

### Escalabilidad
- Si N8N se cae, los PDFs no se pueden generar (punto único de falla)
- Solución: Implementar retry logic en el backend con exponential backoff

---

## 🔄 Actualizaciones Futuras

- [ ] Agregar autenticación al webhook (API key)
- [ ] Implementar cache de datos de Google Sheets
- [ ] Agregar validación de formato de planilla
- [ ] Soporte para múltiples sheets en el mismo spreadsheet
- [ ] Webhook para actualizar correcciones en Drive

---

**Última actualización**: 2025-12-04
**Versión del workflow**: 1.0.0
