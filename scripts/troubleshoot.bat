@echo off
REM ============================================
REM Script de Diagnostico del Sistema
REM Sistema de Correccion Automatica - Windows
REM ============================================

setlocal enabledelayedexpansion

echo.
echo ============================================
echo   Diagnostico del Sistema
echo ============================================
echo.

REM ============================================
REM 1. Verificar Docker
REM ============================================
echo [1/7] Verificando Docker...
echo.

docker --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker no esta instalado o no esta en el PATH
    echo         Instala Docker Desktop desde: https://docs.docker.com/get-docker/
    set ISSUES=1
) else (
    echo [OK] Docker instalado:
    docker --version
)

docker ps >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker no esta corriendo
    echo         Inicia Docker Desktop
    set ISSUES=1
) else (
    echo [OK] Docker esta corriendo
)

echo.

REM ============================================
REM 2. Verificar Docker Compose
REM ============================================
echo [2/7] Verificando Docker Compose...
echo.

where docker-compose >nul 2>&1
if %ERRORLEVEL% neq 0 (
    docker compose version >nul 2>&1
    if !ERRORLEVEL! neq 0 (
        echo [ERROR] Docker Compose no esta instalado
        set ISSUES=1
    ) else (
        echo [OK] Docker Compose instalado:
        docker compose version
    )
) else (
    echo [OK] Docker Compose instalado:
    docker-compose --version
)

echo.

REM ============================================
REM 3. Verificar archivo .env
REM ============================================
echo [3/7] Verificando archivo .env...
echo.

if not exist .env (
    echo [ERROR] Archivo .env no encontrado
    echo         Ejecuta: scripts\setup.bat
    set ISSUES=1
) else (
    echo [OK] Archivo .env existe

    REM Verificar MONGODB_URI
    findstr /b /c:"MONGODB_URI=" .env >nul 2>&1
    if !ERRORLEVEL! neq 0 (
        echo [WARNING] MONGODB_URI no configurado en .env
    ) else (
        echo [OK] MONGODB_URI configurado
    )
)

echo.

REM ============================================
REM 4. Verificar estructura de directorios
REM ============================================
echo [4/7] Verificando estructura de directorios...
echo.

set DIRS_OK=1
if not exist backend (
    echo [ERROR] Directorio 'backend' no encontrado
    set DIRS_OK=0
    set ISSUES=1
)
if not exist frontend-correccion-automatica-n8n (
    echo [ERROR] Directorio 'frontend-correccion-automatica-n8n' no encontrado
    set DIRS_OK=0
    set ISSUES=1
)
if not exist n8n (
    echo [ERROR] Directorio 'n8n' no encontrado
    set DIRS_OK=0
    set ISSUES=1
)

if !DIRS_OK! equ 1 (
    echo [OK] Estructura de directorios correcta
)

echo.

REM ============================================
REM 5. Verificar estado de servicios
REM ============================================
echo [5/7] Verificando estado de servicios Docker...
echo.

docker-compose ps >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [INFO] No hay servicios corriendo
    echo        Inicia con: docker-compose up -d
) else (
    docker-compose ps
)

echo.

REM ============================================
REM 6. Verificar puertos
REM ============================================
echo [6/7] Verificando puertos...
echo.

REM Cargar puertos desde .env
if exist .env (
    for /f "tokens=1,2 delims==" %%a in ('type .env ^| findstr /v "^#" ^| findstr /v "^$"') do (
        if "%%a"=="BACKEND_PORT" set BACKEND_PORT=%%b
        if "%%a"=="FRONTEND_PORT" set FRONTEND_PORT=%%b
        if "%%a"=="N8N_PORT" set N8N_PORT=%%b
    )
)

if not defined BACKEND_PORT set BACKEND_PORT=5000
if not defined FRONTEND_PORT set FRONTEND_PORT=3000
if not defined N8N_PORT set N8N_PORT=5678

echo Verificando puerto %BACKEND_PORT% ^(Backend^)...
netstat -an | findstr ":%BACKEND_PORT% " >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] Puerto %BACKEND_PORT% en uso
) else (
    echo [INFO] Puerto %BACKEND_PORT% libre
)

echo Verificando puerto %FRONTEND_PORT% ^(Frontend^)...
netstat -an | findstr ":%FRONTEND_PORT% " >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] Puerto %FRONTEND_PORT% en uso
) else (
    echo [INFO] Puerto %FRONTEND_PORT% libre
)

echo Verificando puerto %N8N_PORT% ^(N8N^)...
netstat -an | findstr ":%N8N_PORT% " >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] Puerto %N8N_PORT% en uso
) else (
    echo [INFO] Puerto %N8N_PORT% libre
)

echo.

REM ============================================
REM 7. Health Checks
REM ============================================
echo [7/7] Verificando health checks de servicios...
echo.

echo Backend ^(http://localhost:%BACKEND_PORT%/health^):
curl -s -o nul -w "  Status: %%{http_code}\n" http://localhost:%BACKEND_PORT%/health 2>nul || echo   [INFO] No disponible

echo Frontend ^(http://localhost:%FRONTEND_PORT%/^):
curl -s -o nul -w "  Status: %%{http_code}\n" http://localhost:%FRONTEND_PORT%/ 2>nul || echo   [INFO] No disponible

echo N8N ^(http://localhost:%N8N_PORT%/healthz^):
curl -s -o nul -w "  Status: %%{http_code}\n" http://localhost:%N8N_PORT%/healthz 2>nul || echo   [INFO] No disponible

echo.

REM ============================================
REM Resumen
REM ============================================
if defined ISSUES (
    echo ============================================
    echo [WARNING] Se encontraron algunos problemas
    echo ============================================
    echo.
    echo Revisa los mensajes anteriores y corrige los problemas.
    echo.
) else (
    echo ============================================
    echo [OK] Diagnostico completado sin problemas criticos
    echo ============================================
    echo.
)

endlocal
