import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { adminService, type Achievement, type CreateAchievementPayload } from '@/services/admin-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';

const EMPTY: CreateAchievementPayload = { name: '', description: '', category: '', points: 0, condition: '', rarity: 'COMUM' };

export const AdminAchievements = () => {
  const [items, setItems] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<Achievement | null>(null);
  const [form, setForm] = useState<CreateAchievementPayload>(EMPTY);
  const [isSaving, setIsSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.listAchievements();
      setItems(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  };

  const openEdit = (a: Achievement) => {
    setEditing(a);
    setForm({
      name: a.name,
      description: a.description,
      icon: a.icon ?? undefined,
      category: a.category,
      points: a.points,
      rarity: a.rarity,
      condition: a.condition,
    });
    setModalOpen(true);
  };

  const save = async () => {
    setIsSaving(true);
    try {
      if (editing) {
        await adminService.updateAchievement(editing.id, form);
      } else {
        await adminService.createAchievement(form);
      }
      setModalOpen(false);
      await load();
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async (a: Achievement) => {
    if (!confirm(`Remover conquista "${a.name}"?`)) return;
    await adminService.deleteAchievement(a.id);
    await load();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-900 font-display">Conquistas</h1>
            <p className="text-slate-500">Cadastro de achievements.</p>
          </div>
          <Button onClick={openCreate} className="bg-accent-600 hover:bg-accent-700 text-brand-950 font-bold">
            <Plus className="w-4 h-4 mr-2" /> Nova Conquista
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 tracking-widest">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Condition</th>
                  <th className="px-4 py-3">Pontos</th>
                  <th className="px-4 py-3">Raridade</th>
                  <th className="px-4 py-3">Desbloqueios</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-500">Nenhuma conquista cadastrada.</td></tr>
                ) : items.map((a) => (
                  <tr key={a.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-800">{a.name}</td>
                    <td className="px-4 py-3 text-slate-600">{a.category}</td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">{a.condition}</td>
                    <td className="px-4 py-3 text-slate-600">{a.points}</td>
                    <td className="px-4 py-3 text-slate-600">{a.rarity}</td>
                    <td className="px-4 py-3 text-slate-600">{a._count?.userAchievements ?? 0}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => openEdit(a)} className="text-brand-700 hover:text-brand-900 inline-flex items-center gap-1 text-xs font-semibold">
                        <Pencil className="w-3 h-3" /> Editar
                      </button>
                      <button onClick={() => remove(a)} className="text-rose-600 hover:text-rose-800 inline-flex items-center gap-1 text-xs font-semibold">
                        <Trash2 className="w-3 h-3" /> Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
            <div className="bg-white rounded-lg border border-slate-200 shadow-xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-brand-900 mb-4">{editing ? 'Editar' : 'Nova'} conquista</h3>
              <div className="space-y-3">
                <Input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <Input placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Categoria" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                  <Input placeholder="Raridade" value={form.rarity ?? ''} onChange={(e) => setForm({ ...form, rarity: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Condition (chave única)" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} />
                  <Input type="number" placeholder="Pontos" value={form.points} onChange={(e) => setForm({ ...form, points: Number(e.target.value) })} />
                </div>
                <Input placeholder="Ícone (opcional)" value={form.icon ?? ''} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
                <Button onClick={save} disabled={isSaving} className="bg-accent-600 hover:bg-accent-700 text-brand-950 font-bold">
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
