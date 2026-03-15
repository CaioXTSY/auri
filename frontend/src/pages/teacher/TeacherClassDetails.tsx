import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { classService, type Class } from '@/services/class-service';
import { activityService, type Activity } from '@/services/activity-service';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, Calendar, Users, Trophy, Loader2, Copy, Check } from 'lucide-react';

export const TeacherClassDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [classData, setClassData] = useState<Class | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const copyToClipboard = () => {
    if (classData?.code) {
      navigator.clipboard.writeText(classData.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const [cls, acts] = await Promise.all([
          classService.getClassDetails(id),
          activityService.getActivitiesByClass(id)
        ]);
        
        if (isMounted) {
          setClassData(cls);
          setActivities(acts.data);
        }
      } catch (err) {
        if (isMounted) {
          setError('Erro ao carregar detalhes da turma.');
          console.error(err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
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

  if (error || !classData) {
    return (
      <DashboardLayout>
        <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
          {error || 'Turma não encontrada'}
        </div>
        <Button variant="link" onClick={() => navigate('/dashboard/teacher/classes')}>
          Voltar para lista
        </Button>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <button 
            onClick={() => navigate('/dashboard/teacher/classes')}
            className="flex items-center text-slate-500 hover:text-brand-900 mb-4 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Voltar
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-brand-900 font-display">{classData.name}</h1>
              <div className="flex items-center gap-4 mt-2 text-slate-600">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {classData.semester}
                </span>
                <div className="flex items-center gap-2 bg-brand-50 px-3 py-1 rounded-full border border-brand-100">
                  <span className="text-xs font-semibold text-brand-700 uppercase tracking-wide">Código:</span>
                  <code className="font-mono font-bold text-brand-900">{classData.code}</code>
                  <button 
                    onClick={copyToClipboard}
                    className="ml-1 text-brand-500 hover:text-brand-700 transition-colors"
                    title="Copiar código"
                  >
                    {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                  classData.status === 'ATIVA' 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {classData.status}
                </span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Gerenciar Alunos
              </Button>
              <Button 
                onClick={() => navigate(`/dashboard/teacher/classes/${id}/activities/new`)}
                className="bg-brand-900 hover:bg-brand-800"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Atividade
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total de Alunos</h3>
            <p className="text-3xl font-bold text-brand-900 mt-2">{classData._count?.students || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Atividades</h3>
            <p className="text-3xl font-bold text-brand-900 mt-2">{classData._count?.activities || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Média da Turma</h3>
            <p className="text-3xl font-bold text-brand-900 mt-2">-</p>
          </div>
        </div>

        {/* Activities List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-brand-900 font-display">Atividades</h2>
          
          {activities.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-slate-200 border-dashed">
              <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-900">Nenhuma atividade criada</h3>
              <p className="text-slate-500 mb-6">Crie a primeira atividade para seus alunos.</p>
              <Button onClick={() => navigate(`/dashboard/teacher/classes/${id}/activities/new`)}>
                Criar Atividade
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 font-medium">Título</th>
                    <th className="px-6 py-3 font-medium">Tipo</th>
                    <th className="px-6 py-3 font-medium">Dificuldade</th>
                    <th className="px-6 py-3 font-medium">Prazo</th>
                    <th className="px-6 py-3 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activities.map((activity) => (
                    <tr key={activity.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-brand-900">{activity.title}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                          {activity.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{activity.difficulty}</td>
                      <td className="px-6 py-4 text-slate-600">
                        {new Date(activity.deadline).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/dashboard/teacher/activities/${activity.id}/submissions`)}
                          className="mr-2"
                        >
                          Ver Submissões
                        </Button>
                        <Button variant="ghost" size="sm">
                          Editar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
