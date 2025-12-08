# Networking entre Servicios Docker

Este documento explica cómo se comunican los servicios del sistema entre sí.

---

## Arquitectura de Red

```
┌─────────────────────────────────────────────────────────────┐
│                    correcion-network                         │
│                  (Docker Bridge Network)                     │
│                                                              │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────┐  │
│  │   Frontend   │─────▶│   Backend    │─────▶│   N8N    │  │
│  │  (nginx:80)  │      │  (node:80)   │      │ (:5678)  │  │
│  │              │      │              │      │          │  │
│  └──────────────┘      └──────────────┘      └──────────┘  │
│       │                      │                     │        │
└───────┼──────────────────────┼─────────────────────┼────────┘
        │                      │                     │
        │                      │                     │
   localhost:3000         localhost:5000        localhost:5678
```

---

## URLs de Comunicación

### 1️⃣ Frontend → Backend

**Desde el navegador (cliente):**
```javascript
// Frontend hace requests HTTP al backend
const API_URL = "http://localhost:5000"
fetch(`${API_URL}/api/submissions`)
```

**Variables de entorno (build time):**
- `VITE_API_URL=http://localhost:5000`

**Puerto expuesto:**
- `localhost:5000` → `backend:80`

---

### 2️⃣ Backend → N8N

**Desde el contenedor backend:**
```javascript
// Backend llama a webhooks de N8N
const N8N_URL = "http://n8n:5678"
axios.post(`${N8N_URL}/webhook/corregir`, data)
```

**URLs internas (entre containers):**
```env
N8N_RUBRIC_WEBHOOK_URL=http://n8n:5678/webhook/rubrica
N8N_GRADING_WEBHOOK_URL=http://n8n:5678/webhook/corregir
N8N_SPREADSHEET_WEBHOOK_URL=http://n8n:5678/webhook/spreadsheet
N8N_BATCH_GRADING_WEBHOOK_URL=http://n8n:5678/webhook/automatico

# Creación de carpetas
N8N_CREATE_UNIVERSITY_FOLDER_WEBHOOK=http://n8n:5678/webhook/create-university-folder
N8N_CREATE_FACULTY_FOLDER_WEBHOOK=http://n8n:5678/webhook/create-faculty-folder
N8N_CREATE_CAREER_FOLDER_WEBHOOK=http://n8n:5678/webhook/create-career-folder
N8N_CREATE_COURSE_FOLDER_WEBHOOK=http://n8n:5678/webhook/create-course-folder
N8N_CREATE_COMMISSION_FOLDER_WEBHOOK=http://n8n:5678/webhook/create-commission-folder
N8N_CREATE_SUBMISSION_FOLDER_WEBHOOK=http://n8n:5678/webhook/create-submission-folder
```

**¿Por qué `http://n8n:5678` y no `http://localhost:5678`?**

Dentro de Docker:
- ✅ `http://n8n:5678` - Nombre del servicio en la red Docker
- ❌ `http://localhost:5678` - No funciona (localhost es el propio container)

---

### 3️⃣ Usuario → N8N (UI)

**Desde el navegador:**
```
http://localhost:5678
```

**Credenciales:**
- Usuario: `admin` (configurado en `.env`)
- Password: `admin123` (configurado en `.env`)

---

### 4️⃣ Frontend → N8N (Webhooks directos)

⚠️ **Actualmente el frontend también llama a N8N directamente**

**Variables de entorno en frontend:**
```env
VITE_RUBRIC_WEBHOOK_URL=http://localhost:5678/webhook/rubrica
VITE_GRADING_WEBHOOK_URL=http://localhost:5678/webhook/corregir
VITE_SPREADSHEET_WEBHOOK_URL=http://localhost:5678/webhook/spreadsheet
VITE_BATCH_GRADING_WEBHOOK_URL=http://localhost:5678/webhook/automatico
```

**Nota:** Estas son URLs externas (localhost) porque el navegador del usuario hace las peticiones, no el container de frontend.

---

## Dependencias entre Servicios

```yaml
# En docker-compose.yml
frontend:
  depends_on:
    backend:
      condition: service_healthy  # Espera a que backend esté saludable

backend:
  depends_on:
    n8n:
      condition: service_healthy  # Espera a que n8n esté saludable
```

**Orden de inicio:**
1. N8N (primero)
2. Backend (después de N8N)
3. Frontend (después de Backend)

---

## Health Checks

Cada servicio tiene un health check para verificar que esté funcionando:

### Backend
```yaml
healthcheck:
  test: ["CMD", "node", "-e", "require('http').get('http://localhost:80/health', ...)"]
  interval: 30s
  timeout: 3s
  retries: 3
  start_period: 40s
```

**Endpoint:** `GET http://localhost:5000/health`

### Frontend
```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:80/"]
  interval: 30s
  timeout: 3s
  retries: 3
  start_period: 10s
```

**Endpoint:** `GET http://localhost:3000/`

### N8N
```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:5678/healthz"]
  interval: 30s
  timeout: 10s
  retries: 5
  start_period: 40s
```

**Endpoint:** `GET http://localhost:5678/healthz`

---

## Verificar Comunicación entre Services

### Desde tu máquina host:

```bash
# Ver estado de los servicios
docker-compose ps

# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend

# Verificar health checks
docker inspect correcion-backend | grep -A 10 Health
docker inspect correcion-n8n | grep -A 10 Health
docker inspect correcion-frontend | grep -A 10 Health
```

### Probar comunicación desde el host:

```bash
# Frontend
curl http://localhost:3000

# Backend health
curl http://localhost:5000/health

# N8N health
curl http://localhost:5678/healthz

# N8N webhook (ejemplo)
curl -X POST http://localhost:5678/webhook/test \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### Probar comunicación DENTRO de un container:

```bash
# Acceder al container del backend
docker exec -it correcion-backend sh

# Desde dentro del backend, probar N8N
wget -O- http://n8n:5678/healthz

# Probar webhook de N8N
wget -O- --post-data='{"test":"data"}' \
  --header='Content-Type:application/json' \
  http://n8n:5678/webhook/rubrica
```

---

## Troubleshooting de Red

### Problema: Backend no puede conectarse a N8N

**Síntomas:**
```
Error: connect ECONNREFUSED n8n:5678
```

**Soluciones:**
1. Verificar que N8N esté corriendo:
   ```bash
   docker-compose ps
   ```

2. Verificar que N8N esté saludable:
   ```bash
   docker-compose logs n8n | grep -i health
   ```

3. Verificar networking:
   ```bash
   docker network inspect correcion-network
   ```

4. Verificar que ambos estén en la misma red:
   ```bash
   docker network inspect correcion-network | grep -A 5 correcion-backend
   docker network inspect correcion-network | grep -A 5 correcion-n8n
   ```

### Problema: Frontend no puede hacer fetch al backend

**Síntomas:**
```
Failed to fetch: http://localhost:5000/api/...
CORS error
```

**Soluciones:**
1. Verificar CORS_ORIGIN en .env:
   ```env
   CORS_ORIGIN=http://localhost:3000
   ```

2. Verificar que backend esté escuchando:
   ```bash
   curl http://localhost:5000/health
   ```

3. Verificar logs del backend:
   ```bash
   docker-compose logs -f backend
   ```

### Problema: No puedo acceder a N8N UI

**Síntomas:**
```
http://localhost:5678 no responde
```

**Soluciones:**
1. Verificar que N8N esté corriendo:
   ```bash
   docker-compose ps n8n
   ```

2. Verificar puerto mapeado:
   ```bash
   docker port correcion-n8n
   # Debe mostrar: 5678/tcp -> 0.0.0.0:5678
   ```

3. Verificar si el puerto está ocupado:
   ```bash
   # Windows
   netstat -ano | findstr :5678

   # Linux/Mac
   lsof -i :5678
   ```

4. Cambiar puerto en .env si está ocupado:
   ```env
   N8N_PORT=5679
   ```

---

## Resumen de Puertos

| Servicio | Puerto Interno | Puerto Externo | Acceso |
|----------|---------------|----------------|--------|
| Frontend | 80 | 3000 (configurable) | http://localhost:3000 |
| Backend | 80 | 5000 (configurable) | http://localhost:5000 |
| N8N | 5678 | 5678 (configurable) | http://localhost:5678 |

**Configurable mediante .env:**
```env
FRONTEND_PORT=3000
BACKEND_PORT=5000
N8N_PORT=5678
```

---

## DNS Interno de Docker

Docker crea automáticamente entradas DNS para cada servicio:

```
frontend   → 172.18.0.2 (ejemplo)
backend    → 172.18.0.3 (ejemplo)
n8n        → 172.18.0.4 (ejemplo)
```

**Resolución de nombres:**
- `ping n8n` desde `backend` → resuelve a IP del container N8N
- `ping backend` desde `frontend` → resuelve a IP del container Backend

---

## Comunicación Externa (Internet)

Todos los servicios pueden acceder a internet:

- **Backend:** Llama a MongoDB Atlas en la nube
- **N8N:** Llama a Google APIs (Drive, Sheets, Gemini)
- **Frontend:** Navegador del usuario hace requests externos

**No se requiere configuración adicional** para acceso a internet.
