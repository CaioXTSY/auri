import { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { ConfirmAction } from '@/components/ui/confirm-action';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Field } from '@/components/ui/field';
import { ModalDialog } from '@/components/ui/modal-dialog';
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
import { adminService, type AdminUserListItem } from '@/services/admin-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Pencil, Trash2 } from 'lucide-react';

type Role = 'ADMIN' | 'PROFESSOR' | 'ALUNO';

export const AdminUsers = () => {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<Role | ''>('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<AdminUserListItem | null>(null);
  const [editRole, setEditRole] = useState<Role>('ALUNO');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userToRemove, setUserToRemove] = useState<AdminUserListItem | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const trimmedSearch = search.trim();
      const baseParams = {
        limit: 100,
        role: roleFilter || undefined,
      };

      if (!trimmedSearch) {
        const res = await adminService.listUsers(baseParams);
        setUsers(res.data);
        return;
      }

      const [byName, byEmail] = await Promise.all([
        adminService.listUsers({ ...baseParams, name: trimmedSearch }),
        adminService.listUsers({ ...baseParams, email: trimmedSearch }),
      ]);

      const merged = [...byName.data, ...byEmail.data].filter(
        (user, index, all) => all.findIndex((item) => item.id === user.id) === index,
      );
      setUsers(merged);
    } catch {
      setError('Falha ao carregar usuários.');
    } finally {
      setIsLoading(false);
    }
  }, [roleFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  const startEdit = (user: AdminUserListItem) => {
    setEditing(user);
    setEditRole(user.role);
  };

  const saveEdit = async () => {
    if (!editing) return;
    setIsSaving(true);
    setError(null);

    try {
      await adminService.updateUser(editing.id, { role: editRole });
      setEditing(null);
      await load();
    } catch {
      setError('Não foi possível atualizar o usuário.');
    } finally {
      setIsSaving(false);
    }
  };

  const removeUser = async () => {
    if (!userToRemove) return;
    setIsRemoving(true);
    setError(null);

    try {
      await adminService.deleteUser(userToRemove.id);
      setUserToRemove(null);
      await load();
    } catch {
      setError('Não foi possível remover o usuário.');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Usuários"
          description="Gerencie contas, permissões e consistência de acesso da plataforma."
        />

        <SectionCard className="p-4">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr),220px,auto]">
            <Field htmlFor="users-search" label="Buscar usuário">
              <Input
                id="users-search"
                placeholder="Nome ou email"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && load()}
              />
            </Field>

            <Field htmlFor="users-role-filter" label="Filtrar por perfil">
              <select
                id="users-role-filter"
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value as Role | '')}
                className="h-10 rounded-md border border-slate-200 px-3 text-sm"
              >
                <option value="">Todos os perfis</option>
                <option value="ADMIN">Admin</option>
                <option value="PROFESSOR">Professor</option>
                <option value="ALUNO">Aluno</option>
              </select>
            </Field>

            <div className="flex items-end">
              <Button onClick={load} variant="outline" className="w-full md:w-auto">
                Filtrar
              </Button>
            </div>
          </div>
        </SectionCard>

        {error ? <ErrorState message={error} /> : null}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          </div>
        ) : users.length === 0 ? (
          <EmptyState message="Nenhum usuário encontrado para os filtros atuais." />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Nome</TableHeaderCell>
                  <TableHeaderCell>Email</TableHeaderCell>
                  <TableHeaderCell>Perfil</TableHeaderCell>
                  <TableHeaderCell className="text-right">Ações</TableHeaderCell>
                </tr>
              </TableHead>
              <tbody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium text-slate-800">{user.name}</TableCell>
                    <TableCell className="text-slate-600">{user.email}</TableCell>
                    <TableCell>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      <button
                        type="button"
                        onClick={() => startEdit(user)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-900"
                      >
                        <Pencil className="h-3 w-3" /> Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserToRemove(user)}
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
          open={Boolean(editing)}
          title={editing ? `Editar ${editing.name}` : 'Editar usuário'}
          description="Altere o perfil de acesso do usuário selecionado."
          onClose={() => {
            if (isSaving) return;
            setEditing(null);
          }}
          initialFocusSelector="#edit-user-role"
          panelClassName="max-w-md"
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)} disabled={isSaving}>
                Cancelar
              </Button>
              <Button
                onClick={saveEdit}
                disabled={isSaving}
                className="bg-accent-600 font-bold text-brand-950 hover:bg-accent-700"
              >
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          }
        >
          {editing ? (
            <Field htmlFor="edit-user-role" label="Perfil">
              <select
                id="edit-user-role"
                value={editRole}
                onChange={(event) => setEditRole(event.target.value as Role)}
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm"
              >
                <option value="ADMIN">Admin</option>
                <option value="PROFESSOR">Professor</option>
                <option value="ALUNO">Aluno</option>
              </select>
            </Field>
          ) : null}
        </ModalDialog>

        <ConfirmAction
          open={Boolean(userToRemove)}
          title="Remover usuário"
          description="Essa ação exclui a conta selecionada."
          body={
            userToRemove ? (
              <p>
                Remover <strong>{userToRemove.name}</strong> agora?
              </p>
            ) : null
          }
          confirmLabel="Remover"
          destructive
          isConfirming={isRemoving}
          onConfirm={removeUser}
          onClose={() => {
            if (isRemoving) return;
            setUserToRemove(null);
          }}
        />
      </div>
    </DashboardLayout>
  );
};
