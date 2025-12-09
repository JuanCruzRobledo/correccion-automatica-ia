#!/bin/bash
# ============================================
# Script de Inicio - Sistema de Correccion Automatica
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
echo -e "${CYAN}============================================${NC}"
echo ""

# ============================================
# Verificar Docker
# ============================================
if ! command -v docker &> /dev/null; then
    echo -e "${RED}[ERROR] Docker no esta instalado${NC}"
    echo ""
    echo "Instala Docker desde: https://docs.docker.com/get-docker/"
    echo ""
    exit 1
fi

# Verificar si Docker esta corriendo
if ! docker info &> /dev/null; then
    echo -e "${RED}[ERROR] Docker no esta corriendo${NC}"
    echo ""
    echo "Por favor inicia Docker y ejecuta este script nuevamente"
    echo ""
    exit 1
fi

# ============================================
# Verificar archivo .env
# ============================================
if [ ! -f .env ]; then
    echo -e "${YELLOW}[INFO] Archivo .env no encontrado. Ejecutando setup inicial...${NC}"
    echo ""
    bash scripts/setup.sh
    if [ $? -ne 0 ]; then
        echo ""
        echo -e "${RED}[ERROR] Setup fallo. Por favor revisa los errores anteriores.${NC}"
        exit 1
    fi
    echo ""
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
# Iniciar servicios
# ============================================
echo -e "${YELLOW}[INFO] Iniciando servicios...${NC}"
echo ""

$COMPOSE_CMD up -d

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}  Servicios iniciados correctamente!${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo ""
    echo -e "${CYAN}Accede a los servicios en:${NC}"
    echo -e "  Frontend:  ${CYAN}http://localhost:3000${NC}"
    echo -e "  Backend:   ${CYAN}http://localhost:5000${NC}"
    echo -e "  N8N:       ${CYAN}http://localhost:5678${NC} (admin/admin123)"
    echo ""
    echo -e "${YELLOW}Comandos utiles:${NC}"
    echo -e "  Ver logs:  ${CYAN}$COMPOSE_CMD logs -f${NC}"
    echo -e "  Detener:   ${CYAN}$COMPOSE_CMD down${NC}"
    echo -e "  Estado:    ${CYAN}$COMPOSE_CMD ps${NC}"
    echo ""
    echo -e "${YELLOW}Estado de los servicios:${NC}"
    echo ""
    $COMPOSE_CMD ps
    echo ""
else
    echo ""
    echo -e "${RED}[ERROR] Fallo al iniciar servicios${NC}"
    echo ""
    echo -e "Ejecuta: ${CYAN}$COMPOSE_CMD logs${NC}"
    echo "Para ver los errores detallados"
    echo ""
    exit 1
fi
