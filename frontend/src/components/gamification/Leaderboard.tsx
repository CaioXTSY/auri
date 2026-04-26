import { Medal, Trophy, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RankingEntry } from '@/services/gamification-service';
import { useAuthStore } from '@/stores/auth-store';
import { getAssetUrl } from '@/lib/assets';

interface LeaderboardProps {
  entries: RankingEntry[];
  title?: string;
  className?: string;
  currentUserHighlight?: boolean;
}

export const Leaderboard = ({ 
  entries, 
  title = "Ranking", 
  className,
  currentUserHighlight = true 
}: LeaderboardProps) => {
  const { user } = useAuthStore();
  const currentUserId = user?.id;

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="w-5 h-5 text-amber-400 fill-amber-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-slate-400 fill-slate-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-700 fill-amber-700" />;
      default:
        return <span className="text-sm font-bold text-slate-500 w-5 text-center">{position}º</span>;
    }
  };

  const getRowStyle = (position: number) => {
    switch (position) {
      case 1:
        return "bg-amber-50/50 border-amber-100";
      case 2:
        return "bg-slate-50/50 border-slate-100";
      case 3:
        return "bg-orange-50/50 border-orange-100";
      default:
        return "border-transparent hover:bg-slate-50";
    }
  };

  if (entries.length === 0) {
    return (
      <div className={cn("bg-white rounded-xl border border-slate-200 p-6 text-center", className)}>
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Trophy className="w-6 h-6 text-slate-400" />
        </div>
        <h3 className="font-bold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500 mt-1">Nenhum aluno pontuou ainda.</p>
      </div>
    );
  }

  return (
    <div className={cn("bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col h-full", className)}>
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-brand-600" />
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">{title}</h3>
      </div>
      
      <div className="divide-y divide-slate-100 overflow-y-auto max-h-[400px]">
        {entries.map((entry) => {
          const isMe = currentUserHighlight && entry.user.id === currentUserId;
          
          return (
            <div 
              key={entry.user.id}
              className={cn(
                "flex items-center gap-3 p-3 transition-colors border-l-4",
                getRowStyle(entry.position),
                isMe ? "bg-brand-50 border-l-brand-500" : "border-l-transparent"
              )}
            >
              <div className="flex-shrink-0 w-8 flex justify-center">
                {getPositionIcon(entry.position)}
              </div>
              
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-300 text-xs font-bold text-slate-600">
                  {entry.user.avatar ? (
                    <img src={getAssetUrl(entry.user.avatar) ?? ''} alt={entry.user.name} className="w-full h-full object-cover" />
                  ) : (
                    entry.user.name.substring(0, 2).toUpperCase()
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn(
                    "text-sm font-medium truncate",
                    isMe ? "text-brand-700" : "text-slate-900"
                  )}>
                    {entry.user.name}
                    {isMe && <span className="ml-1 text-[10px] text-brand-500 font-normal">(Você)</span>}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="block text-sm font-bold text-slate-700">{entry.points}</span>
                <span className="text-[10px] text-slate-400 font-medium uppercase">XP</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
