# Scripts de Utilidad

Este directorio contiene scripts para facilitar la gestión del sistema.

---

## Scripts Disponibles

### 🚀 `setup.sh` - Configuración Inicial

Script principal para configurar el sistema por primera vez.

**Uso:**
```bash
bash scripts/setup.sh
# O usando Makefile:
make setup
```

**Qué hace:**
1. ✅ Verifica que Docker y Docker Compose estén instalados
2. ✅ Verifica que Docker esté corriendo
3. ✅ Crea archivo `.env` desde `.env.example`
4. ✅ Verifica estructura de directorios
5. ✅ Construye imágenes Docker
6. ✅ Verifica puertos disponibles
7. ✅ Muestra resumen e instrucciones

**Cuándo usar:**
- Primera vez que clonas el repositorio
- Después de cambios importantes en la configuración
- Cuando quieres resetear la configuración inicial

---

### 🔍 `check-env.sh` - Verificar Variables de Entorno

Verifica que todas las variables de entorno estén correctamente configuradas.

**Uso:**
```bash
bash scripts/check-env.sh
```

**Qué verifica:**
- ✅ Existencia de archivo `.env`
- ✅ Variables requeridas (MONGODB_URI, JWT_SECRET, ENCRYPTION_KEY)
- ✅ Variables opcionales
- ✅ Formato de MONGODB_URI
- ✅ Longitud de JWT_SECRET (mínimo 32 caracteres)
- ✅ Longitud de ENCRYPTION_KEY (exactamente 64 caracteres)

**Cuándo usar:**
- Antes de iniciar el sistema
- Después de editar `.env`
- Cuando hay errores de configuración

**Ejemplo de output:**
```
============================================
  Verificación de Variables de Entorno
============================================

📋 Variables Requeridas:

  ✅ MONGODB_URI - Configurada (mongodb+...)
  ✅ JWT_SECRET - Configurada (correcion...)
  ✅ ENCRYPTION_KEY - Configurada (0123456789...)

📋 Variables Opcionales:

  ✅ BACKEND_PORT - 5000
  ✅ FRONTEND_PORT - 3000
  ✅ N8N_PORT - 5678
  ✅ N8N_BASIC_AUTH_USER - admin
  ✅ N8N_BASIC_AUTH_PASSWORD - (***)

✅ Todas las variables requeridas están configuradas
```

---

### 🩺 `troubleshoot.sh` - Diagnóstico de Problemas

Ejecuta un diagnóstico completo del sistema para identificar problemas.

**Uso:**
```bash
bash scripts/troubleshoot.sh
```

**Qué verifica:**
1. ✅ Docker instalado y corriendo
2. ✅ Estado de contenedores
3. ✅ Conectividad de servicios (Frontend, Backend, N8N)
4. ✅ Health checks de contenedores
5. ✅ Red Docker (correcion-network)
6. ✅ Volúmenes Docker
7. ✅ Variables de entorno
8. ✅ Últimos errores en logs

**Cuándo usar:**
- Cuando algo no funciona
- Servicios no responden
- Errores de conectividad
- Antes de reportar un problema

**Ejemplo de output:**
```
============================================
  Diagnóstico del Sistema
============================================

1️⃣  Verificando Docker...

✅ Docker: Docker version 24.0.0
✅ Docker está corriendo

2️⃣  Estado de los Contenedores:

NAME                  STATUS    PORTS
correcion-backend     Up        0.0.0.0:5000->80/tcp
correcion-frontend    Up        0.0.0.0:3000->80/tcp
correcion-n8n         Up        0.0.0.0:5678->5678/tcp

3️⃣  Verificando conectividad de servicios...

Frontend (http://localhost:3000):
✅ Responde correctamente

Backend (http://localhost:5000):
✅ Responde correctamente

N8N (http://localhost:5678):
✅ Responde correctamente

4️⃣  Health Checks de contenedores:

✅ correcion-backend: Healthy
✅ correcion-frontend: Healthy
✅ correcion-n8n: Healthy

...
```

---

## Makefile - Comandos Simples

El `Makefile` en la raíz del proyecto proporciona comandos simples que internamente usan estos scripts.

**Comandos principales:**
```bash
make setup      # Ejecuta setup.sh
make start      # Inicia servicios
make stop       # Detiene servicios
make restart    # Reinicia servicios
make logs-f     # Ver logs en tiempo real
make status     # Estado de servicios
make health     # Health checks
make help       # Ver todos los comandos
```

---

## Flujo de Trabajo Recomendado

### Primera vez
```bash
# 1. Clonar repositorio
git clone [url]
cd proyecto-correccion

# 2. Setup inicial
make setup

# 3. Editar .env (solo MONGODB_URI es obligatorio)
nano .env

# 4. Verificar configuración
bash scripts/check-env.sh

# 5. Iniciar sistema
make start

# 6. Verificar que todo funciona
make status
make health
```

### Uso diario
```bash
# Iniciar
make start

# Ver logs
make logs-f

# Detener
make stop
```

### Cuando hay problemas
```bash
# Diagnóstico completo
bash scripts/troubleshoot.sh

# Ver logs de un servicio específico
make logs-backend
make logs-frontend
make logs-n8n

# Reiniciar servicios
make restart

# Reset completo (elimina datos locales)
make reset
```

### Actualizar desde git
```bash
git pull
make update  # Reconstruye y reinicia
```

---

## Crear tus Propios Scripts

Puedes agregar scripts personalizados en este directorio.

**Template básico:**
```bash
#!/bin/bash
# Descripción del script

set -e  # Exit on error

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Tu script aquí${NC}"

# Tu lógica...
```

**Hacerlo ejecutable:**
```bash
chmod +x scripts/tu-script.sh
```

**Agregarlo al Makefile (opcional):**
```makefile
tu-comando:
	@bash scripts/tu-script.sh
```

---

## Troubleshooting de Scripts

### Script no ejecuta (Permission denied)
```bash
# Hacer ejecutable
chmod +x scripts/nombre-script.sh
```

### Error "command not found"
```bash
# Ejecutar con bash explícitamente
bash scripts/nombre-script.sh
```

### Variables de entorno no se cargan
```bash
# Verificar que .env existe
ls -la .env

# Verificar contenido
cat .env

# Cargar manualmente
source .env
```

---

## Soporte

- **Documentación general:** `README.md` en raíz
- **Networking:** `NETWORKING.md`
- **N8N:** `n8n/README-PRECONFIGURACION.md`
- **Troubleshooting:** Ejecuta `bash scripts/troubleshoot.sh`
