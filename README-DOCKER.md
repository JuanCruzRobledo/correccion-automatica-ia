# Guía de Instalación con Docker

Esta guía te ayudará a ejecutar el Sistema de Corrección Automática usando Docker en **menos de 15 minutos**.

---

## 📋 Requisitos Previos

### Obligatorio
- **Docker Desktop** instalado y corriendo
  - Windows/Mac: [Descargar Docker Desktop](https://docs.docker.com/get-docker/)
  - Linux: [Instalar Docker Engine](https://docs.docker.com/engine/install/)
- **Git** instalado

### Verificar instalación
```bash
docker --version
docker-compose --version
git --version
```

---

## 🚀 Instalación Rápida (3 Pasos)

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/proyecto-correccion.git
cd proyecto-correccion
```

### 2. Configuración Inicial

```bash
make setup
```

Este comando:
- ✅ Verifica que Docker esté instalado y corriendo
- ✅ Crea archivo `.env` con configuración por defecto
- ✅ Construye las imágenes Docker (tarda 5-10 min la primera vez)
- ✅ Verifica puertos disponibles

**⚠️ Importante:** Al final del setup, edita `.env` y actualiza:
```env
MONGODB_URI=mongodb+srv://tu-usuario:tu-password@cluster.mongodb.net/correcion-automatica
```

### 3. Iniciar el Sistema

```bash
make start
```

**¡Listo!** Accede a:
- 🖥️ **Frontend:** http://localhost:3000
- ⚙️ **Backend:** http://localhost:5000
- 🔄 **N8N:** http://localhost:5678 (admin/admin123)

---

## 📝 Configuración Detallada

### Archivo `.env`

El archivo `.env` ya viene con valores por defecto funcionales. **Solo necesitas cambiar:**

#### 1. MONGODB_URI (Obligatorio)
```env
# Reemplaza con tu URI de MongoDB Atlas
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/correcion-automatica?retryWrites=true&w=majority
```

**Nota:** La base de datos está en la nube y es compartida entre todos los usuarios locales.

#### 2. Puertos (Opcional - solo si hay conflictos)
```env
BACKEND_PORT=5000
FRONTEND_PORT=3000
N8N_PORT=5678
```

#### 3. Seguridad (Opcional - recomendado para producción)
```env
# Generar con: openssl rand -hex 32
JWT_SECRET=tu-secreto-personalizado-aqui

# Generar con: openssl rand -hex 32
ENCRYPTION_KEY=tu-clave-de-encriptacion-aqui

# Cambiar password de N8N
N8N_BASIC_AUTH_PASSWORD=tu-password-seguro
```

### Verificar Configuración

```bash
make check-env
```

Este comando verifica que todas las variables estén correctamente configuradas.

---

## 🎯 Uso del Sistema

### Comandos Básicos

```bash
# Iniciar servicios
make start

# Ver estado
make status

# Ver logs en tiempo real
make logs-f

# Detener servicios
make stop

# Reiniciar servicios
make restart

# Ver todos los comandos
make help
```

### Acceder a los Servicios

#### Frontend (http://localhost:3000)
Interfaz principal del sistema de corrección.

**Usuarios de demo:** (Si la base de datos ya tiene datos)
- Super Admin: Gestiona todo el sistema

#### Backend (http://localhost:5000)
API REST del sistema.

**Endpoints útiles:**
- `GET /health` - Health check
- `GET /api/...` - Endpoints de la API

#### N8N (http://localhost:5678)
Sistema de automatización de workflows.

**Credenciales por defecto:**
- Usuario: `admin`
- Password: `admin123`

---

## 🔧 Configuración de Google APIs en N8N

**⚠️ Nota:** Si estás usando la imagen preconfigurada de N8N, **salta esta sección** (ya está todo configurado).

Si usas la imagen oficial de N8N, necesitas configurar las Google APIs manualmente:

### 1. Crear Proyecto en Google Cloud

1. Ve a https://console.cloud.google.com/
2. Crea un nuevo proyecto
3. Habilita las APIs necesarias:
   - Google Drive API
   - Google Sheets API
   - Google Gemini API

### 2. Crear Service Account (Recomendado)

1. En Google Cloud Console → IAM → Service Accounts
2. Crear Service Account
3. Descargar archivo JSON de credenciales
4. En N8N (http://localhost:5678):
   - Ir a **Credentials** → **New**
   - Seleccionar **Google Service Account**
   - Pegar contenido del JSON
   - Guardar como "Google Service Account"

### 3. Importar Workflows (Solo si usas imagen oficial)

Los workflows están en `n8n/workflows/`. Para importarlos:

1. En N8N, ve a **Workflows**
2. Click **Import from File**
3. Importa cada archivo `.json` de `n8n/workflows/`
4. Activa cada workflow (toggle en esquina superior derecha)

**Workflows disponibles:**
- `correcion-automatica.json`
- `flujo_correccion_manual.json`
- `flujo_correccion_masiva.json`
- `create-university-folder.json`
- Y 10 workflows más...

**Documentación completa:** Ver `n8n/README-PRECONFIGURACION.md`

---

## 📊 Verificar que Todo Funciona

### 1. Estado de Servicios
```bash
make status
```

**Output esperado:**
```
NAME                 STATUS    PORTS
correcion-backend    Up        0.0.0.0:5000->80/tcp
correcion-frontend   Up        0.0.0.0:3000->80/tcp
correcion-n8n        Up        0.0.0.0:5678->5678/tcp
```

### 2. Health Checks
```bash
make health
```

**Output esperado:**
```
Backend:
  Status: 200

Frontend:
  Status: 200

N8N:
  Status: 200
```

### 3. Conectividad
```bash
make test
```

Prueba la comunicación entre servicios.

---

## 🐛 Troubleshooting

### Diagnóstico Automático

```bash
make troubleshoot
```

Este comando ejecuta un diagnóstico completo del sistema.

### Problemas Comunes

#### 1. Puerto Ocupado

**Síntoma:**
```
Error: Bind for 0.0.0.0:5000 failed: port is already allocated
```

**Solución:**
Cambia los puertos en `.env`:
```env
BACKEND_PORT=5001
FRONTEND_PORT=3001
N8N_PORT=5679
```

Luego:
```bash
make stop
make start
```

#### 2. Servicio No Responde

**Síntoma:**
- El navegador no carga http://localhost:3000
- Health checks fallan

**Solución:**
```bash
# Ver logs del servicio
make logs-frontend
make logs-backend
make logs-n8n

# Reiniciar servicio
make restart-frontend
make restart-backend
make restart-n8n
```

#### 3. Error de Conexión a MongoDB

**Síntoma:**
```
MongoNetworkError: failed to connect to server
```

**Solución:**
- Verifica que `MONGODB_URI` en `.env` sea correcta
- Verifica que tu IP esté whitelisted en MongoDB Atlas
- Prueba la conexión con MongoDB Compass

```bash
# Verificar variable
make check-env

# Ver logs del backend
make logs-backend
```

#### 4. Docker No Está Corriendo

**Síntoma:**
```
Cannot connect to the Docker daemon
```

**Solución:**
- Windows/Mac: Inicia Docker Desktop
- Linux: `sudo systemctl start docker`

#### 5. Imagen No Se Construye

**Síntoma:**
```
ERROR [internal] load metadata for docker.io/library/node:20-alpine
```

**Solución:**
```bash
# Limpiar caché de Docker
docker system prune -a

# Reconstruir sin caché
make rebuild
```

### Ver Logs Detallados

```bash
# Logs de todos los servicios
make logs-f

# Logs de un servicio específico
make logs-backend
make logs-frontend
make logs-n8n

# Últimas 100 líneas
make logs
```

### Acceder a Shell de un Container

```bash
# Backend
make shell-backend

# Frontend
make shell-frontend

# N8N
make shell-n8n
```

---

## 🔄 Actualizar el Sistema

### Desde Git

```bash
# Método 1: Comando automático
make update

# Método 2: Manual
git pull
make rebuild
make restart
```

### Reconstruir Imágenes

```bash
# Con caché (rápido)
make build

# Sin caché (limpio)
make rebuild
```

---

## 🧹 Mantenimiento

### Limpiar Contenedores y Redes

```bash
make clean
```

Detiene y elimina contenedores y redes, pero **mantiene volúmenes** (datos de N8N).

### Reset Completo

```bash
make reset
```

⚠️ **Advertencia:** Esto elimina **TODOS los datos locales** de N8N (workflows y credenciales configuradas localmente).

**Nota:** Si usas imagen preconfigurada de N8N, los workflows volverán al estado inicial.

---

## 📚 Comandos de Referencia Rápida

| Comando | Descripción |
|---------|-------------|
| `make setup` | Configuración inicial |
| `make start` | Iniciar servicios |
| `make stop` | Detener servicios |
| `make restart` | Reiniciar servicios |
| `make status` | Ver estado |
| `make logs-f` | Logs en tiempo real |
| `make health` | Health checks |
| `make check-env` | Verificar variables |
| `make troubleshoot` | Diagnóstico completo |
| `make clean` | Limpiar contenedores |
| `make reset` | Reset completo |
| `make help` | Ver todos los comandos |

---

## 🔐 Seguridad

### Variables Sensibles

**NO commitear** el archivo `.env` al repositorio. Está en `.gitignore` por defecto.

### Cambiar Credenciales en Producción

```env
# Generar claves seguras
JWT_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)
N8N_BASIC_AUTH_PASSWORD=tu-password-super-seguro
```

### Base de Datos

- La base de datos está en MongoDB Atlas (en la nube)
- Es compartida entre todos los usuarios locales
- Asegúrate de tener permisos adecuados
- Usa IP whitelisting en MongoDB Atlas

---

## 🌐 Acceso desde Otra Máquina en la Red Local

Para acceder desde otra computadora en la misma red:

1. **Encuentra tu IP local:**
   ```bash
   # Windows
   ipconfig

   # Linux/Mac
   ifconfig
   ```

2. **Accede desde otra máquina:**
   - Frontend: `http://192.168.X.X:3000`
   - Backend: `http://192.168.X.X:5000`
   - N8N: `http://192.168.X.X:5678`

3. **Actualiza CORS en `.env`:**
   ```env
   CORS_ORIGIN=http://192.168.X.X:3000
   ```

4. **Reinicia:**
   ```bash
   make restart
   ```

---

## 📖 Documentación Adicional

- **`NETWORKING.md`** - Troubleshooting de red y comunicación entre servicios
- **`n8n/README-PRECONFIGURACION.md`** - Configuración detallada de N8N
- **`scripts/README.md`** - Documentación de scripts de utilidad
- **`CONTRIBUTING.md`** - Guía para desarrolladores

---

## ❓ Soporte

### Verificar el Sistema

```bash
# Diagnóstico completo
make troubleshoot

# Verificar configuración
make check-env

# Ver estado
make status

# Ver logs
make logs-f
```

### Recursos

- **Documentación de Docker:** https://docs.docker.com/
- **Documentación de N8N:** https://docs.n8n.io/
- **MongoDB Atlas:** https://www.mongodb.com/docs/atlas/

---

## ✅ Checklist de Instalación

- [ ] Docker Desktop instalado y corriendo
- [ ] Repositorio clonado
- [ ] `make setup` ejecutado exitosamente
- [ ] `.env` configurado (MONGODB_URI actualizado)
- [ ] `make start` ejecutado
- [ ] Frontend accesible en http://localhost:3000
- [ ] Backend accesible en http://localhost:5000/health
- [ ] N8N accesible en http://localhost:5678
- [ ] Google APIs configuradas en N8N (si aplica)
- [ ] Workflows importados y activos en N8N (si aplica)
- [ ] Sistema probado con flujo de corrección

---

**¡Listo!** Tu sistema de corrección automática está funcionando.

Para usar el sistema, consulta el `README.md` principal para más detalles sobre funcionalidades.
