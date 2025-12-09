# ============================================
# Makefile - Sistema de Corrección Automática
# ============================================
# Comandos simples para gestionar el stack Docker
#
# NOTA PARA WINDOWS: Si make no está disponible, usa:
#   - start.bat       (equivale a: make setup && make start)
#   - scripts/setup.bat   (equivale a: make setup)
#   - docker-compose up -d  (equivale a: make start)
#   - docker-compose down   (equivale a: make stop)
#
# O instala make para Windows desde: http://gnuwin32.sourceforge.net/packages/make.htm

.PHONY: help setup start stop restart logs logs-f status clean reset build rebuild test health check-env troubleshoot

# Colores para output
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m # No Color

# Detectar sistema operativo
ifeq ($(OS),Windows_NT)
    SHELL := cmd.exe
    SETUP_SCRIPT := scripts\setup.bat
    CHECK_ENV_SCRIPT := scripts\check-env.bat
    TROUBLESHOOT_SCRIPT := scripts\troubleshoot.bat
else
    SETUP_SCRIPT := scripts/setup.sh
    CHECK_ENV_SCRIPT := scripts/check-env.sh
    TROUBLESHOOT_SCRIPT := scripts/troubleshoot.sh
endif

# ============================================
# Help - Mostrar todos los comandos disponibles
# ============================================
help:
	@echo "$(CYAN)============================================$(NC)"
	@echo "$(CYAN)  Sistema de Corrección Automática$(NC)"
	@echo "$(CYAN)============================================$(NC)"
	@echo ""
	@echo "$(GREEN)Inicio Rápido:$(NC)"
	@echo ""
	@echo "  $(YELLOW)make setup && make start$(NC)  - Primera vez (configura e inicia)"
	@echo ""
	@echo "$(GREEN)Comandos principales:$(NC)"
	@echo ""
	@echo "  $(YELLOW)make setup$(NC)       - Configuración inicial (solo primera vez)"
	@echo "  $(YELLOW)make start$(NC)       - Iniciar todos los servicios"
	@echo "  $(YELLOW)make stop$(NC)        - Detener todos los servicios"
	@echo "  $(YELLOW)make restart$(NC)     - Reiniciar todos los servicios"
	@echo "  $(YELLOW)make logs-f$(NC)      - Ver logs en tiempo real (follow)"
	@echo "  $(YELLOW)make status$(NC)      - Ver estado de los servicios"
	@echo ""
	@echo "$(GREEN)Diagnóstico:$(NC)"
	@echo ""
	@echo "  $(YELLOW)make health$(NC)      - Verificar health checks de todos los servicios"
	@echo "  $(YELLOW)make check-env$(NC)   - Verificar variables de entorno"
	@echo "  $(YELLOW)make troubleshoot$(NC)- Diagnóstico completo del sistema"
	@echo ""
	@echo "$(GREEN)Mantenimiento:$(NC)"
	@echo ""
	@echo "  $(YELLOW)make build$(NC)       - Construir/reconstruir imágenes"
	@echo "  $(YELLOW)make rebuild$(NC)     - Reconstruir imágenes sin cache"
	@echo "  $(YELLOW)make clean$(NC)       - Limpiar contenedores y redes"
	@echo "  $(YELLOW)make reset$(NC)       - Reset completo (elimina volúmenes)"
	@echo ""
	@echo "$(GREEN)Servicios individuales:$(NC)"
	@echo ""
	@echo "  $(YELLOW)make logs-backend$(NC)    - Ver logs del backend"
	@echo "  $(YELLOW)make logs-frontend$(NC)   - Ver logs del frontend"
	@echo "  $(YELLOW)make logs-n8n$(NC)        - Ver logs de N8N"
	@echo "  $(YELLOW)make restart-backend$(NC) - Reiniciar backend"
	@echo "  $(YELLOW)make restart-frontend$(NC)- Reiniciar frontend"
	@echo "  $(YELLOW)make restart-n8n$(NC)     - Reiniciar N8N"
	@echo "  $(YELLOW)make shell-backend$(NC)   - Acceder a shell del backend"
	@echo "  $(YELLOW)make shell-frontend$(NC)  - Acceder a shell del frontend"
	@echo "  $(YELLOW)make shell-n8n$(NC)       - Acceder a shell de N8N"
	@echo ""
	@echo "$(GREEN)URLs de acceso:$(NC)"
	@echo "  Frontend:  $(CYAN)http://localhost:3000$(NC)"
	@echo "  Backend:   $(CYAN)http://localhost:5000$(NC)"
	@echo "  N8N:       $(CYAN)http://localhost:5678$(NC) (admin/admin123)"
	@echo ""
	@echo "$(CYAN)Alternativas para Windows (si make no funciona):$(NC)"
	@echo "  start.bat          - Iniciar sistema (setup + start)"
	@echo "  docker-compose up -d   - Iniciar servicios"
	@echo "  docker-compose down    - Detener servicios"
	@echo ""

# ============================================
# Setup - Configuración inicial
# ============================================
setup:
	@echo "$(CYAN)============================================$(NC)"
	@echo "$(CYAN)  Configuración Inicial$(NC)"
	@echo "$(CYAN)============================================$(NC)"
	@echo ""
ifeq ($(OS),Windows_NT)
	@cmd /c $(SETUP_SCRIPT)
else
	@bash $(SETUP_SCRIPT)
endif

# ============================================
# Start - Iniciar servicios
# ============================================
start:
	@echo "$(GREEN)▶️  Iniciando servicios...$(NC)"
	@docker-compose up -d
	@echo ""
	@echo "$(GREEN)✅ Servicios iniciados$(NC)"
	@echo ""
	@echo "$(CYAN)Accede a los servicios en:$(NC)"
	@echo "  Frontend:  $(CYAN)http://localhost:3000$(NC)"
	@echo "  Backend:   $(CYAN)http://localhost:5000$(NC)"
	@echo "  N8N:       $(CYAN)http://localhost:5678$(NC) (admin/admin123)"
	@echo ""
	@echo "$(YELLOW)Ver logs:$(NC) make logs-f"
	@echo "$(YELLOW)Ver estado:$(NC) make status"

# ============================================
# Stop - Detener servicios
# ============================================
stop:
	@echo "$(YELLOW)⏹️  Deteniendo servicios...$(NC)"
	@docker-compose down
	@echo "$(GREEN)✅ Servicios detenidos$(NC)"

# ============================================
# Restart - Reiniciar servicios
# ============================================
restart:
	@echo "$(YELLOW)🔄 Reiniciando servicios...$(NC)"
	@docker-compose restart
	@echo "$(GREEN)✅ Servicios reiniciados$(NC)"

# ============================================
# Logs - Ver logs
# ============================================
logs:
	@docker-compose logs --tail=100

logs-f:
	@echo "$(CYAN)📋 Logs en tiempo real (Ctrl+C para salir)$(NC)"
	@echo ""
	@docker-compose logs -f

logs-backend:
	@docker-compose logs -f backend

logs-frontend:
	@docker-compose logs -f frontend

logs-n8n:
	@docker-compose logs -f n8n

# ============================================
# Status - Ver estado de servicios
# ============================================
status:
	@echo "$(CYAN)📊 Estado de los servicios:$(NC)"
	@echo ""
	@docker-compose ps

# ============================================
# Health - Verificar health checks
# ============================================
health:
	@echo "$(CYAN)🏥 Verificando health checks...$(NC)"
	@echo ""
	@echo "$(YELLOW)Backend:$(NC)"
	@curl -s -o /dev/null -w "  Status: %{http_code}\n" http://localhost:5000/health || echo "  $(RED)❌ No disponible$(NC)"
	@echo ""
	@echo "$(YELLOW)Frontend:$(NC)"
	@curl -s -o /dev/null -w "  Status: %{http_code}\n" http://localhost:3000/ || echo "  $(RED)❌ No disponible$(NC)"
	@echo ""
	@echo "$(YELLOW)N8N:$(NC)"
	@curl -s -o /dev/null -w "  Status: %{http_code}\n" http://localhost:5678/healthz || echo "  $(RED)❌ No disponible$(NC)"
	@echo ""

# ============================================
# Build - Construir imágenes
# ============================================
build:
	@echo "$(CYAN)🏗️  Construyendo imágenes...$(NC)"
	@docker-compose build
	@echo "$(GREEN)✅ Imágenes construidas$(NC)"

rebuild:
	@echo "$(CYAN)🏗️  Reconstruyendo imágenes sin cache...$(NC)"
	@docker-compose build --no-cache
	@echo "$(GREEN)✅ Imágenes reconstruidas$(NC)"

# ============================================
# Clean - Limpiar
# ============================================
clean:
	@echo "$(YELLOW)🧹 Limpiando contenedores y redes...$(NC)"
	@docker-compose down --remove-orphans
	@echo "$(GREEN)✅ Limpieza completada$(NC)"

# ============================================
# Reset - Reset completo
# ============================================
reset:
	@echo "$(RED)⚠️  ADVERTENCIA: Esto eliminará TODOS los datos de N8N$(NC)"
	@echo "$(RED)   (workflows y credenciales configuradas localmente)$(NC)"
	@echo ""
	@read -p "¿Estás seguro? (escribe 'si' para confirmar): " confirm; \
	if [ "$$confirm" = "si" ]; then \
		echo "$(YELLOW)🗑️  Eliminando todo...$(NC)"; \
		docker-compose down -v; \
		echo "$(GREEN)✅ Reset completo$(NC)"; \
	else \
		echo "$(CYAN)Cancelado$(NC)"; \
	fi

# ============================================
# Test - Probar conectividad
# ============================================
test:
	@echo "$(CYAN)🧪 Probando conectividad...$(NC)"
	@echo ""
	@echo "$(YELLOW)1. Frontend → Backend:$(NC)"
	@curl -s http://localhost:3000 > /dev/null && echo "  $(GREEN)✅ OK$(NC)" || echo "  $(RED)❌ Error$(NC)"
	@echo ""
	@echo "$(YELLOW)2. Backend Health:$(NC)"
	@curl -s http://localhost:5000/health > /dev/null && echo "  $(GREEN)✅ OK$(NC)" || echo "  $(RED)❌ Error$(NC)"
	@echo ""
	@echo "$(YELLOW)3. N8N Health:$(NC)"
	@curl -s http://localhost:5678/healthz > /dev/null && echo "  $(GREEN)✅ OK$(NC)" || echo "  $(RED)❌ Error$(NC)"
	@echo ""
	@echo "$(YELLOW)4. Backend → N8N (interno):$(NC)"
	@docker exec correcion-backend wget -q -O- http://n8n:5678/healthz > /dev/null 2>&1 && echo "  $(GREEN)✅ OK$(NC)" || echo "  $(RED)❌ Error (normal si servicios no están corriendo)$(NC)"
	@echo ""

# ============================================
# Restart individual services
# ============================================
restart-backend:
	@echo "$(YELLOW)🔄 Reiniciando backend...$(NC)"
	@docker-compose restart backend
	@echo "$(GREEN)✅ Backend reiniciado$(NC)"

restart-frontend:
	@echo "$(YELLOW)🔄 Reiniciando frontend...$(NC)"
	@docker-compose restart frontend
	@echo "$(GREEN)✅ Frontend reiniciado$(NC)"

restart-n8n:
	@echo "$(YELLOW)🔄 Reiniciando N8N...$(NC)"
	@docker-compose restart n8n
	@echo "$(GREEN)✅ N8N reiniciado$(NC)"

# ============================================
# Shell access
# ============================================
shell-backend:
	@echo "$(CYAN)🐚 Accediendo a shell del backend...$(NC)"
	@docker exec -it correcion-backend sh

shell-frontend:
	@echo "$(CYAN)🐚 Accediendo a shell del frontend...$(NC)"
	@docker exec -it correcion-frontend sh

shell-n8n:
	@echo "$(CYAN)🐚 Accediendo a shell de N8N...$(NC)"
	@docker exec -it correcion-n8n sh

# ============================================
# Update - Actualizar desde git
# ============================================
update:
	@echo "$(CYAN)📥 Actualizando desde git...$(NC)"
	@git pull
	@echo "$(YELLOW)Reconstruyendo imágenes...$(NC)"
	@docker-compose up -d --build
	@echo "$(GREEN)✅ Sistema actualizado$(NC)"

# ============================================
# Check Env - Verificar variables de entorno
# ============================================
check-env:
ifeq ($(OS),Windows_NT)
	@cmd /c $(CHECK_ENV_SCRIPT)
else
	@bash $(CHECK_ENV_SCRIPT)
endif

# ============================================
# Troubleshoot - Diagnóstico del sistema
# ============================================
troubleshoot:
ifeq ($(OS),Windows_NT)
	@cmd /c $(TROUBLESHOOT_SCRIPT)
else
	@bash $(TROUBLESHOOT_SCRIPT)
endif
