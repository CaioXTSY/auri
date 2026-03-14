import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { submissionService, type Submission } from '@/services/submission-service';
import { activityService, type Activity } from '@/services/activity-service';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Loader2, Eye } from 'lucide-react';

export const ActivitySubmissions = () => {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!activityId) return;
      try {
        setIsLoading(true);
        // Carrega detalhes da atividade e lista de submissões em paralelo
        const [activityData, submissionsData] = await Promise.all([
          activityService.getActivity(activityId),
          submissionService.getSubmissions({ activityId, limit: 50 })
        ]);

        setActivity(activityData);
        setSubmissions(submissionsData.data);
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar submissões.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [activityId]);

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDENTE: 'bg-yellow-100 text-yellow-800',
      EXECUTANDO: 'bg-blue-100 text-blue-800',
      APROVADO: 'bg-emerald-100 text-emerald-800',
      PARCIAL: 'bg-orange-100 text-orange-800',
      REPROVADO: 'bg-red-100 text-red-800',
      ERRO: 'bg-red-100 text-red-800',
    };
    // @ts-expect-error - status key check
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-slate-100 text-slate-800'}`}>{status}</span>;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !activity) {
    return (
      <DashboardLayout>
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">
          {error || 'Atividade não encontrada'}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <button 
            onClick={() => navigate(`/dashboard/teacher/classes/${activity.class?.id || ''}`)}
            className="flex items-center text-slate-500 hover:text-brand-900 mb-4 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Voltar para a turma
          </button>
          
          <h1 className="text-2xl font-bold text-brand-900 font-display">
            Submissões: {activity.title}
          </h1>
          <p className="text-slate-500 mt-1">
            Gerencie as entregas dos alunos para esta atividade.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 font-medium">Aluno</th>
                  <th className="px-6 py-3 font-medium">Data/Hora</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Pontos</th>
                  <th className="px-6 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      Nenhuma submissão encontrada para esta atividade.
                    </td>
                  </tr>
                ) : (
                  submissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-900">{submission.user.name}</p>
                          <p className="text-xs text-slate-500">{submission.user.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {new Date(submission.submittedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(submission.status)}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-600">
                        {submission.pointsEarned} / {activity.points}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/dashboard/teacher/submissions/${submission.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Código
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
