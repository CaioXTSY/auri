import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { ConfirmAction } from '@/components/ui/confirm-action';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { PageHeader } from '@/components/ui/page-header';
import {
  Table,
  TableCell,
  TableContainer,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/table';
import { adminService } from '@/services/admin-service';
import { classService, type Class } from '@/services/class-service';
import { Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const ClassesTableSkeleton = () => (
  <TableContainer>
    <Table>
      <TableHead>
        <tr>
          <TableHeaderCell>Nome</TableHeaderCell>
          <TableHeaderCell>Ano</TableHeaderCell>
          <TableHeaderCell>Código</TableHeaderCell>
          <TableHeaderCell>Alunos</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell className="text-right">Ações</TableHeaderCell>
        </tr>
      </TableHead>
      <tbody>
        {Array.from({ length: 6 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <Skeleton className="h-4 w-44 max-w-full" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-12" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-28" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-8" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-6 w-16 rounded-full" />
            </TableCell>
            <TableCell>
              <div className="flex justify-end">
                <Skeleton className="h-4 w-14" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </tbody>
    </Table>
  </TableContainer>
);

export const AdminClasses = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classToDelete, setClassToDelete] = useState<Class | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await classService.getAllClasses();
      setClasses(data);
    } catch {
      setError('Falha ao carregar turmas.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async () => {
    if (!classToDelete) return;
    setIsDeleting(true);
    setError(null);
    try {
      await adminService.deleteClass(classToDelete.id);
      setClassToDelete(null);
      await load();
    } catch {
      setError('Não foi possível remover a turma.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Turmas"
          description="Acompanhe todas as turmas cadastradas e remova registros quando necessário."
        />

        {error ? <ErrorState message={error} /> : null}

        {isLoading ? (
          <ClassesTableSkeleton />
        ) : classes.length === 0 ? (
          <EmptyState message="Nenhuma turma cadastrada." />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Nome</TableHeaderCell>
                  <TableHeaderCell>Ano</TableHeaderCell>
                  <TableHeaderCell>Código</TableHeaderCell>
                  <TableHeaderCell>Alunos</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell className="text-right">Ações</TableHeaderCell>
                </tr>
              </TableHead>
              <tbody>
                {classes.map((classItem) => (
                  <TableRow key={classItem.id}>
                    <TableCell className="font-medium text-slate-800">{classItem.name}</TableCell>
                    <TableCell className="text-slate-600">
                      {classItem.year}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-600">
                      {classItem.code}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {classItem._count?.students ?? 0}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-bold ${
                          classItem.status === 'ATIVA'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {classItem.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        type="button"
                        onClick={() => setClassToDelete(classItem)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800"
                      >
                        <Trash2 className="h-3 w-3" /> Remover
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </TableContainer>
        )}

        <ConfirmAction
          open={Boolean(classToDelete)}
          title="Remover turma"
          description="Essa ação apaga a turma selecionada e não pode ser desfeita."
          body={
            classToDelete ? (
              <p>
                Deletar a turma <strong>{classToDelete.name}</strong> agora?
              </p>
            ) : null
          }
          confirmLabel="Remover"
          destructive
          isConfirming={isDeleting}
          onConfirm={handleDelete}
          onClose={() => {
            if (isDeleting) return;
            setClassToDelete(null);
          }}
        />
      </div>
    </DashboardLayout>
  );
};
