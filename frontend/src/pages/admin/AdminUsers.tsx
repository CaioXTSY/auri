import { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
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
      setError('Falha ao carregar usuarios');
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
    try {
      await adminService.updateUser(editing.id, { role: editRole });
      setEditing(null);
      await load();
    } finally {
      setIsSaving(false);
    }
  };

  const removeUser = async (user: AdminUserListItem) => {
    if (!confirm(`Remover ${user.name}?`)) return;
    await adminService.deleteUser(user.id);
    await load();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-900 font-display">Usuarios</h1>
          <p className="text-slate-500">Gerencie contas e permissoes.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && load()}
          />
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value as Role | '')}
            className="h-10 rounded-md border border-slate-200 px-3 text-sm"
          >
            <option value="">Todas as roles</option>
            <option value="ADMIN">Admin</option>
            <option value="PROFESSOR">Professor</option>
            <option value="ALUNO">Aluno</option>
          </select>
          <Button onClick={load} variant="outline">Filtrar</Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">{error}</div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 tracking-widest">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                      Nenhum usuario encontrado.
                    </td>
                  </tr>
                ) : users.map((user) => (
                  <tr key={user.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-800">{user.name}</td>
                    <td className="px-4 py-3 text-slate-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => startEdit(user)}
                        className="text-brand-700 hover:text-brand-900 inline-flex items-center gap-1 text-xs font-semibold"
                      >
                        <Pencil className="w-3 h-3" /> Editar
                      </button>
                      <button
                        onClick={() => removeUser(user)}
                        className="text-rose-600 hover:text-rose-800 inline-flex items-center gap-1 text-xs font-semibold"
                      >
                        <Trash2 className="w-3 h-3" /> Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {editing && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
            onClick={() => setEditing(null)}
          >
            <div
              className="bg-white rounded-lg border border-slate-200 shadow-xl p-6 w-full max-w-md"
              onClick={(event) => event.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-brand-900 mb-4">Editar {editing.name}</h3>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-widest">Role</label>
              <select
                value={editRole}
                onChange={(event) => setEditRole(event.target.value as Role)}
                className="mt-2 w-full h-10 rounded-md border border-slate-200 px-3 text-sm"
              >
                <option value="ADMIN">Admin</option>
                <option value="PROFESSOR">Professor</option>
                <option value="ALUNO">Aluno</option>
              </select>
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
                <Button onClick={saveEdit} disabled={isSaving} className="bg-accent-600 hover:bg-accent-700 text-brand-950 font-bold">
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
