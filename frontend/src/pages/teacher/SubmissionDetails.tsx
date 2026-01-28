import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { submissionService, type Submission } from '@/services/submission-service';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Loader2, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export const SubmissionDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSubmission = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const data = await submissionService.getSubmissionById(id);
        setSubmission(data);
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar detalhes da submissão.');
      } finally {
        setIsLoading(false);
      }
    };

    loadSubmission();
  }, [id]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !submission) {
    return (
      <DashboardLayout>
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">
          {error || 'Submissão não encontrada'}
        </div>
      </DashboardLayout>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APROVADO': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'REPROVADO': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'ERRO': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-100px)]">
        {/* Header */}
        <div className="mb-6">
          <button 
            onClick={() => navigate(`/dashboard/teacher/activities/${submission.activityId}/submissions`)}
            className="flex items-center text-slate-500 hover:text-brand-900 mb-4 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Voltar para lista
          </button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-brand-900 font-display">
                Submissão de {submission.user.name}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                <span>{submission.activity.title}</span>
                <span>•</span>
                <span>{new Date(submission.submittedAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2">
                {getStatusIcon(submission.status)}
                <span className="font-medium text-slate-900">{submission.status}</span>
              </div>
              <div className="w-px h-6 bg-slate-200" />
              <div className="font-mono font-bold text-brand-900">
                {submission.pointsEarned} / {submission.activity.points} pts
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
          {/* Code Viewer */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
              <span className="text-xs font-medium text-slate-500 uppercase">Código Enviado ({submission.language})</span>
            </div>
            <div className="flex-1">
              <Editor
                height="100%"
                language={submission.language === 'python' ? 'python' : 'javascript'}
                value={submission.code}
                theme="vs-light"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                }}
              />
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6 overflow-y-auto">
            {/* Execution Result */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Resultado da Execução</h3>
              <div className="bg-slate-900 rounded-lg p-3 text-xs font-mono text-slate-50 overflow-x-auto whitespace-pre-wrap">
                {submission.result || 'Nenhum log de execução disponível.'}
              </div>
            </div>

            {/* Performance Stats */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Performance</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tempo de Execução:</span>
                  <span className="font-mono text-slate-900">{submission.executionTime ? `${submission.executionTime}ms` : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Memória Usada:</span>
                  <span className="font-mono text-slate-900">{submission.memoryUsed ? `${Math.round(submission.memoryUsed / 1024)}KB` : '-'}</span>
                </div>
              </div>
            </div>

            {/* Student Info */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Aluno</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold">
                  {submission.user.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-slate-900">{submission.user.name}</p>
                  <p className="text-xs text-slate-500">{submission.user.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
