import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { ModalDialog } from '@/components/ui/modal-dialog';
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

        <ModalDialog
          open={Boolean(selected || isLoadingDetail)}
          title="Detalhe da geração"
          description="Auditoria completa do prompt, resposta e quizzes associados."
          onClose={() => setSelected(null)}
          panelClassName="max-w-3xl"
          initialFocusSelector="[data-dialog-close]"
        >
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                type="button"
                data-dialog-close
                aria-label="Fechar detalhe da geração"
                onClick={() => setSelected(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {isLoadingDetail || !selected ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>
            ) : (
              <>
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">Tipo</p>
                  <p className="text-sm">{selected.type}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">Prompt</p>
                  <pre className="whitespace-pre-wrap break-words rounded-md border border-slate-200 bg-slate-50 p-3 text-xs">{selected.prompt}</pre>
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">Response</p>
                  <pre className="whitespace-pre-wrap break-words rounded-md border border-slate-200 bg-slate-50 p-3 text-xs">{selected.response}</pre>
                </div>
                {selected.missionQuizzes.length > 0 ? (
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">Quizzes gerados</p>
                    <ul className="list-disc pl-5 text-sm">
                      {selected.missionQuizzes.map((quiz) => <li key={quiz.id}>{quiz.title}</li>)}
                    </ul>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </ModalDialog>
      </div>
    </DashboardLayout>
  );
};
