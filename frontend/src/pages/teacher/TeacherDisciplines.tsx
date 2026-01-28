import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { disciplineService, type Discipline } from '@/services/discipline-service';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen, Loader2, Code2 } from 'lucide-react';

export const TeacherDisciplines = () => {
  const navigate = useNavigate();
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadDisciplines = async () => {
      try {
        setIsLoading(true);
        const data = await disciplineService.getMyDisciplines();
        if (isMounted) {
          setDisciplines(data);
        }
      } catch (err) {
        if (isMounted) {
          setError('Falha ao carregar disciplinas.');
          console.error(err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadDisciplines();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-900 font-display">Gerenciar Disciplinas</h1>
            <p className="text-slate-500">Crie e gerencie as disciplinas que você leciona.</p>
          </div>
          <Button onClick={() => navigate('/dashboard/teacher/disciplines/new')} className="bg-accent-600 hover:bg-accent-700 text-brand-950 font-bold">
            <Plus className="w-4 h-4 mr-2" />
            Nova Disciplina
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
            {error}
          </div>
        ) : disciplines.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">Nenhuma disciplina encontrada</h3>
            <p className="text-slate-500 max-w-sm mx-auto mt-2 mb-6">
              Você ainda não criou nenhuma disciplina. Disciplinas são necessárias para criar turmas.
            </p>
            <Button onClick={() => navigate('/dashboard/teacher/disciplines/new')} variant="outline">
              Criar Primeira Disciplina
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {disciplines.map((discipline) => (
              <div 
                key={discipline.id} 
                className="bg-white rounded-lg border border-slate-200 shadow-sm p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center text-brand-600">
                      <Code2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-brand-900">
                        {discipline.name}
                      </h3>
                      <p className="text-sm text-slate-500 capitalize">{discipline.language}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                    discipline.status === 'ATIVA' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {discipline.status}
                  </span>
                </div>
                {discipline.description && (
                  <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                    {discipline.description}
                  </p>
                )}
                <div className="pt-4 border-t border-slate-100 text-xs text-slate-500">
                  ID: <span className="font-mono">{discipline.id.substring(0, 8)}...</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
