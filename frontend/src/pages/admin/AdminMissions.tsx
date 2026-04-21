import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { adminService, type AdminMissionListItem } from '@/services/admin-service';
import { Loader2, Trash2 } from 'lucide-react';

export const AdminMissions = () => {
  const [missions, setMissions] = useState<AdminMissionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.listMissions();
      setMissions(data);
    } catch {
      setError('Falha ao carregar missões');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (m: AdminMissionListItem) => {
    if (!confirm(`Deletar missão "${m.title}"?`)) return;
    await adminService.deleteMission(m.id);
    await load();
  };

  const filtered = typeFilter ? missions.filter((m) => m.type === typeFilter) : missions;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-900 font-display">Missões</h1>
          <p className="text-slate-500">Todas as missões criadas.</p>
        </div>

        <div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-10 rounded-md border border-slate-200 px-3 text-sm">
            <option value="">Todos os tipos</option>
            <option value="DIARIA">Diária</option>
            <option value="SEMANAL">Semanal</option>
            <option value="PERSONALIZADA">Personalizada</option>
          </select>
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
                  <th className="px-4 py-3">Título</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Pontos</th>
                  <th className="px-4 py-3">Início</th>
                  <th className="px-4 py-3">Fim</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">Nenhuma missão.</td></tr>
                ) : filtered.map((m) => (
                  <tr key={m.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-800">{m.title}</td>
                    <td className="px-4 py-3 text-slate-600">{m.type}</td>
                    <td className="px-4 py-3 text-slate-600">{m.points}</td>
                    <td className="px-4 py-3 text-slate-600">{new Date(m.startDate).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3 text-slate-600">{new Date(m.endDate).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(m)} className="text-rose-600 hover:text-rose-800 inline-flex items-center gap-1 text-xs font-semibold">
                        <Trash2 className="w-3 h-3" /> Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
