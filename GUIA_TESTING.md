# 🧪 Guía de Testing Manual

## Sistema de Corrección Automática Multi-Tenant

Esta guía proporciona instrucciones detalladas para realizar testing manual completo del sistema, incluyendo pruebas por rol, workflows de n8n, y escenarios end-to-end.

---

## 📋 Tabla de Contenidos

1. [Preparación del Entorno](#preparación-del-entorno)
2. [Testing por Rol](#testing-por-rol)
3. [Testing de n8n Workflows](#testing-de-n8n-workflows)
4. [Escenarios End-to-End](#escenarios-end-to-end)
5. [Checklist de Testing](#checklist-de-testing)
6. [Testing de Seguridad](#testing-de-seguridad)
7. [Troubleshooting](#troubleshooting)

---

## 🔧 Preparación del Entorno

### 1. Ejecutar seed de datos

```bash
cd backend
node src/scripts/seedMultiTenant.js
```

**Verificar que se crearon:**
- ✅ 2 universidades (UTN, UBA)
- ✅ 9 usuarios con diferentes roles
- ✅ Estructura académica completa
- ✅ Profesores asignados a comisiones
- ✅ 1 rúbrica de ejemplo

### 2. Iniciar todos los servicios

**Terminal 1 - MongoDB:**
```bash
mongod
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 3 - Frontend:**
```bash
cd frontend-correccion-automatica-n8n
npm run dev
```

**Terminal 4 - n8n:**
```bash
docker start n8n
# O si es self-hosted: n8n start
```

### 3. Verificar que todo funciona

```bash
# Backend
curl http://localhost:5000/health
# Debe retornar: {"status":"ok","mongodb":"connected"}

# Frontend
# Abrir: http://localhost:5173
# Debe mostrar pantalla de login

# n8n
# Abrir: http://localhost:5678
# Verificar que workflows estén "Active"
```

---

## 👥 Testing por Rol

### 🌟 Role 1: Super Admin

**Credenciales:**
```
Usuario: superadmin
Contraseña: admin123
```

#### Pruebas:

**1. Login y Redirección**
- ✅ Login exitoso
- ✅ Redirige a `/admin`
- ✅ Navbar muestra "Admin Panel"

**2. Acceso Global a Universidades**
- ✅ Ir a Admin Panel
- ✅ Ver "Universidad" en el selector superior
- ✅ Seleccionar "Todas las Universidades"
- ✅ Ver datos de UTN y UBA juntos

**3. Gestión de Universidades**
- ✅ Ir a "Universidades"
- ✅ Ver listado con UTN y UBA
- ✅ Crear nueva universidad:
  ```
  ID: unlp
  Nombre: Universidad Nacional de La Plata
  ```
- ✅ Editar universidad existente
- ✅ Eliminar universidad (soft delete)
- ✅ Verificar que universidades eliminadas no aparecen

**4. Gestión de Usuarios Cross-University**
- ✅ Ir a "Usuarios"
- ✅ Ver usuarios de todas las universidades
- ✅ Crear usuario en UTN:
  ```
  Username: test-user-utn
  Nombre: Test User UTN
  Role: user
  Universidad: UTN
  Password: test123
  ```
- ✅ Crear usuario en UBA
- ✅ Crear usuario sin universidad (otro super-admin)
- ✅ Editar usuario cambiando universidad
- ✅ Eliminar usuario

**5. Gestión de Facultades**
- ✅ Cambiar a "Universidad: UTN"
- ✅ Ir a "Facultades"
- ✅ Ver solo facultades de UTN
- ✅ Crear facultad en UTN:
  ```
  ID: frm
  Nombre: Facultad Regional Mendoza
  ```
- ✅ Cambiar a "Universidad: UBA"
- ✅ Verificar que solo aparecen facultades de UBA
- ✅ Crear facultad en UBA

**6. Gestión de Carreras**
- ✅ Seleccionar "Universidad: UTN"
- ✅ Ir a "Carreras"
- ✅ Ver solo carreras de UTN
- ✅ Crear carrera:
  ```
  ID: ie
  Nombre: Ingeniería Electrónica
  Facultad: FRBA
  ```
- ✅ Editar carrera
- ✅ Eliminar carrera

**7. Gestión de Cursos**
- ✅ Ir a "Cursos"
- ✅ Ver cursos filtrados por universidad
- ✅ Crear curso:
  ```
  ID: sintaxis
  Nombre: Sintaxis y Semántica
  Año: 2025
  Carrera: ISI
  Facultad: FRBA
  ```
- ✅ Verificar que el curso aparece en el listado

**8. Gestión de Comisiones**
- ✅ Ir a "Comisiones"
- ✅ Ver comisiones de la universidad seleccionada
- ✅ Crear comisión:
  ```
  ID: 3k1
  Nombre: Comisión 3K1
  Curso: Sintaxis
  Carrera: ISI
  Facultad: FRBA
  Año: 2025
  Profesor: Juan López
  Email: lopez@utn.edu.ar
  ```
- ✅ Editar comisión para asignar profesor:
  - Click en "Editar"
  - Scroll hasta "Profesores Asignados"
  - Seleccionar "María García" en el dropdown
  - Verificar que aparece en la lista
- ✅ Remover profesor de comisión
- ✅ Verificar que solo profesores de la universidad aparecen en el dropdown

**9. Gestión de Rúbricas**
- ✅ Ir a "Rúbricas"
- ✅ Ver rúbricas de la universidad seleccionada
- ✅ Crear rúbrica (ver siguiente sección para detalles)
- ✅ Editar rúbrica existente
- ✅ Eliminar rúbrica

**10. Logout**
- ✅ Click en "Cerrar Sesión"
- ✅ Redirige a `/login`
- ✅ Token borrado (verificar en localStorage)

---

### 👨‍💼 Role 2: University Admin

**Credenciales (UTN):**
```
Usuario: admin-utn
Contraseña: admin123
```

**Credenciales (UBA):**
```
Usuario: admin-uba
Contraseña: admin123
```

#### Pruebas con admin-utn:

**1. Login y Alcance**
- ✅ Login exitoso
- ✅ Redirige a `/admin`
- ✅ **NO** ve selector de "Universidad" (solo su universidad)
- ✅ Título muestra "Universidad Tecnológica Nacional"

**2. Gestión de Facultades (Solo UTN)**
- ✅ Ir a "Facultades"
- ✅ Ver solo facultades de UTN (FRBA)
- ✅ **NO** puede ver facultades de UBA
- ✅ Crear facultad en UTN
- ✅ Editar facultad de UTN
- ✅ Eliminar facultad de UTN

**3. Gestión de Carreras (Solo UTN)**
- ✅ Ir a "Carreras"
- ✅ Ver solo carreras de UTN (ISI)
- ✅ Crear carrera en UTN
- ✅ Dropdown de "Facultad" solo muestra facultades de UTN

**4. Gestión de Cursos (Solo UTN)**
- ✅ Ir a "Cursos"
- ✅ Ver solo cursos de UTN (Diseño, Paradigmas)
- ✅ Crear curso en UTN
- ✅ Dropdown de "Carrera" solo muestra carreras de UTN

**5. Gestión de Comisiones (Solo UTN)**
- ✅ Ir a "Comisiones"
- ✅ Ver comisiones de UTN (1K1, 1K2, 2K1)
- ✅ Crear comisión
- ✅ Editar comisión
- ✅ Asignar profesor:
  - Dropdown solo muestra profesores de UTN (García, López)
  - **NO** muestra profesores de UBA

**6. Gestión de Usuarios (Solo UTN)**
- ✅ Ir a "Usuarios"
- ✅ Ver solo usuarios de UTN
- ✅ Crear usuario:
  - Campo "Universidad" está pre-seleccionado en UTN
  - **NO** puede cambiar a otra universidad
- ✅ Editar usuario de UTN
- ✅ **NO** puede editar usuarios de UBA

**7. Gestión de Rúbricas (Solo UTN)**
- ✅ Ir a "Rúbricas"
- ✅ Ver solo rúbricas de UTN
- ✅ Crear rúbrica para comisión de UTN

**8. Limitaciones (Testing de Seguridad)**
- ✅ **NO** puede acceder a "Universidades" (opción no aparece)
- ✅ **NO** puede ver datos de UBA en ninguna sección
- ✅ **NO** puede crear usuarios de UBA
- ✅ **NO** puede asignar profesores de UBA a comisiones de UTN

#### Pruebas con admin-uba:

**Verificar aislamiento:**
- ✅ Login con admin-uba
- ✅ Ver solo datos de UBA
- ✅ **NO** puede ver datos de UTN
- ✅ Crear comisión en UBA
- ✅ Asignar profesor de UBA (Rodriguez)
- ✅ **NO** puede asignar profesores de UTN

---

### 👨‍🏫 Role 3: Professor

**Credenciales (UTN - María García):**
```
Usuario: prof-garcia
Contraseña: prof123
Comisiones: 1K1, 2K1
```

**Credenciales (UTN - Juan López):**
```
Usuario: prof-lopez
Contraseña: prof123
Comisiones: 1K2
```

**Credenciales (UBA - Carlos Rodriguez):**
```
Usuario: prof-rodriguez
Contraseña: prof123
Comisiones: Comisión 1
```

#### Pruebas con prof-garcia:

**1. Login y Redirección**
- ✅ Login exitoso
- ✅ Redirige a `/professor`
- ✅ Navbar muestra "Mis Comisiones" y "Corrección"
- ✅ **NO** muestra "Admin Panel"

**2. Vista de Comisiones**
- ✅ Sidebar muestra "Comisión 1K1" y "Comisión 2K1"
- ✅ **NO** muestra "Comisión 1K2" (no está asignado)
- ✅ Click en "Comisión 1K1" → selecciona comisión
- ✅ Panel principal actualiza con datos de 1K1

**3. Vista de Rúbricas**
- ✅ Ver listado de rúbricas de la comisión 1K1
- ✅ Ver rúbrica "TP1 - Diseño de Sistemas"
- ✅ Auto-selección de primera rúbrica
- ✅ Botón "Subir Entrega" habilitado

**4. Subir Entrega (Flujo Completo)**
- ✅ Click en "Subir Entrega"
- ✅ Modal se abre con título "Subir Entrega - TP1 - Diseño de Sistemas"
- ✅ Ingresar nombre de estudiante: `Juan Perez`
- ✅ Seleccionar archivo `.txt`:
  - Crear archivo `test-entrega.txt` con contenido:
    ```
    Código del TP1 de Juan Perez

    public class Main {
      public static void main(String[] args) {
        System.out.println("Hola Mundo");
      }
    }
    ```
- ✅ Verificar validación: si selecciono un `.pdf` → error "Solo se permiten archivos .txt"
- ✅ Verificar límite de tamaño: si archivo > 10MB → error
- ✅ Ver preview del archivo (primeros 500 caracteres)
- ✅ Nombre de archivo se auto-genera: `juan-perez.txt`
- ✅ Click en "Subir"
- ✅ Loading durante el upload
- ✅ Modal se cierra
- ✅ Lista de entregas se actualiza
- ✅ Nueva entrega aparece con badge "📤 Subido"

**5. Verificar Entrega en Drive**
- ✅ En la lista de entregas, ver la nueva entrega
- ✅ Click en "📁 Ver en Drive"
- ✅ Abre nueva pestaña con el archivo en Google Drive
- ✅ Verificar que el archivo está en la carpeta correcta de la rúbrica
- ✅ Descargar y verificar contenido del archivo

**6. Gestión de Entregas**
- ✅ Ver detalles de entrega:
  - Nombre del estudiante
  - Fecha de subida
  - Estado (Subido)
  - Nombre del archivo en Drive
- ✅ Click en "🗑️ Eliminar" en una entrega
- ✅ Confirmar eliminación
- ✅ Entrega desaparece de la lista

**7. Cambio de Comisión**
- ✅ Click en "Comisión 2K1" en sidebar
- ✅ Panel actualiza con datos de 2K1
- ✅ Rúbricas cambian a las de 2K1
- ✅ Lista de entregas cambia a las de 2K1

**8. Navegación a Corrección**
- ✅ Click en "🏠 Corrección" en navbar
- ✅ Redirige a `/` (interfaz de corrección manual)
- ✅ Puede usar el sistema de corrección normal

**9. Limitaciones (Testing de Seguridad)**
- ✅ **NO** puede acceder a `/admin` (redirige o da 403)
- ✅ **NO** puede ver comisiones donde no está asignado
- ✅ **NO** puede subir entregas a comisiones de otros profesores
- ✅ **NO** puede ver entregas de otras comisiones

#### Pruebas con prof-lopez:

**Verificar aislamiento:**
- ✅ Login con prof-lopez
- ✅ Solo ve "Comisión 1K2" en sidebar
- ✅ **NO** ve comisiones 1K1 ni 2K1 (de García)
- ✅ Puede subir entregas solo a 1K2
- ✅ **NO** puede ver entregas de García

#### Pruebas con prof-rodriguez (UBA):

**Verificar multi-tenant:**
- ✅ Login con prof-rodriguez
- ✅ Ve "Comisión 1" de UBA
- ✅ **NO** ve comisiones de UTN
- ✅ Puede subir entregas a Comisión 1 de UBA
- ✅ **NO** puede ver entregas de UTN

---

### 👤 Role 4: User (Estudiante)

**Credenciales (UTN):**
```
Usuario: estudiante-utn
Contraseña: user123
```

**Credenciales (UBA):**
```
Usuario: estudiante-uba
Contraseña: user123
```

#### Pruebas:

**1. Login y Redirección**
- ✅ Login exitoso
- ✅ Redirige a `/` (interfaz de corrección)
- ✅ Navbar muestra solo "Corrección" y "Cerrar Sesión"

**2. Interfaz de Corrección**
- ✅ Ver sección de subir archivo PDF
- ✅ Ver sección de subir rúbrica
- ✅ Botón "Corregir con IA" disponible
- ✅ Funcionalidad de corrección manual funciona (FASE 1 original)

**3. Limitaciones (Testing de Seguridad)**
- ✅ **NO** puede acceder a `/admin` (redirige o da 403)
- ✅ **NO** puede acceder a `/professor` (redirige o da 403)
- ✅ **NO** tiene opciones de gestión en navbar
- ✅ Solo puede usar corrección manual

---

## 🔄 Testing de n8n Workflows

### Workflow: Upload File to Drive

#### 1. Configuración Previa

**Verificar en n8n:**
```bash
# Abrir n8n
http://localhost:5678

# Verificar:
1. Workflow "Upload File to Drive" existe
2. Está "Active" (toggle verde)
3. Nodo "Google Drive" tiene credenciales configuradas (icono verde)
4. Copiar URL del webhook
```

**Actualizar backend/.env:**
```bash
N8N_UPLOAD_FILE_TO_DRIVE_WEBHOOK=https://tu-n8n.example.com/webhook/upload-file-to-drive
```

**Reiniciar backend:**
```bash
cd backend
# Ctrl+C para detener
npm run dev
```

#### 2. Testing desde Postman

**Crear Request:**
```
Method: POST
URL: {{n8n_url}}/webhook/upload-file-to-drive
Body: form-data
```

**Parámetros:**
```
file: [Seleccionar archivo .txt]
fileName: test-alumno.txt
folderId: [ID de carpeta en Drive]
```

**Obtener folderId:**
```bash
# 1. Ir a Google Drive
# 2. Crear carpeta de prueba "Test Uploads"
# 3. Abrir carpeta
# 4. Copiar ID de URL:
#    URL: https://drive.google.com/drive/folders/1abcd1234efgh5678ijkl
#    ID: 1abcd1234efgh5678ijkl
```

**Ejecutar Request:**
- ✅ Status 200
- ✅ Response:
  ```json
  {
    "success": true,
    "drive_file_id": "1XyZ...",
    "drive_file_url": "https://drive.google.com/file/d/1XyZ.../view",
    "file_name": "test-alumno.txt"
  }
  ```

**Verificar en Drive:**
- ✅ Abrir `drive_file_url` en navegador
- ✅ Ver archivo en Drive
- ✅ Descargar y verificar contenido

#### 3. Testing desde el Sistema

**Flujo completo:**
```bash
# 1. Login como profesor (prof-garcia)
# 2. Seleccionar comisión 1K1
# 3. Seleccionar rúbrica "TP1 - Diseño de Sistemas"
# 4. Click en "Subir Entrega"
# 5. Ingresar nombre: "Pedro Martinez"
# 6. Seleccionar archivo .txt
# 7. Click en "Subir"
```

**Verificar backend logs:**
```bash
# En terminal del backend, ver:
📤 Subiendo archivo a Drive...
   Archivo: pedro-martinez.txt
   Carpeta: 1abcd1234...
✅ Archivo subido a Drive
   File ID: 1XyZ...
   URL: https://drive.google.com/file/d/1XyZ.../view
```

**Verificar en n8n:**
```bash
# Ir a n8n > Executions
# Ver última ejecución del workflow
# Verificar:
- ✅ Status: Success
- ✅ Webhook recibió datos correctos
- ✅ Google Drive Upload ejecutó correctamente
- ✅ Response enviado
```

**Verificar en MongoDB:**
```bash
mongo
> use correccion-automatica
> db.submissions.find().pretty()

# Verificar documento:
{
  student_name: "Pedro Martinez",
  drive_file_id: "1XyZ...",
  drive_file_url: "https://drive.google.com/file/d/1XyZ.../view",
  drive_file_name: "pedro-martinez.txt",
  status: "uploaded"
}
```

#### 4. Testing de Errores

**Error 1: FolderId Inválido**
```bash
# En Postman, usar folderId falso: "123invalid"
# Verificar:
- ✅ Status 500
- ✅ Response: { "success": false, "error": "Invalid folder ID" }
```

**Error 2: Sin Credenciales**
```bash
# En n8n, desconectar credenciales de Google Drive
# Intentar subir archivo desde el sistema
# Verificar:
- ✅ Error en n8n execution
- ✅ Backend recibe error 500
- ✅ Frontend muestra mensaje de error
```

**Error 3: Archivo Muy Grande**
```bash
# Crear archivo .txt de 15MB
# Intentar subirlo desde el sistema
# Verificar:
- ✅ Frontend valida tamaño antes de enviar
- ✅ Error: "El archivo supera el límite de 10MB"
```

**Error 4: Archivo No .txt**
```bash
# Intentar subir archivo .pdf
# Verificar:
- ✅ Frontend valida extensión
- ✅ Error: "Solo se permiten archivos .txt"
```

#### 5. Testing de Performance

**Subir múltiples archivos:**
```bash
# Login como profesor
# Subir 5 entregas seguidas
# Verificar:
- ✅ Todas suben correctamente
- ✅ Sin errores de timeout
- ✅ Todas aparecen en la lista
- ✅ Todas están en Drive
```

---

## 🔄 Escenarios End-to-End

### Escenario 1: Crear Universidad y Estructura Completa

**Actores:** Super Admin

**Pasos:**
1. ✅ Login como superadmin
2. ✅ Crear universidad "UNLP"
3. ✅ Cambiar selector a "UNLP"
4. ✅ Crear facultad "Facultad de Informática"
5. ✅ Crear carrera "Licenciatura en Informática"
6. ✅ Crear curso "Algoritmos I" (año 2025)
7. ✅ Crear comisión "Comisión A"
8. ✅ Crear usuario profesor "prof-unlp" (role: professor, universidad: UNLP)
9. ✅ Editar comisión para asignar "prof-unlp"
10. ✅ Crear rúbrica para "Comisión A"
11. ✅ **Crear carpeta en Google Drive manualmente** para la rúbrica
12. ✅ Editar rúbrica y agregar `drive_folder_id`

**Verificaciones:**
- ✅ Todas las entidades creadas correctamente
- ✅ Profesor asignado a comisión
- ✅ Rúbrica tiene drive_folder_id

---

### Escenario 2: Flujo Completo de Entrega

**Actores:** Professor (prof-unlp)

**Pasos:**
1. ✅ Logout de superadmin
2. ✅ Login como prof-unlp
3. ✅ Verificar que ve "Comisión A" en sidebar
4. ✅ Seleccionar comisión
5. ✅ Ver rúbrica creada
6. ✅ Click en "Subir Entrega"
7. ✅ Ingresar estudiante: "Ana Rodriguez"
8. ✅ Subir archivo `ana-rodriguez.txt`
9. ✅ Ver entrega en la lista con estado "Subido"
10. ✅ Click en "Ver en Drive"
11. ✅ Verificar archivo en Drive
12. ✅ Repetir para 3 estudiantes más

**Verificaciones:**
- ✅ 4 entregas creadas
- ✅ 4 archivos en Drive
- ✅ Todas con estado "uploaded"
- ✅ URLs funcionan correctamente

---

### Escenario 3: Multi-Tenant Isolation

**Actores:** University Admin (admin-utn), University Admin (admin-uba)

**Pasos:**

**Como admin-utn:**
1. ✅ Login como admin-utn
2. ✅ Ir a "Comisiones"
3. ✅ Crear comisión "4K1" en UTN
4. ✅ Asignar profesor García
5. ✅ Logout

**Como admin-uba:**
6. ✅ Login como admin-uba
7. ✅ Ir a "Comisiones"
8. ✅ **NO** ver comisión "4K1" de UTN
9. ✅ Crear comisión "Comisión 2" en UBA
10. ✅ Asignar profesor Rodriguez
11. ✅ Logout

**Como superadmin:**
12. ✅ Login como superadmin
13. ✅ Seleccionar "UTN" → ver comisión "4K1"
14. ✅ Seleccionar "UBA" → ver comisión "Comisión 2"
15. ✅ Seleccionar "Todas las Universidades" → ver ambas

**Verificaciones:**
- ✅ admin-utn **no** ve datos de UBA
- ✅ admin-uba **no** ve datos de UTN
- ✅ superadmin ve todo
- ✅ Profesores solo ven sus comisiones

---

### Escenario 4: Role-Based Access Control

**Actores:** Todos los roles

**Pasos:**

**Como user (estudiante-utn):**
1. ✅ Login
2. ✅ Intentar acceder a `/admin` → 403 o redirige
3. ✅ Intentar acceder a `/professor` → 403 o redirige
4. ✅ Solo puede usar `/` (corrección)

**Como professor (prof-garcia):**
5. ✅ Login
6. ✅ Intentar acceder a `/admin` → 403 o redirige
7. ✅ Puede acceder a `/professor`
8. ✅ Solo ve sus comisiones (1K1, 2K1)

**Como university-admin (admin-utn):**
9. ✅ Login
10. ✅ Puede acceder a `/admin`
11. ✅ Solo ve datos de UTN
12. ✅ **NO** puede acceder a "Universidades"

**Como super-admin:**
13. ✅ Login
14. ✅ Acceso completo a todo
15. ✅ Puede acceder a "Universidades"
16. ✅ Ve datos de todas las universidades

---

### Escenario 5: Gestión de Profesores en Comisiones

**Actores:** Super Admin, Professor

**Pasos:**

**Como superadmin:**
1. ✅ Login
2. ✅ Ir a "Comisiones" (UTN)
3. ✅ Crear comisión "5K1" en curso "Diseño"
4. ✅ Editar comisión "5K1"
5. ✅ Asignar profesor "María García"
6. ✅ Asignar profesor "Juan López"
7. ✅ Verificar que ambos aparecen en la lista
8. ✅ Remover "Juan López"
9. ✅ Verificar que solo queda "María García"

**Como prof-garcia:**
10. ✅ Login
11. ✅ Verificar que ahora ve "Comisión 5K1" en sidebar
12. ✅ Puede subir entregas a 5K1

**Como prof-lopez:**
13. ✅ Login
14. ✅ **NO** ve "Comisión 5K1" (fue removido)

---

## ✅ Checklist de Testing

### Backend

#### Autenticación y Autorización
- [ ] Login con cada rol (super-admin, university-admin, professor, user)
- [ ] Logout correctamente borra token
- [ ] Token expirado redirige a login
- [ ] Middleware `requireRoles` bloquea roles no autorizados
- [ ] Middleware `checkUniversityAccess` valida university_id

#### API Endpoints - Universidades
- [ ] GET /api/universities (solo super-admin)
- [ ] POST /api/universities (solo super-admin)
- [ ] PUT /api/universities/:id (solo super-admin)
- [ ] DELETE /api/universities/:id (soft delete, solo super-admin)

#### API Endpoints - Usuarios
- [ ] GET /api/users (filtrado por universidad)
- [ ] POST /api/users (con validación de university_id)
- [ ] PUT /api/users/:id (con restricciones por rol)
- [ ] DELETE /api/users/:id (soft delete)

#### API Endpoints - Facultades
- [ ] GET /api/faculties (filtrado por universidad)
- [ ] POST /api/faculties (con university_id)
- [ ] PUT /api/faculties/:id (verificar ownership)
- [ ] DELETE /api/faculties/:id (soft delete)

#### API Endpoints - Carreras
- [ ] GET /api/careers (filtrado por universidad)
- [ ] POST /api/careers (con validación de faculty)
- [ ] PUT /api/careers/:id
- [ ] DELETE /api/careers/:id

#### API Endpoints - Cursos
- [ ] GET /api/courses (filtrado por universidad)
- [ ] POST /api/courses (con validación de career)
- [ ] PUT /api/courses/:id
- [ ] DELETE /api/courses/:id

#### API Endpoints - Comisiones
- [ ] GET /api/commissions (filtrado por universidad)
- [ ] GET /api/commissions/my (solo profesores, sus comisiones)
- [ ] POST /api/commissions
- [ ] PUT /api/commissions/:id
- [ ] POST /api/commissions/:id/assign-professor (asignar profesor)
- [ ] DELETE /api/commissions/:id/professors/:professorId (remover profesor)
- [ ] DELETE /api/commissions/:id

#### API Endpoints - Rúbricas
- [ ] GET /api/rubrics (filtrado por universidad)
- [ ] GET /api/rubrics/commission/:commissionId (rúbricas de comisión)
- [ ] POST /api/rubrics
- [ ] PUT /api/rubrics/:id
- [ ] DELETE /api/rubrics/:id

#### API Endpoints - Submissions
- [ ] GET /api/submissions/commission/:commissionId (solo profesor asignado)
- [ ] POST /api/submissions (subir archivo .txt)
- [ ] DELETE /api/submissions/:id (solo profesor de la comisión)

### Frontend

#### Componentes - Login
- [ ] Formulario funciona correctamente
- [ ] Validación de campos
- [ ] Mensajes de error apropiados
- [ ] Redirección basada en rol

#### Componentes - Admin Panel
- [ ] Selector de universidad (solo super-admin)
- [ ] Navegación entre secciones
- [ ] CRUD de todas las entidades
- [ ] Modales de crear/editar funcionan
- [ ] Eliminación con confirmación

#### Componentes - Professor View
- [ ] Sidebar muestra comisiones correctas
- [ ] Selección de comisión actualiza panel
- [ ] Lista de rúbricas carga correctamente
- [ ] Modal de subir entrega funciona
- [ ] Validación de archivos (.txt, tamaño)
- [ ] Preview de archivo
- [ ] Lista de entregas actualiza tras upload
- [ ] Botones "Ver en Drive" y "Eliminar" funcionan

#### Componentes - User View
- [ ] Interfaz de corrección carga
- [ ] Puede subir PDF y rúbrica
- [ ] Corrección con IA funciona (FASE 1 original)

#### Routing
- [ ] Rutas protegidas funcionan
- [ ] Redirecciones basadas en rol
- [ ] 403/404 para rutas no autorizadas
- [ ] Navegación entre secciones

#### Navbar
- [ ] Muestra opciones correctas por rol
- [ ] Logout funciona
- [ ] Links redirigen correctamente

### n8n Workflows

#### Upload File to Drive
- [ ] Workflow está activo
- [ ] Credenciales de Google Drive configuradas
- [ ] Webhook recibe datos correctos
- [ ] Upload a Drive funciona
- [ ] Response retorna file_id y URL
- [ ] Manejo de errores (folder inválido, credenciales, etc.)

#### Testing de Integración
- [ ] Backend llama al webhook correctamente
- [ ] FormData se envía correctamente
- [ ] Timeout configurado (60s)
- [ ] Errores del workflow se manejan en backend

### Database (MongoDB)

#### Modelos
- [ ] Validaciones funcionan (required, enum, etc.)
- [ ] Soft delete (deleted: true)
- [ ] Índices únicos (username, email, university_id + _id)
- [ ] Métodos personalizados (assignProfessor, etc.)

#### Seed Data
- [ ] Script crea 2 universidades
- [ ] Script crea 9 usuarios
- [ ] Script crea estructura académica completa
- [ ] Profesores asignados correctamente
- [ ] Rúbricas creadas

### Seguridad

#### Autenticación
- [ ] Passwords hasheados (bcrypt)
- [ ] JWT tokens seguros
- [ ] Token expiration funciona

#### Autorización
- [ ] Usuarios solo ven datos de su universidad
- [ ] Profesores solo ven sus comisiones
- [ ] University-admin no puede acceder a otras universidades
- [ ] Super-admin tiene acceso global

#### Validación
- [ ] Validación de archivos (.txt, tamaño)
- [ ] Validación de campos en formularios
- [ ] Validación de university_id en requests
- [ ] Sanitización de inputs

---

## 🔐 Testing de Seguridad

### 1. Testing de Autorización con Postman

**Obtener tokens:**
```bash
# Login como cada rol y copiar token
POST http://localhost:5000/api/auth/login
Body: { "username": "superadmin", "password": "admin123" }
# Copiar response.token
```

**Probar acceso no autorizado:**

**Test 1: User intenta acceder a admin endpoints**
```bash
# Usar token de estudiante-utn
GET http://localhost:5000/api/universities
Headers: Authorization: Bearer {student_token}

# Esperado: 403 Forbidden
```

**Test 2: University-admin intenta acceder a otra universidad**
```bash
# Usar token de admin-utn
GET http://localhost:5000/api/commissions
Headers: Authorization: Bearer {admin_utn_token}

# Esperado: Solo comisiones de UTN, no de UBA
```

**Test 3: Professor intenta acceder a comisión no asignada**
```bash
# Usar token de prof-garcia (asignado a 1K1, 2K1)
GET http://localhost:5000/api/submissions/commission/{1k2_id}
Headers: Authorization: Bearer {prof_garcia_token}

# Esperado: 403 Forbidden (1K2 es de prof-lopez)
```

**Test 4: Professor intenta subir entrega a comisión no asignada**
```bash
# Usar token de prof-lopez (asignado solo a 1K2)
POST http://localhost:5000/api/submissions
Headers: Authorization: Bearer {prof_lopez_token}
Body: {
  "commission_id": "{1k1_id}",  // Comisión de García
  "rubric_id": "...",
  "student_name": "Hack Attempt"
}

# Esperado: 403 Forbidden
```

### 2. Testing de Validación

**Test 1: Crear usuario sin university_id (no super-admin)**
```bash
POST http://localhost:5000/api/users
Headers: Authorization: Bearer {admin_utn_token}
Body: {
  "username": "test",
  "role": "professor",
  "university_id": null  // Inválido para professor
}

# Esperado: 400 Bad Request
```

**Test 2: Subir archivo no .txt**
```bash
POST http://localhost:5000/api/submissions
Headers:
  Authorization: Bearer {prof_token}
  Content-Type: multipart/form-data
Body:
  file: [archivo.pdf]
  commission_id: "..."
  rubric_id: "..."

# Esperado: 400 Bad Request - Solo archivos .txt
```

**Test 3: Crear comisión con university_id diferente a faculty**
```bash
POST http://localhost:5000/api/commissions
Body: {
  "faculty_id": "{frba_id}",  // FRBA es de UTN
  "university_id": "uba"      // Mismatch!
}

# Esperado: 400 Bad Request - Faculty no pertenece a universidad
```

### 3. Testing de Aislamiento Multi-Tenant

**Test: Verificar que los datos no se filtran entre universidades**

```bash
# 1. Como admin-utn, crear comisión "SECRET-UTN"
POST /api/commissions
Headers: Authorization: Bearer {admin_utn_token}
Body: { ..., "commission_id": "secret-utn" }

# 2. Copiar el _id de la comisión creada

# 3. Como admin-uba, intentar acceder a esa comisión
GET /api/commissions/{secret_utn_id}
Headers: Authorization: Bearer {admin_uba_token}

# Esperado: 403 Forbidden o 404 Not Found

# 4. Como admin-uba, intentar editar la comisión
PUT /api/commissions/{secret_utn_id}
Headers: Authorization: Bearer {admin_uba_token}

# Esperado: 403 Forbidden
```

---

## 🐛 Troubleshooting

### Error: "Cannot connect to backend"

**Síntomas:** Frontend no carga datos, Network Error en consola

**Soluciones:**
1. Verificar que backend esté corriendo: `http://localhost:5000/health`
2. Verificar `VITE_API_URL` en frontend/.env
3. Verificar CORS en backend/.env (`FRONTEND_URL`)
4. Reiniciar backend

### Error: "Unauthorized" o "Token expired"

**Síntomas:** Usuario redirigido a login constantemente

**Soluciones:**
1. Borrar localStorage: `localStorage.clear()` en consola
2. Login nuevamente
3. Verificar `JWT_EXPIRES_IN` en backend/.env

### Error: "No commissions found"

**Síntomas:** Profesor no ve comisiones en ProfessorView

**Soluciones:**
1. Verificar que el profesor esté asignado:
   ```bash
   mongo
   > use correccion-automatica
   > db.commissions.find({ professors: ObjectId("...") })
   ```
2. Verificar que las comisiones no estén eliminadas (`deleted: false`)
3. Re-ejecutar seed: `node src/scripts/seedMultiTenant.js`

### Error: "Webhook timeout"

**Síntomas:** Upload de archivo tarda mucho y falla

**Soluciones:**
1. Verificar que n8n esté corriendo
2. Verificar que workflow esté activo
3. Verificar credenciales de Google Drive en n8n
4. Aumentar timeout en backend (submissionController.js):
   ```javascript
   timeout: 120000  // 2 minutos
   ```

### Error: "Invalid folder ID" en n8n

**Síntomas:** Upload falla con error de Drive

**Soluciones:**
1. Verificar que la rúbrica tenga `drive_folder_id` configurado
2. Verificar que la carpeta exista en Drive
3. Verificar que la cuenta de n8n tenga permisos en esa carpeta

### Error: "Professor not found" al asignar

**Síntomas:** No se puede asignar profesor a comisión

**Soluciones:**
1. Verificar que el profesor tenga role: 'professor'
2. Verificar que el profesor tenga la misma university_id que la comisión
3. Verificar en UsersManager que el profesor existe

---

## 📊 Resumen de Testing

Al completar esta guía, habrás verificado:

- ✅ **Autenticación**: Login/logout para 4 roles
- ✅ **Autorización**: RBAC funciona correctamente
- ✅ **Multi-Tenant**: Aislamiento entre universidades
- ✅ **CRUD**: Todas las entidades se gestionan correctamente
- ✅ **Professor Features**: Subir entregas, ver comisiones
- ✅ **n8n Integration**: Upload de archivos a Drive
- ✅ **Seguridad**: Validaciones, no hay fugas de datos
- ✅ **End-to-End**: Flujos completos funcionan

---

## 📝 Notas Finales

- Esta guía cubre testing manual. Para testing automatizado (Jest, Cypress), ver `FASE 8` del plan.
- Antes de pasar a producción, ejecutar todos los tests de seguridad.
- Mantener logs del backend para debugging.
- Documentar cualquier bug encontrado en GitHub Issues.

---

## 🎯 Próximos Pasos

1. ✅ Completar todos los tests de esta guía
2. ✅ Documentar bugs encontrados
3. ✅ Ejecutar tests de performance (múltiples uploads simultáneos)
4. ✅ Testing en diferentes navegadores (Chrome, Firefox, Safari)
5. ✅ Testing responsive (móvil, tablet)
6. ✅ Preparar para FASE 8 (testing automatizado)
