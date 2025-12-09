#!/bin/bash
# ============================================
# Script de Detención - Sistema de Correccion Automatica
# Linux/Mac/Unix (.sh)
# ============================================

set -e

# Colores
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  Sistema de Correccion Automatica${NC}"
echo -e "${CYAN}  Deteniendo servicios...${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""

# ============================================
# Verificar Docker
# ============================================
if ! command -v docker &> /dev/null; then
    echo -e "${RED}[ERROR] Docker no esta instalado${NC}"
    echo ""
    exit 1
fi

# Verificar si Docker esta corriendo
if ! docker info &> /dev/null; then
    echo -e "${RED}[ERROR] Docker no esta corriendo${NC}"
    echo ""
    exit 1
fi

# ============================================
# Detectar comando de docker-compose
# ============================================
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    COMPOSE_CMD="docker compose"
fi

# ============================================
# Detener servicios
# ============================================
$COMPOSE_CMD down

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}  Servicios detenidos correctamente!${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo ""
    echo -e "${YELLOW}Para iniciar nuevamente:${NC}"
    echo -e "  ${CYAN}./start.sh${NC}"
    echo -e "  ${CYAN}make start${NC}"
    echo -e "  ${CYAN}$COMPOSE_CMD up -d${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}[ERROR] Fallo al detener servicios${NC}"
    echo ""
    echo -e "Ejecuta: ${CYAN}$COMPOSE_CMD ps${NC}"
    echo "Para ver el estado de los servicios"
    echo ""
    exit 1
fi
