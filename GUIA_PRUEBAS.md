# 🧪 GUÍA DE PRUEBAS - Sistema de Corrección Automática

> Guía paso a paso para probar todas las funcionalidades implementadas en las Fases 1, 2 y 3

**Fecha**: 22 de Octubre, 2025
**Progreso**: 83% (29/35 tareas - Fases 1-3.5 completadas)

---

## 📋 ÍNDICE

1. [Requisitos Previos](#-requisitos-previos)
2. [Iniciar el Sistema](#-iniciar-el-sistema)
3. [Probar Login](#-probar-login)
4. [Probar Admin Panel](#-probar-admin-panel)
5. [Probar Vista de Usuario](#-probar-vista-de-usuario)
6. [Probar CRUD de Usuarios](#-probar-crud-de-usuarios)
7. [Troubleshooting](#-troubleshooting)

---

## ✅ REQUISITOS PREVIOS

Antes de comenzar, asegúrate de tener:

- [x] **MongoDB** corriendo (local o Atlas)
- [x] **Backend** configurado (`.env` con conexión MongoDB y JWT_SECRET)
- [x] **Datos migrados** (`npm run seed` ejecutado en backend)
- [x] **Frontend** con `.env` configurado (`VITE_API_URL=http://localhost:5000`)

---

## 🚀 INICIAR EL SISTEMA

### 1. Iniciar MongoDB (si es local)

```bash
# Terminal 1
mongod
```

Dejar esta terminal abierta.

### 2. Iniciar Backend

```bash
# Terminal 2
cd backend
npm run dev
```

Deberías ver:
```
============================================================
🚀 Servidor iniciado correctamente
📡 Puerto: 5000
🌍 Entorno: development
🔗 URL: http://localhost:5000
============================================================
```

### 3. Iniciar Frontend

```bash
# Terminal 3
cd frontend-n8n
npm run dev
```

Deberías ver:
```
  VITE v4.4.9  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 4. Abrir el Navegador

Ir a: **http://localhost:5173/**

---

## 🔐 PROBAR LOGIN

### Paso 1: Pantalla de Login

1. Al abrir `http://localhost:5173/` serás redirigido a `/login`
2. Verás la pantalla de login con:
   - Logo circular con gradiente
   - Título "Sistema de Corrección Automática"
   - Formulario con Usuario y Contraseña
   - Usuarios de prueba mostrados abajo

### Paso 2: Login como Admin

**Credenciales:**
- Usuario: `admin`
- Contraseña: `admin123`

**Resultado esperado:**
- ✅ Redirige a `/` (home)
- ✅ Muestra navbar con "Panel de Administración"
- ✅ Muestra nombre de usuario "admin" y rol "admin"
- ✅ Botón "Cerrar Sesión" visible
- ✅ Muestra la vista de UserView (3 secciones con cards)

### Paso 3: Login como Usuario Normal

1. Hacer logout (botón "Cerrar Sesión")
2. Volver a login

**Credenciales:**
- Usuario: `usuario`
- Contraseña: `usuario123`

**Resultado esperado:**
- ✅ Redirige a `/` (home)
- ✅ Muestra navbar con "Vista de Usuario"
- ✅ Muestra nombre de usuario "usuario" y rol "user"
- ✅ Muestra la vista de UserView (3 secciones con cards)
- ❌ **NO** tiene acceso a `/admin` (si intentas ir, te redirige a `/`)

---

## 👨‍💼 PROBAR ADMIN PANEL

### Requisito: Estar logueado como `admin`

### Paso 1: Acceder al Admin Panel

1. Login como `admin` / `admin123`
2. Ir a: `http://localhost:5173/admin`

**Resultado esperado:**
- ✅ Muestra aside lateral con 3 tabs:
  - 🏫 Universidades
  - 📚 Materias
  - 📋 Rúbricas
- ✅ Tab "Universidades" activo por defecto (fondo gradiente)
- ✅ Muestra tabla con las 4 universidades migradas

### Paso 2: CRUD de Universidades

#### A. Listar

**Resultado esperado:**
- ✅ Tabla muestra:
  - UTN - Facultad Regional Mendoza (utn-frm)
  - UTN - Facultad Regional San Nicolás (utn-frsn)
  - UTN - Facultad Regional Avellaneda (utn-fra)
  - UTN - Facultad Regional Buenos Aires (utn-frba)
- ✅ Cada fila tiene botones "Editar" y "Eliminar"

#### B. Crear Universidad

1. Clic en botón **"+ Crear Universidad"**
2. Modal se abre
3. Llenar:
   - ID: `utn-frc`
   - Nombre: `UTN - Facultad Regional Córdoba`
4. Clic en **"Guardar"**

**Resultado esperado:**
- ✅ Modal se cierra
- ✅ Tabla se recarga automáticamente
- ✅ Nueva universidad aparece en la tabla

#### C. Editar Universidad

1. Clic en **"Editar"** de la universidad recién creada
2. Modal se abre con datos pre-llenados
3. Cambiar nombre a: `UTN - FRC`
4. Clic en **"Guardar"**

**Resultado esperado:**
- ✅ Modal se cierra
- ✅ Tabla se actualiza con el nuevo nombre

#### D. Eliminar Universidad

1. Clic en **"Eliminar"** de la universidad creada
2. Confirmar en el alert

**Resultado esperado:**
- ✅ Universidad desaparece de la tabla (baja lógica)

### Paso 3: CRUD de Materias

#### A. Cambiar de Tab

1. Clic en tab **"📚 Materias"**

**Resultado esperado:**
- ✅ Tab se activa (fondo gradiente)
- ✅ Muestra tabla con los 17 cursos migrados
- ✅ Muestra select **"Filtrar por universidad"**
- ✅ Muestra botón **"+ Crear Curso"**

#### B. Filtrar por Universidad

1. Seleccionar en el filtro: **"UTN - Facultad Regional Mendoza"**

**Resultado esperado:**
- ✅ Tabla se actualiza automáticamente
- ✅ Solo muestra los 5 cursos de UTN-FRM:
  - Programación 1
  - Programación 2
  - Programación 3
  - Bases de Datos 1
  - Diseño de Sistemas

#### C. Crear Curso

1. Clic en **"+ Crear Curso"**
2. Llenar:
   - ID: `algoritmos-1`
   - Nombre: `Algoritmos y Estructuras de Datos 1`
   - Universidad: `UTN - Facultad Regional Mendoza`
3. Clic en **"Guardar"**

**Resultado esperado:**
- ✅ Modal se cierra
- ✅ Nuevo curso aparece en la tabla

#### D. Editar y Eliminar

Similar a universidades.

### Paso 4: CRUD de Rúbricas

#### A. Cambiar de Tab

1. Clic en tab **"📋 Rúbricas"**

**Resultado esperado:**
- ✅ Tab se activa
- ✅ Muestra tabla con las 5 rúbricas migradas
- ✅ Muestra 2 selects de filtro (Universidad + Curso)
- ✅ Muestra 2 botones: **"+ Desde JSON"** y **"+ Desde PDF"**

#### B. Filtrar Rúbricas

1. Seleccionar Universidad: **"UTN - Facultad Regional Mendoza"**
2. Seleccionar Curso: **"Programación 1"**

**Resultado esperado:**
- ✅ Tabla muestra solo la rúbrica "TP Listas" de UTN-FRM
- ✅ Badge muestra "MANUAL" como fuente

#### C. Ver Rúbrica

1. Clic en **"Ver"** de cualquier rúbrica

**Resultado esperado:**
- ✅ Modal se abre en modo solo lectura
- ✅ Muestra el JSON completo de la rúbrica en un textarea
- ✅ **No** muestra botón "Guardar" (solo "Cancelar")

#### D. Descargar Rúbrica

1. Clic en **"Descargar"**

**Resultado esperado:**
- ✅ Descarga un archivo `.json` con el nombre del rubric_id

#### E. Crear Rúbrica desde JSON

1. Clic en **"+ Desde JSON"**
2. Llenar:
   - Nombre: `TP Funciones`
   - Universidad: `UTN - Facultad Regional Mendoza`
   - Curso: `Programación 1`
   - JSON: (pegar un JSON válido, ej: copiar de otra rúbrica y cambiar el rubric_id)
3. Clic en **"Guardar"**

**Resultado esperado:**
- ✅ Si el JSON es válido, se crea la rúbrica
- ✅ Si el JSON es inválido, muestra error de validación

#### F. Crear Rúbrica desde PDF

1. Clic en **"+ Desde PDF"**
2. Llenar:
   - Nombre: `TP Arrays`
   - Universidad: `UTN - Facultad Regional Mendoza`
   - Curso: `Programación 2`
   - PDF: (seleccionar un archivo PDF)
3. Clic en **"Guardar"**

**Resultado esperado:**
- ✅ Archivo PDF se envía al webhook de n8n
- ✅ n8n procesa el PDF y devuelve el JSON
- ✅ Rúbrica se guarda con source: "PDF"
- ⚠️ **Nota**: Esto requiere que tu webhook de n8n esté configurado y funcionando

#### G. Editar Rúbrica

1. Clic en **"Editar"** de cualquier rúbrica
2. Modal se abre con JSON editable
3. Modificar el JSON (ej: cambiar el título)
4. Clic en **"Guardar"**

**Resultado esperado:**
- ✅ Cambios se guardan
- ✅ Tabla se actualiza

#### H. Eliminar Rúbrica

1. Clic en **"Eliminar"**
2. Confirmar

**Resultado esperado:**
- ✅ Rúbrica desaparece (baja lógica)

---

## 👤 PROBAR VISTA DE USUARIO

### Requisito: Estar logueado (admin o usuario normal)

### Paso 1: Ir a la Vista de Usuario

1. Ir a: `http://localhost:5173/` (home)

**Resultado esperado:**
- ✅ Muestra 3 secciones (cards):
  1. Contexto Académico
  2. Subir Archivo a Corregir
  3. Subir Resultados a Planilla

### Paso 2: Seleccionar Contexto Académico

1. **Universidad**: Seleccionar `UTN - Facultad Regional Mendoza`

**Resultado esperado:**
- ✅ Select de "Materia" se habilita
- ✅ Muestra los cursos de UTN-FRM

2. **Materia**: Seleccionar `Programación 1`

**Resultado esperado:**
- ✅ Select de "Rúbrica" se habilita
- ✅ Muestra las rúbricas de UTN-FRM + Programación 1

3. **Rúbrica**: Seleccionar `TP Listas`

**Resultado esperado:**
- ✅ Rúbrica seleccionada

### Paso 3: Subir Archivo a Corregir

1. En la sección 2, hacer clic en **"Archivo del Alumno"**
2. Seleccionar un archivo (puede ser cualquiera: .py, .txt, .pdf, etc.)
3. Clic en **"Corregir Archivo"**

**Resultado esperado:**
- ✅ Botón muestra "Cargando..." con spinner
- ✅ Se envía FormData al webhook de n8n con:
  - `rubric`: JSON de la rúbrica
  - `submission`: Archivo del alumno
- ✅ **SI webhook n8n está configurado:**
  - Muestra resultado con nota, resumen, fortalezas, recomendaciones
  - Auto-llena los campos de la sección 3
- ❌ **SI webhook n8n NO está configurado:**
  - Muestra error de conexión

### Paso 4: Subir Resultados a Planilla

1. Llenar los campos (si no se auto-llenaron):
   - URL del Spreadsheet
   - Nombre de la Hoja
   - Alumno
   - Nota
   - Resumen por Criterios
   - Fortalezas
   - Recomendaciones

2. Clic en **"Subir a Planilla"**

**Resultado esperado:**
- ✅ Botón muestra "Cargando..."
- ✅ Datos se envían al webhook de Google Sheets
- ✅ **SI webhook está configurado:** Muestra alert "Datos subidos exitosamente"
- ❌ **SI webhook NO está configurado:** Muestra error

---

## 👥 PROBAR CRUD DE USUARIOS

### Requisito: Estar logueado como `admin`

### Paso 1: Acceder al CRUD de Usuarios

1. Login como `admin` / `admin123`
2. Ir a: `http://localhost:5173/admin`
3. Hacer clic en la pestaña **"👥 Usuarios"**

**Resultado esperado:**
- ✅ Se abre el CRUD de Usuarios
- ✅ Muestra tabla con 2 usuarios (admin y usuario)
- ✅ Columnas: Usuario, Rol, Estado, Fecha de Creación, Acciones
- ✅ Ambos usuarios tienen estado "✅ Activo"
- ✅ Checkbox "Mostrar eliminados" (sin marcar)
- ✅ Botón "+ Crear Usuario"

### Paso 2: Crear Usuario

1. Hacer clic en **"+ Crear Usuario"**
2. Modal se abre
3. Llenar:
   - Username: `profesor1`
   - Password: `profesor123`
   - Rol: `👤 Usuario`
4. Hacer clic en **"Guardar"**

**Resultado esperado:**
- ✅ Modal se cierra
- ✅ Tabla se recarga automáticamente
- ✅ Nuevo usuario aparece con badge "✅ Activo"
- ✅ Contador muestra "3 usuarios activos"

### Paso 3: Validaciones de Usuario

#### A. Username inválido
1. Intentar crear usuario con username: `PROFESOR2` (mayúsculas)
2. **Resultado esperado:** Se convierte automáticamente a minúsculas

#### B. Username duplicado
1. Intentar crear usuario con username: `profesor1`
2. **Resultado esperado:** Error "El nombre de usuario ya está en uso"

#### C. Password corta
1. Intentar crear usuario con password: `12345` (5 caracteres)
2. **Resultado esperado:** Error "Mínimo 6 caracteres"

### Paso 4: Editar Usuario

1. Hacer clic en **"Editar"** del usuario `profesor1`
2. Modal se abre con datos pre-llenados
3. Cambiar:
   - Password: `nuevapass123` (opcional)
   - Rol: `👨‍💼 Admin`
4. Hacer clic en **"Guardar"**

**Resultado esperado:**
- ✅ Modal se cierra
- ✅ Badge de rol cambia a "👨‍💼 Admin"
- ✅ Usuario sigue activo

### Paso 5: Eliminar Usuario (Soft Delete)

1. Hacer clic en **"Eliminar"** del usuario `profesor1`
2. Confirmar en el alert
3. **Resultado esperado:**
   - ✅ Usuario desaparece de la tabla
   - ✅ Contador muestra "2 usuarios activos"

### Paso 6: Ver Usuarios Eliminados

1. Marcar checkbox **"Mostrar eliminados"**
2. **Resultado esperado:**
   - ✅ Tabla se recarga
   - ✅ Aparecen 3 usuarios
   - ✅ `profesor1` tiene badge "🚫 Eliminado"
   - ✅ Solo muestra botón "Restaurar" (sin Editar/Eliminar)
   - ✅ Contador muestra "3 usuarios en total"

### Paso 7: Restaurar Usuario

1. Hacer clic en **"Restaurar"** del usuario `profesor1`
2. Confirmar
3. **Resultado esperado:**
   - ✅ Badge cambia a "✅ Activo"
   - ✅ Aparecen botones "Editar" y "Eliminar"
   - ✅ Usuario funcional nuevamente

### Paso 8: Probar Login con Usuario Eliminado

1. Desmarcar "Mostrar eliminados"
2. Eliminar usuario `profesor1`
3. Hacer logout
4. Intentar login con `profesor1` / `nuevapass123`
5. **Resultado esperado:**
   - ❌ Error: "Esta cuenta ha sido deshabilitada. Contacte al administrador."
   - ❌ No puede acceder al sistema

### Paso 9: Protección del Usuario Admin

1. Login como `admin`
2. Ir a Admin Panel → Usuarios
3. Intentar eliminar usuario `admin`
4. **Resultado esperado:**
   - ⚠️ Botón "Eliminar" está deshabilitado
   - ⚠️ Si se intenta, muestra error

5. Intentar editar usuario `admin` y cambiar:
   - Username o Rol
6. **Resultado esperado:**
   - ⚠️ Campos deshabilitados o mensaje de advertencia
   - ⚠️ No se puede cambiar username ni rol del admin principal

### Paso 10: Login con Usuario Restaurado

1. Restaurar `profesor1` desde el admin panel
2. Hacer logout
3. Login con `profesor1` / `nuevapass123`
4. **Resultado esperado:**
   - ✅ Login exitoso
   - ✅ Acceso al sistema según su rol

---

## 🐛 TROUBLESHOOTING

### Problema 1: "No se pudo conectar con el servidor"

**Causa**: Backend no está corriendo o .env del frontend tiene URL incorrecta

**Solución**:
```bash
# Verificar que backend esté corriendo
curl http://localhost:5000/health

# Verificar .env del frontend
cat frontend-n8n/.env
# Debe tener: VITE_API_URL=http://localhost:5000

# Reiniciar frontend después de cambiar .env
cd frontend-n8n
npm run dev
```

### Problema 2: "Token inválido" o redirige a login constantemente

**Causa**: JWT_SECRET no está configurado o cambió

**Solución**:
```bash
# Verificar backend/.env
cat backend/.env
# Debe tener: JWT_SECRET=algún-valor

# Hacer logout y volver a login
```

### Problema 3: No aparecen universidades/cursos/rúbricas

**Causa**: Datos no fueron migrados

**Solución**:
```bash
cd backend
npm run seed
```

### Problema 4: Error al crear rúbrica desde PDF

**Causa**: Webhook de n8n no configurado

**Solución**:
1. Configurar tu webhook de n8n
2. Actualizar `backend/.env`:
   ```
   N8N_RUBRIC_WEBHOOK_URL=https://tu-servidor.n8n.cloud/webhook/rubrica
   ```
3. Reiniciar backend

### Problema 5: CORS error

**Causa**: Frontend y backend en puertos diferentes sin CORS configurado

**Solución**:
```bash
# Verificar backend/.env
CORS_ORIGIN=http://localhost:5173

# Reiniciar backend
```

---

## ✅ CHECKLIST DE PRUEBAS

### Backend

- [ ] MongoDB conectado correctamente
- [ ] Servidor corriendo en puerto 5000
- [ ] Endpoint `/health` responde
- [ ] Datos migrados (4 universidades, 17 cursos, 5 rúbricas, 2 usuarios)

### Frontend

- [ ] App corriendo en puerto 5173
- [ ] Login muestra pantalla correctamente
- [ ] Login con admin funciona
- [ ] Login con usuario funciona
- [ ] Logout funciona

### Admin Panel (como admin)

- [ ] Acceso a `/admin` permitido
- [ ] Tab de Universidades funciona
- [ ] CRUD de Universidades completo
- [ ] Tab de Materias funciona
- [ ] CRUD de Materias completo
- [ ] Tab de Rúbricas funciona
- [ ] CRUD de Rúbricas completo
- [ ] Tab de Usuarios funciona
- [ ] CRUD de Usuarios completo
- [ ] Filtros funcionan correctamente
- [ ] Modales abren y cierran

### Vista de Usuario

- [ ] Selects se llenan dinámicamente desde BD
- [ ] Cascada de selects funciona (Universidad → Curso → Rúbrica)
- [ ] Upload de archivo funciona
- [ ] (Opcional) Corrección con n8n funciona
- [ ] (Opcional) Subida a planilla funciona

### Seguridad

- [ ] Usuario normal NO puede acceder a `/admin`
- [ ] Sin login redirige a `/login`
- [ ] Token se guarda en localStorage
- [ ] Logout limpia token
- [ ] Usuario eliminado NO puede hacer login
- [ ] Admin principal NO se puede eliminar
- [ ] Toggle "Mostrar eliminados" funciona
- [ ] Restauración de usuarios funciona

---

## 🎉 CONCLUSIÓN

Si completaste todos los checks, **¡FELICIDADES!**

Has probado exitosamente las **Fases 1, 2, 3 y 3.5** del sistema:
- ✅ Backend API REST completo
- ✅ Frontend con autenticación
- ✅ Admin Panel funcional (4 tabs: Universidades, Materias, Rúbricas, Usuarios)
- ✅ Vista de Usuario simplificada
- ✅ CRUD completo de usuarios con soft delete
- ✅ Sistema de restauración de usuarios
- ✅ Protecciones de seguridad implementadas

**Próximos pasos:**
- Fase 4: Ajustes finales, optimizaciones y deploy

---

**Última actualización**: 22 de Octubre, 2025
