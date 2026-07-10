import { Eye, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableCell, TableContainer, TableHead, TableHeaderCell, TableRow } from '@/components/ui/table';
import type { AdminMissionListItem } from '@/services/admin-service';

const LoadingTable = () => (
  <TableContainer><Table><TableHead><tr>{['Título', 'Tipo', 'Pontos', 'Início', 'Disponibilidade', 'Quiz', 'Ações'].map((header) => <TableHeaderCell key={header} className={header === 'Ações' ? 'text-right' : undefined}>{header}</TableHeaderCell>)}</tr></TableHead><tbody>{Array.from({ length: 6 }).map((_, index) => <TableRow key={index}>{Array.from({ length: 7 }).map((__, cell) => <TableCell key={cell}><Skeleton className="h-4 w-20" /></TableCell>)}</TableRow>)}</tbody></Table></TableContainer>
);

export const AdminMissionList = ({
  missions,
  isLoading,
  onViewQuiz,
  onDelete,
}: {
  missions: AdminMissionListItem[];
  isLoading: boolean;
  onViewQuiz: (mission: AdminMissionListItem) => void;
  onDelete: (mission: AdminMissionListItem) => void;
}) => {
  if (isLoading) return <LoadingTable />;
  if (!missions.length) return <EmptyState message="Nenhuma missão encontrada para o filtro atual." />;
  return (
    <TableContainer><Table><TableHead><tr><TableHeaderCell>Título</TableHeaderCell><TableHeaderCell>Tipo</TableHeaderCell><TableHeaderCell>Pontos</TableHeaderCell><TableHeaderCell>Início</TableHeaderCell><TableHeaderCell>Disponibilidade</TableHeaderCell><TableHeaderCell>Quiz</TableHeaderCell><TableHeaderCell className="text-right">Ações</TableHeaderCell></tr></TableHead>
      <tbody>{missions.map((mission) => <TableRow key={mission.id}><TableCell className="font-medium text-slate-800">{mission.title}</TableCell><TableCell className="text-slate-600">{mission.type}</TableCell><TableCell className="text-slate-600">{mission.points}</TableCell><TableCell className="text-slate-600">{new Date(mission.startDate).toLocaleDateString('pt-BR')}</TableCell><TableCell className="text-slate-600">Permanente</TableCell><TableCell className="text-slate-600">{mission.hasQuiz ? 'Sim' : 'Não'}</TableCell><TableCell className="text-right"><div className="flex justify-end gap-3">{mission.hasQuiz ? <button type="button" onClick={() => onViewQuiz(mission)} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-900"><Eye className="h-3 w-3" /> Ver</button> : null}<button type="button" onClick={() => onDelete(mission)} className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800"><Trash2 className="h-3 w-3" /> Remover</button></div></TableCell></TableRow>)}</tbody>
    </Table></TableContainer>
  );
};
