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
import { Loader2, Trash2 } from 'lucide-react';

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
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          </div>
        ) : classes.length === 0 ? (
          <EmptyState message="Nenhuma turma cadastrada." />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Nome</TableHeaderCell>
                  <TableHeaderCell>Semestre</TableHeaderCell>
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
                      {classItem.semester} / {classItem.year}
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
