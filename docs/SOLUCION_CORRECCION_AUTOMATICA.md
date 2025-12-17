# Solución: Error en Corrección Automática

## Problema Original

Al intentar usar el botón "Iniciar Corrección Automática" en el frontend, se mostraba el error:

```
La rúbrica no tiene un archivo de entregas configurado. Por favor, recrea la rúbrica.
```

Este error ocurría porque:
1. El modelo `Rubric` fue migrado y ya NO tiene los campos `spreadsheet_file_id` y `drive_folder_id`
2. El frontend seguía verificando que esos campos existieran antes de iniciar la corrección
3. Ya existían workflows n8n nuevos para MongoDB, pero el frontend no los estaba usando

## Cambios Realizados

### 1. Frontend: UserView.tsx

**Archivo**: `frontend-correccion-automatica-n8n/src/components/user/UserView.tsx`

**Cambios**:
- ✅ Eliminadas las validaciones de `spreadsheet_file_id` y `drive_folder_id`
- ✅ Actualizado para usar el nuevo webhook de MongoDB: `http://localhost:5678/webhook/automatico-mongodb`
- ✅ Actualizado el cuerpo de la petición para enviar los parámetros correctos:
  - `commission_id`
  - `rubric_id`
  - `rubric_json`
  - `gemini_api_key`
  - `backend_url`
  - `auth_token` (JWT del usuario)
- ✅ Eliminado código obsoleto relacionado con `drive_link`
- ✅ Actualizada la respuesta esperada del webhook

### 2. Archivo de Configuración: .env.example

**Archivo**: `frontend-correccion-automatica-n8n/.env.example`

**Cambios**:
- ✅ Actualizada la URL por defecto de `VITE_BATCH_GRADING_WEBHOOK_URL` para usar el nuevo webhook de MongoDB
- ✅ Agregada documentación indicando que el nuevo webhook no requiere Google Drive/Sheets

## Cómo Probar la Solución

### Prerequisitos

1. **Backend corriendo** en `http://localhost:5000`
2. **MongoDB corriendo** con datos de prueba
3. **n8n corriendo** en `http://localhost:5678` con los workflows de MongoDB importados
4. **Frontend corriendo** (después de recompilar con los cambios)

### Workflows n8n Requeridos

Asegúrate de tener importados y configurados los siguientes workflows en n8n:

1. **Flujo Principal**: `flujo-correcion-automatica-mongodb.json`
2. **Flujo Secundario**: `flujo-correcion-masiva-mongodb.json`

Ver instrucciones completas en: `n8n-workflows/README-MONGODB-MIGRATION.md`

### Variables de Entorno

Asegúrate de tener configuradas en tu archivo `.env` (frontend):

```env
VITE_API_URL=http://localhost:5000
VITE_BATCH_GRADING_WEBHOOK_URL=http://localhost:5678/webhook/automatico-mongodb
```

### Pasos de Testing

1. **Crear/Verificar rúbrica**:
   - Asegúrate de tener una rúbrica creada con `rubric_json` válido
   - La rúbrica NO necesita tener `spreadsheet_file_id` ni `drive_folder_id`

2. **Subir submissions**:
   - Sube al menos una entrega de alumno con status "uploaded"
   - Puedes hacerlo desde el panel de profesor o usando el endpoint de API

3. **Iniciar corrección automática**:
   - Desde la vista de usuario, selecciona la rúbrica
   - Haz clic en "Iniciar Corrección Automática"
   - El sistema debería:
     - Validar que tengas API key de Gemini configurada
     - Validar que la rúbrica tenga `rubric_json`
     - Llamar al webhook de n8n con MongoDB
     - Mostrar el resultado: "✅ Se corrigieron exitosamente N estudiante(s)."

4. **Verificar resultados**:
   - Las submissions deberían cambiar su status a "corrected"
   - El campo `correction` debería tener los datos de la corrección
   - Puedes descargar PDFs de devolución individuales

## Arquitectura Nueva (MongoDB)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Frontend llama al webhook de n8n con MongoDB            │
│    POST /webhook/automatico-mongodb                          │
│    Body: { commission_id, rubric_id, rubric_json,          │
│            gemini_api_key, backend_url, auth_token }        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. n8n Flujo Principal recibe y llama al Flujo Secundario  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. n8n Flujo Secundario obtiene submissions desde MongoDB  │
│    GET /api/submissions?commission_id=X&status=uploaded     │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Para cada submission:                                    │
│    a) Descargar archivo: GET /api/submissions/:id/file     │
│    b) Subir a Gemini y corregir                             │
│    c) Guardar corrección: PUT /api/submissions/:id         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Retornar resultado al frontend                           │
│    { success: true, alumnos_corregidos: N, ... }           │
└─────────────────────────────────────────────────────────────┘
```

## Ventajas de la Nueva Arquitectura

1. ✅ **Sin dependencias de Google Drive/Sheets**: Todo se guarda en MongoDB
2. ✅ **Más simple**: Menos nodos en n8n, sin búsquedas jerárquicas de carpetas
3. ✅ **Más rápido**: Sin operaciones de lectura/escritura en Drive/Sheets
4. ✅ **Más confiable**: MongoDB maneja transaccionalidad y consistencia
5. ✅ **Mejor trazabilidad**: Todos los datos en una sola base de datos
6. ✅ **Más seguro**: Autenticación JWT centralizada en el backend

## Troubleshooting

### Error: "No se encontró token de autenticación"
- El usuario debe estar correctamente logueado
- Verificar que `localStorage.getItem('token')` retorne un JWT válido

### Error: "La rúbrica no tiene configuración válida"
- Verificar que la rúbrica tenga el campo `rubric_json` poblado
- Si la rúbrica es antigua, puede que necesites recrearla

### Error: "Debes configurar tu API Key de Gemini"
- El usuario debe ir a su perfil y configurar su API key de Gemini
- Verificar que el campo `gemini_api_key` exista en el perfil del usuario

### El webhook de n8n no responde
- Verificar que n8n esté corriendo: `http://localhost:5678`
- Verificar que los workflows de MongoDB estén importados y activos
- Revisar logs de n8n para ver errores

### No se encuentran submissions para corregir
- Verificar que existan submissions con `status="uploaded"` para la comisión/rúbrica
- Usar MongoDB Compass o la API para verificar: `GET /api/submissions?commission_id=X&rubric_id=Y&status=uploaded`

## Archivos Modificados

```
✏️  frontend-correccion-automatica-n8n/src/components/user/UserView.tsx
✏️  frontend-correccion-automatica-n8n/.env.example
📄 docs/SOLUCION_CORRECCION_AUTOMATICA.md (este archivo)
```

## Próximos Pasos (Opcional)

Si quieres completar la migración completa según el plan original:

1. **Eliminar workflows n8n obsoletos** que usan Drive/Sheets
2. **Actualizar otros componentes** del frontend que puedan estar usando campos obsoletos
3. **Migrar datos históricos** de Google Sheets a MongoDB (si los hay)
4. **Limpiar código backend** relacionado con Drive/Sheets

Ver más detalles en: `docs/plans/PLAN_MIGRACION_DRIVE_A_MONGODB.md`

## Referencias

- Plan de migración completo: `docs/plans/PLAN_MIGRACION_DRIVE_A_MONGODB.md`
- README de workflows MongoDB: `n8n-workflows/README-MONGODB-MIGRATION.md`
- Modelo Rubric refactorizado: `backend/src/models/Rubric.js`
- Controller de Submissions: `backend/src/controllers/submissionController.js`
