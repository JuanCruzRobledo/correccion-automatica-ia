# Guía de Preconfiguración de N8N

Este documento explica cómo preconfigurar la imagen de N8N con workflows y credenciales para que los usuarios finales no tengan que hacerlo.

---

## Estructura de Directorios

```
n8n/
├── workflows/              # Workflows en formato JSON (ya copiados)
├── data/                   # Datos persistentes de N8N (generados en runtime)
├── n8n.env.example        # Variables de entorno de ejemplo
└── README-PRECONFIGURACION.md  # Este archivo
```

---

## Proceso de Preconfiguración Manual

### PASO 1: Levantar N8N en modo configuración

Primero, levanta N8N localmente para configurarlo:

```bash
docker run -d \
  --name n8n-config \
  -p 5678:5678 \
  -e N8N_BASIC_AUTH_ACTIVE=false \
  -v $(pwd)/n8n/data:/home/node/.n8n \
  n8nio/n8n:latest
```

Accede a: http://localhost:5678

### PASO 2: Configurar Credenciales de Google

#### Opción A: Google Service Account (Recomendado para preconfiguración)

1. Ve a https://console.cloud.google.com/
2. Crea un Service Account
3. Descarga el archivo JSON de credenciales
4. En N8N:
   - Ve a **Credentials** → **New**
   - Selecciona **Google Service Account**
   - Pega el contenido del JSON
   - Guarda como "Google Service Account"

**APIs necesarias para el Service Account:**
- Google Drive API
- Google Sheets API
- Google Gemini API (o usa API Key separada)

#### Opción B: Google API Key (Solo para Gemini)

1. Ve a https://console.cloud.google.com/
2. Habilita Google Gemini API
3. Crea API Key
4. En N8N:
   - Ve a **Credentials** → **New**
   - Selecciona **Google API Key**
   - Pega la API Key
   - Guarda como "Google Gemini API"

#### Opción C: OAuth2 (Requiere configuración por usuario)

⚠️ **NO recomendado para preconfiguración** porque cada instancia necesita autorización web.

Si usas OAuth2:
- Cada usuario final deberá hacer el flujo de autorización
- Se recomienda usar Service Account en su lugar

### PASO 3: Importar Workflows

Todos los workflows están en `n8n/workflows/`. Para importarlos:

**Opción 1: Importar desde UI (Recomendado)**
1. En N8N, ve a **Workflows**
2. Click en **Import from File**
3. Selecciona cada archivo `.json` de `n8n/workflows/`
4. Después de importar, abre cada workflow y:
   - Verifica que las credenciales estén asignadas
   - Activa el workflow (toggle en la esquina superior derecha)

**Opción 2: Copiar directamente a la base de datos**
Los workflows se guardan en `/home/node/.n8n/` dentro del contenedor (mapeado a `n8n/data/` localmente).

**Workflows a importar:**
- `correcion-automatica.json` - Flujo principal de corrección
- `flujo_correccion_manual.json` - Corrección manual individual
- `flujo_correccion_masiva.json` - Corrección masiva/batch
- `create-university-folder.json` - Crear carpeta de universidad
- `create-faculty-folder.json` - Crear carpeta de facultad
- `create-career-folder.json` - Crear carpeta de carrera
- `create-course-folder.json` - Crear carpeta de materia
- `create-commission-folder.json` - Crear carpeta de comisión
- `create-submission-folder.json` - Crear carpeta de entrega
- `create-student-folder.json` - Crear carpeta de alumno
- `upload-file-to-drive.json` - Subir archivos a Drive
- `get-student-corrections.json` - Obtener correcciones de alumno

### PASO 4: Configurar Webhooks en los Workflows

Para cada workflow, verifica que los webhooks estén correctamente configurados:

1. Abre el workflow
2. Busca el nodo **Webhook**
3. Verifica que la URL sea:
   - Path: `/webhook/nombre-del-endpoint`
   - Method: POST (generalmente)
   - Authentication: None (el backend maneja auth)

**Endpoints importantes:**
- `/webhook/rubrica` - Generar rúbrica desde PDF
- `/webhook/corregir` - Corregir una entrega
- `/webhook/spreadsheet` - Integración con Google Sheets
- `/webhook/automatico` - Corrección masiva
- `/webhook/create-*` - Creación de carpetas en Drive

### PASO 5: Verificar Configuración

Prueba que todo funcione:

1. **Probar credenciales:**
   - Crea un workflow de prueba
   - Usa un nodo de Google Drive/Sheets
   - Ejecuta manualmente
   - Verifica que pueda acceder a tu cuenta

2. **Probar webhooks:**
   - Ejecuta un webhook con curl:
     ```bash
     curl -X POST http://localhost:5678/webhook/test \
       -H "Content-Type: application/json" \
       -d '{"test": "data"}'
     ```

3. **Verificar workflows activos:**
   - Ve a **Executions** en N8N
   - Verifica que los workflows estén escuchando webhooks

### PASO 6: Exportar la Configuración de N8N

Una vez configurado todo, necesitas guardar la configuración para la imagen final.

**Opción A: Commit del volumen de datos**
Los datos de N8N están en `n8n/data/`. Este directorio contiene:
- `database.sqlite` - Base de datos con workflows y credenciales
- `nodes/` - Nodos personalizados (si hay)
- `static-data/` - Datos estáticos

```bash
# Detener N8N
docker stop n8n-config

# El directorio n8n/data/ ahora contiene toda la configuración
# Puedes commitearlo al repositorio si quieres (⚠️ cuidado con credenciales)
```

**Opción B: Crear imagen personalizada con datos incluidos**

Crea un Dockerfile personalizado:

```dockerfile
FROM n8nio/n8n:latest

# Copiar datos preconfigurados
COPY ./data /home/node/.n8n

# Asegurar permisos correctos
USER root
RUN chown -R node:node /home/node/.n8n
USER node
```

Build la imagen:
```bash
cd n8n/
docker build -t n8n-preconfigured:latest -f Dockerfile.preconfigured .
```

Pushea a un registry:
```bash
docker tag n8n-preconfigured:latest tu-usuario/n8n-preconfigured:latest
docker push tu-usuario/n8n-preconfigured:latest
```

### PASO 7: Limpiar

```bash
# Detener y eliminar contenedor de configuración
docker stop n8n-config
docker rm n8n-config
```

---

## Consideraciones de Seguridad

### ⚠️ Credenciales en el Repositorio

**SI usas Service Account:**
- ✅ El archivo JSON de Service Account está en `database.sqlite` encriptado
- ⚠️ Al hacer commit de `n8n/data/`, las credenciales estarán incluidas
- 🔒 Asegúrate que el repositorio sea PRIVADO
- 🔐 O encripta el directorio `n8n/data/` antes de commitear

**Alternativa más segura:**
1. NO commitear `n8n/data/` al repositorio
2. Subir imagen Docker preconfigurada a un registry privado
3. Usuarios descargan la imagen, no el código fuente

### Encriptar Directorio de Datos (Opcional)

Si quieres commitear `n8n/data/` de forma segura:

```bash
# Encriptar
tar -czf - n8n/data/ | openssl enc -aes-256-cbc -salt -out n8n-data.tar.gz.enc

# Desencriptar (usuarios finales)
openssl enc -aes-256-cbc -d -in n8n-data.tar.gz.enc | tar -xzf -
```

---

## Variables de Entorno Importantes

Estas variables se configuran en el docker-compose.yml:

```yaml
environment:
  # Autenticación
  N8N_BASIC_AUTH_ACTIVE: true
  N8N_BASIC_AUTH_USER: admin
  N8N_BASIC_AUTH_PASSWORD: admin123

  # Webhooks
  WEBHOOK_URL: http://localhost:5678

  # Red
  N8N_HOST: 0.0.0.0
  N8N_PORT: 5678
  N8N_PROTOCOL: http

  # Zona horaria
  GENERIC_TIMEZONE: America/Argentina/Buenos_Aires
```

---

## URLs de Webhooks en el Backend

El backend debe apuntar a estos webhooks (configurados en `.env`):

```env
# URLs internas (entre containers Docker)
N8N_RUBRIC_WEBHOOK_URL=http://n8n:5678/webhook/rubrica
N8N_GRADING_WEBHOOK_URL=http://n8n:5678/webhook/corregir
N8N_SPREADSHEET_WEBHOOK_URL=http://n8n:5678/webhook/spreadsheet
N8N_BATCH_GRADING_WEBHOOK_URL=http://n8n:5678/webhook/automatico

# Webhooks de creación de carpetas
N8N_CREATE_UNIVERSITY_FOLDER_WEBHOOK=http://n8n:5678/webhook/create-university-folder
N8N_CREATE_FACULTY_FOLDER_WEBHOOK=http://n8n:5678/webhook/create-faculty-folder
N8N_CREATE_CAREER_FOLDER_WEBHOOK=http://n8n:5678/webhook/create-career-folder
N8N_CREATE_COURSE_FOLDER_WEBHOOK=http://n8n:5678/webhook/create-course-folder
N8N_CREATE_COMMISSION_FOLDER_WEBHOOK=http://n8n:5678/webhook/create-commission-folder
N8N_CREATE_SUBMISSION_FOLDER_WEBHOOK=http://n8n:5678/webhook/create-submission-folder
```

---

## Troubleshooting

### Workflows no aparecen después de importar
- Verifica que los archivos JSON sean válidos
- Revisa logs: `docker logs n8n-config`
- Intenta importar uno por uno

### Credenciales no funcionan
- Verifica que el Service Account tenga los permisos correctos en Google Cloud
- Asegúrate de habilitar las APIs necesarias
- Revisa scopes en el Service Account

### Webhooks no responden
- Verifica que el workflow esté ACTIVO (toggle verde)
- Revisa que el path del webhook sea correcto
- Verifica que N8N esté escuchando en el puerto correcto

### Permiso denegado en `/home/node/.n8n`
```bash
# Arreglar permisos
docker exec -u root n8n-config chown -R node:node /home/node/.n8n
```

---

## Checklist de Preconfiguración

- [ ] N8N levantado en modo configuración
- [ ] Credenciales de Google configuradas (Service Account o API Key)
- [ ] Todos los workflows importados (14 archivos)
- [ ] Workflows activos (toggle verde)
- [ ] Webhooks verificados y funcionando
- [ ] Credenciales asignadas a nodos en workflows
- [ ] Pruebas de integración exitosas
- [ ] Datos exportados a `n8n/data/` o imagen Docker
- [ ] Contenedor de configuración eliminado

---

## Próximo Paso

Una vez completada la preconfiguración:
1. Continúa con **FASE 3: Docker Compose** para integrar N8N al stack
2. O crea la imagen personalizada y súbela a un registry
