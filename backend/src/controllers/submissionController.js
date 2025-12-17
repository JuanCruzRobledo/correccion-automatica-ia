/**
 * Controlador de Submissions (Entregas de Alumnos)
 * Gestiona la subida, listado, actualización y eliminación de entregas
 */
import Submission from '../models/Submission.js';
import Commission from '../models/Commission.js';
import Rubric from '../models/Rubric.js';
import User from '../models/User.js';
import * as fileStorageService from '../services/fileStorageService.js';
import ConsolidatorService from '../services/consolidatorService.js';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import axios from 'axios';

/**
 * Obtener todas las submissions con filtros multi-tenant
 * GET /api/submissions?commission_id=...&rubric_id=...&status=...
 */
export const getAllSubmissions = async (req, res) => {
  try {
    const { commission_id, rubric_id, status } = req.query;
    const filters = {};

    // Aplicar filtros multi-tenant según rol
    if (req.user.role === 'super-admin') {
      // Super-admin ve todo
    } else if (req.user.role === 'university-admin') {
      // University-admin solo su universidad
      filters.university_id = req.user.university_id;
    } else if (req.user.role === 'professor') {
      // Professor solo sus comisiones
      const professorCommissions = await Commission.find({
        professors: req.user.userId,
        deleted: false,
      }).select('commission_id');

      const commissionIds = professorCommissions.map((c) => c.commission_id);

      if (commissionIds.length === 0) {
        return res.status(200).json({
          success: true,
          data: [],
          message: 'No tiene comisiones asignadas',
        });
      }

      filters.commission_id = { $in: commissionIds };
    } else {
      // user no tiene acceso
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado',
      });
    }

    // Aplicar filtros adicionales del query
    if (commission_id) {
      filters.commission_id = commission_id;
    }
    if (rubric_id) {
      filters.rubric_id = rubric_id;
    }
    if (status) {
      filters.status = status;
    }

    const submissions = await Submission.findActive(filters);

    res.status(200).json({
      success: true,
      data: submissions,
      count: submissions.length,
    });
  } catch (error) {
    console.error('Error al obtener submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener submissions',
      error: error.message,
    });
  }
};

/**
 * Obtener una submission por ID con validación de acceso
 * GET /api/submissions/:id
 */
export const getSubmissionById = async (req, res) => {
  try {
    const { id } = req.params;

    const submission = await Submission.findById(id)
      .populate('uploaded_by', 'name username')
      .populate('correction.corrected_by', 'name username');

    if (!submission || submission.deleted) {
      return res.status(404).json({
        success: false,
        message: 'Submission no encontrada',
      });
    }

    // Validar acceso multi-tenant
    if (req.user.role === 'super-admin') {
      // Super-admin accede a todo
    } else if (req.user.role === 'university-admin') {
      // University-admin solo su universidad
      if (submission.university_id !== req.user.university_id) {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado a esta submission',
        });
      }
    } else if (req.user.role === 'professor') {
      // Professor solo sus comisiones
      const commission = await Commission.findOne({
        commission_id: submission.commission_id,
        professors: req.user.userId,
        deleted: false,
      });

      if (!commission) {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado a esta submission',
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado',
      });
    }

    res.status(200).json({
      success: true,
      data: submission,
    });
  } catch (error) {
    console.error('Error al obtener submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener submission',
      error: error.message,
    });
  }
};

/**
 * Crear nueva submission (subir entrega de alumno)
 * POST /api/submissions
 * Body (multipart/form-data): file, student_name, student_id, rubric_id, commission_id, mode?, customExtensions?, includeTests?, forceOverwrite?
 */
export const createSubmission = async (req, res) => {
  let tempFilePath = null;
  let extractedPath = null;
  let consolidatedTxtPath = null;

  try {
    const {
      student_name,
      student_id,
      rubric_id,
      commission_id,
      mode,
      customExtensions,
      includeTests,
      forceOverwrite,
    } = req.body;
    const uploadedFile = req.file;

    // Validaciones
    if (!student_name || !rubric_id || !commission_id) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: student_name, rubric_id, commission_id',
      });
    }

    if (!uploadedFile) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó archivo',
      });
    }

    // Validar extensión (.txt o .zip)
    const isTxt = uploadedFile.originalname.endsWith('.txt');
    const isZip = uploadedFile.originalname.endsWith('.zip');

    if (!isTxt && !isZip) {
      await fs.unlink(uploadedFile.path);
      return res.status(400).json({
        success: false,
        message: 'Solo se permiten archivos .txt o .zip',
      });
    }

    tempFilePath = uploadedFile.path;

    // Buscar rúbrica para obtener jerarquía
    console.log(`🔍 Buscando rúbrica con rubric_id: "${rubric_id}"`);
    const rubric = await Rubric.findOne({ rubric_id, deleted: false });

    if (!rubric) {
      await fs.unlink(tempFilePath);
      console.error(`❌ Rúbrica no encontrada: "${rubric_id}"`);
      return res.status(404).json({
        success: false,
        message: 'Rúbrica no encontrada',
      });
    }

    console.log(`✅ Rúbrica encontrada: ${rubric.name}`);

    // Validar que commission_id coincida
    if (rubric.commission_id !== commission_id) {
      await fs.unlink(tempFilePath);
      return res.status(400).json({
        success: false,
        message: 'La rúbrica no pertenece a la comisión especificada',
      });
    }

    // Validar acceso del profesor a la comisión
    if (req.user.role === 'professor') {
      const commission = await Commission.findOne({
        commission_id,
        professors: req.user.userId,
        deleted: false,
      });

      if (!commission) {
        await fs.unlink(tempFilePath);
        return res.status(403).json({
          success: false,
          message: 'No tiene acceso a esta comisión',
        });
      }
    }

    // Si es ZIP, consolidar primero
    let finalTxtPath = tempFilePath;
    let consolidationStats = null;

    if (isZip) {
      console.log(`🔄 Consolidando ZIP para ${student_name}...`);

      try {
        // Descomprimir ZIP
        const AdmZip = (await import('adm-zip')).default;
        const zip = new AdmZip(tempFilePath);

        const uploadDir = path.join(process.cwd(), 'uploads', 'temp');
        if (!fsSync.existsSync(uploadDir)) {
          fsSync.mkdirSync(uploadDir, { recursive: true });
        }

        const timestamp = Date.now();
        extractedPath = path.join(uploadDir, `extracted_${timestamp}_${student_name}`);
        zip.extractAllTo(extractedPath, true);

        // Buscar la carpeta raíz del proyecto (a veces el ZIP tiene una carpeta contenedora)
        const extractedContents = await fs.readdir(extractedPath);
        let projectPath = extractedPath;

        if (extractedContents.length === 1) {
          const singleItem = path.join(extractedPath, extractedContents[0]);
          const singleItemStat = await fs.stat(singleItem);
          if (singleItemStat.isDirectory()) {
            projectPath = singleItem;
          }
        }

        // Consolidar proyecto
        const customExtArray = customExtensions
          ? customExtensions.split(',').map((ext) => ext.trim())
          : null;

        const consolidationResult = await ConsolidatorService.consolidateProject(
          projectPath,
          mode || '1',
          customExtArray,
          includeTests === 'true' || includeTests === true
        );

        // Guardar resultado en archivo temporal .txt
        consolidatedTxtPath = path.join(uploadDir, `consolidated-${timestamp}-${student_name}.txt`);
        await fs.writeFile(consolidatedTxtPath, consolidationResult.content, 'utf-8');

        finalTxtPath = consolidatedTxtPath;
        consolidationStats = consolidationResult.stats;

        console.log(`✅ Consolidación exitosa: ${consolidationResult.stats.totalFiles} archivos`);
      } catch (consolidationError) {
        console.error('❌ Error en consolidación:', consolidationError);
        throw new Error(`Error al consolidar proyecto: ${consolidationError.message}`);
      }
    }

    // Validar que no exista submission duplicada (mismo rubric_id + student_name)
    const cleanStudentName = student_name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const existingSubmission = await Submission.findOne({
      rubric_id,
      student_name: cleanStudentName,
      deleted: false,
    });

    if (existingSubmission) {
      // Si forceOverwrite está activo, hacer soft delete de la submission anterior
      if (forceOverwrite === 'true' || forceOverwrite === true) {
        console.log(`⚠️ Sobrescribiendo submission existente para ${cleanStudentName}`);
        await existingSubmission.softDelete();
      } else {
        throw new Error(
          `Ya existe una entrega para el alumno "${student_name}" en esta rúbrica. Active "Forzar sobrescritura" para reemplazarla.`
        );
      }
    }

    // Leer preview del archivo (primeros 500 caracteres)
    const fileContent = await fs.readFile(finalTxtPath, 'utf-8');
    const fileContentPreview = fileContent.substring(0, 500);

    // Obtener tamaño del archivo final
    const finalFileStats = await fs.stat(finalTxtPath);

    // Guardar archivo localmente
    console.log(`💾 Guardando archivo localmente para ${cleanStudentName}...`);

    // Preparar datos del archivo para storage
    const fileToStore = {
      path: finalTxtPath,
      originalname: 'entrega.txt',
      mimetype: 'text/plain',
      size: finalFileStats.size,
    };

    const storageResult = await fileStorageService.saveSubmissionFile(fileToStore, {
      commission_id: rubric.commission_id,
      rubric_id: rubric.rubric_id,
      student_name: cleanStudentName,
    });

    console.log(`✅ Archivo guardado: ${storageResult.file_path}`);

    // Generar submission_id
    const submission_id = Submission.generateSubmissionId(commission_id, cleanStudentName);

    // Crear submission en BD
    const newSubmission = new Submission({
      submission_id,
      commission_id: rubric.commission_id,
      rubric_id: rubric.rubric_id,
      course_id: rubric.course_id,
      career_id: rubric.career_id,
      faculty_id: rubric.faculty_id,
      university_id: rubric.university_id,
      student_name: cleanStudentName,
      student_id: student_id || null,
      file_name: 'entrega.txt',
      file_size: finalFileStats.size,
      file_content_preview: fileContentPreview,
      file_path: storageResult.file_path,
      file_storage_type: storageResult.storage_type,
      file_mime_type: storageResult.mime_type,
      uploaded_by: req.user.userId,
      status: 'uploaded',
    });

    await newSubmission.save();

    console.log(`✅ Submission creada: ${submission_id}`);

    // Preparar respuesta
    const responseMessage = isZip
      ? `Entrega consolidada y subida exitosamente (${consolidationStats.totalFiles} archivos procesados)`
      : 'Entrega subida exitosamente';

    res.status(201).json({
      success: true,
      data: newSubmission,
      message: responseMessage,
      consolidationStats: isZip ? consolidationStats : undefined,
    });
  } catch (error) {
    console.error('Error al crear submission:', error);

    res.status(500).json({
      success: false,
      message: 'Error al crear submission',
      error: error.message,
    });
  } finally {
    // Limpiar archivos temporales
    try {
      if (tempFilePath && fsSync.existsSync(tempFilePath)) {
        await fs.unlink(tempFilePath);
      }
      if (consolidatedTxtPath && fsSync.existsSync(consolidatedTxtPath)) {
        await fs.unlink(consolidatedTxtPath);
      }
      if (extractedPath && fsSync.existsSync(extractedPath)) {
        await fs.rm(extractedPath, { recursive: true, force: true });
      }
    } catch (cleanupError) {
      console.error('⚠️ Error al limpiar archivos temporales:', cleanupError);
    }
  }
};

/**
 * Actualizar submission (estado o corrección)
 * PUT /api/submissions/:id
 * Body: { status?, correction? }
 */
export const updateSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, correction } = req.body;

    const submission = await Submission.findById(id);

    if (!submission || submission.deleted) {
      return res.status(404).json({
        success: false,
        message: 'Submission no encontrada',
      });
    }

    // Validar acceso
    if (req.user.role === 'professor') {
      const commission = await Commission.findOne({
        commission_id: submission.commission_id,
        professors: req.user.userId,
        deleted: false,
      });

      if (!commission) {
        return res.status(403).json({
          success: false,
          message: 'No tiene acceso a esta submission',
        });
      }
    } else if (req.user.role === 'university-admin') {
      if (submission.university_id !== req.user.university_id) {
        return res.status(403).json({
          success: false,
          message: 'No tiene acceso a esta submission',
        });
      }
    }

    // Actualizar estado
    if (status) {
      await submission.updateStatus(status);
    }

    // Actualizar corrección
    if (correction) {
      await submission.addCorrection({
        ...correction,
        corrected_by: req.user.userId,
      });
    }

    const updatedSubmission = await Submission.findById(id)
      .populate('uploaded_by', 'name username')
      .populate('correction.corrected_by', 'name username');

    res.status(200).json({
      success: true,
      data: updatedSubmission,
      message: 'Submission actualizada exitosamente',
    });
  } catch (error) {
    console.error('Error al actualizar submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar submission',
      error: error.message,
    });
  }
};

/**
 * Descargar archivo original de submission
 * GET /api/submissions/:id/file
 */
export const downloadSubmissionFile = async (req, res) => {
  try {
    const { id } = req.params;

    const submission = await Submission.findById(id);

    if (!submission || submission.deleted) {
      return res.status(404).json({
        success: false,
        message: 'Submission no encontrada',
      });
    }

    // Validar acceso
    if (req.user.role === 'professor') {
      const commission = await Commission.findOne({
        commission_id: submission.commission_id,
        professors: req.user.userId,
        deleted: false,
      });

      if (!commission) {
        return res.status(403).json({
          success: false,
          message: 'No tiene acceso a esta submission',
        });
      }
    } else if (req.user.role === 'university-admin') {
      if (submission.university_id !== req.user.university_id) {
        return res.status(403).json({
          success: false,
          message: 'No tiene acceso a esta submission',
        });
      }
    }

    // Verificar que tenga archivo
    if (!submission.file_path) {
      return res.status(404).json({
        success: false,
        message: 'Esta submission no tiene archivo asociado',
      });
    }

    // Obtener archivo desde fileStorageService
    const { getSubmissionFile } = await import('../services/fileStorageService.js');
    const fileBuffer = await getSubmissionFile(submission.file_path);

    // Configurar headers para descarga
    res.setHeader('Content-Type', submission.file_mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${submission.file_name}"`);
    res.setHeader('Content-Length', fileBuffer.length);

    // Enviar archivo
    res.send(fileBuffer);

    console.log(`✅ Archivo descargado: ${submission.file_name} (${submission.student_name})`);
  } catch (error) {
    console.error('Error al descargar archivo de submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error al descargar archivo',
      error: error.message,
    });
  }
};

/**
 * Eliminar submission (soft delete)
 * DELETE /api/submissions/:id
 */
export const deleteSubmission = async (req, res) => {
  try {
    const { id } = req.params;

    const submission = await Submission.findById(id);

    if (!submission || submission.deleted) {
      return res.status(404).json({
        success: false,
        message: 'Submission no encontrada',
      });
    }

    // Validar acceso
    if (req.user.role === 'professor') {
      const commission = await Commission.findOne({
        commission_id: submission.commission_id,
        professors: req.user.userId,
        deleted: false,
      });

      if (!commission) {
        return res.status(403).json({
          success: false,
          message: 'No tiene acceso a esta submission',
        });
      }
    } else if (req.user.role === 'university-admin') {
      if (submission.university_id !== req.user.university_id) {
        return res.status(403).json({
          success: false,
          message: 'No tiene acceso a esta submission',
        });
      }
    }

    await submission.softDelete();

    res.status(200).json({
      success: true,
      message: 'Submission eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error al eliminar submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar submission',
      error: error.message,
    });
  }
};

/**
 * Crear múltiples submissions en batch (auto-consolidación)
 * POST /api/submissions/batch
 * Body (multipart/form-data): file (ZIP con estructura entregas/), rubric_id, commission_id, mode?, customExtensions?, includeTests?, forceOverwrite?, runSimilarityAnalysis?
 */
export const createBatchSubmissions = async (req, res) => {
  let tempZipPath = null;
  let consolidatedDir = null;

  try {
    const {
      rubric_id,
      commission_id,
      mode,
      customExtensions,
      includeTests,
      forceOverwrite,
      runSimilarityAnalysis,
    } = req.body;

    const uploadedFile = req.file;

    // Validaciones
    if (!rubric_id || !commission_id) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: rubric_id, commission_id',
      });
    }

    if (!uploadedFile) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó archivo ZIP',
      });
    }

    if (!uploadedFile.originalname.endsWith('.zip')) {
      await fs.unlink(uploadedFile.path);
      return res.status(400).json({
        success: false,
        message: 'Solo se permiten archivos .zip para batch',
      });
    }

    tempZipPath = uploadedFile.path;

    // Buscar rúbrica
    const rubric = await Rubric.findOne({ rubric_id, deleted: false });

    if (!rubric) {
      await fs.unlink(tempZipPath);
      return res.status(404).json({
        success: false,
        message: 'Rúbrica no encontrada',
      });
    }

    console.log(`✅ Rúbrica encontrada: ${rubric.name}`);

    // Validar que commission_id coincida
    if (rubric.commission_id !== commission_id) {
      await fs.unlink(tempZipPath);
      return res.status(400).json({
        success: false,
        message: 'La rúbrica no pertenece a la comisión especificada',
      });
    }

    // Validar acceso del profesor a la comisión
    if (req.user.role === 'professor') {
      const commission = await Commission.findOne({
        commission_id,
        professors: req.user.userId,
        deleted: false,
      });

      if (!commission) {
        await fs.unlink(tempZipPath);
        return res.status(403).json({
          success: false,
          message: 'No tiene acceso a esta comisión',
        });
      }
    }

    console.log(`📦 Procesando batch de entregas para ${commission_id} / ${rubric_id}...`);

    // Importar BatchConsolidatorService
    const { default: BatchConsolidatorService } = await import(
      '../services/batchConsolidatorService.js'
    );

    // Consolidar todos los proyectos
    const options = {
      mode: mode || '1',
      includeTests: includeTests === 'true' || includeTests === true,
      customExtensions: customExtensions
        ? customExtensions.split(',').map((ext) => ext.trim())
        : null,
    };

    const batchResult = await BatchConsolidatorService.processBatchSubmissions(
      tempZipPath,
      commission_id,
      rubric_id,
      options
    );

    consolidatedDir = batchResult.output_dir;

    console.log(
      `✅ Batch consolidado: ${batchResult.successful} exitosos, ${batchResult.failed} fallidos`
    );

    // Procesar cada resultado
    const successResults = [];
    const errorResults = [];

    for (const result of batchResult.results) {
      try {
        if (result.status === 'error') {
          // Registrar error sin crear submission
          errorResults.push({
            studentName: result.student_name,
            error: result.error || 'Error desconocido durante consolidación',
          });
          continue;
        }

        const cleanStudentName = result.student_name.toLowerCase().replace(/[^a-z0-9-]/g, '-');

        // Validar duplicado
        const existingSubmission = await Submission.findOne({
          rubric_id,
          student_name: cleanStudentName,
          deleted: false,
        });

        if (existingSubmission) {
          if (forceOverwrite === 'true' || forceOverwrite === true) {
            console.log(`⚠️ Sobrescribiendo submission existente para ${cleanStudentName}`);
            await existingSubmission.softDelete();
          } else {
            errorResults.push({
              studentName: result.student_name,
              error: 'Ya existe una entrega. Active "Forzar sobrescritura".',
            });
            continue;
          }
        }

        // Ruta del archivo consolidado
        const txtPath = path.join(consolidatedDir, result.student_name, 'entrega.txt');

        if (!fsSync.existsSync(txtPath)) {
          errorResults.push({
            studentName: result.student_name,
            error: 'Archivo consolidado no encontrado',
          });
          continue;
        }

        // Leer preview y stats del archivo
        const fileContent = await fs.readFile(txtPath, 'utf-8');
        const fileContentPreview = fileContent.substring(0, 500);
        const fileStats = await fs.stat(txtPath);

        // Guardar archivo localmente
        console.log(`💾 Guardando archivo localmente para ${cleanStudentName}...`);

        // Preparar datos del archivo para storage
        const fileToStore = {
          path: txtPath,
          originalname: 'entrega.txt',
          mimetype: 'text/plain',
          size: fileStats.size,
        };

        const storageResult = await fileStorageService.saveSubmissionFile(fileToStore, {
          commission_id: rubric.commission_id,
          rubric_id: rubric.rubric_id,
          student_name: cleanStudentName,
        });

        console.log(`✅ Archivo guardado: ${storageResult.file_path}`);

        // Crear Submission
        const submission_id = Submission.generateSubmissionId(commission_id, cleanStudentName);

        const newSubmission = new Submission({
          submission_id,
          commission_id: rubric.commission_id,
          rubric_id: rubric.rubric_id,
          course_id: rubric.course_id,
          career_id: rubric.career_id,
          faculty_id: rubric.faculty_id,
          university_id: rubric.university_id,
          student_name: cleanStudentName,
          student_id: null,
          file_name: 'entrega.txt',
          file_size: fileStats.size,
          file_content_preview: fileContentPreview,
          file_path: storageResult.file_path,
          file_storage_type: storageResult.storage_type,
          file_mime_type: storageResult.mime_type,
          uploaded_by: req.user.userId,
          status: 'uploaded',
        });

        await newSubmission.save();
        successResults.push({
          studentName: result.student_name,
          submissionId: submission_id,
          stats: result.stats,
        });

        console.log(`✅ Submission creada para ${cleanStudentName}`);
      } catch (err) {
        console.error(`❌ Error procesando ${result.student_name}:`, err);
        errorResults.push({
          studentName: result.student_name,
          error: err.message,
        });
      }
    }

    // Análisis de similitud (opcional)
    let similarityAnalysis = null;
    if ((runSimilarityAnalysis === 'true' || runSimilarityAnalysis === true) && batchResult.similarity) {
      console.log('🔍 Análisis de similitud disponible');
      similarityAnalysis = {
        identicalGroups: batchResult.similarity.identicalGroups.length,
        partialCopies: batchResult.similarity.partialCopies.length,
        mostCopiedFiles: batchResult.similarity.mostCopiedFiles.length,
        details: batchResult.similarity,
      };
    }

    console.log(`\n📊 Resumen: ${successResults.length} exitosos, ${errorResults.length} errores`);

    // Respuesta
    res.status(200).json({
      success: true,
      message: `Batch procesado: ${successResults.length} exitosos, ${errorResults.length} errores`,
      data: {
        successCount: successResults.length,
        errorCount: errorResults.length,
        submissions: successResults,
        errors: errorResults,
        similarity: similarityAnalysis,
      },
    });
  } catch (error) {
    console.error('❌ Error en batch submissions:', error);

    res.status(500).json({
      success: false,
      message: 'Error al procesar batch de entregas',
      error: error.message,
    });
  } finally {
    // Limpiar archivos temporales
    try {
      if (tempZipPath && fsSync.existsSync(tempZipPath)) {
        await fs.unlink(tempZipPath);
      }
      if (consolidatedDir && fsSync.existsSync(consolidatedDir)) {
        await fs.rm(consolidatedDir, { recursive: true, force: true });
      }
    } catch (cleanupError) {
      console.error('⚠️ Error al limpiar archivos temporales:', cleanupError);
    }
  }
};

/**
 * Corregir múltiples submissions en batch (llama a n8n individualmente por cada una)
 * POST /api/submissions/correct-batch
 * Body: { commission_id, rubric_id }
 */
export const correctBatchSubmissions = async (req, res) => {
  try {
    const { commission_id, rubric_id } = req.body;

    // Validaciones
    if (!commission_id || !rubric_id) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: commission_id, rubric_id',
      });
    }

    // Obtener rúbrica
    const rubric = await Rubric.findOne({ rubric_id, deleted: false });

    if (!rubric) {
      return res.status(404).json({
        success: false,
        message: 'Rúbrica no encontrada',
      });
    }

    // Validar que la rúbrica pertenezca a la comisión
    if (rubric.commission_id !== commission_id) {
      return res.status(400).json({
        success: false,
        message: 'La rúbrica no pertenece a la comisión especificada',
      });
    }

    // Validar acceso del profesor a la comisión
    if (req.user.role === 'professor') {
      const commission = await Commission.findOne({
        commission_id,
        professors: req.user.userId,
        deleted: false,
      });

      if (!commission) {
        return res.status(403).json({
          success: false,
          message: 'No tiene acceso a esta comisión',
        });
      }
    } else if (req.user.role === 'university-admin') {
      if (rubric.university_id !== req.user.university_id) {
        return res.status(403).json({
          success: false,
          message: 'No tiene acceso a esta rúbrica',
        });
      }
    }

    // Obtener API key del usuario
    const user = await User.findById(req.user.userId).select('+gemini_api_key_encrypted');

    if (!user || !user.hasValidGeminiApiKey()) {
      return res.status(403).json({
        success: false,
        message: 'Debes configurar tu API Key de Gemini en tu perfil antes de poder corregir.',
      });
    }

    const geminiApiKey = user.getGeminiApiKey();

    if (!geminiApiKey) {
      return res.status(500).json({
        success: false,
        message: 'Error al obtener la API key. Intenta reconfigurarla en tu perfil.',
      });
    }

    // Obtener todas las submissions pendientes de corregir
    // Incluye: 'uploaded' (nuevas) y 'failed' (que fallaron anteriormente)
    const submissions = await Submission.find({
      commission_id,
      rubric_id,
      status: { $in: ['uploaded', 'failed'] },
      deleted: false,
    });

    if (submissions.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No hay submissions pendientes para corregir',
        data: {
          total: 0,
          corrected: 0,
          failed: 0,
          errors: [],
        },
      });
    }

    console.log(`🔄 Iniciando corrección batch de ${submissions.length} submissions...`);

    // Configuración de n8n webhook
    const n8nWebhookUrl =
      process.env.N8N_INDIVIDUAL_GRADING_WEBHOOK_URL ||
      'http://localhost:5678/webhook/corregir-individual';

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const authToken = req.headers.authorization?.replace('Bearer ', '');

    // Contadores
    let corrected = 0;
    let failed = 0;
    const errors = [];

    // Procesar cada submission
    for (const submission of submissions) {
      try {
        console.log(`📝 Corrigiendo submission: ${submission.student_name}`);

        // Cambiar status a 'pending-correction'
        await submission.updateStatus('pending-correction');

        // Llamar a n8n con el flujo individual
        const response = await axios.post(
          n8nWebhookUrl,
          {
            submission_id: submission._id.toString(),
            rubric_json: rubric.rubric_json,
            gemini_api_key: geminiApiKey,
            backend_url: backendUrl,
            auth_token: authToken,
          },
          {
            timeout: 120000, // 2 minutos por submission
          }
        );

        // Verificar respuesta
        const result = response.data;

        if (!result.success) {
          throw new Error(result.error || 'Error desconocido en la corrección');
        }

        // Guardar corrección en MongoDB
        await submission.addCorrection({
          grade: result.grade,
          summary: result.summary,
          strengths: result.strengths,
          recommendations: result.recommendations,
          result_json: result.result_json,
          corrected_by: req.user.userId,
        });

        // Cambiar status a 'corrected'
        await submission.updateStatus('corrected');

        corrected++;
        console.log(`✅ Submission corregida: ${submission.student_name} (${result.grade}/100)`);
      } catch (error) {
        failed++;
        const errorMessage = error.response?.data?.error || error.message;

        errors.push({
          submission_id: submission._id,
          student_name: submission.student_name,
          error: errorMessage,
        });

        // Cambiar status a 'failed'
        await submission.updateStatus('failed');

        console.error(`❌ Error al corregir ${submission.student_name}:`, errorMessage);
      }
    }

    console.log(
      `\n📊 Corrección batch completada: ${corrected} exitosos, ${failed} fallidos`
    );

    res.status(200).json({
      success: true,
      message: `Corrección batch completada: ${corrected} exitosos, ${failed} fallidos`,
      data: {
        total: submissions.length,
        corrected,
        failed,
        errors,
      },
    });
  } catch (error) {
    console.error('Error en corrección batch:', error);
    res.status(500).json({
      success: false,
      message: 'Error al corregir submissions en batch',
      error: error.message,
    });
  }
};

/**
 * Corregir una submission individual
 * POST /api/submissions/:id/correct
 */
export const correctIndividualSubmission = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🔄 Corrigiendo submission individual: ${id}`);

    // Buscar submission
    let submission;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      submission = await Submission.findById(id);
    }
    if (!submission) {
      submission = await Submission.findOne({ submission_id: id, deleted: false });
    }

    if (!submission || submission.deleted) {
      return res.status(404).json({
        success: false,
        message: 'Submission no encontrada',
      });
    }

    // Obtener rúbrica
    const rubric = await Rubric.findOne({ rubric_id: submission.rubric_id, deleted: false });

    if (!rubric) {
      return res.status(404).json({
        success: false,
        message: 'Rúbrica no encontrada',
      });
    }

    // Validar acceso del profesor
    if (req.user.role === 'professor') {
      const commission = await Commission.findOne({
        commission_id: submission.commission_id,
        professors: req.user.userId,
        deleted: false,
      });

      if (!commission) {
        return res.status(403).json({
          success: false,
          message: 'No tiene acceso a esta comisión',
        });
      }
    } else if (req.user.role === 'university-admin') {
      if (rubric.university_id !== req.user.university_id) {
        return res.status(403).json({
          success: false,
          message: 'No tiene acceso a esta rúbrica',
        });
      }
    }

    // Obtener API key del usuario
    const user = await User.findById(req.user.userId).select('+gemini_api_key_encrypted');

    if (!user || !user.hasValidGeminiApiKey()) {
      return res.status(403).json({
        success: false,
        message: 'Debes configurar tu API Key de Gemini en tu perfil antes de poder corregir.',
      });
    }

    const geminiApiKey = user.getGeminiApiKey();

    if (!geminiApiKey) {
      return res.status(500).json({
        success: false,
        message: 'Error al obtener la API key. Intenta reconfigurarla en tu perfil.',
      });
    }

    // Configuración de n8n webhook
    const n8nWebhookUrl =
      process.env.N8N_INDIVIDUAL_GRADING_WEBHOOK_URL ||
      'http://localhost:5678/webhook/corregir-individual';

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const authToken = req.headers.authorization?.replace('Bearer ', '');

    console.log(`📝 Llamando a n8n para corregir: ${submission.student_name}`);

    // Cambiar status a 'pending-correction'
    await submission.updateStatus('pending-correction');

    try {
      // Llamar a n8n con el flujo individual
      const response = await axios.post(
        n8nWebhookUrl,
        {
          submission_id: submission._id.toString(),
          rubric_json: rubric.rubric_json,
          gemini_api_key: geminiApiKey,
          backend_url: backendUrl,
          auth_token: authToken,
        },
        {
          timeout: 120000, // 2 minutos
        }
      );

      // Verificar respuesta
      const result = response.data;

      if (!result.success) {
        throw new Error(result.error || 'Error desconocido en la corrección');
      }

      // Guardar corrección en MongoDB
      await submission.addCorrection({
        grade: result.grade,
        summary: result.summary,
        strengths: result.strengths,
        recommendations: result.recommendations,
        result_json: result.result_json,
        corrected_by: req.user.userId,
      });

      // Cambiar status a 'corrected'
      await submission.updateStatus('corrected');

      console.log(`✅ Submission corregida: ${submission.student_name} (${result.grade}/100)`);

      res.status(200).json({
        success: true,
        message: 'Submission corregida exitosamente',
        data: {
          submission_id: submission._id,
          student_name: submission.student_name,
          grade: result.grade,
          status: 'corrected',
        },
      });
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;

      // Cambiar status a 'failed'
      await submission.updateStatus('failed');

      console.error(`❌ Error al corregir ${submission.student_name}:`, errorMessage);

      return res.status(500).json({
        success: false,
        message: 'Error al corregir la submission',
        error: errorMessage,
      });
    }
  } catch (error) {
    console.error('Error en corrección individual:', error);
    res.status(500).json({
      success: false,
      message: 'Error al corregir la submission',
      error: error.message,
    });
  }
};
