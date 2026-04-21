import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { adminService, type AIGenerationListItem, type AIGenerationDetail } from '@/services/admin-service';
import { Loader2, X } from 'lucide-react';

export const AdminAIGenerations = () => {
  const [items, setItems] = useState<AIGenerationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<AIGenerationDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  useEffect(() => {
    let mounted = true;
    adminService.listAIGenerations({ limit: 50 })
      .then((res) => mounted && setItems(res.data))
      .finally(() => mounted && setIsLoading(false));
    return () => { mounted = false; };
  }, []);

  const openDetail = async (id: string) => {
    setIsLoadingDetail(true);
    try {
      const detail = await adminService.getAIGeneration(id);
      setSelected(detail);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-900 font-display">Gerações de IA</h1>
          <p className="text-slate-500">Auditoria de prompts e respostas usados em missões geradas.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 tracking-widest">
                <tr>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Prompt (preview)</th>
                  <th className="px-4 py-3">Criado em</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">Nenhuma geração.</td></tr>
                ) : items.map((g) => (
                  <tr key={g.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-800">{g.type}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-md truncate">{g.promptPreview}</td>
                    <td className="px-4 py-3 text-slate-600">{new Date(g.createdAt).toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openDetail(g.id)} className="text-brand-700 hover:text-brand-900 text-xs font-semibold">Ver</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(selected || isLoadingDetail) && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
            <div className="bg-white rounded-lg border border-slate-200 shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-brand-900">Detalhe da geração</h3>
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                {isLoadingDetail || !selected ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500 tracking-widest mb-1">Tipo</p>
                      <p className="text-sm">{selected.type}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500 tracking-widest mb-1">Prompt</p>
                      <pre className="text-xs bg-slate-50 border border-slate-200 rounded-md p-3 whitespace-pre-wrap break-words">{selected.prompt}</pre>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500 tracking-widest mb-1">Response</p>
                      <pre className="text-xs bg-slate-50 border border-slate-200 rounded-md p-3 whitespace-pre-wrap break-words">{selected.response}</pre>
                    </div>
                    {selected.missionQuizzes.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-500 tracking-widest mb-1">Quizzes gerados</p>
                        <ul className="text-sm list-disc pl-5">
                          {selected.missionQuizzes.map((q) => <li key={q.id}>{q.title}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
