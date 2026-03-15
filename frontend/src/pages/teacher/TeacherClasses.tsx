import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { classService, type Class } from '@/services/class-service';
import { Button } from '@/components/ui/button';
import { Plus, Users, BookOpen, Calendar, Loader2 } from 'lucide-react';

export const TeacherClasses = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadClasses = async () => {
      try {
        setIsLoading(true);
        const data = await classService.getAllClasses();
        if (isMounted) {
          setClasses(data);
        }
      } catch (err) {
        if (isMounted) {
          setError('Falha ao carregar turmas.');
          console.error(err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadClasses();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-900 font-display">Gerenciar Turmas</h1>
            <p className="text-slate-500">Visualize e gerencie suas turmas e alunos.</p>
          </div>
          <Button onClick={() => navigate('/dashboard/teacher/classes/new')} className="bg-accent-600 hover:bg-accent-700 text-brand-950 font-bold">
            <Plus className="w-4 h-4 mr-2" />
            Nova Turma
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
        ) : classes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">Nenhuma turma encontrada</h3>
            <p className="text-slate-500 max-w-sm mx-auto mt-2 mb-6">
              Você ainda não criou nenhuma turma. Comece criando uma para organizar seus alunos e atividades.
            </p>
            <Button onClick={() => navigate('/dashboard/teacher/classes/new')} variant="outline">
              Criar Primeira Turma
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <div 
                key={cls.id} 
                onClick={() => navigate(`/dashboard/teacher/classes/${cls.id}`)}
                className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden group"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-brand-900 group-hover:text-accent-600 transition-colors">
                        {cls.name}
                      </h3>
                      <p className="text-sm text-slate-500">{cls.semester} • {cls.year}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                      cls.status === 'ATIVA' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {cls.status}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-slate-600">
                      <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                      <span>{cls.semester} • {cls.year}</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <Users className="w-4 h-4 mr-2 text-slate-400" />
                      <span>{cls._count?.students || 0} alunos</span>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-between items-center">
                   <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                     {cls.code}
                   </span>
                   <span className="text-sm font-medium text-brand-600 group-hover:underline">
                     Ver detalhes
                   </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
