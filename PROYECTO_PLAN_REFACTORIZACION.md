# 📋 PLAN DE REFACTORIZACIÓN - Sistema Multi-Tenant con Rol de Profesor

## 🎯 Descripción General

Este documento detalla la refactorización del sistema de corrección automática para implementar:

- **Nuevo rol de Profesor** con acceso a sus comisiones asignadas
- **Sistema Multi-Tenant** con jerarquía de roles
- **Subida de soluciones de alumnos** en formato .txt (del Consolidador)
- **Admin Panel multi-tenant** (cada universidad ve solo sus datos)
- **Super Admin Panel** (acceso global)
- **Sistema de Tooltips** para mejorar UX

---

## ⚠️ TAREAS PENDIENTES

### Pendientes de Implementación
- **FASE 3**: Flujo n8n para Upload a Drive (webhook para subir archivos .txt a Google Drive)
- **FASE 5**: Frontend - Vista de Profesor (ProfessorView con subida de entregas)
- **FASE 7**: Routing y Navegación (rutas por rol, redirección en login)
- **FASE 8**: Testing e Integración (testing end-to-end de todo el flujo)
- **FASE 9**: Seed de datos multi-tenant
- **FASE 10**: Documentación completa

### Pendientes de Testing
- **FASE 6**: Testing manual de UsersManager y CommissionsManager en navegador
  - Crear usuarios con diferentes roles
  - Asignar profesores a comisiones
  - Validar filtros multi-tenant
- **FASE 4**: Testing de tooltips en navegador
- **FASE 2**: Testing de API de submissions con Postman
- **FASE 1**: Testing de modelos y middleware con Postman

---

## 🎯 Objetivos de la Refactorización

### Objetivos Principales

1. **Nuevo rol de Profesor**: Crear rol `professor` que puede gestionar sus comisiones asignadas
2. **Subida de entregas**: Profesor sube archivos `.txt` (del consolidador) a rúbricas específicas
3. **Multi-Tenancy**: Cada `university-admin` ve solo datos de su universidad
4. **Super Admin**: Rol `super-admin` con acceso global al sistema
5. **Estructura Drive simplificada**: Archivos `.txt` directos en carpeta de rúbrica
6. **Mejor UX**: Tooltips informativos en formularios

### Roles del Sistema

| Rol | Permisos | Acceso |
|-----|----------|--------|
| **super-admin** | Administra TODO el sistema | Todas las universidades, usuarios, datos |
| **university-admin** | Administra SU universidad | Solo datos de su universidad (actual rol `admin`) |
| **professor** | Gestiona SUS comisiones | Solo comisiones donde está asignado |
| **user** | Solo visualización | Vista de corrección (actual UserView) |

---

## 🏗️ Arquitectura Actualizada

### Estructura de Datos (Jerarquía) - YA EXISTE

```
University (universidad) ✅ YA EXISTE
  └── Faculty (facultad) ✅ YA EXISTE
      └── Career (carrera) ✅ YA EXISTE
          └── Course (curso/materia) ✅ YA EXISTE
              └── Commission (comisión) ✅ YA EXISTE
                  ├── Professors (asignados) ⚠️ MODIFICAR
                  └── Rubrics (rúbricas) ✅ YA EXISTE
                      └── Submissions (entregas) ⭐ CREAR
```

### Estructura en Google Drive (SIMPLIFICADA)

```
ROOT_DRIVE_FOLDER/
└── {university_id}/
    └── {faculty_id}/
        └── {career_id}/
            └── {course_id}/
                └── {commission_id}/
                    └── {rubric_folder_id}/           ← Carpeta de rúbrica (drive_folder_id)
                        ├── alumno-juan-perez.txt      ← Archivos .txt directos
                        ├── alumno-maria-gomez.txt
                        └── alumno-pedro-lopez.txt
```

**Ventajas**:
- ✅ Archivos directos (no subcarpetas por alumno)
- ✅ Nombre de archivo identifica al alumno
- ✅ Menos operaciones en Drive
- ✅ Estructura más simple

---

## 📊 Cambios en Modelos de Datos

### 1. User (MODIFICAR) ⚠️

**Estado actual**:
```javascript
{
  username: String,
  name: String,
  password: String,
  role: String (enum: ['admin', 'user']), // ⚠️ CAMBIAR
  gemini_api_key_encrypted: String,
  // ... otros campos de Gemini API
  deleted: Boolean
}
```

**Estado nuevo**:
```javascript
{
  username: String,
  name: String,
  password: String,
  role: String (enum: ['super-admin', 'university-admin', 'professor', 'user']), // ✅ MODIFICADO
  university_id: String (index: true), // ⭐ AGREGAR (requerido si no es super-admin)
  gemini_api_key_encrypted: String,
  // ... otros campos de Gemini API
  deleted: Boolean
}
```

**Cambios**:
- ✅ Cambiar enum de `role`: agregar `super-admin`, `university-admin`, `professor`
- ✅ Cambiar `admin` → `university-admin` (migración de datos)
- ⭐ Agregar campo `university_id` (String, requerido si `role !== 'super-admin'`)
- ✅ Agregar validación: `university_id` requerido para todos excepto `super-admin`
- ✅ Agregar índice: `university_id`

---

### 2. Commission (MODIFICAR) ⚠️

**Estado actual**:
```javascript
{
  commission_id: String,
  name: String,
  course_id: String,
  career_id: String,
  faculty_id: String,
  university_id: String,
  professor_name: String, // ⚠️ ELIMINAR
  professor_email: String, // ⚠️ ELIMINAR
  year: Number,
  deleted: Boolean
}
```

**Estado nuevo**:
```javascript
{
  commission_id: String,
  name: String,
  course_id: String,
  career_id: String,
  faculty_id: String,
  university_id: String,
  professors: [ObjectId] (ref: 'User'), // ⭐ AGREGAR (array de IDs de usuarios con rol professor)
  year: Number,
  deleted: Boolean
}
```

**Cambios**:
- ❌ Eliminar: `professor_name`, `professor_email`
- ⭐ Agregar: `professors: [ObjectId]` (refs a User con rol `professor`)
- ✅ Agregar índice: `professors`

---

### 3. Rubric (YA TIENE TODO) ✅

**Estado actual** (NO MODIFICAR):
```javascript
{
  rubric_id: String,
  name: String,
  commission_id: String, // ✅ Ya existe
  course_id: String,     // ✅ Ya existe
  career_id: String,     // ✅ Ya existe
  faculty_id: String,    // ✅ Ya existe
  university_id: String, // ✅ Ya existe
  rubric_type: String (enum: tp, parcial-1, parcial-2, recuperatorio-1, recuperatorio-2, final, global),
  rubric_number: Number,
  year: Number,
  rubric_json: Mixed,
  source: String (enum: pdf, json, manual),
  original_file_url: String,
  drive_folder_id: String, // ✅ Ya existe (carpeta de la rúbrica en Drive)
  deleted: Boolean
}
```

**NO HAY CAMBIOS EN RUBRIC** ✅

---

### 4. Submission (CREAR NUEVO) ⭐

**Nuevo modelo** (NO EXISTE):
```javascript
{
  _id: ObjectId,
  submission_id: String (unique, auto-generado),

  // Relaciones
  commission_id: String (required, index),
  rubric_id: String (required, index),
  course_id: String (required, index),
  career_id: String (required, index),
  faculty_id: String (required, index),
  university_id: String (required, index),

  // Datos del alumno
  student_name: String (required, ej: "juan-perez"),
  student_id: String (legajo/DNI, opcional),

  // Archivo
  file_name: String (required, ej: "alumno-juan-perez.txt"),
  file_size: Number (bytes),
  file_content_preview: String (primeros 500 caracteres),

  // Google Drive
  drive_file_id: String (ID del archivo en Drive),
  drive_file_url: String (URL del archivo),
  rubric_drive_folder_id: String (ID de la carpeta de la rúbrica),

  // Metadata
  uploaded_by: ObjectId (ref: User, el profesor que subió),
  uploaded_at: Date (default: now),

  // Estado
  status: String (enum: ['uploaded', 'pending-correction', 'corrected', 'failed'], default: 'uploaded'),

  // Corrección (si se realizó)
  correction: {
    corrected_at: Date,
    corrected_by: ObjectId (ref: User),
    grade: Number,
    summary: String,
    strengths: String,
    recommendations: String,
    result_json: Mixed
  },

  deleted: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🗓️ FASES DEL PROYECTO

---

## ✅ FASE 1: Modificar Modelos Existentes (2-3 días)

### 🎯 Objetivos
- Modificar modelo User: agregar nuevos roles y `university_id`
- Modificar modelo Commission: cambiar de strings a array de profesores
- Crear modelo Submission nuevo
- Crear middleware multi-tenant

### 📋 Tareas

#### 1.1. Modificar modelo User
- [ ] Abrir `backend/src/models/User.js`
- [ ] Modificar enum de `role`: agregar `super-admin`, `university-admin`, `professor`
- [ ] Agregar campo `university_id` (String, default: null, index: true)
- [ ] Agregar validación pre-save: `university_id` requerido si `role !== 'super-admin'`
- [ ] Agregar método estático `findByUniversity(university_id)`

**Código a modificar**:
```javascript
// backend/src/models/User.js (MODIFICAR líneas 30-35)

role: {
  type: String,
  enum: ['super-admin', 'university-admin', 'professor', 'user'], // ✅ MODIFICADO
  default: 'user',
  required: true,
},
university_id: { // ⭐ AGREGAR DESPUÉS DE role
  type: String,
  default: null,
  index: true,
},
```

**Agregar validación pre-save** (después del hook de password, línea ~90):
```javascript
// Validación: university_id requerido si no es super-admin
userSchema.pre('save', function(next) {
  if (this.role !== 'super-admin' && !this.university_id) {
    return next(new Error('university_id es requerido para roles que no son super-admin'));
  }
  next();
});
```

**Agregar método estático** (después de `findActive`, línea ~140):
```javascript
/**
 * Método estático para encontrar usuarios por universidad
 * @param {String} universityId
 * @returns {Promise<Array>}
 */
userSchema.statics.findByUniversity = function (universityId) {
  return this.find({
    university_id: universityId,
    $or: [{ deleted: false }, { deleted: { $exists: false } }]
  });
};

/**
 * Método estático para encontrar profesores por universidad
 * @param {String} universityId
 * @returns {Promise<Array>}
 */
userSchema.statics.findProfessorsByUniversity = function (universityId) {
  return this.find({
    role: 'professor',
    university_id: universityId,
    $or: [{ deleted: false }, { deleted: { $exists: false } }]
  });
};
```

#### 1.2. Modificar modelo Commission
- [ ] Abrir `backend/src/models/Commission.js`
- [ ] Eliminar campos: `professor_name`, `professor_email`
- [ ] Agregar campo: `professors: [ObjectId]` (refs: User)
- [ ] Agregar índice: `professors`
- [ ] Agregar método: `assignProfessor(userId)`, `removeProfessor(userId)`

**Código a modificar**:
```javascript
// backend/src/models/Commission.js (ELIMINAR líneas 42-52)
// ❌ ELIMINAR professor_name y professor_email

// ⭐ AGREGAR después de university_id (línea ~40):
professors: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  default: []
}],
```

**Actualizar índices** (línea ~72):
```javascript
// Índices compuestos
commissionSchema.index({ commission_id: 1, deleted: 1 });
commissionSchema.index({ course_id: 1, deleted: 1 });
commissionSchema.index({ course_id: 1, year: 1, deleted: 1 });
commissionSchema.index({ year: 1, deleted: 1 });
commissionSchema.index({ professors: 1 }); // ⭐ AGREGAR
```

**Agregar métodos** (después de restore, línea ~125):
```javascript
/**
 * Método de instancia para asignar profesor
 * @param {ObjectId} userId - ID del usuario profesor
 * @returns {Promise<Document>}
 */
commissionSchema.methods.assignProfessor = function(userId) {
  if (!this.professors.includes(userId)) {
    this.professors.push(userId);
  }
  return this.save();
};

/**
 * Método de instancia para remover profesor
 * @param {ObjectId} userId - ID del usuario profesor
 * @returns {Promise<Document>}
 */
commissionSchema.methods.removeProfessor = function(userId) {
  this.professors = this.professors.filter(id => !id.equals(userId));
  return this.save();
};

/**
 * Método estático para encontrar comisiones de un profesor
 * @param {ObjectId} professorId
 * @returns {Promise<Array>}
 */
commissionSchema.statics.findByProfessor = function(professorId) {
  return this.find({
    professors: professorId,
    deleted: false
  }).sort({ name: 1 });
};
```

#### 1.3. Crear modelo Submission
- [ ] Crear archivo `backend/src/models/Submission.js`
- [ ] Definir schema completo con validaciones
- [ ] Métodos: `generateSubmissionId()`, `findActive()`, `softDelete()`, `restore()`
- [ ] Pre-hook para excluir `deleted: true`

**Código**:
```javascript
// backend/src/models/Submission.js (CREAR NUEVO)
/**
 * Modelo de Submission/Entrega
 * Representa una entrega de alumno para una rúbrica específica
 */
import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
  {
    submission_id: {
      type: String,
      required: [true, 'El ID de la entrega es requerido'],
      unique: true,
      trim: true,
    },
    commission_id: {
      type: String,
      required: [true, 'El ID de la comisión es requerido'],
      index: true,
    },
    rubric_id: {
      type: String,
      required: [true, 'El ID de la rúbrica es requerido'],
      index: true,
    },
    course_id: {
      type: String,
      required: [true, 'El ID del curso es requerido'],
      index: true,
    },
    career_id: {
      type: String,
      required: [true, 'El ID de la carrera es requerido'],
      index: true,
    },
    faculty_id: {
      type: String,
      required: [true, 'El ID de la facultad es requerido'],
      index: true,
    },
    university_id: {
      type: String,
      required: [true, 'El ID de la universidad es requerido'],
      index: true,
    },
    student_name: {
      type: String,
      required: [true, 'El nombre del alumno es requerido'],
      trim: true,
    },
    student_id: {
      type: String,
      trim: true,
      default: null,
    },
    file_name: {
      type: String,
      required: [true, 'El nombre del archivo es requerido'],
    },
    file_size: {
      type: Number,
      default: 0,
    },
    file_content_preview: {
      type: String,
      maxlength: 500,
      default: null,
    },
    drive_file_id: {
      type: String,
      default: null,
    },
    drive_file_url: {
      type: String,
      default: null,
    },
    rubric_drive_folder_id: {
      type: String,
      required: [true, 'El ID de la carpeta de la rúbrica es requerido'],
    },
    uploaded_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El profesor que subió es requerido'],
      index: true,
    },
    uploaded_at: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['uploaded', 'pending-correction', 'corrected', 'failed'],
      default: 'uploaded',
      index: true,
    },
    correction: {
      corrected_at: Date,
      corrected_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      grade: Number,
      summary: String,
      strengths: String,
      recommendations: String,
      result_json: mongoose.Schema.Types.Mixed,
    },
    deleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índices compuestos
submissionSchema.index({ commission_id: 1, rubric_id: 1, deleted: 1 });
submissionSchema.index({ uploaded_by: 1, deleted: 1 });
submissionSchema.index({ status: 1, deleted: 1 });
submissionSchema.index({ university_id: 1, deleted: 1 });

// Evitar duplicados: rubric + student_name debe ser único
submissionSchema.index({ rubric_id: 1, student_name: 1 }, { unique: true });

/**
 * Método estático para generar submission_id
 * @param {String} commissionId
 * @param {String} studentName
 * @returns {String}
 */
submissionSchema.statics.generateSubmissionId = function(commissionId, studentName) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const cleanName = studentName.toLowerCase().replace(/\s+/g, '-');
  return `sub-${commissionId}-${cleanName}-${timestamp}-${random}`;
};

/**
 * Método estático para obtener entregas activas
 * @param {Object} filters - Filtros opcionales
 * @returns {Promise<Array>}
 */
submissionSchema.statics.findActive = function(filters = {}) {
  const query = { deleted: false, ...filters };
  return this.find(query).sort({ uploaded_at: -1 });
};

/**
 * Método de instancia para soft delete
 * @returns {Promise<Document>}
 */
submissionSchema.methods.softDelete = function() {
  this.deleted = true;
  return this.save();
};

/**
 * Método de instancia para restaurar
 * @returns {Promise<Document>}
 */
submissionSchema.methods.restore = function() {
  this.deleted = false;
  return this.save();
};

// Pre-hook: excluir eliminados
submissionSchema.pre(/^find/, function(next) {
  if (!this.getQuery().hasOwnProperty('deleted')) {
    this.where({ deleted: false });
  }
  next();
});

const Submission = mongoose.model('Submission', submissionSchema);

export default Submission;
```

#### 1.4. Crear middleware multi-tenant
- [ ] Crear archivo `backend/src/middleware/multiTenant.js`
- [ ] Función `checkUniversityAccess()` - valida acceso a universidad
- [ ] Función `checkProfessorAccess()` - valida acceso a comisión
- [ ] Función `requireRoles()` - valida roles específicos

**Código**:
```javascript
// backend/src/middleware/multiTenant.js (CREAR NUEVO)
import Commission from '../models/Commission.js';

/**
 * Middleware para verificar acceso a universidad
 * super-admin: acceso a todo
 * university-admin: solo su universidad
 * professor: solo su universidad
 * user: solo su universidad
 */
export const checkUniversityAccess = (req, res, next) => {
  const { role, university_id } = req.user;

  // super-admin tiene acceso a todo
  if (role === 'super-admin') {
    return next();
  }

  // university_id del recurso (puede venir en body, params o query)
  const resourceUniversityId = req.body.university_id ||
                                req.params.university_id ||
                                req.query.university_id;

  // Si no hay university_id en el recurso, pasar (se validará en el controller)
  if (!resourceUniversityId) {
    return next();
  }

  // Validar que el usuario solo acceda a su universidad
  if (resourceUniversityId !== university_id) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para acceder a esta universidad'
    });
  }

  next();
};

/**
 * Middleware para verificar acceso de profesor a comisión
 * super-admin y university-admin: acceso a todo
 * professor: solo comisiones donde está asignado
 */
export const checkProfessorAccess = async (req, res, next) => {
  const { role, _id: userId, university_id } = req.user;

  // super-admin y university-admin tienen acceso a todo
  if (role === 'super-admin' || role === 'university-admin') {
    return next();
  }

  // Si es professor, validar que tenga acceso a la comisión
  if (role === 'professor') {
    const commissionId = req.body.commission_id ||
                         req.params.commission_id ||
                         req.query.commission_id;

    if (!commissionId) {
      return res.status(400).json({
        success: false,
        message: 'commission_id es requerido'
      });
    }

    try {
      // Verificar que el profesor esté asignado a la comisión
      const commission = await Commission.findOne({
        commission_id: commissionId,
        professors: userId,
        university_id: university_id // Doble validación
      });

      if (!commission) {
        return res.status(403).json({
          success: false,
          message: 'No tienes acceso a esta comisión'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error al verificar acceso',
        error: error.message
      });
    }
  } else {
    // user no tiene acceso a comisiones
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado'
    });
  }
};

/**
 * Middleware para requerir roles específicos
 * @param {...String} allowedRoles - Roles permitidos
 */
export const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const { role } = req.user;

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};
```

#### 1.5. Actualizar middleware auth existente
- [ ] Abrir `backend/src/middleware/auth.js`
- [ ] Cambiar `requireAdmin` → `requireUniversityAdmin` (para compatibilidad)
- [ ] Mantener `requireAdmin` como alias de `requireUniversityAdmin`

**Código a modificar**:
```javascript
// backend/src/middleware/auth.js (MODIFICAR)
// Encontrar la función requireAdmin y agregar después:

/**
 * Middleware para requerir rol university-admin o super-admin
 */
export const requireUniversityAdmin = (req, res, next) => {
  if (req.user.role !== 'university-admin' && req.user.role !== 'super-admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requiere rol de administrador.',
    });
  }
  next();
};

// Alias para compatibilidad con código existente
export const requireAdmin = requireUniversityAdmin;
```

#### 1.6. Testing de modelos
- [ ] Iniciar MongoDB y backend
- [ ] Probar creación de usuario `super-admin` sin `university_id`
- [ ] Probar creación de usuario `professor` con `university_id`
- [ ] Probar asignación de profesor a comisión
- [ ] Probar creación de submission

**Comandos**:
```bash
cd backend
npm run dev

# Usar Thunder Client o Postman para probar
```

---

### 📚 DOCUMENTACIÓN - Fase 1
- [ ] Actualizar `backend/README.md` - Sección "Modelos de Datos"
- [ ] Agregar descripción del modelo Submission
- [ ] Documentar cambios en User (nuevos roles, university_id)
- [ ] Documentar cambios en Commission (array de profesores)
- [ ] Documentar middleware multi-tenant

---

## ✅ FASE 2: Controladores y Rutas de Submissions (2-3 días)

### 🎯 Objetivos
- Crear controlador de Submissions (CRUD)
- Crear rutas protegidas con middleware multi-tenant
- Implementar upload de archivos .txt con Multer
- Integrar con driveService para subir a Drive

### 📋 Tareas

#### 2.1. Crear controlador de Submissions
- [ ] Crear archivo `backend/src/controllers/submissionController.js`
- [ ] Implementar `getAllSubmissions()` con filtros
- [ ] Implementar `getSubmissionById()`
- [ ] Implementar `createSubmission()` con upload de archivo
- [ ] Implementar `updateSubmission()` (estado, corrección)
- [ ] Implementar `deleteSubmission()` (soft delete)

**Código**:
```javascript
// backend/src/controllers/submissionController.js (CREAR NUEVO)
import Submission from '../models/Submission.js';
import Rubric from '../models/Rubric.js';
import fs from 'fs';
import { uploadFileToDrive } from '../services/driveService.js';

/**
 * GET /api/submissions
 * Obtener todas las entregas (con filtros)
 */
export const getAllSubmissions = async (req, res) => {
  try {
    const { commission_id, rubric_id, status, university_id, includeDeleted } = req.query;
    const { role, university_id: userUniversityId, _id: userId } = req.user;

    let query = {};

    // Filtro multi-tenant
    if (role === 'super-admin') {
      // Acceso a todo
      if (university_id) query.university_id = university_id;
    } else if (role === 'university-admin') {
      query.university_id = userUniversityId;
    } else if (role === 'professor') {
      // Solo sus comisiones
      const Commission = (await import('../models/Commission.js')).default;
      const commissions = await Commission.find({ professors: userId });
      const commissionIds = commissions.map(c => c.commission_id);
      query.commission_id = { $in: commissionIds };
    } else {
      // user no tiene acceso
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver entregas'
      });
    }

    // Filtros adicionales
    if (commission_id) query.commission_id = commission_id;
    if (rubric_id) query.rubric_id = rubric_id;
    if (status) query.status = status;

    // Incluir eliminados
    if (includeDeleted === 'true') {
      query.deleted = { $in: [true, false] };
    }

    const submissions = await Submission.find(query)
      .populate('uploaded_by', 'name username')
      .sort({ uploaded_at: -1 });

    res.json({
      success: true,
      data: submissions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener entregas',
      error: error.message
    });
  }
};

/**
 * GET /api/submissions/:id
 * Obtener una entrega por ID
 */
export const getSubmissionById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, university_id: userUniversityId, _id: userId } = req.user;

    const submission = await Submission.findById(id)
      .populate('uploaded_by', 'name username')
      .populate('correction.corrected_by', 'name username');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Entrega no encontrada'
      });
    }

    // Validar acceso
    if (role === 'super-admin') {
      // OK
    } else if (role === 'university-admin') {
      if (submission.university_id !== userUniversityId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes acceso a esta entrega'
        });
      }
    } else if (role === 'professor') {
      const Commission = (await import('../models/Commission.js')).default;
      const commission = await Commission.findOne({
        commission_id: submission.commission_id,
        professors: userId
      });
      if (!commission) {
        return res.status(403).json({
          success: false,
          message: 'No tienes acceso a esta entrega'
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos'
      });
    }

    res.json({
      success: true,
      data: submission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener entrega',
      error: error.message
    });
  }
};

/**
 * POST /api/submissions
 * Crear nueva entrega (subir archivo .txt)
 */
export const createSubmission = async (req, res) => {
  try {
    const { student_name, student_id, rubric_id } = req.body;
    const file = req.file; // Multer
    const { _id: userId } = req.user;

    // Validar campos
    if (!student_name || !rubric_id || !file) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: student_name, rubric_id, file'
      });
    }

    // Obtener rúbrica
    const rubric = await Rubric.findOne({ rubric_id });
    if (!rubric) {
      // Limpiar archivo temporal
      if (file && file.path) fs.unlinkSync(file.path);
      return res.status(404).json({
        success: false,
        message: 'Rúbrica no encontrada'
      });
    }

    if (!rubric.drive_folder_id) {
      if (file && file.path) fs.unlinkSync(file.path);
      return res.status(400).json({
        success: false,
        message: 'La rúbrica no tiene carpeta en Drive configurada'
      });
    }

    // Generar submission_id
    const submission_id = Submission.generateSubmissionId(rubric.commission_id, student_name);

    // Generar nombre de archivo
    const cleanName = student_name.toLowerCase().replace(/\s+/g, '-');
    const fileName = `alumno-${cleanName}.txt`;

    // Subir a Drive
    const driveResult = await uploadFileToDrive(
      file.path,
      fileName,
      rubric.drive_folder_id
    );

    if (!driveResult.success) {
      if (file && file.path) fs.unlinkSync(file.path);
      return res.status(500).json({
        success: false,
        message: 'Error al subir archivo a Drive',
        error: driveResult.message
      });
    }

    // Leer preview del archivo
    const fileContent = fs.readFileSync(file.path, 'utf-8');
    const preview = fileContent.substring(0, 500);

    // Crear submission en BD
    const submission = await Submission.create({
      submission_id,
      commission_id: rubric.commission_id,
      rubric_id: rubric.rubric_id,
      course_id: rubric.course_id,
      career_id: rubric.career_id,
      faculty_id: rubric.faculty_id,
      university_id: rubric.university_id,
      student_name: cleanName,
      student_id: student_id || null,
      file_name: fileName,
      file_size: file.size,
      file_content_preview: preview,
      drive_file_id: driveResult.drive_file_id,
      drive_file_url: driveResult.drive_file_url,
      rubric_drive_folder_id: rubric.drive_folder_id,
      uploaded_by: userId
    });

    // Eliminar archivo temporal
    fs.unlinkSync(file.path);

    res.status(201).json({
      success: true,
      message: 'Entrega subida exitosamente',
      data: submission
    });
  } catch (error) {
    // Limpiar archivo en caso de error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error('Error al eliminar archivo temporal:', e);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Error al crear entrega',
      error: error.message
    });
  }
};

/**
 * PUT /api/submissions/:id
 * Actualizar entrega (estado, corrección)
 */
export const updateSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, correction } = req.body;
    const { role, university_id: userUniversityId, _id: userId } = req.user;

    const submission = await Submission.findById(id);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Entrega no encontrada'
      });
    }

    // Validar acceso
    if (role !== 'super-admin' && submission.university_id !== userUniversityId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a esta entrega'
      });
    }

    // Actualizar campos
    if (status) submission.status = status;
    if (correction) {
      submission.correction = {
        ...correction,
        corrected_at: new Date(),
        corrected_by: userId
      };
      submission.status = 'corrected';
    }

    await submission.save();

    res.json({
      success: true,
      message: 'Entrega actualizada exitosamente',
      data: submission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar entrega',
      error: error.message
    });
  }
};

/**
 * DELETE /api/submissions/:id
 * Eliminar entrega (soft delete)
 */
export const deleteSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, university_id: userUniversityId } = req.user;

    const submission = await Submission.findById(id);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Entrega no encontrada'
      });
    }

    // Validar acceso
    if (role !== 'super-admin' && submission.university_id !== userUniversityId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a esta entrega'
      });
    }

    await submission.softDelete();

    res.json({
      success: true,
      message: 'Entrega eliminada exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar entrega',
      error: error.message
    });
  }
};
```

#### 2.2. Actualizar driveService
- [ ] Abrir `backend/src/services/driveService.js`
- [ ] Agregar función `uploadFileToDrive()` para subir archivos .txt

**Código a agregar** (al final del archivo):
```javascript
// backend/src/services/driveService.js (AGREGAR al final)

/**
 * Subir archivo .txt de alumno a carpeta de rúbrica en Drive
 * NO crea subcarpetas, sube directo a la carpeta de la rúbrica
 *
 * @param {String} filePath - Ruta local del archivo .txt
 * @param {String} fileName - Nombre del archivo (ej: "alumno-juan-perez.txt")
 * @param {String} rubricDriveFolderId - ID de la carpeta de la rúbrica en Drive
 * @returns {Promise<Object>} { success, drive_file_id, drive_file_url }
 */
export const uploadFileToDrive = async (filePath, fileName, rubricDriveFolderId) => {
  try {
    const webhookUrl = process.env.N8N_UPLOAD_FILE_TO_DRIVE_WEBHOOK;

    if (!webhookUrl) {
      console.warn('⚠️  N8N_UPLOAD_FILE_TO_DRIVE_WEBHOOK no está configurada.');
      return { success: false, message: 'Webhook no configurado' };
    }

    console.log(`📁 Subiendo archivo: ${fileName} a carpeta: ${rubricDriveFolderId}`);

    const FormData = (await import('form-data')).default;
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('fileName', fileName);
    formData.append('folderId', rubricDriveFolderId);

    const response = await axios.post(webhookUrl, formData, {
      headers: { ...formData.getHeaders() },
      timeout: 45000, // 45 segundos
    });

    console.log(`✅ Archivo subido: ${fileName} (ID: ${response.data.drive_file_id})`);

    return {
      success: true,
      drive_file_id: response.data.drive_file_id || response.data.fileId,
      drive_file_url: response.data.drive_file_url || response.data.fileUrl
    };
  } catch (error) {
    console.error(`❌ Error al subir archivo "${fileName}":`, error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
};
```

#### 2.3. Crear rutas de Submissions
- [ ] Crear archivo `backend/src/routes/submissionRoutes.js`
- [ ] Configurar Multer para upload de .txt
- [ ] Proteger con middleware multi-tenant

**Código**:
```javascript
// backend/src/routes/submissionRoutes.js (CREAR NUEVO)
import express from 'express';
import multer from 'multer';
import {
  getAllSubmissions,
  getSubmissionById,
  createSubmission,
  updateSubmission,
  deleteSubmission
} from '../controllers/submissionController.js';
import { authenticate } from '../middleware/auth.js';
import { checkProfessorAccess, requireRoles } from '../middleware/multiTenant.js';

const router = express.Router();

// Configurar Multer
const upload = multer({
  dest: 'uploads/temp/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/plain' || file.originalname.endsWith('.txt')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos .txt'));
    }
  }
});

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/submissions
router.get('/', getAllSubmissions);

// GET /api/submissions/:id
router.get('/:id', getSubmissionById);

// POST /api/submissions (subir entrega)
router.post('/',
  requireRoles('professor', 'university-admin', 'super-admin'),
  checkProfessorAccess,
  upload.single('file'),
  createSubmission
);

// PUT /api/submissions/:id (actualizar estado/corrección)
router.put('/:id',
  requireRoles('professor', 'university-admin', 'super-admin'),
  updateSubmission
);

// DELETE /api/submissions/:id
router.delete('/:id',
  requireRoles('professor', 'university-admin', 'super-admin'),
  deleteSubmission
);

export default router;
```

#### 2.4. Registrar rutas en app.js
- [ ] Abrir `backend/src/app.js`
- [ ] Importar y registrar `submissionRoutes`

**Código a agregar**:
```javascript
// backend/src/app.js (AGREGAR)
import submissionRoutes from './routes/submissionRoutes.js';

// ... código existente ...

app.use('/api/submissions', submissionRoutes);
```

#### 2.5. Actualizar controlador de Commission
- [ ] Abrir `backend/src/controllers/commissionController.js`
- [ ] Agregar endpoint `POST /api/commissions/:id/assign-professor`
- [ ] Agregar endpoint `DELETE /api/commissions/:id/professors/:professorId`
- [ ] Agregar endpoint `GET /api/commissions/my-commissions` (para profesores)

**Código a agregar** (al final del archivo):
```javascript
// backend/src/controllers/commissionController.js (AGREGAR)

/**
 * POST /api/commissions/:id/assign-professor
 * Asignar profesor a comisión
 */
export const assignProfessor = async (req, res) => {
  try {
    const { id } = req.params;
    const { professor_id } = req.body;
    const { role, university_id: userUniversityId } = req.user;

    // Solo admin puede asignar profesores
    if (role !== 'super-admin' && role !== 'university-admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores pueden asignar profesores'
      });
    }

    // Validar que el profesor exista y sea de la misma universidad
    const User = (await import('../models/User.js')).default;
    const professor = await User.findOne({
      _id: professor_id,
      role: 'professor',
      university_id: userUniversityId
    });

    if (!professor) {
      return res.status(404).json({
        success: false,
        message: 'Profesor no encontrado o no pertenece a tu universidad'
      });
    }

    const commission = await Commission.findById(id);

    if (!commission) {
      return res.status(404).json({
        success: false,
        message: 'Comisión no encontrada'
      });
    }

    // Verificar multi-tenant
    if (role !== 'super-admin' && commission.university_id !== userUniversityId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para modificar esta comisión'
      });
    }

    // Asignar profesor
    await commission.assignProfessor(professor_id);

    res.json({
      success: true,
      message: 'Profesor asignado exitosamente',
      data: commission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al asignar profesor',
      error: error.message
    });
  }
};

/**
 * DELETE /api/commissions/:id/professors/:professorId
 * Remover profesor de comisión
 */
export const removeProfessor = async (req, res) => {
  try {
    const { id, professorId } = req.params;
    const { role, university_id: userUniversityId } = req.user;

    if (role !== 'super-admin' && role !== 'university-admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores pueden remover profesores'
      });
    }

    const commission = await Commission.findById(id);

    if (!commission) {
      return res.status(404).json({
        success: false,
        message: 'Comisión no encontrada'
      });
    }

    if (role !== 'super-admin' && commission.university_id !== userUniversityId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para modificar esta comisión'
      });
    }

    await commission.removeProfessor(professorId);

    res.json({
      success: true,
      message: 'Profesor removido exitosamente',
      data: commission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al remover profesor',
      error: error.message
    });
  }
};

/**
 * GET /api/commissions/my-commissions
 * Obtener comisiones del profesor autenticado
 */
export const getMyCommissions = async (req, res) => {
  try {
    const { _id: userId, role } = req.user;

    if (role !== 'professor') {
      return res.status(403).json({
        success: false,
        message: 'Solo profesores pueden acceder a este endpoint'
      });
    }

    const commissions = await Commission.findByProfessor(userId);

    res.json({
      success: true,
      data: commissions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener comisiones',
      error: error.message
    });
  }
};
```

#### 2.6. Actualizar rutas de Commission
- [ ] Abrir `backend/src/routes/commissionRoutes.js`
- [ ] Agregar rutas de asignación de profesores

**Código a agregar**:
```javascript
// backend/src/routes/commissionRoutes.js (AGREGAR)
import {
  // ... imports existentes ...
  assignProfessor,
  removeProfessor,
  getMyCommissions
} from '../controllers/commissionController.js';

// ... rutas existentes ...

// GET /api/commissions/my-commissions (ANTES de /:id)
router.get('/my-commissions', authenticate, getMyCommissions);

// POST /api/commissions/:id/assign-professor
router.post('/:id/assign-professor',
  authenticate,
  requireRoles('super-admin', 'university-admin'),
  assignProfessor
);

// DELETE /api/commissions/:id/professors/:professorId
router.delete('/:id/professors/:professorId',
  authenticate,
  requireRoles('super-admin', 'university-admin'),
  removeProfessor
);
```

#### 2.7. Agregar variables de entorno
- [ ] Abrir `backend/.env.example`
- [ ] Agregar webhook de upload de archivo

**Código**:
```bash
# backend/.env.example (AGREGAR)
N8N_UPLOAD_FILE_TO_DRIVE_WEBHOOK=https://tu-n8n.com/webhook/upload-file-to-drive
```

#### 2.8. Testing de endpoints
- [ ] Crear usuario professor
- [ ] Asignar profesor a comisión
- [ ] Subir entrega .txt a rúbrica
- [ ] Verificar que aparezca en `/api/submissions`
- [ ] Verificar archivo en Drive

**Testing con curl**:
```bash
# 1. Login como admin
POST /api/auth/login
{ "username": "admin", "password": "admin123" }

# 2. Crear profesor
POST /api/users
{ "username": "profesor1", "name": "Juan Profesor", "password": "123456", "role": "professor", "university_id": "utn-frm" }

# 3. Asignar a comisión
POST /api/commissions/{id}/assign-professor
{ "professor_id": "..." }

# 4. Login como profesor
POST /api/auth/login
{ "username": "profesor1", "password": "123456" }

# 5. Ver mis comisiones
GET /api/commissions/my-commissions

# 6. Subir entrega
POST /api/submissions
FormData: file=@proyecto.txt, student_name=juan-perez, rubric_id=...

# 7. Ver entregas
GET /api/submissions?commission_id=...
```

---

### 📚 DOCUMENTACIÓN - Fase 2
- [ ] Actualizar `backend/README.md` - Sección "API Endpoints"
- [ ] Documentar endpoints de Submissions
- [ ] Documentar endpoints de asignación de profesores
- [ ] Agregar ejemplos con curl

---

## ✅ FASE 3: Flujo n8n para Upload a Drive (1-2 días) ✅ COMPLETADA

**Rama**: `feature/admin-multitenant`
**Commits**: da25f37
**Fecha**: 2025-11-10

### 🎯 Objetivos
- Crear flujo n8n para subir archivos .txt a Drive
- Configurar webhook simplificado
- Integrar con Google Drive API

### 📋 Tareas

#### 3.1. Crear flujo n8n: upload-file-to-drive ✅
- [x] Crear archivo `n8n-workflows/upload-file-to-drive.json`
- [x] Webhook POST `/upload-file-to-drive`
- [x] Nodo Google Drive: Upload File a carpeta especificada con tipo text/plain
- [x] Responder con file_id, file_url y file_name
- [x] Manejo de errores con respuestas apropiadas

**Flujo n8n implementado**:
```
1. Webhook (POST)
   - Recibe: file (multipart), fileName, folderId

2. Set Variables
   - Extrae fileName, folderId, fileData

3. Google Drive - Upload File
   - Parent Folder ID: {{ $json.folderId }}
   - File Name: {{ $json.fileName }}
   - MIME Type: text/plain
   - Binary Data: file

4. Format Response (success)
   - drive_file_id, drive_file_url, file_name

5. Format Error (on error)
   - success: false, error message

6. Respond to Webhook
   - JSON con resultado o error
```

#### 3.2. Configurar en n8n
- [x] Workflow creado y listo para importar
- [x] Documentar configuración de credenciales de Google Drive
- [ ] Importar en instancia de n8n (pendiente - requiere n8n activo)
- [ ] Activar workflow y copiar URL

#### 3.3. Actualizar backend con URL
- [x] Variable `N8N_UPLOAD_FILE_TO_DRIVE_WEBHOOK` documentada en .env.example
- [ ] Pegar URL real en `backend/.env` (pendiente - requiere n8n activo)

#### 3.4. Testing del flujo
- [ ] Test desde Postman (pendiente - requiere n8n activo)
- [ ] Test desde backend (pendiente - requiere n8n configurado)
- [ ] Verificar archivo en Drive
- [ ] Verificar que submission tenga `drive_file_id` y `drive_file_url`

### 📦 Archivos Creados
- `n8n-workflows/upload-file-to-drive.json` - Workflow JSON completo
- `n8n-workflows/UPLOAD_FILE_WORKFLOW.md` - Documentación detallada con ejemplos

### 📦 Archivos Modificados
- `n8n-workflows/README.md` - Agregado nuevo flujo en índice

---

### 📚 DOCUMENTACIÓN - Fase 3
- [ ] Actualizar `n8n-workflows/README.md`
- [ ] Documentar webhook `/upload-file-to-drive`
- [ ] Agregar diagrama de flujo

---

## ✅ FASE 4: Frontend - Sistema de Tooltips (1-2 días)

### 🎯 Objetivos
- Crear componentes Tooltip y TooltipIcon
- Actualizar Input y Select para soportar tooltips
- Agregar tooltips en formularios clave

### 📋 Tareas

#### 4.1. Crear componente Tooltip
- [ ] Crear archivo `frontend/src/components/shared/Tooltip.tsx`
- [ ] Implementar posicionamiento (top, bottom, left, right)
- [ ] Animaciones con Tailwind

**Código**:
```tsx
// frontend/src/components/shared/Tooltip.tsx (CREAR NUEVO)
import React, { useState } from 'react';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = 'top'
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative inline-flex items-center">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children}
      </div>

      {isVisible && (
        <div
          className={`
            absolute z-50 px-3 py-2 text-sm text-white
            bg-slate-900 border border-slate-700 rounded-lg
            shadow-lg max-w-xs whitespace-normal
            ${positionClasses[position]}
            transition-opacity duration-200
          `}
        >
          {content}
          <div
            className={`
              absolute w-2 h-2 bg-slate-900 border-slate-700
              transform rotate-45
              ${position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2 border-b border-r' : ''}
              ${position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2 border-t border-l' : ''}
              ${position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2 border-t border-r' : ''}
              ${position === 'right' ? 'left-[-4px] top-1/2 -translate-y-1/2 border-b border-l' : ''}
            `}
          />
        </div>
      )}
    </div>
  );
};
```

#### 4.2. Crear componente TooltipIcon
- [ ] Crear archivo `frontend/src/components/shared/TooltipIcon.tsx`

**Código**:
```tsx
// frontend/src/components/shared/TooltipIcon.tsx (CREAR NUEVO)
import React from 'react';
import { Tooltip } from './Tooltip';

interface TooltipIconProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const TooltipIcon: React.FC<TooltipIconProps> = ({ content, position = 'top' }) => {
  return (
    <Tooltip content={content} position={position}>
      <span className="inline-flex items-center justify-center w-4 h-4 ml-2 text-xs text-slate-400 hover:text-indigo-400 transition-colors">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-4 h-4"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 3 3 0 112.871 5.026v.345a.75.75 0 01-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 108.94 6.94zM10 15a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
      </span>
    </Tooltip>
  );
};
```

#### 4.3. Actualizar componente Input
- [ ] Abrir `frontend/src/components/shared/Input.tsx`
- [ ] Agregar prop `tooltip?: string`
- [ ] Renderizar TooltipIcon si está presente

**Código a modificar**:
```tsx
// frontend/src/components/shared/Input.tsx (MODIFICAR)
import { TooltipIcon } from './TooltipIcon';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  tooltip?: string; // ⭐ AGREGAR
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  tooltip, // ⭐ AGREGAR
  error,
  helperText,
  className = '',
  ...props
}) => {
  return (
    <div className="flex flex-col space-y-1">
      {label && (
        <label className="flex items-center text-sm font-medium text-slate-200">
          {label}
          {tooltip && <TooltipIcon content={tooltip} />} {/* ⭐ AGREGAR */}
        </label>
      )}
      {/* ... resto del código existente ... */}
    </div>
  );
};
```

#### 4.4. Actualizar componente Select
- [ ] Abrir `frontend/src/components/shared/Select.tsx`
- [ ] Agregar prop `tooltip?: string`
- [ ] Similar a Input

#### 4.5. Agregar tooltips en formularios
- [ ] `UsersManager.tsx`: Tooltip en campo "Rol"
- [ ] `CommissionsManager.tsx`: Tooltip en campos clave
- [ ] Otros managers según necesidad

**Ejemplo**:
```tsx
<Input
  label="Nombre de usuario"
  name="username"
  value={formData.username}
  onChange={handleChange}
  tooltip="Solo letras minúsculas, números y guiones. Mínimo 3 caracteres."
  required
/>

<Select
  label="Rol"
  name="role"
  value={formData.role}
  onChange={handleChange}
  tooltip="super-admin: acceso global | university-admin: su universidad | professor: sus comisiones | user: solo corrección"
  options={roles}
  required
/>
```

---

### 📚 DOCUMENTACIÓN - Fase 4
- [ ] Actualizar `frontend/README.md`
- [ ] Documentar Tooltip y TooltipIcon
- [ ] Ejemplos de uso

---

## ✅ FASE 5: Frontend - Vista de Profesor (3-4 días) ✅ COMPLETADA

**Rama**: `feature/admin-multitenant`
**Commits**: c6972a0
**Fecha**: 2025-11-10

### 🎯 Objetivos
- Crear ProfessorView completo
- Listar comisiones asignadas
- Subir entregas de alumnos
- Ver lista de entregas por rúbrica

### 📋 Tareas

#### 5.1. Crear componente ProfessorView ✅
- [x] Crear archivo `frontend/src/components/professor/ProfessorView.tsx`
- [x] Layout: Sidebar con comisiones + Panel principal
- [x] Auto-selección de primera comisión y rúbrica
- [x] Selector de rúbricas por comisión

#### 5.2. Crear servicio submissionService ✅
- [x] Crear archivo `frontend/src/services/submissionService.ts`
- [x] Métodos: `getSubmissionsByRubric()`, `getSubmissionById()`, `createSubmission()`, `deleteSubmission()`, `getMyCommissions()`
- [x] Soporte para FormData en upload

#### 5.3. Crear componente para subir entregas ✅
- [x] Modal UploadSubmissionModal con formulario completo
- [x] Input file (.txt) con validación
- [x] Preview del archivo (primeros 500 caracteres)
- [x] Tooltips en campos
- [x] Generación automática de nombre en formato kebab-case

#### 5.4. Crear componente para listar entregas ✅
- [x] Tabla SubmissionsList con entregas por rúbrica
- [x] Columnas: Alumno, Archivo, Fecha, Estado, Nota
- [x] Badges de estado (uploaded, pending-correction, corrected, failed)
- [x] Acciones: Ver en Drive, Ver corrección, Eliminar
- [x] Estado vacío con mensaje amigable

#### 5.5. Testing
- [ ] Login como professor
- [ ] Ver comisiones
- [ ] Subir entrega
- [ ] Ver lista de entregas

### 📦 Archivos Creados
- `frontend/src/components/professor/ProfessorView.tsx` - Vista principal del profesor
- `frontend/src/components/professor/UploadSubmissionModal.tsx` - Modal para subir entregas
- `frontend/src/components/professor/SubmissionsList.tsx` - Lista de entregas
- `frontend/src/services/submissionService.ts` - Servicio de submissions

### 📦 Archivos Modificados
- `frontend/src/services/rubricService.ts` - Agregado método getRubricsByCommission

---

### 📚 DOCUMENTACIÓN - Fase 5
- [ ] Actualizar `frontend/README.md`
- [ ] Documentar ProfessorView
- [ ] Capturas de pantalla

---

## ✅ FASE 6: Frontend - Actualizar Admin Panel (2-3 días) ✅ COMPLETADA

**Rama**: `feature/admin-multitenant`
**Commits**: 65f559f
**Fecha**: 2025-11-10

### 🎯 Objetivos
- Actualizar UsersManager para nuevos roles
- Actualizar CommissionsManager para asignar profesores
- Filtros multi-tenant (university-admin ve solo su universidad)

### 📋 Tareas

#### 6.1. Actualizar UsersManager ✅
- [x] Agregar campo `university_id` en formulario
- [x] Select de rol con tooltips (4 roles: super-admin, university-admin, professor, user)
- [x] Validación condicional de `university_id` (requerido excepto para super-admin)
- [x] Actualización de badges de roles en tabla
- [x] Integración con universityService

#### 6.2. Actualizar CommissionsManager ✅
- [x] Sección para asignar/remover profesores en modal de edición
- [x] Select de profesores disponibles (filtrados por universidad)
- [x] Lista de profesores asignados con opción de quitar
- [x] Visualización de profesores en tabla con badges
- [x] Métodos handleAssignProfessor y handleRemoveProfessor

#### 6.3. Testing
- [ ] Crear usuarios con diferentes roles
- [ ] Asignar profesores a comisiones
- [ ] Validar filtros multi-tenant

### 📦 Archivos Modificados
- `frontend/src/components/admin/UsersManager.tsx` - Soporte multi-tenant y nuevos roles
- `frontend/src/components/admin/CommissionsManager.tsx` - Asignación de profesores
- `frontend/src/services/commissionService.ts` - Métodos assignProfessor, removeProfessor, getProfessorsByUniversity
- `frontend/src/services/userService.ts` - Actualización de tipos (CreateUserForm, UpdateUserForm)
- `frontend/src/types/index.ts` - Actualización de User, UserProfile, Commission con nuevos campos

---

### 📚 DOCUMENTACIÓN - Fase 6
- [ ] Actualizar `frontend/README.md`
- [ ] Documentar cambios en managers

---

## ✅ FASE 7: Routing y Navegación (1 día) ✅ COMPLETADA

**Rama**: `feature/admin-multitenant`
**Commits**: 22b61d2
**Fecha**: 2025-11-10

### 🎯 Objetivos
- Actualizar rutas en App.tsx
- Redirección según rol después de login
- Links en navbar según rol

### 📋 Tareas

#### 7.1. Actualizar App.tsx ✅
- [x] Agregar ruta `/professor` con requireRole="professor"
- [x] Importar ProfessorView y crear ProfessorPage wrapper
- [x] Proteger con ProtectedRoute

#### 7.2. Actualizar Login ✅
- [x] Redirección según rol después de login:
  - super-admin/university-admin/admin → /admin
  - professor → /professor
  - user → / (home)

#### 7.3. Actualizar useAuth y ProtectedRoute ✅
- [x] Agregado hasRole(role) para validar rol específico
- [x] Agregado getRole() para obtener rol actual
- [x] Actualizado isAdmin() para incluir todos los admin roles
- [x] ProtectedRoute con soporte para requireRole prop

#### 7.4. Actualizar Layout (Navbar) ✅
- [x] Links dinámicos según rol del usuario
- [x] Admin: Admin Panel + Inicio
- [x] Professor: Mis Comisiones + Corrección
- [x] User: Inicio
- [x] Subtítulos dinámicos por rol

### 📦 Archivos Modificados
- `frontend/src/App.tsx` - Ruta /professor agregada
- `frontend/src/components/auth/Login.tsx` - Redirección por rol
- `frontend/src/components/auth/ProtectedRoute.tsx` - Soporte requireRole
- `frontend/src/components/layout/Layout.tsx` - Navbar dinámica
- `frontend/src/hooks/useAuth.ts` - Métodos hasRole y getRole

---

### 📚 DOCUMENTACIÓN - Fase 7
- [ ] Actualizar `frontend/README.md`
- [ ] Documentar rutas por rol

---

## ✅ FASE 8: Testing e Integración (2-3 días)

### 🎯 Objetivos
- Testing end-to-end
- Validar multi-tenancy
- Validar estructura Drive

### 📋 Tareas

#### 8.1. Testing de roles
- [ ] Crear usuarios de cada rol
- [ ] Validar accesos

#### 8.2. Testing de flujo completo
- [ ] Super-admin crea universidad
- [ ] University-admin crea comisión
- [ ] University-admin asigna profesor
- [ ] Professor sube entrega
- [ ] Verificar en Drive

#### 8.3. Testing de estructura Drive
- [ ] Subir 3 entregas a una rúbrica
- [ ] Verificar archivos en Drive
- [ ] Verificar nombres: `alumno-{nombre}.txt`

---

### 📚 DOCUMENTACIÓN - Fase 8
- [ ] Crear `GUIA_TESTING_REFACTORIZACION.md`
- [ ] Casos de prueba

---

## ✅ FASE 9: Documentación Final (1-2 días)

### 🎯 Objetivos
- Actualizar todos los READMEs
- Crear guías por rol
- Actualizar PROYECTO_PLAN.md

### 📋 Tareas

#### 9.1. Actualizar README principal
- [ ] Sección de roles
- [ ] Sección de arquitectura

#### 9.2. Actualizar backend/README.md
- [ ] Nuevos modelos
- [ ] Nuevos endpoints

#### 9.3. Actualizar frontend/README.md
- [ ] ProfessorView
- [ ] Tooltips

#### 9.4. Actualizar n8n-workflows/README.md
- [ ] Webhook upload-file-to-drive

#### 9.5. Crear guías de usuario
- [ ] GUIA_SUPER_ADMIN.md
- [ ] GUIA_UNIVERSITY_ADMIN.md
- [ ] GUIA_PROFESSOR.md

---

### 📚 DOCUMENTACIÓN - Fase 9
- [ ] Revisar todos los READMEs
- [ ] Verificar ejemplos de código

---

## 📊 RESUMEN

### Progreso Total

| Fase | Nombre | Días | Estado |
|------|--------|------|--------|
| 1 | Modificar Modelos | 2-3 | ⬜ Pendiente |
| 2 | Controladores Submissions | 2-3 | ⬜ Pendiente |
| 3 | Flujo n8n Upload Drive | 1-2 | ⬜ Pendiente |
| 4 | Sistema Tooltips | 1-2 | ⬜ Pendiente |
| 5 | Vista Profesor | 3-4 | ⬜ Pendiente |
| 6 | Actualizar Admin Panel | 2-3 | ⬜ Pendiente |
| 7 | Routing | 1 | ⬜ Pendiente |
| 8 | Testing | 2-3 | ⬜ Pendiente |
| 9 | Documentación | 1-2 | ⬜ Pendiente |

**Total**: 15-23 días (~3-5 semanas)

---

## 🎯 CHECKLIST GENERAL

### Backend
- [ ] User: nuevos roles + university_id
- [ ] Commission: array de profesores
- [ ] Submission: modelo nuevo
- [ ] Middleware: multiTenant.js
- [ ] Controlador: submissionController.js
- [ ] Rutas: submissionRoutes.js
- [ ] driveService: uploadFileToDrive()

### Frontend
- [ ] Tooltip + TooltipIcon
- [ ] Input + Select con tooltips
- [ ] ProfessorView completo
- [ ] submissionService.ts
- [ ] UsersManager actualizado
- [ ] CommissionsManager actualizado

### n8n
- [ ] Webhook: upload-file-to-drive

### Documentación
- [ ] READMEs actualizados
- [ ] Guías de usuario

---

**Última actualización**: Noviembre 2025
**Versión**: 2.1 (Corregida y basada en estructura real)
**Estado**: Pendiente de inicio
