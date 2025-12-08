# Plan de Portabilidad del Sistema con Docker

## Objetivo
Crear un entorno completamente portable que cualquier persona pueda ejecutar con **comandos simples y mínima configuración**.

---

## Resumen Ejecutivo

### Experiencia del Usuario Final
```bash
# Solo 3 comandos para tener todo funcionando:
git clone https://github.com/tu-usuario/proyecto-correccion.git
cd proyecto-correccion
make setup && make start

# ¡Listo! Sistema corriendo en menos de 10 minutos
# Frontend: http://localhost:3000
# Backend:  http://localhost:5000
# N8N:      http://localhost:5678
```

### Configuración Requerida
- ✅ **Base de datos:** Pre-configurada (compartida en la nube)
- ✅ **Variables de entorno:** Pre-configuradas con valores por defecto
- ✅ **Workflows de N8N:** Importados automáticamente
- ⚠️ **Google APIs:** Única configuración manual (10 min) - Video 3

### Videos Tutoriales
**Solo 5 videos esenciales (40-51 min total):**
1. Instalación de Docker (5-7 min)
2. Configuración y ejecución (8-10 min)
3. Google APIs en N8N (10-12 min)
4. Flujo de corrección completo (12-15 min)
5. Troubleshooting (5-7 min)

---

## Solución Recomendada: Docker Compose Multi-Servicio

### Por qué Docker Compose es la mejor opción:
- **Un solo comando** para levantar todo el ecosistema
- **Zero-config:** Base de datos ya conectada, workflows pre-cargados
- Networking automático entre servicios (backend ↔ n8n)
- Volúmenes persistentes para datos de N8N
- Cross-platform (Windows, Mac, Linux)
- Fácil de actualizar y mantener

### Alternativas descartadas:
- **Kubernetes**: Demasiado complejo para un proyecto académico
- **VM con Vagrant**: Requiere más recursos y es más lento
- **Scripts de instalación manual**: Propenso a errores de dependencias
- **MongoDB local**: Cada usuario necesitaría configurar su propia BD

---

## Estructura del Proyecto Dockerizado

```
proyecto-correccion/
├── docker-compose.yml          # Orquestación de todos los servicios
├── .env.example                # Template de variables de entorno
├── Makefile                    # Comandos simples (make start, make stop, etc.)
├── README-DOCKER.md            # Guía de inicio rápido
│
├── backend/
│   ├── Dockerfile              # Imagen del backend
│   ├── .dockerignore           # Archivos a ignorar
│   └── ...
│
├── frontend-correccion-automatica-n8n/
│   ├── Dockerfile              # Imagen del frontend (build + nginx)
│   ├── nginx.conf              # Configuración de nginx para servir React
│   ├── .dockerignore           # Archivos a ignorar
│   └── ...
│
├── n8n/
│   ├── init/                   # Scripts de inicialización
│   │   ├── import-workflows.sh # Importa workflows automáticamente
│   │   └── healthcheck.sh      # Verifica que N8N esté listo
│   ├── workflows/              # Workflows a importar (copia de n8n-workflows/)
│   └── credentials/            # Credenciales pre-configuradas (opcional)
│
└── scripts/
    ├── setup.sh                # Script inicial de configuración
    ├── start.sh                # Inicia todo el stack
    ├── stop.sh                 # Detiene todo el stack
    └── reset.sh                # Resetea todo (útil para desarrollo)
```

---

## Plan de Implementación Detallado

### FASE 1: Preparación de Archivos Base
**Tiempo estimado de implementación:** 1 sesión

#### 1.1 Crear Dockerfile para Backend
- Usar imagen `node:20-alpine` (ligera)
- Multi-stage build no necesario (backend no requiere compilación)
- Copiar solo archivos necesarios (usar .dockerignore)
- Exponer puerto 5000 (o el que uses)
- Health check para verificar disponibilidad

#### 1.2 Crear Dockerfile para Frontend
- Multi-stage build:
  - **Stage 1 (build)**: node:20-alpine para compilar React
  - **Stage 2 (runtime)**: nginx:alpine para servir archivos estáticos
- Configurar nginx para SPA (single page application)
- Variables de entorno en build time
- Exponer puerto 80

#### 1.3 Crear .dockerignore para ambos servicios
- Excluir node_modules
- Excluir archivos de desarrollo
- Excluir .git
- Excluir archivos de configuración local

---

### FASE 2: Configuración de N8N
**Tiempo estimado de implementación:** 1-2 sesiones

#### 2.1 Preparar Imagen de N8N
- Usar imagen oficial `n8nio/n8n:latest`
- Configurar volúmenes para persistencia:
  - `/home/node/.n8n` → Datos de N8N
  - `./n8n/workflows` → Workflows a importar
- Variables de entorno críticas:
  - `N8N_BASIC_AUTH_ACTIVE=true`
  - `N8N_BASIC_AUTH_USER` y `N8N_BASIC_AUTH_PASSWORD`
  - `WEBHOOK_URL` para webhooks públicos
  - `N8N_HOST` y `N8N_PORT`
  - `N8N_PROTOCOL=http` (o https si configuras SSL)

#### 2.2 Script de Importación Automática de Workflows
- Crear script `n8n/init/import-workflows.sh`
- Esperar a que N8N esté listo (health check)
- Usar API de N8N para importar workflows desde `n8n-workflows/`
- Activar workflows automáticamente
- Logging de errores y éxitos

#### 2.3 Pre-configuración de Credenciales (Opcional)
- Crear template de credenciales
- Usuario debe configurar API keys manualmente (por seguridad)
- Documentar en README las credenciales necesarias:
  - Google API (Gemini, Drive, Sheets)
  - Cualquier otro servicio externo

---

### FASE 3: Docker Compose Principal
**Tiempo estimado de implementación:** 1 sesión

#### 3.1 Crear docker-compose.yml
Servicios a incluir:
```yaml
services:
  # 1. Backend
  backend:
    build: ./backend
    container_name: correcion-backend
    restart: unless-stopped
    ports:
      - "${BACKEND_PORT:-5000}:5000"
    environment:
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
      - N8N_RUBRIC_WEBHOOK_URL=http://n8n:5678/webhook/rubrica
      - N8N_GRADING_WEBHOOK_URL=http://n8n:5678/webhook/corregir
      - (... todas las variables necesarias)
    depends_on:
      - n8n
    networks:
      - correcion-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # 2. Frontend
  frontend:
    build: ./frontend-correccion-automatica-n8n
    container_name: correcion-frontend
    restart: unless-stopped
    ports:
      - "${FRONTEND_PORT:-3000}:80"
    environment:
      - VITE_API_URL=http://localhost:${BACKEND_PORT:-5000}
    depends_on:
      - backend
    networks:
      - correcion-network

  # 3. N8N
  n8n:
    image: n8nio/n8n:latest
    container_name: correcion-n8n
    restart: unless-stopped
    ports:
      - "${N8N_PORT:-5678}:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=${N8N_USER:-admin}
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
      - WEBHOOK_URL=http://localhost:${N8N_PORT:-5678}
      - N8N_HOST=0.0.0.0
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - GENERIC_TIMEZONE=America/Argentina/Buenos_Aires
    volumes:
      - n8n_data:/home/node/.n8n
      - ./n8n-workflows:/workflows:ro
      - ./n8n/init:/init:ro
    networks:
      - correcion-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:5678/healthz"]
      interval: 30s
      timeout: 10s
      retries: 5

  # 4. Init Container (opcional)
  # Inicializa workflows después de que N8N esté listo
  n8n-init:
    image: alpine:latest
    container_name: correcion-n8n-init
    depends_on:
      n8n:
        condition: service_healthy
    volumes:
      - ./n8n/init:/scripts:ro
    command: /bin/sh /scripts/import-workflows.sh
    networks:
      - correcion-network

networks:
  correcion-network:
    driver: bridge

volumes:
  n8n_data:
    driver: local
```

#### 3.2 Crear .env.example completo
Incluir TODAS las variables necesarias con valores por defecto que funcionen:
```env
# ===========================================
# CONFIGURACIÓN GENERAL
# ===========================================
COMPOSE_PROJECT_NAME=correcion-automatica

# ===========================================
# PUERTOS DE LOS SERVICIOS
# ===========================================
BACKEND_PORT=5000
FRONTEND_PORT=3000
N8N_PORT=5678

# ===========================================
# BASE DE DATOS (MONGODB ATLAS - EN LA NUBE)
# ===========================================
# ⚠️ IMPORTANTE: Esta es la base de datos compartida en producción
# TODOS los usuarios locales usarán esta misma base de datos
# NO MODIFICAR - Ya está configurada y desplegada
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/correcion-automatica?retryWrites=true&w=majority

# ===========================================
# BACKEND - JWT
# ===========================================
# Estas claves YA están configuradas - Funciona out-of-the-box
# Solo modificar si necesitas algo específico
JWT_SECRET=correcion-automatica-jwt-secret-default-2024
JWT_EXPIRES_IN=7d

# ===========================================
# BACKEND - ENCRYPTION
# ===========================================
# Clave de encriptación pre-configurada - Funciona out-of-the-box
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# ===========================================
# N8N - AUTENTICACIÓN
# ===========================================
# Credenciales de acceso a N8N local
# Usuario: admin / Password: admin123
N8N_USER=admin
N8N_PASSWORD=admin123

# ===========================================
# N8N - WEBHOOKS (URLs INTERNAS - NO CAMBIAR)
# ===========================================
# Estas URLs son internas entre containers Docker
N8N_RUBRIC_WEBHOOK_URL=http://n8n:5678/webhook/rubrica
N8N_GRADING_WEBHOOK_URL=http://n8n:5678/webhook/corregir
N8N_SPREADSHEET_WEBHOOK_URL=http://n8n:5678/webhook/spreadsheet

# Webhooks de creación de carpetas
N8N_CREATE_UNIVERSITY_FOLDER_WEBHOOK=http://n8n:5678/webhook/create-university-folder
N8N_CREATE_FACULTY_FOLDER_WEBHOOK=http://n8n:5678/webhook/create-faculty-folder
N8N_CREATE_CAREER_FOLDER_WEBHOOK=http://n8n:5678/webhook/create-career-folder
N8N_CREATE_COURSE_FOLDER_WEBHOOK=http://n8n:5678/webhook/create-course-folder
N8N_CREATE_COMMISSION_FOLDER_WEBHOOK=http://n8n:5678/webhook/create-commission-folder
N8N_CREATE_SUBMISSION_FOLDER_WEBHOOK=http://n8n:5678/webhook/create-submission-folder

# ===========================================
# CORS
# ===========================================
CORS_ORIGIN=http://localhost:3000

# ===========================================
# GOOGLE APIs
# ===========================================
# ⚠️ IMPORTANTE: Estas credenciales se configuran en N8N después del primer inicio
# Ver Video 2: Configuración de Google APIs en N8N
# GOOGLE_API_KEY=
# GOOGLE_DRIVE_CLIENT_ID=
# GOOGLE_DRIVE_CLIENT_SECRET=
```

---

### FASE 4: Scripts de Utilidad
**Tiempo estimado de implementación:** 30 minutos

#### 4.1 Crear Makefile
```makefile
.PHONY: help setup start stop restart logs clean reset

help:
	@echo "Comandos disponibles:"
	@echo "  make setup    - Configuración inicial (solo primera vez)"
	@echo "  make start    - Iniciar todos los servicios"
	@echo "  make stop     - Detener todos los servicios"
	@echo "  make restart  - Reiniciar todos los servicios"
	@echo "  make logs     - Ver logs en tiempo real"
	@echo "  make clean    - Limpiar contenedores y redes"
	@echo "  make reset    - Resetear todo (elimina volúmenes)"

setup:
	@echo "🚀 Configuración inicial..."
	@bash scripts/setup.sh

start:
	@echo "▶️  Iniciando servicios..."
	docker-compose up -d
	@echo "✅ Servicios iniciados:"
	@echo "   Frontend: http://localhost:3000"
	@echo "   Backend:  http://localhost:5000"
	@echo "   N8N:      http://localhost:5678"

stop:
	@echo "⏹️  Deteniendo servicios..."
	docker-compose down

restart:
	@echo "🔄 Reiniciando servicios..."
	docker-compose restart

logs:
	docker-compose logs -f

clean:
	@echo "🧹 Limpiando contenedores y redes..."
	docker-compose down --remove-orphans

reset:
	@echo "⚠️  ADVERTENCIA: Esto eliminará TODOS los datos de N8N"
	@read -p "¿Estás seguro? (s/N): " confirm && [ "$$confirm" = "s" ] || exit 1
	docker-compose down -v
	@echo "✅ Reset completo"
```

#### 4.2 Crear scripts/setup.sh
```bash
#!/bin/bash
# Script de configuración inicial

echo "🔧 Configuración Inicial del Sistema de Corrección Automática"
echo "=============================================================="

# 1. Verificar que Docker esté instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker no está instalado"
    echo "   Visita: https://docs.docker.com/get-docker/"
    exit 1
fi

# 2. Verificar que Docker Compose esté instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Error: Docker Compose no está instalado"
    echo "   Visita: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker y Docker Compose están instalados"

# 3. Crear archivo .env si no existe (ya viene pre-configurado)
if [ ! -f .env ]; then
    echo "📝 Creando archivo .env desde template..."
    cp .env.example .env
    echo "✅ Archivo .env creado con configuraciones por defecto"
    echo ""
    echo "ℹ️  La base de datos ya está configurada (compartida en la nube)"
    echo "ℹ️  Puedes modificar puertos en .env si hay conflictos"
else
    echo "✅ Archivo .env ya existe"
fi

# 4. Crear directorios necesarios
echo "📁 Creando directorios necesarios..."
mkdir -p n8n/init
mkdir -p n8n/workflows

# 5. Copiar workflows si no existen
if [ -d "n8n-workflows" ] && [ ! "$(ls -A n8n/workflows)" ]; then
    echo "📋 Copiando workflows de N8N..."
    cp n8n-workflows/*.json n8n/workflows/
    echo "✅ Workflows copiados"
fi

# 6. Construir imágenes
echo ""
echo "🏗️  Construyendo imágenes Docker (puede tardar unos minutos la primera vez)..."
docker-compose build

echo ""
echo "✅ ¡Configuración completada!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Para iniciar el sistema ejecuta:"
echo "   make start"
echo ""
echo "📱 Accede a los servicios en:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo "   N8N:      http://localhost:5678 (admin/admin123)"
echo ""
echo "⚠️  SIGUIENTE PASO: Configurar Google APIs en N8N"
echo "   Ver README-DOCKER.md para instrucciones"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
```

#### 4.3 Crear n8n/init/import-workflows.sh
```bash
#!/bin/sh
# Script para importar workflows automáticamente a N8N

echo "⏳ Esperando a que N8N esté listo..."
sleep 10

N8N_URL="http://n8n:5678"
N8N_USER="${N8N_USER:-admin}"
N8N_PASSWORD="${N8N_PASSWORD}"

echo "📥 Importando workflows desde /workflows..."

# Iterar sobre todos los archivos JSON en /workflows
for workflow_file in /workflows/*.json; do
    if [ -f "$workflow_file" ]; then
        filename=$(basename "$workflow_file")
        echo "  - Importando: $filename"

        # Importar usando la API de N8N
        curl -X POST \
            -u "$N8N_USER:$N8N_PASSWORD" \
            -H "Content-Type: application/json" \
            -d @"$workflow_file" \
            "$N8N_URL/api/v1/workflows" \
            --silent --output /dev/null

        if [ $? -eq 0 ]; then
            echo "    ✅ $filename importado"
        else
            echo "    ❌ Error importando $filename"
        fi
    fi
done

echo "✅ Importación de workflows completada"
```

---

### FASE 5: Documentación de Usuario
**Tiempo estimado de implementación:** 1 sesión

#### 5.1 Crear README-DOCKER.md
Guía paso a paso super simplificada:
1. **Pre-requisitos:** Instalar Docker Desktop (incluye Docker Compose)
2. **Clonar repositorio:** `git clone [url] && cd proyecto-correccion`
3. **Setup y ejecución:** `make setup && make start`
4. **Acceder a servicios:**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000
   - N8N: http://localhost:5678 (admin/admin123)
5. **Configurar Google APIs en N8N** (única configuración manual - 10 min)
6. **Usar el sistema:** Login con usuario demo
7. **Troubleshooting:** Comandos útiles para diagnosticar problemas

**Notas importantes:**
- Base de datos ya configurada (compartida en la nube)
- No se requiere configurar MongoDB Atlas
- Workflows de N8N importados automáticamente
- Variables de entorno pre-configuradas

#### 5.2 Actualizar README.md principal
- Agregar sección "Inicio Rápido con Docker"
- Link a README-DOCKER.md
- Badge de Docker

#### 5.3 Crear CONTRIBUTING.md
- Guía para desarrolladores
- Cómo levantar el entorno de desarrollo
- Cómo debuggear dentro de containers

---

### FASE 6: Optimizaciones y Mejoras
**Tiempo estimado de implementación:** 1 sesión (opcional)

#### 6.1 Agregar Nginx Reverse Proxy (Opcional)
Beneficios:
- Un solo puerto de entrada (ej: 80)
- Routing por path:
  - `/` → Frontend
  - `/api` → Backend
  - `/n8n` → N8N
- SSL/TLS fácil con Let's Encrypt
- Compresión gzip
- Caching de assets estáticos

#### 6.2 Crear docker-compose.dev.yml
- Configuración para desarrollo
- Hot reload habilitado
- Volúmenes para código fuente
- Ports expuestos para debugging

#### 6.3 Agregar Docker Healthchecks
- Healthchecks para cada servicio
- Reinicio automático en caso de fallo
- Logging estructurado

#### 6.4 Crear GitHub Actions (CI/CD)
- Build automático de imágenes
- Push a Docker Hub
- Tests automáticos

---

## Ventajas de Esta Solución

### Para el Usuario Final:
1. **Instalación ultra-simple en 3 comandos:**
   ```bash
   git clone [repo]
   make setup      # Solo primera vez
   make start      # ¡Listo!
   ```
2. **Sin configuración de base de datos:** Ya viene conectada a producción
3. **Sin instalar dependencias:** No requiere Node.js, npm, Python, etc.
4. **Cross-platform:** Funciona igual en Windows, Mac y Linux
5. **Actualización fácil:** `git pull && docker-compose up -d --build`
6. **Datos compartidos:** Todos trabajan con la misma base de datos

### Para el Desarrollador:
1. **Reproducibilidad:** Mismo entorno en todas las máquinas
2. **Aislamiento:** No contamina el sistema host con dependencias
3. **Reset rápido:** `make reset` vuelve al estado inicial
4. **Debugging simple:** `docker-compose logs -f [servicio]`
5. **Versionable:** docker-compose.yml está en git
6. **Hot reload en dev:** Opcional con docker-compose.dev.yml

### Para el Proyecto:
1. **Profesionalismo:** Demuestra buenas prácticas de DevOps
2. **Escalabilidad:** Fácil agregar servicios nuevos
3. **Documentación clara:** README + 5 videos enfocados
4. **Mantenibilidad:** Configuración centralizada en un solo lugar
5. **Portabilidad garantizada:** Docker elimina el "funciona en mi máquina"

---

## Consideraciones de Seguridad

### Variables de Entorno:
- **NUNCA** commitear archivo `.env` (está en .gitignore)
- `.env.example` contiene valores por defecto funcionales
- Para producción: cambiar JWT_SECRET y ENCRYPTION_KEY
- N8N_PASSWORD ya viene configurado (cambiar si se desea)

### Credenciales de Google APIs:
- No incluir en imagen Docker ni en .env
- Configurar manualmente en N8N después del primer inicio
- Cada usuario debe usar sus propias credenciales de Google
- Documentar proceso detalladamente en README y Video 3

### Base de Datos Compartida (MongoDB Atlas):
- URI ya configurada en .env.example (apunta a producción)
- Todos los usuarios locales comparten la misma base de datos
- NO exponer puerto de MongoDB localmente
- Credenciales ya incluidas en URI (solo lectura/escritura, no admin)
- Para producción: usar IP whitelisting en Atlas (0.0.0.0/0 para desarrollo)

---

## Troubleshooting Común

### Problema 1: Puertos ocupados
**Solución:** Cambiar puertos en .env
```env
BACKEND_PORT=5001
FRONTEND_PORT=3001
N8N_PORT=5679
```

### Problema 2: Workflows no importados
**Solución:** Importar manualmente o ejecutar:
```bash
docker exec correcion-n8n-init /bin/sh /scripts/import-workflows.sh
```

### Problema 3: Frontend no conecta con Backend
**Solución:** Verificar VITE_API_URL en .env y rebuild:
```bash
docker-compose up -d --build frontend
```

### Problema 4: N8N no guarda workflows
**Solución:** Verificar permisos del volumen:
```bash
docker volume inspect correcion-automatica_n8n_data
```

---

## Plan de Videos Tutoriales

### Video 1: Instalación de Docker (5-7 min)
**Contenido:**
- Instalar Docker Desktop (Windows/Mac) o Docker Engine (Linux)
- Verificar instalación: `docker --version` y `docker-compose --version`
- Instalar Git (si no lo tiene)
- Clonar repositorio: `git clone [url]`

**Puntos clave a mostrar:**
- Descarga oficial de Docker: https://docs.docker.com/get-docker/
- Comandos de verificación en terminal
- Clonar el repositorio

**Script de ejemplo:**
```bash
# Verificar Docker
docker --version
docker-compose --version

# Clonar repositorio
git clone https://github.com/usuario/proyecto-correccion.git
cd proyecto-correccion
```

---

### Video 2: Configuración y Primera Ejecución (8-10 min)
**Contenido:**
- Ejecutar setup: `make setup`
- Explicar que la base de datos ya está configurada (compartida)
- Iniciar servicios: `make start`
- Verificar que todo corre: `docker-compose ps`
- Acceder a servicios:
  - Frontend: http://localhost:3000
  - Backend: http://localhost:5000/health
  - N8N: http://localhost:5678 (admin/admin123)

**Puntos clave a mostrar:**
- Salida del script de setup
- Cómo verificar que los servicios estén corriendo
- Acceder a cada interfaz
- Workflows ya importados en N8N

**Script de ejemplo:**
```bash
# Setup inicial (solo primera vez)
make setup

# Iniciar sistema
make start

# Verificar que todo corre
docker-compose ps

# Ver logs si hay problemas
docker-compose logs -f
```

---

### Video 3: Configuración de Google APIs en N8N (10-12 min)
**Contenido:**
- Crear proyecto en Google Cloud Console
- Habilitar APIs necesarias:
  - Google Drive API
  - Google Sheets API
  - Google Gemini API
- Crear credenciales OAuth 2.0
- Configurar pantalla de consentimiento
- Pegar credenciales en N8N:
  - Ir a Credentials en N8N
  - Agregar Google OAuth2
  - Agregar Google API Key
- Activar workflows en N8N
- Probar un webhook simple

**Puntos clave a mostrar:**
- Google Cloud Console: https://console.cloud.google.com/
- Navegación por la interfaz
- Dónde copiar Client ID, Client Secret y API Key
- Cómo pegar en N8N y autenticar
- Activar workflows uno por uno
- Verificar que webhooks funcionan

---

### Video 4: Uso del Sistema - Flujo Completo de Corrección (12-15 min)
**Contenido:**
- Login en el sistema (usuarios de demo ya creados en la BD)
- Navegación por el dashboard
- Flujo de corrección completo:
  1. Ver universidades/facultades/carreras existentes (ya hay datos de demo)
  2. Navegar a una comisión
  3. Subir consigna en PDF
  4. Generar rúbrica con IA (mostrar resultado)
  5. Subir entrega de un alumno (archivo .zip)
  6. Ejecutar corrección automática
  7. Ver resultados y feedback detallado
  8. Ver nota actualizada en Google Sheets
- Explicar cada parte del feedback:
  - Nota final
  - Resumen por criterios
  - Fortalezas
  - Recomendaciones
- Mostrar corrección masiva (subir múltiples entregas)

**Puntos clave a mostrar:**
- Interfaz intuitiva del sistema
- Cada paso del proceso
- Resultados de la IA (reales)
- Integración con Google Sheets funcionando
- Navegación fluida

---

### Video 5: Comandos Útiles y Troubleshooting (5-7 min)
**Contenido:**
- Comandos básicos:
  - `make stop` - Detener servicios
  - `make restart` - Reiniciar servicios
  - `make logs` - Ver logs en tiempo real
  - `docker-compose logs -f backend` - Logs de un servicio específico
- Actualizar el sistema:
  - `git pull`
  - `docker-compose up -d --build`
- Problemas comunes:
  - Puerto ocupado → Cambiar en .env
  - Container no inicia → Ver logs
  - Frontend no conecta → Verificar VITE_API_URL
- Cómo resetear todo: `make reset`

**Puntos clave a mostrar:**
- Cada comando en acción
- Cómo diagnosticar problemas con logs
- Soluciones rápidas a errores comunes

**Script de ejemplo:**
```bash
# Ver estado de servicios
docker-compose ps

# Ver logs de todos los servicios
make logs

# Ver logs de un servicio específico
docker-compose logs -f backend

# Detener todo
make stop

# Reiniciar
make restart

# Actualizar código
git pull
docker-compose up -d --build
```

---

## Checklist de Implementación

### Pre-implementación
- [ ] Backup del código actual
- [ ] Documentar dependencias actuales
- [ ] Listar todas las variables de entorno

### Implementación
- [ ] Crear Dockerfile para backend
- [ ] Crear Dockerfile para frontend
- [ ] Crear docker-compose.yml
- [ ] Crear .env.example
- [ ] Crear scripts de utilidad (setup.sh, etc.)
- [ ] Crear script de importación de N8N
- [ ] Crear Makefile
- [ ] Crear .dockerignore para backend y frontend

### Documentación
- [ ] Crear README-DOCKER.md
- [ ] Actualizar README.md principal
- [ ] Crear CONTRIBUTING.md
- [ ] Documentar troubleshooting común

### Testing
- [ ] Probar instalación fresh en Windows
- [ ] Probar instalación fresh en Mac
- [ ] Probar instalación fresh en Linux
- [ ] Verificar todos los workflows de N8N funcionen
- [ ] Verificar conexión con base de datos compartida (MongoDB Atlas en producción)
- [ ] Verificar integración con Google APIs
- [ ] Crear datos de demo en la base de datos (usuarios, universidades, etc.)

### Videos (Solo lo Esencial)
- [ ] Grabar Video 1: Instalación de Docker (5-7 min)
- [ ] Grabar Video 2: Configuración y Primera Ejecución (8-10 min)
- [ ] Grabar Video 3: Configuración de Google APIs en N8N (10-12 min)
- [ ] Grabar Video 4: Uso del Sistema - Flujo Completo de Corrección (12-15 min)
- [ ] Grabar Video 5: Comandos Útiles y Troubleshooting (5-7 min)

---

## Estimación de Tiempos

| Fase | Tiempo Estimado |
|------|----------------|
| Fase 1: Dockerfiles | 2-3 horas |
| Fase 2: Configuración N8N | 3-4 horas |
| Fase 3: Docker Compose | 2-3 horas |
| Fase 4: Scripts | 1-2 horas |
| Fase 5: Documentación | 2-3 horas |
| Fase 6: Optimizaciones (opcional) | 4-6 horas |
| **Testing** | 2-3 horas |
| **Datos de Demo en BD** | 1-2 horas |
| **Videos (5 videos esenciales)** | 4-6 horas |
| **TOTAL** | **13-20 horas** (sin videos)<br>**17-26 horas** (con videos) |

---

## Próximos Pasos Recomendados

1. **Revisar este plan** y confirmar que cubre todas tus necesidades
2. **Priorizar fases**: Implementar Fases 1-5 primero, Fase 6 es opcional
3. **Preparar base de datos compartida**:
   - Asegurar que MongoDB Atlas esté desplegado
   - Crear datos de demo (usuarios, universidades, facultades, etc.)
   - Obtener URI de conexión para poner en .env.example
4. **Definir timeline**: ¿Cuánto tiempo puedes dedicar por día/semana?
5. **Preparar ambiente de testing**: Máquinas virtuales o diferentes sistemas operativos

---

## Conclusión

Esta solución con Docker Compose es la más equilibrada entre:
- **Facilidad de uso** para el usuario final
- **Mantenibilidad** para el desarrollador
- **Portabilidad** entre sistemas operativos
- **Profesionalismo** del proyecto

### Ventajas Clave de Este Approach:

1. **Base de datos compartida**: Todos usan la misma BD en producción
   - No necesitan configurar MongoDB localmente
   - Datos consistentes entre todos los usuarios
   - Menos pasos de configuración

2. **Configuración mínima**:
   - `.env` viene pre-configurado
   - Solo necesitan configurar Google APIs en N8N
   - Workflows importados automáticamente

3. **Experiencia del usuario final**:
   - 3 comandos: `git clone`, `make setup`, `make start`
   - Funciona en menos de 10 minutos
   - Solo 1 paso manual: Google APIs

4. **Videos ultra-focalizados**:
   - Solo 5 videos esenciales (40-51 min total)
   - Sin videos innecesarios
   - Foco en ejecutar y usar el sistema

Con este plan, cualquier persona podrá levantar tu proyecto en **menos de 15 minutos** (solo necesitan configurar Google APIs en N8N).

Los 5 videos tutoriales asegurarán que incluso usuarios sin experiencia previa con Docker puedan ejecutar el proyecto exitosamente.
