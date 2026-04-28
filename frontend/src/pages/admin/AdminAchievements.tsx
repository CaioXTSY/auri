import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { ConfirmAction } from '@/components/ui/confirm-action';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Field } from '@/components/ui/field';
import { ModalDialog } from '@/components/ui/modal-dialog';
import { PageHeader } from '@/components/ui/page-header';
import {
  Table,
  TableCell,
  TableContainer,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/table';
import { adminService, type Achievement, type CreateAchievementPayload } from '@/services/admin-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';

const EMPTY: CreateAchievementPayload = {
  name: '',
  description: '',
  category: '',
  points: 0,
  condition: '',
  rarity: 'COMUM',
};

export const AdminAchievements = () => {
  const [items, setItems] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<Achievement | null>(null);
  const [form, setForm] = useState<CreateAchievementPayload>(EMPTY);
  const [isSaving, setIsSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [achievementToDelete, setAchievementToDelete] = useState<Achievement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminService.listAchievements();
      setItems(data);
    } catch {
      setError('Falha ao carregar conquistas.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  };

  const openEdit = (achievement: Achievement) => {
    setEditing(achievement);
    setForm({
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon ?? undefined,
      category: achievement.category,
      points: achievement.points,
      rarity: achievement.rarity,
      condition: achievement.condition,
    });
    setModalOpen(true);
  };

  const save = async () => {
    setIsSaving(true);
    setError(null);
    try {
      if (editing) {
        await adminService.updateAchievement(editing.id, form);
      } else {
        await adminService.createAchievement(form);
      }
      setModalOpen(false);
      await load();
    } catch {
      setError('Não foi possível salvar a conquista.');
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async () => {
    if (!achievementToDelete) return;
    setIsDeleting(true);
    setError(null);
    try {
      await adminService.deleteAchievement(achievementToDelete.id);
      setAchievementToDelete(null);
      await load();
    } catch {
      setError('Não foi possível remover a conquista.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Conquistas"
          description="Cadastre, ajuste e remova achievements com o mesmo padrão visual do restante do admin."
          actions={
            <Button onClick={openCreate} className="bg-accent-600 font-bold text-brand-950 hover:bg-accent-700">
              <Plus className="mr-2 h-4 w-4" /> Nova conquista
            </Button>
          }
        />

        {error ? <ErrorState message={error} /> : null}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState message="Nenhuma conquista cadastrada." />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Nome</TableHeaderCell>
                  <TableHeaderCell>Categoria</TableHeaderCell>
                  <TableHeaderCell>Condição</TableHeaderCell>
                  <TableHeaderCell>Pontos</TableHeaderCell>
                  <TableHeaderCell>Raridade</TableHeaderCell>
                  <TableHeaderCell>Desbloqueios</TableHeaderCell>
                  <TableHeaderCell className="text-right">Ações</TableHeaderCell>
                </tr>
              </TableHead>
              <tbody>
                {items.map((achievement) => (
                  <TableRow key={achievement.id}>
                    <TableCell className="font-medium text-slate-800">{achievement.name}</TableCell>
                    <TableCell className="text-slate-600">{achievement.category}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-600">
                      {achievement.condition}
                    </TableCell>
                    <TableCell className="text-slate-600">{achievement.points}</TableCell>
                    <TableCell className="text-slate-600">{achievement.rarity}</TableCell>
                    <TableCell className="text-slate-600">
                      {achievement._count?.userAchievements ?? 0}
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(achievement)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-900"
                      >
                        <Pencil className="h-3 w-3" /> Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setAchievementToDelete(achievement)}
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

        <ModalDialog
          open={modalOpen}
          title={editing ? 'Editar conquista' : 'Nova conquista'}
          description="Preencha os campos principais para publicar ou ajustar uma conquista."
          onClose={() => {
            if (isSaving) return;
            setModalOpen(false);
          }}
          initialFocusSelector="#achievement-name"
          panelClassName="max-w-2xl"
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModalOpen(false)} disabled={isSaving}>
                Cancelar
              </Button>
              <Button
                onClick={save}
                disabled={isSaving}
                className="bg-accent-600 font-bold text-brand-950 hover:bg-accent-700"
              >
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field htmlFor="achievement-name" label="Nome">
              <Input
                id="achievement-name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </Field>

            <Field htmlFor="achievement-category" label="Categoria">
              <Input
                id="achievement-category"
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
              />
            </Field>

            <Field htmlFor="achievement-description" label="Descrição" className="md:col-span-2">
              <Input
                id="achievement-description"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </Field>

            <Field htmlFor="achievement-rarity" label="Raridade">
              <Input
                id="achievement-rarity"
                value={form.rarity ?? ''}
                onChange={(event) => setForm({ ...form, rarity: event.target.value })}
              />
            </Field>

            <Field htmlFor="achievement-points" label="Pontos">
              <Input
                id="achievement-points"
                type="number"
                value={form.points}
                onChange={(event) => setForm({ ...form, points: Number(event.target.value) })}
              />
            </Field>

            <Field
              htmlFor="achievement-condition"
              label="Condição"
              description="Use uma chave única e previsível para identificar a regra de desbloqueio."
            >
              <Input
                id="achievement-condition"
                value={form.condition}
                onChange={(event) => setForm({ ...form, condition: event.target.value })}
              />
            </Field>

            <Field
              htmlFor="achievement-icon"
              label="Ícone"
              description="Opcional. Informe a referência do ícone salvo no sistema."
            >
              <Input
                id="achievement-icon"
                value={form.icon ?? ''}
                onChange={(event) => setForm({ ...form, icon: event.target.value })}
              />
            </Field>
          </div>
        </ModalDialog>

        <ConfirmAction
          open={Boolean(achievementToDelete)}
          title="Remover conquista"
          description="Essa ação exclui a conquista e seus metadados vinculados."
          body={
            achievementToDelete ? (
              <p>
                Remover <strong>{achievementToDelete.name}</strong> agora?
              </p>
            ) : null
          }
          confirmLabel="Remover"
          destructive
          isConfirming={isDeleting}
          onConfirm={remove}
          onClose={() => {
            if (isDeleting) return;
            setAchievementToDelete(null);
          }}
        />
      </div>
    </DashboardLayout>
  );
};
