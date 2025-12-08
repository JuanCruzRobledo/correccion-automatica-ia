#!/bin/bash
# ============================================
# Troubleshooting - Diagnóstico de Problemas
# ============================================

# Colores
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  Diagnóstico del Sistema${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""

# Detectar comando de docker-compose
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    COMPOSE_CMD="docker compose"
fi

# ============================================
# 1. Verificar Docker
# ============================================
echo -e "${YELLOW}1️⃣  Verificando Docker...${NC}"
echo ""

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker no está instalado${NC}"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker no está corriendo${NC}"
    echo -e "${YELLOW}   Inicia Docker Desktop${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker:${NC} $(docker --version)"
echo -e "${GREEN}✅ Docker está corriendo${NC}"
echo ""

# ============================================
# 2. Verificar Contenedores
# ============================================
echo -e "${YELLOW}2️⃣  Estado de los Contenedores:${NC}"
echo ""

$COMPOSE_CMD ps

echo ""

# ============================================
# 3. Verificar Conectividad
# ============================================
echo -e "${YELLOW}3️⃣  Verificando conectividad de servicios...${NC}"
echo ""

# Frontend
echo -e "${CYAN}Frontend (http://localhost:3000):${NC}"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✅ Responde correctamente${NC}"
else
    echo -e "${RED}❌ No responde${NC}"
    echo -e "${YELLOW}   Ver logs: make logs-frontend${NC}"
fi
echo ""

# Backend
echo -e "${CYAN}Backend (http://localhost:5000):${NC}"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health | grep -q "200"; then
    echo -e "${GREEN}✅ Responde correctamente${NC}"
else
    echo -e "${RED}❌ No responde${NC}"
    echo -e "${YELLOW}   Ver logs: make logs-backend${NC}"
fi
echo ""

# N8N
echo -e "${CYAN}N8N (http://localhost:5678):${NC}"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5678/healthz | grep -q "200"; then
    echo -e "${GREEN}✅ Responde correctamente${NC}"
else
    echo -e "${RED}❌ No responde${NC}"
    echo -e "${YELLOW}   Ver logs: make logs-n8n${NC}"
fi
echo ""

# ============================================
# 4. Verificar Health Checks
# ============================================
echo -e "${YELLOW}4️⃣  Health Checks de contenedores:${NC}"
echo ""

check_health() {
    local container=$1
    local status=$(docker inspect --format='{{.State.Health.Status}}' $container 2>/dev/null)

    if [ -z "$status" ]; then
        echo -e "${YELLOW}⚠️  $container: Sin health check configurado${NC}"
    elif [ "$status" = "healthy" ]; then
        echo -e "${GREEN}✅ $container: Healthy${NC}"
    elif [ "$status" = "unhealthy" ]; then
        echo -e "${RED}❌ $container: Unhealthy${NC}"
        echo -e "${YELLOW}   Ver logs: docker logs $container${NC}"
    elif [ "$status" = "starting" ]; then
        echo -e "${CYAN}⏳ $container: Iniciando...${NC}"
    else
        echo -e "${YELLOW}⚠️  $container: $status${NC}"
    fi
}

check_health "correcion-backend"
check_health "correcion-frontend"
check_health "correcion-n8n"

echo ""

# ============================================
# 5. Verificar Red Docker
# ============================================
echo -e "${YELLOW}5️⃣  Verificando red Docker...${NC}"
echo ""

if docker network inspect correcion-network &> /dev/null; then
    echo -e "${GREEN}✅ Red correcion-network existe${NC}"

    # Verificar contenedores en la red
    CONTAINERS_IN_NETWORK=$(docker network inspect correcion-network -f '{{range .Containers}}{{.Name}} {{end}}')
    if [ -z "$CONTAINERS_IN_NETWORK" ]; then
        echo -e "${YELLOW}⚠️  No hay contenedores en la red${NC}"
    else
        echo -e "${GREEN}✅ Contenedores en la red:${NC} $CONTAINERS_IN_NETWORK"
    fi
else
    echo -e "${RED}❌ Red correcion-network no existe${NC}"
    echo -e "${YELLOW}   Ejecuta: make start${NC}"
fi

echo ""

# ============================================
# 6. Verificar Volúmenes
# ============================================
echo -e "${YELLOW}6️⃣  Verificando volúmenes...${NC}"
echo ""

if docker volume inspect correcion_n8n_data &> /dev/null; then
    echo -e "${GREEN}✅ Volumen correcion_n8n_data existe${NC}"
    SIZE=$(docker volume inspect correcion_n8n_data -f '{{.Mountpoint}}' | xargs du -sh 2>/dev/null | cut -f1 || echo "?")
    echo -e "${CYAN}   Tamaño: $SIZE${NC}"
else
    echo -e "${YELLOW}⚠️  Volumen correcion_n8n_data no existe (se creará al iniciar)${NC}"
fi

echo ""

# ============================================
# 7. Verificar Variables de Entorno
# ============================================
echo -e "${YELLOW}7️⃣  Verificando variables de entorno...${NC}"
echo ""

if [ -f .env ]; then
    echo -e "${GREEN}✅ Archivo .env existe${NC}"

    # Verificar variables críticas
    export $(grep -v '^#' .env | grep -v '^$' | xargs 2>/dev/null)

    if [ -z "$MONGODB_URI" ]; then
        echo -e "${RED}❌ MONGODB_URI no configurada${NC}"
    else
        echo -e "${GREEN}✅ MONGODB_URI configurada${NC}"
    fi

    if [ -z "$JWT_SECRET" ]; then
        echo -e "${YELLOW}⚠️  JWT_SECRET no configurada (usará default)${NC}"
    else
        echo -e "${GREEN}✅ JWT_SECRET configurada${NC}"
    fi
else
    echo -e "${RED}❌ Archivo .env no existe${NC}"
    echo -e "${YELLOW}   Ejecuta: make setup${NC}"
fi

echo ""

# ============================================
# 8. Últimas Líneas de Logs
# ============================================
echo -e "${YELLOW}8️⃣  Últimas líneas de logs (errores):${NC}"
echo ""

echo -e "${CYAN}Backend:${NC}"
docker logs correcion-backend --tail=5 2>&1 | grep -i "error\|fail\|exception" || echo -e "${GREEN}  Sin errores recientes${NC}"
echo ""

echo -e "${CYAN}Frontend:${NC}"
docker logs correcion-frontend --tail=5 2>&1 | grep -i "error\|fail\|exception" || echo -e "${GREEN}  Sin errores recientes${NC}"
echo ""

echo -e "${CYAN}N8N:${NC}"
docker logs correcion-n8n --tail=5 2>&1 | grep -i "error\|fail\|exception" || echo -e "${GREEN}  Sin errores recientes${NC}"
echo ""

# ============================================
# 9. Recomendaciones
# ============================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}📋 Comandos Útiles para Troubleshooting:${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${YELLOW}make logs-f${NC}           - Ver logs en tiempo real"
echo -e "  ${YELLOW}make logs-backend${NC}     - Logs del backend"
echo -e "  ${YELLOW}make logs-frontend${NC}    - Logs del frontend"
echo -e "  ${YELLOW}make logs-n8n${NC}         - Logs de N8N"
echo -e "  ${YELLOW}make restart${NC}          - Reiniciar todos los servicios"
echo -e "  ${YELLOW}make clean && make start${NC} - Limpiar y reiniciar"
echo -e "  ${YELLOW}make health${NC}           - Verificar health checks"
echo ""
echo -e "${CYAN}Documentación adicional:${NC}"
echo -e "  ${YELLOW}NETWORKING.md${NC}         - Troubleshooting de red"
echo -e "  ${YELLOW}n8n/README-PRECONFIGURACION.md${NC} - Configuración de N8N"
echo ""
