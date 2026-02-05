import { Trophy, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Achievement } from '@/services/gamification-service';

interface AchievementCardProps {
  achievement: Achievement;
  locked?: boolean;
}

const rarityColors = {
  COMUM: 'bg-slate-100 text-slate-600 border-slate-200',
  RARO: 'bg-blue-50 text-blue-600 border-blue-200',
  EPICO: 'bg-purple-50 text-purple-600 border-purple-200',
  LENDARIO: 'bg-amber-50 text-amber-600 border-amber-200',
};

const rarityLabels = {
  COMUM: 'Comum',
  RARO: 'Raro',
  EPICO: 'Épico',
  LENDARIO: 'Lendário',
};

export const AchievementCard = ({ achievement, locked = false }: AchievementCardProps) => {
  const progressValue = locked ? 0 : 100;

  return (
    <div 
      className={cn(
        "relative group p-4 rounded-xl border transition-all duration-300",
        locked 
          ? "bg-slate-50 border-slate-100 opacity-60 grayscale hover:grayscale-0 hover:opacity-100" 
          : "bg-white border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon Container */}
        <div className={cn(
          "w-12 h-12 rounded-lg flex items-center justify-center text-2xl shadow-inner",
          locked ? "bg-slate-200" : "bg-gradient-to-br from-brand-50 to-brand-100"
        )}>
          {achievement.icon || '🏆'}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className={cn(
              "font-bold text-sm",
              locked ? "text-slate-500" : "text-slate-900"
            )}>
              {achievement.name}
            </h3>
            <span className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider",
              locked 
                ? "bg-slate-100 text-slate-400 border-slate-200" 
                : rarityColors[achievement.rarity] || rarityColors.COMUM
            )}>
              {rarityLabels[achievement.rarity]}
            </span>
          </div>
          
          <p className="text-xs text-slate-500 leading-relaxed mb-3">
            {achievement.description}
          </p>

          <div className="space-y-2 pb-2">
            <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-widest">
              <span>Progresso</span>
              <span>{progressValue}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  locked ? 'bg-slate-300' : 'bg-emerald-500',
                )}
                style={{ width: `${progressValue}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-medium text-amber-500">
              <Trophy className="w-3 h-3" />
              <span>+{achievement.points} XP</span>
            </div>
            
            {!locked && achievement.unlockedAt && (
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400" title="Desbloqueado em">
                <Clock className="w-3 h-3" />
                <span>{new Date(achievement.unlockedAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
