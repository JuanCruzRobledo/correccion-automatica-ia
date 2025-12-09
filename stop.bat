@echo off
setlocal enabledelayedexpansion
REM ============================================
REM Script de Detención - Sistema de Correccion Automatica
REM Windows (.bat)
REM ============================================

REM Cambiar al directorio del script para asegurar que se ejecuta desde la raiz
cd /d "%~dp0"

echo.
echo ============================================
echo   Sistema de Correccion Automatica
echo   Deteniendo servicios...
echo ============================================
echo.
echo Directorio actual: %CD%
echo.
echo Presiona una tecla para continuar...
pause >nul
echo.

REM Buscar Docker en ubicaciones comunes
set DOCKER_CMD=docker
set DOCKER_COMPOSE_CMD=docker-compose

REM Intentar con docker en PATH
echo [INFO] Buscando Docker...
docker --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [INFO] Docker no esta en PATH, buscando en ubicaciones comunes...
    REM Buscar en Program Files
    if exist "C:\Program Files\Docker\Docker\resources\bin\docker.exe" (
        set DOCKER_CMD="C:\Program Files\Docker\Docker\resources\bin\docker.exe"
        echo [INFO] Docker encontrado en Program Files
    ) else if exist "%ProgramFiles%\Docker\Docker\resources\bin\docker.exe" (
        set DOCKER_CMD="%ProgramFiles%\Docker\Docker\resources\bin\docker.exe"
        echo [INFO] Docker encontrado en Program Files
    ) else (
        echo.
        echo [ERROR] Docker no esta instalado o no se encuentra
        echo.
        echo Opciones:
        echo   1. Instala Docker Desktop desde: https://docs.docker.com/get-docker/
        echo   2. Si Docker esta instalado, agregalo al PATH de Windows
        echo   3. O ejecuta manualmente: docker-compose down
        echo.
        pause
        exit /b 1
    )
) else (
    echo [INFO] Docker encontrado en PATH
)

%DOCKER_CMD% --version
echo.

REM Verificar docker-compose
echo [INFO] Verificando docker-compose...
docker-compose --version >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set DOCKER_COMPOSE_CMD=docker-compose
    echo [INFO] Usando docker-compose standalone
) else (
    echo [INFO] docker-compose no encontrado, intentando con docker compose...
    %DOCKER_CMD% compose version >nul 2>&1
    if %ERRORLEVEL% equ 0 (
        set DOCKER_COMPOSE_CMD=%DOCKER_CMD% compose
        echo [INFO] Usando docker compose ^(plugin^)
    ) else (
        echo [WARNING] docker-compose no encontrado, intentando de todas formas...
        set DOCKER_COMPOSE_CMD=%DOCKER_CMD% compose
    )
)
echo.

REM Verificar si Docker esta corriendo
echo [INFO] Verificando si Docker esta corriendo...
%DOCKER_CMD% ps >nul 2>&1
set DOCKER_PS_ERROR=%ERRORLEVEL%
echo DEBUG: ERRORLEVEL de docker ps = %DOCKER_PS_ERROR%
if %DOCKER_PS_ERROR% neq 0 (
    echo.
    echo [ERROR] Docker no esta corriendo
    echo.
    echo Por favor:
    echo   1. Abre Docker Desktop
    echo   2. Espera a que inicie completamente
    echo   3. Ejecuta este script nuevamente
    echo.
    pause
    exit /b 1
)

echo [OK] Docker esta corriendo
echo.

REM Detener servicios
echo.
echo Comando a ejecutar: %DOCKER_COMPOSE_CMD% down
echo.
%DOCKER_COMPOSE_CMD% down
set COMPOSE_ERROR=%ERRORLEVEL%
echo.
echo DEBUG: Codigo de salida = %COMPOSE_ERROR%

if %COMPOSE_ERROR% eq 0 (
    echo.
    echo ============================================
    echo   Servicios detenidos correctamente!
    echo ============================================
    echo.
    echo Para iniciar nuevamente: start.bat
    echo O: %DOCKER_COMPOSE_CMD% up -d
    echo.
) else (
    echo.
    echo [ERROR] Fallo al detener servicios
    echo.
    echo Ejecuta: %DOCKER_COMPOSE_CMD% ps
    echo Para ver el estado de los servicios
    echo.
)

echo.
echo ============================================
echo Script finalizado
echo ============================================
pause
