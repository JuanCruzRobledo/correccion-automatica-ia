#!/bin/bash
# ============================================
# Verificar Variables de Entorno
# ============================================

set -e

# Colores
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  Verificación de Variables de Entorno${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""

# Verificar que existe .env
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: Archivo .env no encontrado${NC}"
    echo -e "${YELLOW}   Ejecuta: make setup${NC}"
    exit 1
fi

# Cargar variables
export $(grep -v '^#' .env | grep -v '^$' | xargs)

# Variables requeridas
REQUIRED_VARS=(
    "MONGODB_URI"
    "JWT_SECRET"
    "ENCRYPTION_KEY"
)

# Variables opcionales con defaults
OPTIONAL_VARS=(
    "BACKEND_PORT"
    "FRONTEND_PORT"
    "N8N_PORT"
    "N8N_BASIC_AUTH_USER"
    "N8N_BASIC_AUTH_PASSWORD"
    "CORS_ORIGIN"
)

echo -e "${YELLOW}📋 Variables Requeridas:${NC}"
echo ""

ALL_OK=true

for var in "${REQUIRED_VARS[@]}"; do
    value="${!var}"
    if [ -z "$value" ]; then
        echo -e "  ${RED}❌ $var${NC} - No configurada"
        ALL_OK=false
    elif [[ "$value" == *"cambiar"* ]] || [[ "$value" == *"example"* ]] || [[ "$value" == *"tu-"* ]]; then
        echo -e "  ${YELLOW}⚠️  $var${NC} - Usando valor por defecto (cambiar en producción)"
    else
        # Ocultar valores sensibles
        masked_value="${value:0:10}..."
        echo -e "  ${GREEN}✅ $var${NC} - Configurada ($masked_value)"
    fi
done

echo ""
echo -e "${YELLOW}📋 Variables Opcionales:${NC}"
echo ""

for var in "${OPTIONAL_VARS[@]}"; do
    value="${!var}"
    if [ -z "$value" ]; then
        echo -e "  ${CYAN}ℹ️  $var${NC} - Usando default"
    else
        # Mostrar puertos completos, ocultar passwords
        if [[ "$var" == *"PASSWORD"* ]] || [[ "$var" == *"SECRET"* ]]; then
            echo -e "  ${GREEN}✅ $var${NC} - Configurada (***)"
        else
            echo -e "  ${GREEN}✅ $var${NC} - $value"
        fi
    fi
done

echo ""

# Verificar formato de MongoDB URI
if [[ ! "$MONGODB_URI" =~ ^mongodb(\+srv)?:// ]]; then
    echo -e "${RED}❌ MONGODB_URI tiene formato inválido${NC}"
    echo -e "${YELLOW}   Debe empezar con mongodb:// o mongodb+srv://${NC}"
    ALL_OK=false
fi

# Verificar longitud de JWT_SECRET
if [ ${#JWT_SECRET} -lt 32 ]; then
    echo -e "${YELLOW}⚠️  JWT_SECRET debería tener al menos 32 caracteres${NC}"
fi

# Verificar longitud de ENCRYPTION_KEY
if [ ${#ENCRYPTION_KEY} -ne 64 ]; then
    echo -e "${YELLOW}⚠️  ENCRYPTION_KEY debería tener exactamente 64 caracteres (hexadecimal)${NC}"
fi

echo ""

if [ "$ALL_OK" = true ]; then
    echo -e "${GREEN}✅ Todas las variables requeridas están configuradas${NC}"
    exit 0
else
    echo -e "${RED}❌ Algunas variables requeridas faltan${NC}"
    echo -e "${YELLOW}   Edita .env y configura las variables faltantes${NC}"
    exit 1
fi
