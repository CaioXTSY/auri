import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { ClassWorkspace } from '@/components/classes/ClassWorkspace';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { classService, type Class } from '@/services/class-service';
import { gamificationService, type RankingEntry } from '@/services/gamification-service';

export const ClassDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [classroom, setClassroom] = useState<Class | null>(null);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [classData, rankingData] = await Promise.all([
        classService.getClassDetails(id),
        gamificationService.getRanking('TURMA', id, 10),
      ]);
      setClassroom(classData);
      setRanking(rankingData);
    } catch {
      setError('Não foi possível carregar os detalhes da turma.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <ClassWorkspaceSkeleton />
      </DashboardLayout>
    );
  }

  if (error || !classroom) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <ErrorState message={error || 'Turma não encontrada.'} />
          {error ? (
            <Button type="button" variant="outline" onClick={loadData}>
              Tentar novamente
            </Button>
          ) : null}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ClassWorkspace classroom={classroom} role="ALUNO" ranking={ranking} />
    </DashboardLayout>
  );
};

const ClassWorkspaceSkeleton = () => (
  <div className="mx-auto max-w-6xl space-y-6">
    <Skeleton className="h-5 w-32" />
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-lg" />
        ))}
      </div>
    </div>
    <div className="grid gap-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-44 rounded-xl" />
      ))}
    </div>
  </div>
);
