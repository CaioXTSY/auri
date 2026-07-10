import { cn } from '@/lib/utils';
import type { MissionStatus } from '@/services/missions-service';

export type MissionsTab = 'available' | 'history';
export type MissionTypeFilter = 'ALL' | 'DIARIA' | 'SEMANAL' | 'PERSONALIZADA';

export const MissionFilters = ({
  tab,
  searchTerm,
  typeFilter,
  statusFilter,
  onTabChange,
  onSearchChange,
  onTypeChange,
  onStatusChange,
}: {
  tab: MissionsTab;
  searchTerm: string;
  typeFilter: MissionTypeFilter;
  statusFilter: 'ALL' | MissionStatus;
  onTabChange: (value: MissionsTab) => void;
  onSearchChange: (value: string) => void;
  onTypeChange: (value: MissionTypeFilter) => void;
  onStatusChange: (value: 'ALL' | MissionStatus) => void;
}) => (
  <>
    <div className="flex flex-wrap items-center gap-2" data-tour="missions-tabs">
      {([['available', 'Disponíveis'], ['history', 'Histórico']] as const).map(([value, label]) => (
        <button
          key={value}
          type="button"
          onClick={() => onTabChange(value)}
          className={cn(
            'rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]',
            tab === value ? 'border-brand-900 bg-brand-900 text-white' : 'border-slate-200 bg-white text-slate-500',
          )}
        >
          {label}
        </button>
      ))}
    </div>
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center" data-tour="missions-filters">
      <div className="flex-1">
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar por título ou descrição"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <select value={typeFilter} onChange={(event) => onTypeChange(event.target.value as MissionTypeFilter)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
          <option value="ALL">Todos os tipos</option><option value="DIARIA">Diárias</option><option value="SEMANAL">Semanais</option><option value="PERSONALIZADA">Personalizadas</option>
        </select>
        <select value={statusFilter} onChange={(event) => onStatusChange(event.target.value as 'ALL' | MissionStatus)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
          <option value="ALL">Todos os status</option><option value="NAO_INICIADA">Não iniciada</option><option value="EM_PROGRESSO">Em progresso</option><option value="CONCLUIDA">Concluída</option><option value="EXPIRADA">Expirada</option>
        </select>
      </div>
    </div>
  </>
);
