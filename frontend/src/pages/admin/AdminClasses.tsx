import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { adminService } from '@/services/admin-service';
import { classService, type Class } from '@/services/class-service';
import { Loader2, Trash2 } from 'lucide-react';

export const AdminClasses = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await classService.getAllClasses();
      setClasses(data);
    } catch {
      setError('Falha ao carregar turmas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (c: Class) => {
    if (!confirm(`Deletar turma "${c.name}"? Esta ação é irreversível.`)) return;
    await adminService.deleteClass(c.id);
    await load();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-900 font-display">Turmas</h1>
          <p className="text-slate-500">Todas as turmas da plataforma.</p>
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
                  <th className="px-4 py-3">Semestre</th>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Alunos</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {classes.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">Nenhuma turma.</td></tr>
                ) : classes.map((c) => (
                  <tr key={c.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                    <td className="px-4 py-3 text-slate-600">{c.semester} / {c.year}</td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">{c.code}</td>
                    <td className="px-4 py-3 text-slate-600">{c._count?.students ?? 0}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${c.status === 'ATIVA' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{c.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(c)} className="text-rose-600 hover:text-rose-800 inline-flex items-center gap-1 text-xs font-semibold">
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
