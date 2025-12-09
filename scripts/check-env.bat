@echo off
REM ============================================
REM Script de Verificacion de Variables de Entorno
REM Sistema de Correccion Automatica - Windows
REM ============================================

setlocal enabledelayedexpansion

echo.
echo ============================================
echo   Verificacion de Variables de Entorno
echo ============================================
echo.

REM Verificar Docker (opcional, solo para asegurar que el entorno está OK)
docker --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Docker no esta instalado o no esta en el PATH
    echo            Este script solo verifica variables, pero Docker es necesario para ejecutar el sistema
    echo.
)

REM Verificar si existe .env
if not exist .env (
    echo [ERROR] Archivo .env no encontrado
    echo.
    echo Ejecuta: scripts\setup.bat
    echo Para crear el archivo .env
    echo.
    exit /b 1
)

echo [INFO] Verificando archivo .env...
echo.

REM Variables obligatorias
set REQUIRED_VARS=MONGODB_URI JWT_SECRET ENCRYPTION_KEY

set MISSING=0

REM Leer y verificar variables
for %%v in (%REQUIRED_VARS%) do (
    findstr /b /c:"%%v=" .env >nul 2>&1
    if !ERRORLEVEL! neq 0 (
        echo [ERROR] Variable %%v no encontrada en .env
        set MISSING=1
    ) else (
        REM Verificar que no este vacia
        for /f "tokens=2 delims==" %%a in ('findstr /b /c:"%%v=" .env') do (
            if "%%a"=="" (
                echo [ERROR] Variable %%v esta vacia en .env
                set MISSING=1
            ) else (
                echo [OK] Variable %%v configurada
            )
        )
    )
)

echo.

if !MISSING! equ 1 (
    echo ============================================
    echo [ERROR] Algunas variables estan faltantes o vacias
    echo.
    echo Edita el archivo .env y asegurate de configurar:
    echo   - MONGODB_URI: URI de MongoDB Atlas
    echo   - JWT_SECRET: Clave secreta para JWT
    echo   - ENCRYPTION_KEY: Clave de encriptacion
    echo.
    echo Edita con: notepad .env
    echo ============================================
    exit /b 1
) else (
    echo ============================================
    echo [OK] Todas las variables necesarias estan configuradas
    echo ============================================
)

echo.

endlocal
