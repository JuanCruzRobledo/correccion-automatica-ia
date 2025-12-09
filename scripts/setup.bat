@echo off
REM ============================================
REM Script de Setup Inicial
REM Sistema de Correccion Automatica - Windows
REM ============================================

setlocal enabledelayedexpansion

echo.
echo ============================================
echo   Sistema de Correccion Automatica
echo   Configuracion Inicial
echo ============================================
echo.

REM ============================================
REM 1. Verificar Docker
REM ============================================
echo [1/6] Verificando Docker...
echo.

where docker >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker no esta instalado
    echo.
    echo Instala Docker Desktop desde: https://docs.docker.com/get-docker/
    echo.
    pause
    exit /b 1
)
echo [OK] Docker instalado:
docker --version

REM Verificar Docker Compose
where docker-compose >nul 2>&1
if %ERRORLEVEL% neq 0 (
    docker compose version >nul 2>&1
    if !ERRORLEVEL! neq 0 (
        echo [ERROR] Docker Compose no esta instalado
        echo.
        echo Instala Docker Compose desde: https://docs.docker.com/compose/install/
        echo.
        pause
        exit /b 1
    )
    set COMPOSE_CMD=docker compose
    echo [OK] Docker Compose instalado:
    docker compose version
) else (
    set COMPOSE_CMD=docker-compose
    echo [OK] Docker Compose instalado:
    docker-compose --version
)

REM Verificar que Docker este corriendo
docker info >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker no esta corriendo
    echo.
    echo Inicia Docker Desktop y ejecuta este script nuevamente
    echo.
    pause
    exit /b 1
)
echo [OK] Docker esta corriendo
echo.

REM ============================================
REM 2. Crear archivo .env
REM ============================================
echo [2/6] Configurando variables de entorno...
echo.

if not exist .env (
    echo [INFO] Creando archivo .env desde template...
    copy .env.example .env >nul
    echo [OK] Archivo .env creado
    echo.
    echo ============================================
    echo   IMPORTANTE: Configuracion necesaria
    echo ============================================
    echo.
    echo Debes actualizar las siguientes variables en .env:
    echo.
    echo   1. MONGODB_URI
    echo      URI de tu base de datos MongoDB Atlas
    echo      Ejemplo: mongodb+srv://usuario:pass@cluster.mongodb.net/db
    echo.
    echo   2. JWT_SECRET ^(opcional, tiene valor por defecto^)
    echo      Clave secreta para JWT
    echo.
    echo   3. N8N_BASIC_AUTH_PASSWORD ^(opcional, tiene valor por defecto^)
    echo      Contrasena para acceder a N8N
    echo.
    echo ============================================
    echo.

    set /p EDIT_CONFIRM="Deseas editar el archivo .env ahora? (S/N): "
    if /i "!EDIT_CONFIRM!"=="S" (
        if exist "%ProgramFiles%\Notepad++\notepad++.exe" (
            start "" "%ProgramFiles%\Notepad++\notepad++.exe" .env
        ) else if exist "%windir%\system32\notepad.exe" (
            notepad .env
        ) else (
            echo [INFO] No se encontro editor de texto. Edita .env manualmente.
        )
        echo.
        echo [INFO] Presiona cualquier tecla cuando hayas terminado de editar .env...
        pause >nul
    ) else (
        echo [WARNING] Recuerda editar .env antes de iniciar el sistema
        echo           Edita con: notepad .env
    )
) else (
    echo [OK] Archivo .env ya existe
)
echo.

REM ============================================
REM 3. Verificar estructura de directorios
REM ============================================
echo [3/6] Verificando estructura de directorios...
echo.

set DIRS_OK=1
if not exist backend (
    echo [ERROR] Directorio 'backend' no encontrado
    set DIRS_OK=0
)
if not exist frontend-correccion-automatica-n8n (
    echo [ERROR] Directorio 'frontend-correccion-automatica-n8n' no encontrado
    set DIRS_OK=0
)
if not exist n8n (
    echo [ERROR] Directorio 'n8n' no encontrado
    set DIRS_OK=0
)
if not exist n8n\workflows (
    echo [ERROR] Directorio 'n8n\workflows' no encontrado
    set DIRS_OK=0
)

if !DIRS_OK! equ 0 (
    echo.
    echo [ERROR] Estructura de directorios incorrecta
    pause
    exit /b 1
)
echo [OK] Estructura de directorios correcta

REM Contar workflows
set WORKFLOW_COUNT=0
for %%f in (n8n\workflows\*.json) do set /a WORKFLOW_COUNT+=1
if !WORKFLOW_COUNT! equ 0 (
    echo [WARNING] No se encontraron workflows en n8n\workflows\
) else (
    echo [OK] !WORKFLOW_COUNT! workflows encontrados en n8n\workflows\
)
echo.

REM ============================================
REM 4. Construir imagenes Docker
REM ============================================
echo [4/6] Construyendo imagenes Docker...
echo      ^(Esto puede tardar varios minutos la primera vez^)
echo.

%COMPOSE_CMD% build

if %ERRORLEVEL% eq 0 (
    echo.
    echo [OK] Imagenes construidas exitosamente
) else (
    echo.
    echo [ERROR] Error al construir imagenes
    pause
    exit /b 1
)
echo.

REM ============================================
REM 5. Verificar puertos disponibles
REM ============================================
echo [5/6] Verificando puertos disponibles...
echo.

REM Cargar puertos desde .env
for /f "tokens=1,2 delims==" %%a in ('type .env ^| findstr /v "^#" ^| findstr /v "^$"') do (
    if "%%a"=="BACKEND_PORT" set BACKEND_PORT=%%b
    if "%%a"=="FRONTEND_PORT" set FRONTEND_PORT=%%b
    if "%%a"=="N8N_PORT" set N8N_PORT=%%b
)

if not defined BACKEND_PORT set BACKEND_PORT=5000
if not defined FRONTEND_PORT set FRONTEND_PORT=3000
if not defined N8N_PORT set N8N_PORT=5678

REM Verificar puertos (simplificado para Windows)
netstat -an | findstr ":%BACKEND_PORT% " >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [WARNING] Puerto %BACKEND_PORT% ^(Backend^) esta en uso
    echo           Cambia BACKEND_PORT en .env o detén el proceso
) else (
    echo [OK] Puerto %BACKEND_PORT% ^(Backend^) disponible
)

netstat -an | findstr ":%FRONTEND_PORT% " >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [WARNING] Puerto %FRONTEND_PORT% ^(Frontend^) esta en uso
    echo           Cambia FRONTEND_PORT en .env o detén el proceso
) else (
    echo [OK] Puerto %FRONTEND_PORT% ^(Frontend^) disponible
)

netstat -an | findstr ":%N8N_PORT% " >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [WARNING] Puerto %N8N_PORT% ^(N8N^) esta en uso
    echo           Cambia N8N_PORT en .env o detén el proceso
) else (
    echo [OK] Puerto %N8N_PORT% ^(N8N^) disponible
)
echo.

REM ============================================
REM 6. Resumen Final
REM ============================================
echo ============================================
echo   Configuracion completada exitosamente!
echo ============================================
echo.
echo Proximos pasos:
echo.
echo   1. Verifica tu archivo .env
echo      notepad .env
echo      Asegurate que MONGODB_URI este configurado
echo.
echo   2. Inicia el sistema
echo      start.bat
echo      O: docker-compose up -d
echo.
echo   3. Accede a los servicios
echo      Frontend:  http://localhost:%FRONTEND_PORT%
echo      Backend:   http://localhost:%BACKEND_PORT%
echo      N8N:       http://localhost:%N8N_PORT%
echo.
echo   4. Configura Google APIs en N8N ^(solo primera vez^)
echo      Ver: n8n\README-PRECONFIGURACION.md
echo.
echo ============================================
echo Comandos utiles:
echo.
echo   start.bat        - Iniciar servicios
echo   docker-compose down  - Detener servicios
echo   docker-compose logs -f  - Ver logs en tiempo real
echo   docker-compose ps    - Ver estado de servicios
echo.
echo Listo para usar!
echo.

endlocal
