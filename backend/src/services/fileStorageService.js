/**
 * Servicio de Almacenamiento Local de Archivos
 * Maneja el guardado, lectura y eliminación de archivos de submissions
 * Almacenamiento: uploads/submissions/{commission_id}/{rubric_id}/{student_name}/
 */
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuración de ruta base
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_BASE_DIR = path.join(__dirname, '../../uploads/submissions');

// Configuración
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB en bytes
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'text/plain',
  'application/octet-stream', // Para archivos sin extensión o genéricos
];

/**
 * Sanitiza un nombre para usarlo como nombre de carpeta/archivo
 * @param {String} name - Nombre a sanitizar
 * @returns {String} Nombre sanitizado
 */
const sanitizeName = (name) => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^a-z0-9-_]/g, '-') // Reemplazar caracteres especiales por guiones
    .replace(/-+/g, '-') // Reemplazar múltiples guiones por uno solo
    .replace(/^-+|-+$/g, ''); // Eliminar guiones al inicio y final
};

/**
 * Valida el tamaño del archivo
 * @param {Number} fileSize - Tamaño en bytes
 * @throws {Error} Si el archivo es demasiado grande
 */
const validateFileSize = (fileSize) => {
  if (fileSize > MAX_FILE_SIZE) {
    throw new Error(
      `El archivo es demasiado grande. Tamaño máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`
    );
  }
};

/**
 * Valida el tipo MIME del archivo
 * @param {String} mimeType - Tipo MIME
 * @throws {Error} Si el tipo no está permitido
 */
const validateMimeType = (mimeType) => {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error(
      `Tipo de archivo no permitido: ${mimeType}. Permitidos: PDF, ZIP, RAR, 7Z, TXT`
    );
  }
};

/**
 * Crea la estructura de directorios necesaria
 * @param {String} dirPath - Ruta del directorio
 */
const ensureDirectoryExists = async (dirPath) => {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    throw new Error(`Error al crear directorio: ${error.message}`);
  }
};

/**
 * Guarda un archivo de submission en almacenamiento local
 * @param {Object} file - Archivo de multer o similar
 * @param {Object} submissionData - { commission_id, rubric_id, student_name }
 * @returns {Promise<Object>} { file_path, storage_type: 'local', mime_type }
 */
export const saveSubmissionFile = async (file, submissionData) => {
  try {
    const { commission_id, rubric_id, student_name } = submissionData;

    // Validaciones
    if (!file) {
      throw new Error('No se proporcionó ningún archivo');
    }

    if (!commission_id || !rubric_id || !student_name) {
      throw new Error('Faltan datos de submission (commission_id, rubric_id, student_name)');
    }

    validateFileSize(file.size);
    validateMimeType(file.mimetype);

    // Sanitizar nombre del estudiante
    const sanitizedStudentName = sanitizeName(student_name);

    // Construir ruta del directorio
    const submissionDir = path.join(
      UPLOADS_BASE_DIR,
      commission_id,
      rubric_id,
      sanitizedStudentName
    );

    // Crear directorio si no existe
    await ensureDirectoryExists(submissionDir);

    // Generar nombre único para el archivo (timestamp + nombre original)
    const timestamp = Date.now();
    const originalName = file.originalname || file.name || 'archivo';
    const fileName = `${timestamp}-${sanitizeName(path.parse(originalName).name)}${path.extname(
      originalName
    )}`;

    // Ruta completa del archivo
    const filePath = path.join(submissionDir, fileName);

    // Guardar archivo
    // Si el archivo viene con buffer (multer memory storage)
    if (file.buffer) {
      await fs.writeFile(filePath, file.buffer);
    }
    // Si el archivo viene con path (multer disk storage)
    else if (file.path) {
      await fs.copyFile(file.path, filePath);
      // Eliminar archivo temporal si existe
      try {
        await fs.unlink(file.path);
      } catch (err) {
        console.warn('No se pudo eliminar archivo temporal:', err.message);
      }
    } else {
      throw new Error('El archivo no tiene buffer ni path');
    }

    // Retornar ruta relativa desde la raíz del proyecto
    const relativePath = path.relative(path.join(__dirname, '../..'), filePath);

    console.log(`✅ Archivo guardado: ${relativePath}`);

    return {
      file_path: relativePath.replace(/\\/g, '/'), // Normalizar separadores a /
      storage_type: 'local',
      mime_type: file.mimetype,
    };
  } catch (error) {
    console.error('❌ Error al guardar archivo:', error);
    throw error;
  }
};

/**
 * Obtiene un archivo de submission desde almacenamiento local
 * @param {String} filePath - Ruta relativa del archivo
 * @returns {Promise<Buffer>} Buffer del archivo
 */
export const getSubmissionFile = async (filePath) => {
  try {
    if (!filePath) {
      throw new Error('No se proporcionó ruta de archivo');
    }

    // Construir ruta absoluta
    const absolutePath = path.join(__dirname, '../..', filePath);

    // Verificar que el archivo existe
    try {
      await fs.access(absolutePath);
    } catch (error) {
      throw new Error(`Archivo no encontrado: ${filePath}`);
    }

    // Leer archivo
    const fileBuffer = await fs.readFile(absolutePath);

    console.log(`✅ Archivo leído: ${filePath}`);

    return fileBuffer;
  } catch (error) {
    console.error('❌ Error al leer archivo:', error);
    throw error;
  }
};

/**
 * Elimina un archivo de submission del almacenamiento local
 * @param {String} filePath - Ruta relativa del archivo
 * @returns {Promise<Boolean>} true si se eliminó correctamente
 */
export const deleteSubmissionFile = async (filePath) => {
  try {
    if (!filePath) {
      console.warn('No se proporcionó ruta de archivo para eliminar');
      return false;
    }

    // Construir ruta absoluta
    const absolutePath = path.join(__dirname, '../..', filePath);

    // Verificar que el archivo existe antes de eliminar
    try {
      await fs.access(absolutePath);
    } catch (error) {
      console.warn(`Archivo no encontrado al intentar eliminar: ${filePath}`);
      return false;
    }

    // Eliminar archivo
    await fs.unlink(absolutePath);

    console.log(`✅ Archivo eliminado: ${filePath}`);

    return true;
  } catch (error) {
    console.error('❌ Error al eliminar archivo:', error);
    // No lanzar error, solo registrar
    return false;
  }
};

/**
 * Verifica si un archivo existe
 * @param {String} filePath - Ruta relativa del archivo
 * @returns {Promise<Boolean>} true si existe
 */
export const fileExists = async (filePath) => {
  try {
    if (!filePath) {
      return false;
    }

    const absolutePath = path.join(__dirname, '../..', filePath);
    await fs.access(absolutePath);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Inicializa el directorio base de uploads si no existe
 */
export const initializeUploadsDirectory = async () => {
  try {
    await ensureDirectoryExists(UPLOADS_BASE_DIR);
    console.log(`✅ Directorio de uploads inicializado: ${UPLOADS_BASE_DIR}`);
  } catch (error) {
    console.error('❌ Error al inicializar directorio de uploads:', error);
    throw error;
  }
};

// Exportar constantes para uso externo
export const CONFIG = {
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
  UPLOADS_BASE_DIR,
};
