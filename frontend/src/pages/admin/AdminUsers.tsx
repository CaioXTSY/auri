import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { adminService, type AdminUserListItem } from '@/services/admin-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Trash2, Pencil } from 'lucide-react';

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

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.listUsers({ limit: 100, role: roleFilter || undefined, search: search || undefined });
      setUsers(res.data);
    } catch {
      setError('Falha ao carregar usuários');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, [roleFilter]);

  const startEdit = (u: AdminUserListItem) => {
    setEditing(u);
    setEditRole(u.role);
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

  const removeUser = async (u: AdminUserListItem) => {
    if (!confirm(`Remover ${u.name}?`)) return;
    await adminService.deleteUser(u.id);
    await load();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-900 font-display">Usuários</h1>
          <p className="text-slate-500">Gerencie contas e permissões.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Input placeholder="Buscar por nome ou email..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as Role | '')} className="h-10 rounded-md border border-slate-200 px-3 text-sm">
            <option value="">Todas as roles</option>
            <option value="ADMIN">Admin</option>
            <option value="PROFESSOR">Professor</option>
            <option value="ALUNO">Aluno</option>
          </select>
          <Button onClick={load} variant="outline">Filtrar</Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
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
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">Nenhum usuário encontrado.</td></tr>
                ) : users.map((u) => (
                  <tr key={u.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700">{u.role}</span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => startEdit(u)} className="text-brand-700 hover:text-brand-900 inline-flex items-center gap-1 text-xs font-semibold">
                        <Pencil className="w-3 h-3" /> Editar
                      </button>
                      <button onClick={() => removeUser(u)} className="text-rose-600 hover:text-rose-800 inline-flex items-center gap-1 text-xs font-semibold">
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
          <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
            <div className="bg-white rounded-lg border border-slate-200 shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-brand-900 mb-4">Editar {editing.name}</h3>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-widest">Role</label>
              <select value={editRole} onChange={(e) => setEditRole(e.target.value as Role)} className="mt-2 w-full h-10 rounded-md border border-slate-200 px-3 text-sm">
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
