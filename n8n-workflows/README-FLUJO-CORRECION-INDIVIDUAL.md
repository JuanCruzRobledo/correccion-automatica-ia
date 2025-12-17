# 📄 Flujo de Corrección Individual - Nuevo Sistema

## 🎯 Descripción

Este documento describe el **nuevo sistema de corrección** que reemplaza la arquitectura anterior basada en flujos complejos de n8n con bucles internos.

## 🏗️ Arquitectura Anterior (DEPRECADA)

```
Frontend → n8n Webhook (Principal) → n8n Workflow (Masiva)
                                          ↓ (loop interno)
                                    Obtener submissions → Descargar → Corregir → Guardar (❌ ERROR)
```

**Problemas:**
- ❌ Lógica de bucle compleja dentro de n8n
- ❌ Difícil de debuggear
- ❌ Fallas en guardado en MongoDB
- ❌ No se puede pausar o reintentar fácilmente

## ✅ Nueva Arquitectura (ACTUAL)

```
Frontend → Backend API → Loop {
                           n8n Webhook (Individual) → Descargar → Corregir → Retornar
                           Backend guarda en MongoDB
                        }
```

**Ventajas:**
- ✅ Flujo n8n simple (solo corrección individual)
- ✅ Backend controla el bucle y manejo de errores
- ✅ Fácil de debuggear y reintentar
- ✅ Mejor manejo de timeouts y concurrencia

---

## 📦 Componentes del Nuevo Sistema

### 1. **Flujo n8n Individual** (`flujo-correcion-individual.json`)

**Webhook:** `POST /webhook/corregir-individual`

**Input:**
```json
{
  "submission_id": "67abc123...",
  "rubric_json": { /* rúbrica completa */ },
  "gemini_api_key": "AIza...",
  "backend_url": "http://localhost:5000",
  "auth_token": "eyJhbGc..."
}
```

**Proceso:**
1. Descargar archivo de la submission desde el backend
2. Subir archivo a Gemini Files API
3. Construir prompt de corrección con rúbrica
4. Ejecutar corrección con Gemini 2.5 Flash
5. Parsear respuesta JSON
6. Retornar resultado estructurado

**Output:**
```json
{
  "success": true,
  "grade": 85,
  "summary": "✅C1 — Funcionalidad: 20/25 · ...",
  "strengths": "Buena estructura...",
  "recommendations": "Agregar validaciones...",
  "result_json": { /* respuesta completa de Gemini */ }
}
```

**Configuración n8n:**
- Importar `flujo-correcion-individual.json` en n8n
- El webhook estará disponible en: `http://localhost:5678/webhook/corregir-individual`
- **IMPORTANTE:** Este flujo NO guarda en MongoDB, solo retorna el resultado

---

### 2. **Endpoint Backend** (`POST /api/submissions/correct-batch`)

**Ruta:** `POST /api/submissions/correct-batch`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "commission_id": "UTN-FRLP-ISI-SYSOP-2024-1",
  "rubric_id": "RUBRIC-TP1-HASH"
}
```

**Proceso:**
1. Validar permisos del usuario
2. Obtener todas las submissions con `status: 'uploaded'`
3. Para cada submission:
   - Cambiar status a `'pending-correction'`
   - Llamar al flujo n8n individual
   - Guardar resultado en MongoDB
   - Cambiar status a `'corrected'` o `'failed'`
4. Retornar resumen

**Response:**
```json
{
  "success": true,
  "message": "Corrección batch completada: 8 exitosos, 2 fallidos",
  "data": {
    "total": 10,
    "corrected": 8,
    "failed": 2,
    "errors": [
      {
        "submission_id": "67abc...",
        "student_name": "juan-perez",
        "error": "Timeout al corregir"
      }
    ]
  }
}
```

---

### 3. **Frontend** (UserView.tsx)

El frontend ahora llama directamente al backend:

```typescript
const response = await axios.post(
  `${backendUrl}/api/submissions/correct-batch`,
  {
    commission_id: selectedCommissionId,
    rubric_id: rubric.rubric_id,
  },
  {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    timeout: 600000, // 10 minutos
  }
);
```

Muestra resultados detallados:
- ✅ Cantidad de submissions corregidas
- ⚠️ Cantidad de fallos
- 📋 Lista de errores (primeros 5)

---

## 🔧 Configuración

### Variables de Entorno (.env)

```bash
# Backend (.env)
N8N_INDIVIDUAL_GRADING_WEBHOOK_URL=http://localhost:5678/webhook/corregir-individual
BACKEND_URL=http://localhost:5000
```

### Despliegue en Producción

Si backend y n8n están en Docker:
```bash
# Backend (.env)
N8N_INDIVIDUAL_GRADING_WEBHOOK_URL=http://n8n:5678/webhook/corregir-individual
BACKEND_URL=http://backend:80
```

---

## 🚀 Cómo Usar

### 1. Importar el Flujo en n8n

1. Abrir n8n (http://localhost:5678)
2. Click en "+" → "Import from File"
3. Seleccionar `flujo-correcion-individual.json`
4. Activar el flujo

### 2. Configurar Variables de Entorno

```bash
cd backend
nano .env  # Agregar N8N_INDIVIDUAL_GRADING_WEBHOOK_URL
```

### 3. Reiniciar Backend

```bash
cd backend
npm run dev
```

### 4. Probar desde Frontend

1. Subir varias entregas de alumnos
2. Seleccionar la rúbrica
3. Click en "Iniciar Corrección Automática"
4. Ver progreso y resultados

---

## 🐛 Debugging

### Error: "Cannot connect to n8n"

**Causa:** El backend no puede conectarse al webhook de n8n

**Solución:**
1. Verificar que n8n esté corriendo: `curl http://localhost:5678`
2. Verificar la URL en `.env`: `N8N_INDIVIDUAL_GRADING_WEBHOOK_URL`
3. Si están en Docker, usar `http://n8n:5678` en lugar de `localhost`

### Error: "Submission file not found"

**Causa:** El flujo n8n no puede descargar el archivo desde el backend

**Solución:**
1. Verificar que el archivo exista: `GET /api/submissions/:id/file`
2. Verificar que el token sea válido
3. Verificar que `BACKEND_URL` en `.env` sea correcto

### Error: "Timeout"

**Causa:** La corrección tarda más de 2 minutos por alumno

**Solución:**
1. Aumentar timeout en `submissionController.js`: `timeout: 300000` (5 min)
2. Verificar que Gemini API no esté sobrecargada
3. Revisar logs de n8n para ver en qué nodo falla

---

## 📊 Métricas

- **Tiempo promedio por submission:** ~30-60 segundos
- **Concurrencia:** Secuencial (1 por vez)
- **Timeout:** 2 minutos por submission
- **Retry:** Automático en n8n (5 intentos con backoff)

---

## 🔄 Migración desde Sistema Antiguo

Si tienes los flujos antiguos (`flujo-correcion-automatica-mongodb.json` y `flujo-correcion-masiva-mongodb.json`):

1. **NO borrarlos todavía** (por si necesitas rollback)
2. **Desactivarlos** en n8n
3. **Importar y activar** el nuevo flujo individual
4. **Actualizar** backend y frontend
5. **Probar** con 2-3 submissions
6. **Si funciona correctamente:** Mover flujos antiguos a carpeta `deprecated/`

---

## 📝 Notas Importantes

- ✅ El flujo individual **NO guarda en MongoDB**, solo retorna el resultado
- ✅ El backend es quien guarda los resultados en la base de datos
- ✅ Los errores individuales NO detienen el batch completo
- ✅ Se puede reintentar solo las submissions fallidas cambiando su status a `'uploaded'`

---

## 🎉 Beneficios del Nuevo Sistema

1. **Más simple:** Menos nodos en n8n, menos complejidad
2. **Más robusto:** Mejor manejo de errores y timeouts
3. **Más escalable:** Fácil agregar concurrencia en el futuro
4. **Más debuggeable:** Logs claros por cada submission
5. **Más flexible:** Fácil agregar webhooks, notificaciones, etc.

---

**Fecha de implementación:** 2025-12-17
**Autor:** Sistema de Migración MongoDB
**Versión:** 2.0
