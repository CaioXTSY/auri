import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, MessageSquare, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { classService } from '@/services/class-service';

interface ProfessorOverviewProps {
  firstName: string;
}

export const ProfessorOverview = ({ firstName }: ProfessorOverviewProps) => {
  const navigate = useNavigate();
  const { data: classes, isLoading, isError, refetch } = useQuery({
    queryKey: ['teacher-classes'],
    queryFn: () => classService.getAllClasses(),
  });

  const totalStudents = classes?.reduce((sum, c) => sum + (c._count?.students ?? 0), 0) ?? 0;
  const activeClasses = classes?.filter((c) => c.status === 'ATIVA') ?? [];

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white px-6 py-6 shadow-sm md:flex-row md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Painel do Professor</p>
          <h2 className="mt-1 text-2xl font-display font-bold text-brand-900">Bem-vindo, {firstName}.</h2>
          <p className="mt-1 text-sm text-slate-500">Gerencie suas turmas e acompanhe os alunos abaixo.</p>
        </div>
        <Button
          className="shrink-0 bg-brand-900 font-semibold text-white hover:bg-brand-800"
          onClick={() => navigate('/dashboard/teacher/classes/new')}
          data-tour="teacher-new-class"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Turma
        </Button>
      </section>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <BookOpen className="h-4 w-4" /> Turmas
          </p>
          {isLoading ? <Skeleton className="mt-2 h-9 w-16" /> : <p className="mt-2 text-4xl font-display font-bold text-brand-900">{classes?.length ?? 0}</p>}
          <p className="mt-1 text-xs text-slate-400">{activeClasses.length} ativa{activeClasses.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <Users className="h-4 w-4" /> Alunos
          </p>
          {isLoading ? <Skeleton className="mt-2 h-9 w-16" /> : <p className="mt-2 text-4xl font-display font-bold text-brand-900">{totalStudents}</p>}
          <p className="mt-1 text-xs text-slate-400">matriculados no total</p>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <MessageSquare className="h-4 w-4" /> Postagens
          </p>
          <p className="mt-2 text-xs text-slate-400">Acesse postagens das suas turmas no menu lateral.</p>
          <Button variant="outline" size="sm" className="mt-3 w-fit" onClick={() => navigate('/dashboard/posts')}>
            Ver Postagens
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-brand-900">Suas Turmas</h3>
          <Link to="/dashboard/teacher/classes" className="text-xs font-semibold text-brand-700 transition-colors hover:text-brand-900">
            Ver todas →
          </Link>
        </div>

        {isError ? (
          <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            <span>Não foi possível carregar as turmas.</span>
            <button type="button" onClick={() => refetch()} className="ml-auto shrink-0 font-semibold underline underline-offset-2 hover:text-red-800">
              Tentar novamente
            </button>
          </div>
        ) : null}

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <Skeleton className="h-4 w-20 rounded-full" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : null}

        {!isLoading && !isError && (classes?.length ?? 0) === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Você ainda não criou nenhuma turma.{' '}
            <button type="button" onClick={() => navigate('/dashboard/teacher/classes/new')} className="font-semibold text-brand-700 hover:text-brand-900">
              Criar agora →
            </button>
          </div>
        ) : null}

        {!isLoading && !isError && (classes?.length ?? 0) > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(classes ?? []).slice(0, 6).map((cls) => (
              <Link
                key={cls.id}
                to={`/dashboard/teacher/classes/${cls.id}`}
                className="group block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-accent-200 hover:shadow-md"
              >
                <div className="mb-3 flex items-start justify-between">
                  <span className="inline-flex items-center rounded-full border border-brand-100 bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                    {cls.semester} • {cls.year}
                  </span>
                  <span className={`mt-1 h-2 w-2 rounded-full ${cls.status === 'ATIVA' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                </div>
                <h4 className="font-bold text-slate-800 transition-colors group-hover:text-brand-700">{cls.name}</h4>
                <p className="mt-1 text-xs text-slate-500">{cls._count?.students ?? 0} aluno{(cls._count?.students ?? 0) !== 1 ? 's' : ''}</p>
              </Link>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
};
