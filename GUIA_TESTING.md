# Guía de Testing - Sistema de Corrección Automática

## Índice
1. [Testing Backend](#testing-backend)
2. [Testing Frontend](#testing-frontend)
3. [Testing Integración](#testing-integración)
4. [Checklist Completo](#checklist-completo)

---

## Testing Backend

### 1. Configuración Inicial

**Verificar variables de entorno (.env):**
```bash
MONGODB_URI=mongodb://localhost:27017/correcion-automatica
PORT=5000
JWT_SECRET=<tu-secret-seguro>
ENCRYPTION_KEY=<32-bytes-hex-key>
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

**Generar ENCRYPTION_KEY si no existe:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Seed de Base de Datos

**Ejecutar seed:**
```bash
cd backend
npm run seed
```

**Verificar en consola:**
- ✅ Conexión a MongoDB exitosa
- ✅ 4 universidades creadas (UTN regionales)
- ✅ Facultades creadas para cada universidad
- ✅ Carreras creadas para cada facultad
- ✅ Cursos creados (Análisis Matemático I, etc.)
- ✅ 2 comisiones por curso
- ✅ Rúbricas con criterios completos
- ✅ Usuarios: admin (admin) y testuser (usuario normal)

### 3. Testing Endpoints de Autenticación

**POST /api/auth/login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

**Resultado esperado:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "user": {
      "id": "...",
      "username": "admin",
      "name": "Administrador",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 4. Testing Endpoints de Perfil

**Obtener token (guardar en variable):**
```bash
export TOKEN="<token-del-login>"
```

**GET /api/profile**
```bash
curl http://localhost:5000/api/profile \
  -H "Authorization: Bearer $TOKEN"
```

**Resultado esperado:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "username": "admin",
    "name": "Administrador",
    "role": "admin",
    "gemini_api_key_configured": false,
    "gemini_api_key_last_4": null
  }
}
```

**PUT /api/profile/gemini-api-key (configurar API key)**
```bash
curl -X PUT http://localhost:5000/api/profile/gemini-api-key \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "AIzaSyC-test-key-here-1234567890"}'
```

**Resultado esperado:**
```json
{
  "success": true,
  "message": "API Key de Gemini configurada exitosamente",
  "data": {
    "last4": "7890",
    "configured_at": "2025-10-26T..."
  }
}
```

**GET /api/profile (verificar API key guardada)**
```bash
curl http://localhost:5000/api/profile \
  -H "Authorization: Bearer $TOKEN"
```

**Resultado esperado:**
```json
{
  "success": true,
  "data": {
    "gemini_api_key_configured": true,
    "gemini_api_key_last_4": "7890"
  }
}
```

**DELETE /api/profile/gemini-api-key**
```bash
curl -X DELETE http://localhost:5000/api/profile/gemini-api-key \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Testing Endpoints de Jerarquía

**GET /api/universities**
```bash
curl http://localhost:5000/api/universities \
  -H "Authorization: Bearer $TOKEN"
```

**Resultado esperado:**
```json
{
  "success": true,
  "data": [
    {
      "university_id": "utn-frba",
      "name": "Universidad Tecnológica Nacional - FRBA"
    },
    ...
  ]
}
```

**GET /api/faculties?university_id=utn-frba**
```bash
curl "http://localhost:5000/api/faculties?university_id=utn-frba" \
  -H "Authorization: Bearer $TOKEN"
```

**GET /api/careers?faculty_id=utn-frba-ing**
**GET /api/courses?career_id=utn-frba-ing-sistemas**
**GET /api/commissions?course_id=2025-analisis-matematico-1-utn-frba**
**GET /api/rubrics?commission_id=...**

**Verificar encadenamiento:**
- ✅ Universidad → Facultad → Carrera → Curso → Comisión → Rúbrica
- ✅ Filtros por IDs funcionan correctamente
- ✅ Campo `deleted: false` se aplica en todas las consultas

### 6. Testing Endpoints Admin

**POST /api/universities (crear universidad)**
```bash
curl -X POST http://localhost:5000/api/universities \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Universidad de Buenos Aires"}'
```

**PUT /api/universities/:id (actualizar)**
**DELETE /api/universities/:id (soft delete)**

**Repetir para:**
- /api/faculties
- /api/careers
- /api/courses
- /api/commissions
- /api/rubrics

### 7. Testing Sistema de Corrección

**Prerequisito: Usuario con API key configurada**

**POST /api/grade**
```bash
curl -X POST http://localhost:5000/api/grade \
  -H "Authorization: Bearer $TOKEN" \
  -F "universidad=Universidad Tecnológica Nacional - FRBA" \
  -F "facultad=Facultad de Ingeniería" \
  -F "carrera=Ingeniería en Sistemas" \
  -F "materia=Análisis Matemático I" \
  -F "comision=Comisión 1 - Análisis Matemático I" \
  -F "nombre_rubrica=Parcial 1 - Análisis Matemático I" \
  -F "rubrica=@/path/to/rubrica.json" \
  -F "examen=@/path/to/examen.pdf"
```

**Verificar en logs backend:**
- ✅ Usuario identificado correctamente
- ✅ API key desencriptada
- ✅ FormData construido con todos los campos
- ✅ Request enviado a n8n webhook
- ✅ Respuesta de n8n recibida y reenviada

**Sin API key configurada:**
```bash
# Resultado esperado: 403 Forbidden
{
  "success": false,
  "message": "Debes configurar tu API Key de Gemini en tu perfil antes de poder corregir."
}
```

---

## Testing Frontend

### 1. Inicio y Login

**Acceder a http://localhost:5173**

**Login con usuario normal:**
- Usuario: `testuser`
- Contraseña: `test123`
- ✅ Redirección a `/` (UserView)
- ✅ Navbar muestra "Mi Perfil" y "Cerrar Sesión"
- ✅ NO muestra "Panel Admin"

**Login con admin:**
- Usuario: `admin`
- Contraseña: `admin123`
- ✅ Navbar muestra "Panel Admin", "Mi Perfil" y "Cerrar Sesión"

### 2. Testing Vista Usuario (UserView)

**Sin API key configurada:**
- ✅ Banner rojo de advertencia visible
- ✅ Mensaje: "Debes configurar tu API Key de Gemini antes de poder corregir"
- ✅ Botón "Ir a mi perfil" visible
- ✅ Selectores de jerarquía deshabilitados
- ✅ Botón "Corregir" deshabilitado

**Con API key configurada:**
- ✅ Banner de advertencia NO visible
- ✅ Selectores habilitados
- ✅ Botón "Corregir" habilitado

**Testing selección jerárquica:**
1. Seleccionar Universidad
   - ✅ Carga facultades de esa universidad
2. Seleccionar Facultad
   - ✅ Carga carreras de esa facultad
3. Seleccionar Carrera
   - ✅ Carga cursos de esa carrera
4. Seleccionar Curso
   - ✅ Carga comisiones de ese curso
5. Seleccionar Comisión
   - ✅ Carga rúbricas de esa comisión
6. Seleccionar Rúbrica
   - ✅ Muestra criterios de evaluación

**Testing corrección:**
1. Seleccionar archivo de examen (PDF)
   - ✅ Nombre del archivo visible
2. Click en "Corregir"
   - ✅ Loading spinner visible
   - ✅ Botón deshabilitado durante corrección
   - ✅ Request a `/api/grade` con FormData
3. Respuesta exitosa
   - ✅ Mensaje de éxito
   - ✅ Resultado visible con calificación
4. Respuesta con error
   - ✅ Mensaje de error visible

### 3. Testing Vista Perfil

**Acceder a /profile**

**Sin API key configurada:**
- ✅ Sección "API Key de Gemini" visible
- ✅ Banner amarillo de advertencia
- ✅ Input para ingresar API key
- ✅ Botón "Guardar API Key"
- ✅ Texto "No configurada" en estado

**Configurar API key:**
1. Ingresar API key válida
   - ✅ Input acepta texto
2. Click en "Guardar API Key"
   - ✅ Loading durante validación
   - ✅ Mensaje de éxito
3. Refrescar página
   - ✅ Muestra "Últimos 4 dígitos: ****1234"
   - ✅ Banner amarillo desaparece
   - ✅ Botón "Eliminar API Key" visible

**Eliminar API key:**
1. Click en "Eliminar API Key"
   - ✅ Confirmación solicitada
2. Confirmar eliminación
   - ✅ API key eliminada
   - ✅ Vuelve a estado "No configurada"

**Rate limiting:**
- Intentar guardar 6 API keys en menos de 1 hora
  - ✅ 6to intento bloqueado
  - ✅ Mensaje: "Demasiados intentos. Intenta en X minutos"

### 4. Testing Panel Admin

**Acceder con usuario normal:**
- ✅ Redirección a `/` (no autorizado)

**Acceder con admin:**
- ✅ Vista de administración visible

**Testing Universidad Manager:**
1. Ver lista de universidades
   - ✅ 4 universidades del seed visibles
2. Crear nueva universidad
   - ✅ Modal abierto
   - ✅ Input para nombre
   - ✅ Guardado exitoso
   - ✅ Aparece en lista
3. Editar universidad
   - ✅ Modal con datos precargados
   - ✅ Actualización exitosa
4. Eliminar universidad
   - ✅ Confirmación solicitada
   - ✅ Soft delete (no aparece en lista)

**Repetir para cada gestor:**
- ✅ Facultades (filtrar por universidad)
- ✅ Carreras (filtrar por facultad)
- ✅ Cursos (filtrar por carrera, incluir año)
- ✅ Comisiones (filtrar por curso)
- ✅ Rúbricas (filtrar por comisión, incluir tipo y número)

---

## Testing Integración

### Flujo Completo: Nuevo Usuario → Corrección

1. **Admin crea estructura jerárquica**
   - ✅ Universidad → Facultad → Carrera → Curso → Comisión → Rúbrica

2. **Usuario nuevo se registra/logea**
   - ✅ Login exitoso

3. **Usuario configura API key**
   - ✅ Accede a /profile
   - ✅ Configura API key de Gemini
   - ✅ Validación exitosa

4. **Usuario selecciona jerarquía**
   - ✅ Selecciona cada nivel hasta llegar a rúbrica
   - ✅ Ve criterios de evaluación

5. **Usuario sube examen**
   - ✅ Selecciona archivo PDF
   - ✅ Click en "Corregir"

6. **Backend procesa**
   - ✅ Obtiene API key del usuario
   - ✅ Desencripta API key
   - ✅ Construye FormData con jerarquía completa
   - ✅ Envía a n8n webhook

7. **n8n procesa (webhook externo)**
   - ✅ Recibe todos los campos
   - ✅ Procesa con API key del usuario
   - ✅ Retorna resultado

8. **Frontend muestra resultado**
   - ✅ Calificación visible
   - ✅ Feedback de cada criterio

---

## Checklist Completo

### Backend
- [ ] Variables de entorno configuradas
- [ ] ENCRYPTION_KEY generada
- [ ] Base de datos seed ejecutada
- [ ] Login admin funciona
- [ ] Login usuario normal funciona
- [ ] GET /api/profile funciona
- [ ] PUT /api/profile/gemini-api-key funciona
- [ ] Validación de API key funciona
- [ ] DELETE /api/profile/gemini-api-key funciona
- [ ] Rate limiting funciona (5 intentos/hora)
- [ ] GET endpoints de jerarquía funcionan
- [ ] POST/PUT/DELETE admin endpoints funcionan
- [ ] Soft delete funciona en todas las entidades
- [ ] POST /api/grade con API key funciona
- [ ] POST /api/grade sin API key retorna 403

### Frontend
- [ ] Login redirecciona correctamente
- [ ] Navbar muestra opciones según rol
- [ ] Banner de advertencia sin API key visible
- [ ] Redirección a /profile funciona
- [ ] Configurar API key funciona
- [ ] Mostrar últimos 4 dígitos funciona
- [ ] Eliminar API key funciona
- [ ] Selectores jerárquicos cargan datos
- [ ] Selectores en cascada funcionan
- [ ] Subir archivo de examen funciona
- [ ] Corrección con API key funciona
- [ ] Loading states visibles
- [ ] Mensajes de error visibles
- [ ] Panel admin solo accesible por admin
- [ ] CRUD de universidades funciona
- [ ] CRUD de facultades funciona
- [ ] CRUD de carreras funciona
- [ ] CRUD de cursos funciona
- [ ] CRUD de comisiones funciona
- [ ] CRUD de rúbricas funciona

### Integración
- [ ] Flujo completo end-to-end funciona
- [ ] Encriptación/desencriptación de API key funciona
- [ ] Request a n8n incluye todos los campos
- [ ] n8n webhook recibe y procesa correctamente
- [ ] Respuesta de n8n se muestra en frontend

### Seguridad
- [ ] API keys nunca se envían al frontend después de guardar
- [ ] API keys encriptadas en base de datos
- [ ] Rate limiting previene abuso
- [ ] Soft delete previene pérdida de datos
- [ ] JWT expira correctamente
- [ ] Middleware de autenticación funciona
- [ ] Middleware de autorización admin funciona

---

## Notas Finales

- **Backup**: Siempre hacer backup antes de ejecutar migraciones en producción
- **Logs**: Revisar logs del backend durante testing para detectar errores
- **n8n**: Verificar que el webhook de n8n esté funcionando
- **Timeout**: El endpoint `/api/grade` tiene timeout de 2 minutos
- **Archivos**: Límite de 50MB por archivo (configurado en Express)

---

## Comandos Útiles

```bash
# Seed completo
npm run seed

# Migración de jerarquía (si hay datos existentes)
node src/scripts/migrateToNewHierarchy.js

# Migración de campo deleted (si hay usuarios sin este campo)
node scripts/migrateDeletedField.js

# Ver logs de MongoDB
mongosh correcion-automatica

# Limpiar base de datos
use correcion-automatica
db.dropDatabase()
```
