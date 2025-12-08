#!/bin/bash
# ============================================
# Script de Configuración Inicial
# Sistema de Corrección Automática
# ============================================

set -e  # Exit on error

# Colores
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  Sistema de Corrección Automática${NC}"
echo -e "${CYAN}  Configuración Inicial${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""

# ============================================
# 1. Verificar Docker
# ============================================
echo -e "${YELLOW}📋 Verificando requisitos...${NC}"
echo ""

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Error: Docker no está instalado${NC}"
    echo -e "${YELLOW}   Instala Docker Desktop desde: https://docs.docker.com/get-docker/${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker instalado:${NC} $(docker --version)"

# Verificar Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker Compose no está instalado${NC}"
    echo -e "${YELLOW}   Instala Docker Compose desde: https://docs.docker.com/compose/install/${NC}"
    exit 1
fi

# Detectar versión de docker-compose
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
    echo -e "${GREEN}✅ Docker Compose instalado:${NC} $(docker-compose --version)"
else
    COMPOSE_CMD="docker compose"
    echo -e "${GREEN}✅ Docker Compose instalado:${NC} $(docker compose version)"
fi

# Verificar que Docker está corriendo
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Error: Docker no está corriendo${NC}"
    echo -e "${YELLOW}   Inicia Docker Desktop o el servicio de Docker${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker está corriendo${NC}"

echo ""

# ============================================
# 2. Crear archivo .env
# ============================================
echo -e "${YELLOW}📝 Configurando variables de entorno...${NC}"
echo ""

if [ ! -f .env ]; then
    echo -e "${CYAN}Creando archivo .env desde template...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ Archivo .env creado${NC}"
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}⚠️  IMPORTANTE: Configuración necesaria${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${CYAN}Debes actualizar las siguientes variables en .env:${NC}"
    echo ""
    echo -e "  1. ${YELLOW}MONGODB_URI${NC}"
    echo -e "     URI de tu base de datos MongoDB Atlas"
    echo -e "     Ejemplo: mongodb+srv://usuario:pass@cluster.mongodb.net/db"
    echo ""
    echo -e "  2. ${YELLOW}JWT_SECRET${NC} (opcional, tiene valor por defecto)"
    echo -e "     Clave secreta para JWT"
    echo ""
    echo -e "  3. ${YELLOW}N8N_BASIC_AUTH_PASSWORD${NC} (opcional, tiene valor por defecto)"
    echo -e "     Contraseña para acceder a N8N"
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    # Preguntar si quiere editar ahora
    read -p "¿Deseas editar el archivo .env ahora? (s/N): " EDIT_CONFIRM
    if [ "$EDIT_CONFIRM" = "s" ] || [ "$EDIT_CONFIRM" = "S" ]; then
        # Detectar editor disponible
        if command -v nano &> /dev/null; then
            nano .env
        elif command -v vim &> /dev/null; then
            vim .env
        elif command -v vi &> /dev/null; then
            vi .env
        else
            echo -e "${YELLOW}No se encontró editor de texto. Edita .env manualmente.${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Recuerda editar .env antes de iniciar el sistema${NC}"
        echo -e "${CYAN}   Edita con: nano .env${NC}"
    fi
else
    echo -e "${GREEN}✅ Archivo .env ya existe${NC}"
fi

echo ""

# ============================================
# 3. Verificar estructura de directorios
# ============================================
echo -e "${YELLOW}📁 Verificando estructura de directorios...${NC}"
echo ""

# Verificar directorios principales
REQUIRED_DIRS=("backend" "frontend-correccion-automatica-n8n" "n8n" "n8n/workflows")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ ! -d "$dir" ]; then
        echo -e "${RED}❌ Error: Directorio '$dir' no encontrado${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✅ Estructura de directorios correcta${NC}"

# Verificar workflows de N8N
WORKFLOW_COUNT=$(ls -1 n8n/workflows/*.json 2>/dev/null | wc -l)
if [ "$WORKFLOW_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  No se encontraron workflows en n8n/workflows/${NC}"
else
    echo -e "${GREEN}✅ $WORKFLOW_COUNT workflows encontrados en n8n/workflows/${NC}"
fi

echo ""

# ============================================
# 4. Construir imágenes Docker
# ============================================
echo -e "${YELLOW}🏗️  Construyendo imágenes Docker...${NC}"
echo -e "${CYAN}   (Esto puede tardar varios minutos la primera vez)${NC}"
echo ""

$COMPOSE_CMD build

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Imágenes construidas exitosamente${NC}"
else
    echo ""
    echo -e "${RED}❌ Error al construir imágenes${NC}"
    exit 1
fi

echo ""

# ============================================
# 5. Verificar puertos disponibles
# ============================================
echo -e "${YELLOW}🔍 Verificando puertos disponibles...${NC}"
echo ""

# Cargar puertos desde .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | grep -v '^$' | xargs)
fi

BACKEND_PORT=${BACKEND_PORT:-5000}
FRONTEND_PORT=${FRONTEND_PORT:-3000}
N8N_PORT=${N8N_PORT:-5678}

check_port() {
    local port=$1
    local service=$2

    if command -v netstat &> /dev/null; then
        # Windows/Linux con netstat
        if netstat -an | grep -q ":$port.*LISTEN"; then
            echo -e "${YELLOW}⚠️  Puerto $port ($service) está en uso${NC}"
            echo -e "${CYAN}   Cambia ${service}_PORT en .env o detén el proceso${NC}"
            return 1
        fi
    elif command -v lsof &> /dev/null; then
        # Mac/Linux con lsof
        if lsof -i :$port &> /dev/null; then
            echo -e "${YELLOW}⚠️  Puerto $port ($service) está en uso${NC}"
            echo -e "${CYAN}   Cambia ${service}_PORT en .env o detén el proceso${NC}"
            return 1
        fi
    else
        # No hay herramienta disponible, skip check
        echo -e "${CYAN}ℹ️  No se puede verificar puerto $port (no hay netstat/lsof)${NC}"
        return 0
    fi

    echo -e "${GREEN}✅ Puerto $port ($service) disponible${NC}"
    return 0
}

PORTS_OK=true
check_port $BACKEND_PORT "Backend" || PORTS_OK=false
check_port $FRONTEND_PORT "Frontend" || PORTS_OK=false
check_port $N8N_PORT "N8N" || PORTS_OK=false

if [ "$PORTS_OK" = false ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Algunos puertos están ocupados${NC}"
    echo -e "${CYAN}   Puedes cambiarlos en .env antes de iniciar${NC}"
    echo ""
fi

echo ""

# ============================================
# 6. Resumen Final
# ============================================
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Configuración completada exitosamente${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${CYAN}📋 Próximos pasos:${NC}"
echo ""
echo -e "  1. ${YELLOW}Verifica tu archivo .env${NC}"
echo -e "     ${CYAN}nano .env${NC}"
echo -e "     Asegúrate que MONGODB_URI esté configurado"
echo ""
echo -e "  2. ${YELLOW}Inicia el sistema${NC}"
echo -e "     ${CYAN}make start${NC}"
echo ""
echo -e "  3. ${YELLOW}Accede a los servicios${NC}"
echo -e "     Frontend:  ${CYAN}http://localhost:$FRONTEND_PORT${NC}"
echo -e "     Backend:   ${CYAN}http://localhost:$BACKEND_PORT${NC}"
echo -e "     N8N:       ${CYAN}http://localhost:$N8N_PORT${NC}"
echo ""
echo -e "  4. ${YELLOW}Configura Google APIs en N8N (solo primera vez)${NC}"
echo -e "     Ver: ${CYAN}n8n/README-PRECONFIGURACION.md${NC}"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}Comandos útiles:${NC}"
echo ""
echo -e "  ${CYAN}make start${NC}       - Iniciar servicios"
echo -e "  ${CYAN}make stop${NC}        - Detener servicios"
echo -e "  ${CYAN}make logs-f${NC}      - Ver logs en tiempo real"
echo -e "  ${CYAN}make status${NC}      - Ver estado de servicios"
echo -e "  ${CYAN}make help${NC}        - Ver todos los comandos disponibles"
echo ""
echo -e "${GREEN}¡Listo para usar! 🚀${NC}"
echo ""
