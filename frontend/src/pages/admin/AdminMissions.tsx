import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { ConfirmAction } from '@/components/ui/confirm-action';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Field } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import {
  Table,
  TableCell,
  TableContainer,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/table';
import { adminService, type AdminMissionListItem } from '@/services/admin-service';
import { Loader2, Trash2 } from 'lucide-react';

export const AdminMissions = () => {
  const [missions, setMissions] = useState<AdminMissionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [missionToDelete, setMissionToDelete] = useState<AdminMissionListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminService.listMissions();
      setMissions(data);
    } catch {
      setError('Falha ao carregar missões.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async () => {
    if (!missionToDelete) return;
    setIsDeleting(true);
    setError(null);
    try {
      await adminService.deleteMission(missionToDelete.id);
      setMissionToDelete(null);
      await load();
    } catch {
      setError('Não foi possível remover a missão.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = typeFilter ? missions.filter((mission) => mission.type === typeFilter) : missions;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Missões"
          description="Visualize e remova missões já cadastradas na plataforma."
        />

        <SectionCard className="p-4">
          <Field htmlFor="missions-type-filter" label="Filtrar por tipo" className="max-w-sm">
            <select
              id="missions-type-filter"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="h-10 rounded-md border border-slate-200 px-3 text-sm"
            >
              <option value="">Todos os tipos</option>
              <option value="DIARIA">Diária</option>
              <option value="SEMANAL">Semanal</option>
              <option value="PERSONALIZADA">Personalizada</option>
            </select>
          </Field>
        </SectionCard>

        {error ? <ErrorState message={error} /> : null}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState message="Nenhuma missão encontrada para o filtro atual." />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Título</TableHeaderCell>
                  <TableHeaderCell>Tipo</TableHeaderCell>
                  <TableHeaderCell>Pontos</TableHeaderCell>
                  <TableHeaderCell>Início</TableHeaderCell>
                  <TableHeaderCell>Fim</TableHeaderCell>
                  <TableHeaderCell className="text-right">Ações</TableHeaderCell>
                </tr>
              </TableHead>
              <tbody>
                {filtered.map((mission) => (
                  <TableRow key={mission.id}>
                    <TableCell className="font-medium text-slate-800">{mission.title}</TableCell>
                    <TableCell className="text-slate-600">{mission.type}</TableCell>
                    <TableCell className="text-slate-600">{mission.points}</TableCell>
                    <TableCell className="text-slate-600">
                      {new Date(mission.startDate).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {new Date(mission.endDate).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        type="button"
                        onClick={() => setMissionToDelete(mission)}
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
          open={Boolean(missionToDelete)}
          title="Remover missão"
          description="Essa ação é irreversível."
          body={
            missionToDelete ? (
              <p>
                Deletar a missão <strong>{missionToDelete.title}</strong>?
              </p>
            ) : null
          }
          confirmLabel="Remover"
          destructive
          isConfirming={isDeleting}
          onConfirm={handleDelete}
          onClose={() => {
            if (isDeleting) return;
            setMissionToDelete(null);
          }}
        />
      </div>
    </DashboardLayout>
  );
};
