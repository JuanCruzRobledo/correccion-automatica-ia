# Guía para Actualizar la Imagen de N8N

Este documento detalla el flujo de trabajo para realizar mantenimiento, agregar credenciales o modificar workflows en la imagen preconfigurada de N8N y subirla a Docker Hub.

---

## FASE 1: Edición y Configuración (Local)

Antes de generar una nueva imagen, necesitamos levantar N8N conectado a los datos locales para guardar los cambios.

### 1. Preparar permisos (Evitar error Read-Only)
**Contexto:** En Windows, al detener contenedores, los archivos de base de datos a veces quedan bloqueados o con permisos de *root*, lo que impide que N8N arranque de nuevo.
**Acción:** Ejecuta este comando en **PowerShell** (estando en la carpeta `n8n/`) para asignar los permisos correctos al usuario `node` (ID 1000).

```powershell
docker run --rm -v "${PWD}/data:/data" alpine chown -R 1000:1000 /data
```

2. Levantar N8N en modo configuración
Ejecuta el contenedor n8n-config montando tu carpeta local data/.

```powershell
# Asegúrate de no tener una instancia previa trabada
docker rm -f n8n-config

# Iniciar contenedor
docker run -d `
  --name n8n-config `
  -p 5678:5678 `
  -e N8N_BASIC_AUTH_ACTIVE=false `
  -v "${PWD}/data:/home/node/.n8n" `
  n8nio/n8n:latest
```
3. Realizar cambios
Accede a http://localhost:5678.

Realiza tus cambios (importar workflows, autenticar credenciales de Google, cambiar settings).

Importante: Todo lo que hagas se está guardando en tu carpeta local n8n/data/.

4. Finalizar edición
Una vez terminados los cambios, detén y elimina el contenedor para liberar la base de datos y permitir que la imagen se construya correctamente.

```powershell
docker stop n8n-config
docker rm n8n-config
```

ASE 2: Construir y Subir Imagen (Build & Push)
Ahora empaquetaremos los datos actualizados de data/ dentro de la imagen y la subiremos a Docker Hub.

Opción Recomendada: Script Automático
Como el proyecto ya tiene un script preparado, úsalo para construir y subir la imagen.

Abre una terminal de Git Bash.

Navega a la carpeta n8n.

Ejecuta el script:

```bash
./build-preconfigured-image.sh
```

Sigue las instrucciones del script:

Cuando pregunte si deseas subir la imagen al registro (Docker Hub), selecciona Sí/Yes.

Esto actualizará la etiqueta latest en tu repositorio remoto.

FASE 3: Despliegue Final
Como el archivo docker-compose.yml en la raíz del proyecto ya apunta a tu imagen de Docker Hub, solo necesitas actualizar el stack.

En la raíz del proyecto (PowerShell):

```powershell
# 1. Descargar la versión más reciente que acabas de subir
docker-compose pull n8n

# 2. Reiniciar el servicio con la nueva imagen
docker-compose up -d n8n
```

Resumen de Comandos Rápidos
Acción | Terminal |Comando
1.Arreglar Permisos | PowerShell | docker run --rm -v "${PWD}/data:/data" alpine chown -R 1000:1000 /data
2.Iniciar Config | PowerShell | docker run -d --name n8n-config -p 5678:5678 -e N8N_BASIC_AUTH_ACTIVE=false -v "${PWD}/data:/home/node/.n8n" n8nio/n8n:latest 
3.Guardar y Salir | PowerShell |docker stop n8n-config; docker rm n8n-config
4. Build & PushGit | Bash | ./build-preconfigured-image.sh