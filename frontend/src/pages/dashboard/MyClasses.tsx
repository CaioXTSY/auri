import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { classService, type Class } from '@/services/class-service';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export const MyClasses = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadClasses = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const data = await classService.getMyClasses();

        if (isMounted) {
          setClasses(data);
        }
      } catch (err) {
        if (isMounted) {
          setError('Não foi possível carregar suas turmas.');
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-brand-900">
              Minhas Turmas
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Acesse suas disciplinas e atividades matriculadas.
            </p>
          </div>
          <Button onClick={() => navigate('/dashboard/classes/join')} className="w-full md:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Entrar em nova turma
          </Button>
        </div>

        {isLoading && (
          <div className="text-sm text-slate-500">Carregando turmas...</div>
        )}

        {error && <div className="text-sm text-red-500">{error}</div>}

        {!isLoading && !error && classes.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-slate-500">
              Você ainda não está matriculado em nenhuma turma.
            </p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((classroom) => (
            <Link
              key={classroom.id}
              to={`/dashboard/classes/${classroom.id}`}
              className="block group"
            >
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 transition-all group-hover:shadow-md group-hover:border-accent-200">
                <div className="flex justify-between items-start mb-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-100">
                    {classroom.semester} • {classroom.year}
                  </span>
                  {classroom.status === 'ATIVA' ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" title="Ativa" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-300" title="Encerrada" />
                  )}
                </div>
                
                <h3 className="text-lg font-bold text-slate-800 group-hover:text-brand-700 transition-colors">
                  {classroom.discipline.name}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {classroom.name}
                </p>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>{classroom.discipline.language}</span>
                  <span className="group-hover:translate-x-1 transition-transform text-brand-600 font-medium">
                    Acessar &rarr;
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};
