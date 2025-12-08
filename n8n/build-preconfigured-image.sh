#!/bin/bash
# Script para construir y pushear imagen de N8N preconfigurada

set -e

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}===========================================
Construir Imagen N8N Preconfigurada
===========================================${NC}"

# Verificar que el directorio data/ existe y no está vacío
if [ ! -d "data" ] || [ -z "$(ls -A data)" ]; then
    echo -e "${RED}❌ Error: El directorio data/ no existe o está vacío${NC}"
    echo -e "${YELLOW}   Sigue las instrucciones en README-PRECONFIGURACION.md primero${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Directorio data/ encontrado${NC}"

# Solicitar nombre de la imagen
read -p "Nombre de la imagen (ej: tu-usuario/n8n-correcion-automatica): " IMAGE_NAME
if [ -z "$IMAGE_NAME" ]; then
    echo -e "${RED}❌ Nombre de imagen requerido${NC}"
    exit 1
fi

# Solicitar tag (opcional)
read -p "Tag (default: latest): " IMAGE_TAG
IMAGE_TAG=${IMAGE_TAG:-latest}

FULL_IMAGE_NAME="${IMAGE_NAME}:${IMAGE_TAG}"

echo ""
echo -e "${YELLOW}Construyendo imagen: ${FULL_IMAGE_NAME}${NC}"
echo ""

# Construir imagen
docker build -t "$FULL_IMAGE_NAME" -f Dockerfile.preconfigured .

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Imagen construida exitosamente: ${FULL_IMAGE_NAME}${NC}"
    echo ""

    # Preguntar si quiere pushear
    read -p "¿Deseas pushear la imagen a Docker Hub? (s/N): " PUSH_CONFIRM

    if [ "$PUSH_CONFIRM" = "s" ] || [ "$PUSH_CONFIRM" = "S" ]; then
        echo -e "${YELLOW}Pusheando imagen a Docker Hub...${NC}"
        docker push "$FULL_IMAGE_NAME"

        if [ $? -eq 0 ]; then
            echo ""
            echo -e "${GREEN}✅ Imagen pusheada exitosamente${NC}"
            echo ""
            echo -e "${GREEN}Para usar esta imagen, actualiza docker-compose.yml:${NC}"
            echo -e "${YELLOW}  n8n:
    image: ${FULL_IMAGE_NAME}${NC}"
        else
            echo -e "${RED}❌ Error al pushear imagen${NC}"
            echo -e "${YELLOW}   Asegúrate de estar logueado: docker login${NC}"
        fi
    fi

    # Mostrar información de la imagen
    echo ""
    echo -e "${GREEN}Información de la imagen:${NC}"
    docker images "$IMAGE_NAME" | grep "$IMAGE_TAG"

else
    echo -e "${RED}❌ Error al construir la imagen${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}===========================================
Proceso completado
===========================================${NC}"
