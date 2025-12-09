@echo off
REM ============================================
REM Script de Detención - Sistema de Correccion Automatica
REM Windows (.bat)
REM ============================================

echo.
echo ============================================
echo   Sistema de Correccion Automatica
echo   Deteniendo servicios...
echo ============================================
echo.

REM Verificar si Docker esta instalado
where docker >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker no esta instalado
    echo.
    pause
    exit /b 1
)

REM Verificar si Docker esta corriendo
docker info >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker no esta corriendo
    echo.
    pause
    exit /b 1
)

REM Detener servicios
docker-compose down

if %ERRORLEVEL% eq 0 (
    echo.
    echo ============================================
    echo   Servicios detenidos correctamente!
    echo ============================================
    echo.
    echo Para iniciar nuevamente: start.bat
    echo O: docker-compose up -d
    echo.
) else (
    echo.
    echo [ERROR] Fallo al detener servicios
    echo.
    echo Ejecuta: docker-compose ps
    echo Para ver el estado de los servicios
    echo.
)

pause
