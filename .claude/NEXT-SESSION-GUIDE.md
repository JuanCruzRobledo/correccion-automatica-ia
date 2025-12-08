# Guía para la Próxima Sesión de Claude

**Fecha de creación:** 2025-12-08
**Estado del proyecto:** Implementación Docker completada al 100%
**Tareas pendientes:** Configuración manual del usuario

---

## 📋 Contexto Completo

### ¿Qué se ha hecho?

Se implementó una **solución completa de Docker** para el Sistema de Corrección Automática con IA. El usuario podrá ejecutar todo el stack (Backend + Frontend + N8N) con solo 3 comandos.

### Stack Tecnológico
- **Backend:** Node.js + Express + MongoDB Atlas (cloud)
- **Frontend:** React + TypeScript + Vite + Nginx
- **N8N:** Automatización de workflows
- **Base de datos:** MongoDB Atlas (compartida en la nube)

### Arquitectura Docker
```
├── Backend (Node.js) - Puerto 5000
├── Frontend (React + Nginx) - Puerto 3000
└── N8N (Workflows) - Puerto 5678
    └── Red: correcion-network (bridge)
```

---

## ✅ Fases Completadas (5/5)

### FASE 1: Dockerfiles ✅
- `backend/Dockerfile` - Node.js Alpine
- `backend/.dockerignore`
- `frontend-correccion-automatica-n8n/Dockerfile` - Multi-stage (Node + Nginx)
- `frontend-correccion-automatica-n8n/nginx.conf`
- `frontend-correccion-automatica-n8n/.dockerignore`

### FASE 2: Configuración N8N ✅
- `n8n/workflows/` - 14 workflows copiados
- `n8n/README-PRECONFIGURACION.md` - Guía completa
- `n8n/Dockerfile.preconfigured` - Para imagen personalizada
- `n8n/build-preconfigured-image.sh` - Script de build
- `n8n/data/` - Estructura para datos persistentes

### FASE 3: Docker Compose ✅
- `docker-compose.yml` - Orquestación de 3 servicios
- `.env.example` - Template completo
- `NETWORKING.md` - Documentación de red

### FASE 4: Scripts de Utilidad ✅
- `Makefile` - 30+ comandos
- `scripts/setup.sh` - Setup automático
- `scripts/check-env.sh` - Verificar variables
- `scripts/troubleshoot.sh` - Diagnóstico

### FASE 5: Documentación ✅
- `README-DOCKER.md` - Guía completa
- `QUICK-START.md` - Inicio rápido
- `CONTRIBUTING.md` - Para desarrolladores
- `README.md` - Actualizado con sección Docker

---

## ⚠️ TAREAS PENDIENTES PARA EL USUARIO

El usuario debe completar estas tareas cuando reinicie:

### 1. Preconfigurar N8N 🔴 CRÍTICO

**Objetivo:** Crear una imagen Docker de N8N con workflows y credenciales ya configuradas.

**Archivo guía:** `n8n/README-PRECONFIGURACION.md`

**Pasos exactos:**

```bash
# 1. Levantar N8N en modo configuración
cd n8n
docker run -d \
  --name n8n-config \
  -p 5678:5678 \
  -e N8N_BASIC_AUTH_ACTIVE=false \
  -v $(pwd)/data:/home/node/.n8n \
  n8nio/n8n:latest

# 2. Acceder a http://localhost:5678
# Browser: Abrir http://localhost:5678

# 3. Configurar Google Service Account
# - Ir a https://console.cloud.google.com/
# - Crear Service Account
# - Descargar JSON
# - En N8N: Credentials → New → Google Service Account
# - Pegar JSON completo
# - Guardar como "Google Service Account"

# 4. Importar workflows
# En N8N UI: Workflows → Import from File
# Importar cada archivo de n8n/workflows/:
# - correcion-automatica.json
# - flujo_correccion_manual.json
# - flujo_correccion_masiva.json
# - create-university-folder.json
# - create-faculty-folder.json
# - create-career-folder.json
# - create-course-folder.json
# - create-commission-folder.json
# - create-submission-folder.json
# - create-student-folder.json
# - upload-file-to-drive.json
# - get-student-corrections.json
# (Total: 12+ workflows)

# 5. Activar todos los workflows
# En cada workflow: Toggle verde en esquina superior derecha

# 6. Detener N8N
docker stop n8n-config
docker rm n8n-config

# 7. Construir imagen personalizada
cd n8n
./build-preconfigured-image.sh
# Nombre sugerido: tu-usuario/n8n-correcion-automatica:latest

# 8. Pushear a Docker Hub
docker push tu-usuario/n8n-correcion-automatica:latest
```

**Verificación:**
```bash
# La imagen debe contener:
# - n8n/data/database.sqlite (con workflows y credenciales)
# - Todo preconfigurado

# Probar imagen:
docker run -d -p 5678:5678 tu-usuario/n8n-correcion-automatica:latest
# Acceder a http://localhost:5678
# Verificar que workflows están activos
```

---

### 2. Actualizar docker-compose.yml 🟡 IMPORTANTE

**Archivo:** `docker-compose.yml`

**Cambio necesario:**

**Antes (actual):**
```yaml
n8n:
  # OPCIÓN 1: Imagen oficial (para desarrollo o primera configuración)
  image: n8nio/n8n:latest

  # OPCIÓN 2: Imagen preconfigurada (para producción)
  # image: tu-usuario/n8n-correcion-automatica:latest
```

**Después (cuando tengas la imagen):**
```yaml
n8n:
  # OPCIÓN 1: Imagen oficial (para desarrollo o primera configuración)
  # image: n8nio/n8n:latest

  # OPCIÓN 2: Imagen preconfigurada (para producción)
  image: tu-usuario/n8n-correcion-automatica:latest
```

**Opcional:** Si usas imagen preconfigurada, puedes comentar el volumen:
```yaml
volumes:
  # IMPORTANTE: Esto es para desarrollo/primera configuración
  # Si usas imagen preconfigurada (OPCIÓN 2), puedes comentar este volumen
  # - n8n_data:/home/node/.n8n
```

---

### 3. Configurar .env.example con MongoDB URI Real 🟡 IMPORTANTE

**Archivo:** `.env.example`

**Línea a cambiar:**
```env
# ANTES (placeholder)
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/correcion-automatica?retryWrites=true&w=majority

# DESPUÉS (tu URI real)
MONGODB_URI=mongodb+srv://TU_USUARIO:TU_PASSWORD@TU_CLUSTER.mongodb.net/correcion-automatica?retryWrites=true&w=majority
```

**Obtener URI real:**
1. MongoDB Atlas: https://cloud.mongodb.com/
2. Ir a tu cluster
3. Click "Connect" → "Connect your application"
4. Copiar connection string
5. Reemplazar `<password>` con tu password real
6. Reemplazar `<dbname>` con `correcion-automatica`

**Importante:** Este URI será el que todos los usuarios locales usarán (base de datos compartida).

---

### 4. Crear Datos de Demo en MongoDB 🟢 OPCIONAL

**Objetivo:** Poblar la base de datos con datos de prueba para facilitar el uso del sistema.

**Método 1: Script de Seed (si existe)**
```bash
# Verificar si hay script de seed
ls backend/scripts/seedDatabase.js

# Si existe:
cd backend
npm run seed
```

**Método 2: Crear manualmente**

Datos sugeridos:
- **Usuario Super Admin:**
  - Email: admin@test.com
  - Password: admin123
  - Role: super_admin

- **Universidad de prueba:**
  - Nombre: Universidad de Ejemplo
  - Con facultad, carrera, materia, comisión

- **Rúbrica de ejemplo:**
  - Para una materia específica
  - Con criterios básicos

**Script sugerido a crear:**
```javascript
// backend/scripts/createDemoData.js
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import University from '../src/models/University.js';
// ... otros modelos

async function createDemoData() {
  // Conectar a MongoDB
  await mongoose.connect(process.env.MONGODB_URI);

  // Crear Super Admin
  const admin = await User.create({
    email: 'admin@test.com',
    password: 'admin123', // Se hasheará automáticamente
    role: 'super_admin',
    name: 'Admin Demo'
  });

  // Crear Universidad
  const university = await University.create({
    name: 'Universidad de Ejemplo',
    createdBy: admin._id
  });

  // ... más datos

  console.log('✅ Datos de demo creados');
}

createDemoData();
```

---

### 5. Probar el Sistema Completo 🔴 CRÍTICO

**Checklist de verificación:**

```bash
# 1. Setup inicial
make setup
# ✅ Debe crear .env
# ✅ Debe construir imágenes sin errores
# ✅ Debe verificar puertos

# 2. Verificar configuración
make check-env
# ✅ MONGODB_URI configurado
# ✅ Todas las variables OK

# 3. Iniciar servicios
make start
# ✅ 3 containers corriendo

# 4. Verificar estado
make status
# ✅ correcion-backend: Up
# ✅ correcion-frontend: Up
# ✅ correcion-n8n: Up

# 5. Health checks
make health
# ✅ Backend: 200
# ✅ Frontend: 200
# ✅ N8N: 200

# 6. Probar conectividad
make test
# ✅ Todos los tests pasan

# 7. Acceder a servicios
# Frontend: http://localhost:3000
# Backend: http://localhost:5000/health
# N8N: http://localhost:5678 (admin/admin123)

# 8. Probar flujo completo de corrección
# - Login en frontend
# - Crear/ver universidad
# - Subir consigna PDF
# - Generar rúbrica
# - Subir entrega de alumno
# - Ejecutar corrección
# - Ver resultados

# 9. Verificar integración con Google
# - N8N puede acceder a Drive
# - N8N puede escribir en Sheets
# - Gemini API responde

# 10. Ver logs
make logs-f
# ✅ Sin errores críticos
```

---

### 6. Crear Videos Tutoriales 🟢 OPCIONAL

**Videos sugeridos (plan actualizado):**

1. **Video 1: Instalación de Docker** (5-7 min)
   - Descargar e instalar Docker Desktop
   - Verificar instalación
   - Clonar repositorio

2. **Video 2: Configuración y Primera Ejecución** (8-10 min)
   - Ejecutar `make setup`
   - Editar `.env` (solo MONGODB_URI)
   - Ejecutar `make start`
   - Acceder a servicios

3. **Video 3: Configuración de Google APIs en N8N** (10-12 min)
   - Google Cloud Console
   - Crear Service Account
   - Configurar en N8N
   - Activar workflows

4. **Video 4: Flujo Completo de Corrección** (12-15 min)
   - Login en sistema
   - Crear estructura (universidad, facultad, etc.)
   - Subir consigna y generar rúbrica
   - Subir entrega y corregir
   - Ver resultados en Google Sheets

5. **Video 5: Troubleshooting** (5-7 min)
   - Comandos útiles (`make troubleshoot`)
   - Errores comunes y soluciones
   - Ver logs

---

## 🔧 Configuraciones Importantes

### Variables de Entorno Críticas

**En `.env.example`:**
```env
# OBLIGATORIO cambiar
MONGODB_URI=mongodb+srv://...

# RECOMENDADO cambiar en producción
JWT_SECRET=...
ENCRYPTION_KEY=...
N8N_BASIC_AUTH_PASSWORD=...

# OPCIONAL (tiene defaults funcionales)
BACKEND_PORT=5000
FRONTEND_PORT=3000
N8N_PORT=5678
```

### Credenciales de Google APIs

**Service Account necesita permisos para:**
- Google Drive API (crear carpetas, subir archivos)
- Google Sheets API (leer/escribir hojas)
- Google Gemini API (corrección con IA)

**Scopes necesarios:**
```
https://www.googleapis.com/auth/drive
https://www.googleapis.com/auth/spreadsheets
```

---

## 🐛 Troubleshooting Esperado

### Problema: N8N no guarda workflows después de importar

**Causa:** Permisos del volumen

**Solución:**
```bash
docker exec -u root n8n-config chown -R node:node /home/node/.n8n
```

### Problema: Google Service Account no tiene permisos

**Causa:** Falta habilitar APIs o compartir recursos

**Solución:**
1. Habilitar APIs en Google Cloud Console
2. Compartir Drive/Sheet con email del Service Account
3. Verificar scopes en N8N

### Problema: Workflows no se activan

**Causa:** Credenciales no asignadas a nodos

**Solución:**
1. Abrir workflow en N8N
2. Click en cada nodo que use Google APIs
3. Asignar credencial "Google Service Account"
4. Guardar workflow
5. Activar toggle

### Problema: Backend no conecta a MongoDB

**Causa:** URI incorrecta o IP no whitelisted

**Solución:**
1. Verificar MONGODB_URI en `.env`
2. MongoDB Atlas → Network Access → Add IP (0.0.0.0/0 para permitir todas)
3. Verificar usuario/password correctos
4. Probar conexión con MongoDB Compass

---

## 📊 Comandos de Ayuda para Claude

Cuando el usuario pida ayuda, estos son los comandos útiles:

### Diagnóstico rápido
```bash
make troubleshoot    # Diagnóstico completo automático
make check-env       # Verificar variables
make status          # Ver estado de servicios
make health          # Health checks
```

### Ver información
```bash
make logs-f          # Logs en tiempo real
make logs-backend    # Logs del backend
make logs-n8n        # Logs de N8N
docker-compose ps    # Estado de containers
```

### Reiniciar servicios
```bash
make restart              # Reiniciar todos
make restart-backend      # Reiniciar solo backend
make restart-n8n          # Reiniciar solo N8N
```

### Acceder a containers
```bash
make shell-backend   # Shell del backend
make shell-n8n       # Shell de N8N
```

### Limpiar y resetear
```bash
make clean    # Limpiar containers/redes (mantiene volúmenes)
make reset    # Reset completo (elimina volúmenes)
```

---

## 📁 Archivos Clave para Referencia Rápida

### Documentación
1. **README-DOCKER.md** - Guía completa de instalación
2. **n8n/README-PRECONFIGURACION.md** - Configurar N8N
3. **NETWORKING.md** - Troubleshooting de red
4. **scripts/README.md** - Documentación de scripts

### Configuración
1. **docker-compose.yml** - Orquestación de servicios
2. **.env.example** - Template de variables
3. **Makefile** - Comandos disponibles

### Scripts
1. **scripts/setup.sh** - Setup inicial
2. **scripts/check-env.sh** - Verificar configuración
3. **scripts/troubleshoot.sh** - Diagnóstico

---

## 🎯 Objetivo Final

Que cualquier persona pueda:
```bash
git clone https://github.com/usuario/proyecto-correccion.git
cd proyecto-correccion
make setup && make start
# ¡Y tener todo funcionando en 10-15 minutos!
```

**Sin instalar:**
- Node.js
- MongoDB
- N8N
- Dependencias varias

**Solo con:**
- Docker Desktop
- Git

---

## ✅ Checklist de Finalización

Cuando el usuario complete todo, verificar:

- [ ] Imagen de N8N creada y pusheada a Docker Hub
- [ ] `docker-compose.yml` actualizado con imagen personalizada
- [ ] `.env.example` con MONGODB_URI real
- [ ] `make setup && make start` funciona sin errores
- [ ] Servicios responden: `make health` → Todo OK
- [ ] Frontend accesible y funcional
- [ ] Backend conecta a MongoDB
- [ ] N8N workflows activos
- [ ] Integración con Google APIs funciona
- [ ] Flujo completo de corrección probado
- [ ] Documentación revisada y actualizada si es necesario

---

## 📝 Notas para Claude en Próxima Sesión

### Al iniciar nueva sesión:

1. **Leer este archivo completo** antes de empezar
2. **Preguntar al usuario qué completó** de las tareas pendientes
3. **Ejecutar diagnóstico** si hay problemas:
   ```bash
   make troubleshoot
   make check-env
   ```
4. **Revisar logs** si algo falla:
   ```bash
   make logs-backend
   make logs-n8n
   ```

### Contexto importante:

- El usuario tiene Windows
- La base de datos está en MongoDB Atlas (cloud)
- N8N debe tener workflows e credenciales preconfiguradas
- El objetivo es zero-config para el usuario final

### Si el usuario pregunta sobre:

**"¿Cómo configuro N8N?"**
→ Dirigir a `n8n/README-PRECONFIGURACION.md`

**"¿Cómo funciona el networking?"**
→ Dirigir a `NETWORKING.md`

**"¿Por qué no funciona X?"**
→ Ejecutar `make troubleshoot` primero

**"¿Cómo actualizo el sistema?"**
→ `make update` (git pull + rebuild)

**"¿Cómo agrego una nueva feature?"**
→ Dirigir a `CONTRIBUTING.md`

---

## 🚀 Estado Final Esperado

Cuando todo esté completo:

```
Usuario final:
  ├─ git clone [repo]
  ├─ make setup
  ├─ make start
  └─ ✅ Sistema funcionando en < 15 minutos

Servicios corriendo:
  ├─ Frontend (React) - http://localhost:3000
  ├─ Backend (Express) - http://localhost:5000
  └─ N8N (Workflows) - http://localhost:5678
      └─ 14 workflows activos
      └─ Google APIs configuradas
      └─ Zero configuración manual

Base de datos:
  └─ MongoDB Atlas (cloud)
      └─ Compartida entre todos los usuarios locales
      └─ Con datos de demo
```

---

**Última actualización:** 2025-12-08
**Siguiente paso:** Esperar que el usuario complete las tareas pendientes
**Ayuda:** Leer este archivo y asistir según el progreso del usuario
