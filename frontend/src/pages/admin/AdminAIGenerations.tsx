import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { ModalDialog } from '@/components/ui/modal-dialog';
import { EmptyState } from '@/components/ui/empty-state';
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
import { adminService, type AIGenerationListItem, type AIGenerationDetail } from '@/services/admin-service';
import { X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const AIGenerationsTableSkeleton = () => (
  <TableContainer>
    <Table>
      <TableHead>
        <tr>
          <TableHeaderCell>Tipo</TableHeaderCell>
          <TableHeaderCell>Prompt (preview)</TableHeaderCell>
          <TableHeaderCell>Criado em</TableHeaderCell>
          <TableHeaderCell className="text-right">Ações</TableHeaderCell>
        </tr>
      </TableHead>
      <tbody>
        {Array.from({ length: 6 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <Skeleton className="h-6 w-24 rounded-full" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-96 max-w-full" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-32" />
            </TableCell>
            <TableCell>
              <div className="flex justify-end">
                <Skeleton className="h-4 w-8" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </tbody>
    </Table>
  </TableContainer>
);

const AIGenerationDetailSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 3 }).map((_, index) => (
      <SectionCard key={index} className="p-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-28 w-full" />
      </SectionCard>
    ))}
  </div>
);

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
        <PageHeader
          title="Gerações de IA"
          description="Auditoria de prompts e respostas usados em missões geradas."
        />

        {isLoading ? (
          <AIGenerationsTableSkeleton />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Tipo</TableHeaderCell>
                  <TableHeaderCell>Prompt (preview)</TableHeaderCell>
                  <TableHeaderCell>Criado em</TableHeaderCell>
                  <TableHeaderCell className="text-right">Ações</TableHeaderCell>
                </tr>
              </TableHead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <TableCell colSpan={4}>
                      <EmptyState message="Nenhuma geração." className="border-0 py-6" />
                    </TableCell>
                  </tr>
                ) : items.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium text-slate-800">{g.type}</TableCell>
                    <TableCell className="max-w-md truncate text-slate-600">{g.promptPreview}</TableCell>
                    <TableCell className="text-slate-600">{new Date(g.createdAt).toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="text-right">
                      <button onClick={() => openDetail(g.id)} className="text-brand-700 hover:text-brand-900 text-xs font-semibold">Ver</button>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </TableContainer>
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
              <AIGenerationDetailSkeleton />
            ) : (
              <>
                <SectionCard className="p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">Tipo</p>
                  <p className="text-sm">{selected.type}</p>
                </SectionCard>
                <SectionCard className="p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">Prompt</p>
                  <pre className="whitespace-pre-wrap break-words rounded-md border border-slate-200 bg-slate-50 p-3 text-xs">{selected.prompt}</pre>
                </SectionCard>
                <SectionCard className="p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">Response</p>
                  <pre className="whitespace-pre-wrap break-words rounded-md border border-slate-200 bg-slate-50 p-3 text-xs">{selected.response}</pre>
                </SectionCard>
                {selected.missionQuizzes.length > 0 ? (
                  <SectionCard className="p-4">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">Quizzes gerados</p>
                    <ul className="list-disc pl-5 text-sm">
                      {selected.missionQuizzes.map((quiz) => <li key={quiz.id}>{quiz.title}</li>)}
                    </ul>
                  </SectionCard>
                ) : null}
              </>
            )}
          </div>
        </ModalDialog>
      </div>
    </DashboardLayout>
  );
};
