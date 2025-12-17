/**
 * SubmissionsList - Lista de entregas de alumnos para una rúbrica
 * Vista simplificada con expansión al hacer click
 */
import { useState, useEffect } from 'react';
import { Button } from '../shared/Button';
import submissionService, { type Submission } from '../../services/submissionService';
import api from '../../services/api';

interface SubmissionsListProps {
  rubricId: string;
  commissionId: string;
  onRefresh: () => void;
}

export const SubmissionsList = ({
  rubricId,
  commissionId,
  onRefresh,
}: SubmissionsListProps) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [correctingId, setCorrectingId] = useState<string | null>(null);

  useEffect(() => {
    loadSubmissions();
  }, [rubricId]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await submissionService.getSubmissionsByRubric(rubricId);
      setSubmissions(data);
    } catch (err: unknown) {
      setError(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Error al cargar entregas');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (submission: Submission) => {
    if (!confirm(`¿Estás seguro de eliminar la entrega de "${submission.student_name}"?`)) {
      return;
    }

    try {
      await submissionService.deleteSubmission(submission._id);
      await loadSubmissions();
      onRefresh();
    } catch (err: unknown) {
      alert(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Error al eliminar entrega');
    }
  };

  const handleCorrectIndividual = async (submission: Submission) => {
    try {
      setCorrectingId(submission._id);

      const response = await api.post(`/api/submissions/${submission._id}/correct`);

      if (response.data.success) {
        alert(`✅ Corrección exitosa!\nNota: ${response.data.data.grade}/100`);
        await loadSubmissions();
        onRefresh();
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Error al corregir';
      alert(`❌ Error: ${errorMsg}`);
    } finally {
      setCorrectingId(null);
    }
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async (submission: Submission) => {
    try {
      const response = await api.get<Blob>(
        `/api/submissions/${submission.submission_id}/devolution-pdf`,
        { responseType: 'blob' }
      );
      const blob = response.data;
      downloadFile(blob, `${submission.student_name}_devolucion.pdf`);
    } catch (err: unknown) {
      alert(
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Error al descargar el PDF'
      );
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusConfig = (status: Submission['status']) => {
    const configs = {
      uploaded: {
        bg: 'bg-accent-1/20',
        text: 'text-accent-1',
        border: 'border-accent-1/30',
        label: '✅ Subido',
      },
      'pending-correction': {
        bg: 'bg-accent-2/20',
        text: 'text-accent-2',
        border: 'border-accent-2/30',
        label: '⏳ Corrigiendo',
      },
      corrected: {
        bg: 'bg-accent-3/20',
        text: 'text-accent-3',
        border: 'border-accent-3/30',
        label: '✔️ Corregido',
      },
      failed: {
        bg: 'bg-danger-1/20',
        text: 'text-danger-1',
        border: 'border-danger-1/30',
        label: '❌ Error',
      },
    };
    return configs[status];
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent-1"></div>
        <p className="text-text-disabled mt-2">Cargando entregas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-danger-1/10 border border-danger-1/50 rounded-xl p-4">
        <p className="text-danger-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-text-primary">
          📄 Entregas ({submissions.length})
        </h3>
        <Button size="sm" variant="secondary" onClick={loadSubmissions}>
          🔄 Actualizar
        </Button>
      </div>

      {submissions.length === 0 ? (
        <div className="text-center py-12 bg-bg-tertiary/50 rounded-xl border border-border-secondary/50">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-text-secondary mb-1">No hay entregas aún</p>
          <p className="text-text-disabled text-sm">
            Sube la primera entrega usando el botón "Subir Entrega"
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {submissions.map((submission) => {
            const isExpanded = expandedId === submission._id;
            const statusConfig = getStatusConfig(submission.status);
            const isCorrecting = correctingId === submission._id;

            return (
              <div
                key={submission._id}
                className="bg-bg-secondary border border-border-secondary rounded-xl overflow-hidden transition-all hover:border-accent-1/30"
              >
                {/* Vista Colapsada - Clickeable */}
                <div
                  className="p-4 cursor-pointer flex items-center justify-between hover:bg-bg-tertiary/50 transition-colors"
                  onClick={() => toggleExpand(submission._id)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    {/* Nombre */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text-primary truncate">
                        {submission.student_name}
                      </p>
                    </div>

                    {/* Estado */}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} whitespace-nowrap`}
                    >
                      {statusConfig.label}
                    </span>

                    {/* Nota */}
                    <div className="w-20 text-right">
                      <span className="font-semibold text-text-primary">
                        {submission.correction?.grade ? `${submission.correction.grade}/100` : '-'}
                      </span>
                    </div>

                    {/* Icono de expansión */}
                    <div className="text-text-disabled">
                      <svg
                        className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Vista Expandida - Solo botones */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border-secondary/50 pt-4 bg-bg-tertiary/30">
                    {/* Info adicional */}
                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                      <div>
                        <span className="text-text-disabled">Archivo:</span>
                        <span className="ml-2 text-text-secondary font-mono">{submission.file_name}</span>
                      </div>
                      <div>
                        <span className="text-text-disabled">Fecha:</span>
                        <span className="ml-2 text-text-secondary">{formatDate(submission.createdAt)}</span>
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-wrap gap-2">
                      {/* Botón Corregir (para todos los estados) */}
                      <Button
                        size="sm"
                        variant={submission.status === 'corrected' ? 'secondary' : 'primary'}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCorrectIndividual(submission);
                        }}
                        loading={isCorrecting}
                        disabled={isCorrecting || submission.status === 'pending-correction'}
                        title={
                          submission.status === 'corrected'
                            ? 'Volver a corregir'
                            : submission.status === 'failed'
                            ? 'Reintentar corrección'
                            : 'Corregir ahora'
                        }
                      >
                        {isCorrecting ? (
                          '⏳ Corrigiendo...'
                        ) : submission.status === 'corrected' ? (
                          '🔄 Recorregir'
                        ) : submission.status === 'failed' ? (
                          '🔄 Reintentar'
                        ) : (
                          '✨ Corregir'
                        )}
                      </Button>

                      {/* Ver detalle (solo si está corregido) */}
                      {submission.status === 'corrected' && submission.correction && (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              // TODO: Implementar modal de detalle
                              alert('Detalle de corrección:\n\n' + JSON.stringify(submission.correction, null, 2));
                            }}
                            title="Ver detalle de corrección"
                          >
                            📊 Ver Detalle
                          </Button>

                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadPdf(submission);
                            }}
                            title="Descargar PDF de devolución"
                          >
                            📄 Descargar PDF
                          </Button>
                        </>
                      )}

                      {/* Eliminar */}
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(submission);
                        }}
                        title="Eliminar entrega"
                      >
                        🗑️ Eliminar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SubmissionsList;
