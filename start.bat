@echo off
REM ============================================
REM Script de Inicio - Sistema de Correccion Automatica
REM Windows (.bat)
REM ============================================

echo.
echo ============================================
echo   Sistema de Correccion Automatica
echo ============================================
echo.

REM Verificar si Docker esta instalado
where docker >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker no esta instalado
    echo.
    echo Instala Docker Desktop desde: https://docs.docker.com/get-docker/
    echo.
    pause
    exit /b 1
)

REM Verificar si Docker esta corriendo
docker info >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker no esta corriendo
    echo.
    echo Por favor inicia Docker Desktop y ejecuta este script nuevamente
    echo.
    pause
    exit /b 1
)

REM Verificar si existe .env
if not exist .env (
    echo [INFO] Archivo .env no encontrado. Ejecutando setup inicial...
    echo.
    call scripts\setup.bat
    if %ERRORLEVEL% neq 0 (
        echo.
        echo [ERROR] Setup fallo. Por favor revisa los errores anteriores.
        pause
        exit /b 1
    )
    echo.
)

REM Iniciar servicios
echo [INFO] Iniciando servicios...
echo.

docker-compose up -d

if %ERRORLEVEL% eq 0 (
    echo.
    echo ============================================
    echo   Servicios iniciados correctamente!
    echo ============================================
    echo.
    echo Accede a los servicios en:
    echo   Frontend:  http://localhost:3000
    echo   Backend:   http://localhost:5000
    echo   N8N:       http://localhost:5678 ^(admin/admin123^)
    echo.
    echo Para ver logs: docker-compose logs -f
    echo Para detener:  docker-compose down
    echo.
    echo Presiona cualquier tecla para ver el estado de los servicios...
    pause >nul
    docker-compose ps
    echo.
) else (
    echo.
    echo [ERROR] Fallo al iniciar servicios
    echo.
    echo Ejecuta: docker-compose logs
    echo Para ver los errores detallados
    echo.
)

pause
