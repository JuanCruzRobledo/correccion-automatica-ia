/**
 * Devolution PDF Service
 * Genera PDFs individuales de devolución para estudiantes con correcciones
 * Usa el formato excelente de nodeDevolutionService pero con datos de MongoDB
 */
import PDFDocument from 'pdfkit';
import Submission from '../models/Submission.js';
import Commission from '../models/Commission.js';
import Rubric from '../models/Rubric.js';
import archiver from 'archiver';

// ===== Parsers basados en nodeDevolutionService.js =====
const parsearCriterios = (texto) => {
  if (!texto) return [];
  let t = String(texto);
  t = t.replace(/✅/g, '||OK||')
    .replace(/❌/g, '||ERROR||')
    .replace(/⚠️/g, '||WARNING||')
    .replace(/⚠/g, '||WARNING||');

  const partes = t.split('||');
  const items = [];
  let estado = null;
  for (const parte of partes) {
    if (parte === 'OK') estado = 'ok';
    else if (parte === 'ERROR') estado = 'error';
    else if (parte === 'WARNING') estado = 'warning';
    else if (estado && parte.trim()) {
      const criterio = parte.trim();
      const [titulo = criterio, descripcion = ''] = criterio.split('·');
      items.push({ estado, titulo: titulo.trim(), descripcion: descripcion.trim() });
    }
  }
  return items;
};

const parsearFortalezas = (texto) => {
  if (!texto) return [];
  return texto
    .replace(/🌟/g, '||STAR||')
    .split('||STAR||')
    .map((s) => s.trim())
    .filter(Boolean);
};

const parsearRecomendaciones = (texto) => {
  if (!texto) return [];
  const t = String(texto);
  const numeric = t.split(/(\d+)\.\s*/);
  if (numeric.length > 2) {
    const out = [];
    for (let i = 1; i < numeric.length; i += 2) {
      const rec = numeric[i + 1]?.trim();
      if (rec) out.push(rec);
    }
    if (out.length) return out;
  }
  const toolSplit = t
    .replace(/🛠️/g, '||SEP||')
    .replace(/🛠/g, '||SEP||')
    .replace(/🔧/g, '||SEP||')
    .split('||SEP||')
    .map((s) => s.trim())
    .filter(Boolean);
  if (toolSplit.length) return toolSplit;
  return [t.trim()].filter(Boolean);
};

// ===== PDF helpers =====
const criteriaColor = (estado) => {
  switch (estado) {
    case 'ok':
      return '#059669';  // Verde
    case 'error':
      return '#dc2626';  // Rojo
    case 'warning':
      return '#f59e0b';  // Naranja/Amarillo
    default:
      return '#34495e';
  }
};

class DevolutionPdfService {
  /**
   * Genera un PDF de devolución individual para un estudiante
   * @param {Object} submission - Documento Submission de MongoDB
   * @param {String} commissionName - Nombre de la comisión (opcional)
   * @param {String} rubricName - Nombre de la rúbrica (opcional)
   * @returns {Promise<Buffer>} - Buffer del PDF generado
   */
  static async generateDevolutionPdf(submission, commissionName = '', rubricName = '') {
    try {
      // Verificar que la submission tenga corrección
      if (!submission.correction || submission.status !== 'corrected') {
        throw new Error('La submission no tiene corrección disponible');
      }

      // Crear documento PDF con formato idéntico a nodeDevolutionService
      const mmToPt = (mm) => mm * 2.834645669;

      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: mmToPt(15),
          bottom: mmToPt(15),
          left: mmToPt(15),
          right: mmToPt(15)
        },
        info: {
          Title: `Devolucion - ${submission.student_name}`,
          Author: 'Corrección Automática',
        },
      });

      // Función auxiliar para agregar espaciado vertical (en mm)
      const addSpace = (mm) => doc.moveDown(mm / 5);

      // Símbolos para criterios
      const getSymbol = (estado) => {
        switch (estado) {
          case 'ok': return '[OK]';
          case 'error': return '[X]';
          case 'warning': return '[!]';
          default: return '•';
        }
      };

      // Parsear datos de corrección desde MongoDB
      const nota = submission.correction.grade || '';
      const criterios = parsearCriterios(submission.correction.summary || '');
      const fortalezas = parsearFortalezas(submission.correction.strengths || '');
      const recomendaciones = parsearRecomendaciones(submission.correction.recommendations || '');

      // Título principal
      doc.fontSize(20).fillColor('#1f2937').font('Helvetica-Bold').text('Devolucion de Correccion', {
        align: 'center',
      });
      addSpace(5);

      // Información del alumno
      doc.fontSize(12).fillColor('#1f2937').font('Helvetica');
      doc.text(`Alumno: ${submission.student_name}`, { bold: true });

      // Nota/Puntaje destacado
      if (nota) {
        addSpace(2);
        doc.fontSize(14).fillColor('#059669').font('Helvetica-Bold');
        doc.text(`Puntaje Total: ${nota}`, { align: 'center' });
      }

      addSpace(3);

      // Criterios de Evaluación
      if (criterios.length) {
        doc.font('Helvetica-Bold').fontSize(16).fillColor('#374151').text('Criterios de Evaluacion');
        addSpace(2);

        doc.font('Helvetica').fontSize(11);
        criterios.forEach((c) => {
          const simbolo = getSymbol(c.estado);
          const color = criteriaColor(c.estado);

          // Título del criterio con símbolo
          doc.fillColor(color).text(`${simbolo} ${c.titulo}`, {
            indent: 15,
            continued: false,
          });

          // Descripción (si existe) con indentación adicional
          if (c.descripcion) {
            doc.fillColor('#374151').fontSize(11);
            doc.text(`   ${c.descripcion}`, {
              indent: 15,
              continued: false
            });
          }

          addSpace(0.8);
        });

        addSpace(2);
      }

      // Fortalezas Detectadas
      if (fortalezas.length) {
        doc.font('Helvetica-Bold').fontSize(16).fillColor('#374151').text('Fortalezas Detectadas');
        addSpace(1);

        doc.font('Helvetica').fontSize(11).fillColor('#374151');
        fortalezas.forEach((f) => {
          doc.text(`• ${f}`, {
            indent: 15,
            continued: false
          });
          addSpace(0.5);
        });

        addSpace(2);
      }

      // Recomendaciones
      if (recomendaciones.length) {
        doc.font('Helvetica-Bold').fontSize(16).fillColor('#374151').text('Recomendaciones');
        addSpace(1);

        doc.font('Helvetica').fontSize(11).fillColor('#374151');
        recomendaciones.forEach((rec, idx) => {
          doc.text(`${idx + 1}. ${rec}`, {
            indent: 15,
            continued: false
          });
          addSpace(0.5);
        });
      }

      // Pie de página con fecha
      addSpace(2);
      const fecha = submission.correction.corrected_at
        ? new Date(submission.correction.corrected_at).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
        : new Date().toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
      doc.fontSize(9).fillColor('#6b7280').font('Helvetica').text(fecha, {
        align: 'center'
      });

      doc.end();

      // Convertir a buffer
      return await this._streamToBuffer(doc);
    } catch (error) {
      console.error('Error generando PDF de devolución:', error);
      throw error;
    }
  }

  /**
   * Genera múltiples PDFs de devolución y los comprime en un ZIP
   * @param {String} commissionId - ID de la comisión
   * @param {String} rubricId - ID de la rúbrica
   * @returns {Promise<Buffer>} - Buffer del archivo ZIP
   */
  static async generateBatchDevolutionPdfs(commissionId, rubricId) {
    try {
      console.log(`📦 Generando PDFs batch para: ${commissionId} / ${rubricId}`);

      // Obtener submissions corregidas
      const submissions = await Submission.find({
        commission_id: commissionId,
        rubric_id: rubricId,
        status: 'corrected',
        deleted: false,
      });

      if (submissions.length === 0) {
        throw new Error('No se encontraron submissions corregidas para esta comisión y rúbrica');
      }

      // Obtener nombres de comisión y rúbrica
      let commissionName = commissionId;
      let rubricName = rubricId;

      try {
        const commission = await Commission.findOne({ commission_id: commissionId });
        if (commission) commissionName = commission.commission_name;

        const rubric = await Rubric.findOne({ rubric_id: rubricId });
        if (rubric) rubricName = rubric.name;
      } catch (err) {
        console.warn('No se pudieron obtener nombres de comisión/rúbrica:', err.message);
      }

      // Crear archivo ZIP
      const archive = archiver('zip', { zlib: { level: 9 } });
      const chunks = [];

      archive.on('data', (chunk) => chunks.push(chunk));
      archive.on('error', (err) => {
        throw err;
      });

      // Generar PDF para cada submission y agregarlo al ZIP
      for (const submission of submissions) {
        try {
          const pdfBuffer = await this.generateDevolutionPdf(submission, commissionName, rubricName);
          const fileName = `${this._sanitizeFileName(submission.student_name)}_devolucion.pdf`;
          archive.append(pdfBuffer, { name: fileName });
          console.log(`✅ PDF agregado: ${fileName}`);
        } catch (err) {
          console.error(`❌ Error generando PDF para ${submission.student_name}:`, err.message);
        }
      }

      // Finalizar ZIP
      await archive.finalize();

      // Esperar a que termine la compresión
      await new Promise((resolve, reject) => {
        archive.on('end', resolve);
        archive.on('error', reject);
      });

      const zipBuffer = Buffer.concat(chunks);
      console.log(
        `✅ ZIP generado: ${submissions.length} PDFs (${(zipBuffer.length / 1024 / 1024).toFixed(2)} MB)`
      );

      return zipBuffer;
    } catch (error) {
      console.error('Error generando batch de PDFs:', error);
      throw error;
    }
  }

  /**
   * Sanitiza el nombre del archivo removiendo caracteres especiales
   * @private
   */
  static _sanitizeFileName(name) {
    return String(name).trim().replace(/[^a-zA-Z0-9-_]+/g, '_') || 'alumno';
  }

  /**
   * Convierte un stream a buffer
   * @private
   */
  static _streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }
}

export default DevolutionPdfService;
