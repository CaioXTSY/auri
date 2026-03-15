import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { classService, type Class } from '@/services/class-service';
import { activityService, type Activity } from '@/services/activity-service';
import { gamificationService, type RankingEntry } from '@/services/gamification-service';
import { postsService, type PostItem } from '@/services/posts-service';
import { Leaderboard } from '@/components/gamification/Leaderboard';
import { MarkdownContent } from '@/components/ui/markdown-content';
import { Calendar, Trophy, Clock, ChevronRight, MessageSquare } from 'lucide-react';

const getUserInitials = (name?: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'U';
};

export const ClassDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [classroom, setClassroom] = useState<Class | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        setError(null);

        const [classData, activitiesData, rankingData, postsData] = await Promise.all([
          classService.getClassDetails(id),
          activityService.getActivitiesByClass(id),
          gamificationService.getRanking('TURMA', id, 10),
          postsService.list({ classId: id, page: 1, limit: 8 }),
        ]);

        if (isMounted) {
          setClassroom(classData);
          setActivities(activitiesData.data);
          setRanking(rankingData);
          setPosts(postsData.data);
        }
      } catch (err) {
        if (isMounted) {
          setError('Não foi possível carregar os detalhes da turma.');
          console.error(err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'FACIL':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'MEDIO':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'DIFICIL':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-500">Carregando detalhes da turma...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !classroom) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
          {error || 'Turma não encontrada'}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-100">
                  {classroom.semester} • {classroom.year}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  classroom.status === 'ATIVA' 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  {classroom.status === 'ATIVA' ? 'Em andamento' : 'Encerrada'}
                </span>
              </div>
              <h1 className="text-3xl font-display font-bold text-brand-900">
                {classroom.name}
              </h1>
              <div className="flex items-center gap-6 mt-6 text-sm text-slate-500">
                {classroom._count && (
                  <>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{classroom._count.activities} atividades</span>
                    </div>
                    {/* <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{classroom._count.students} alunos</span>
                    </div> */}
                  </>
                )}
              </div>
            </div>
            
            <div className="flex flex-col gap-3 min-w-[200px]">
              <div className="bg-brand-50 rounded-lg p-4 border border-brand-100">
                <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-1">
                  Seu Progresso
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-brand-900">0%</span>
                  <span className="text-xs text-brand-600 mb-1">concluído</span>
                </div>
                <div className="w-full h-1.5 bg-brand-200 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-brand-600 rounded-full w-0" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-bold text-brand-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-accent-600" />
              Postagens da Turma
            </h2>
            <Link
              to="/dashboard/posts"
              className="text-sm font-semibold text-brand-700 hover:text-brand-900"
            >
              Ver todas
            </Link>
          </div>

          {posts.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-500">
              Nenhuma postagem publicada para esta turma.
            </div>
          ) : (
            <div className="grid gap-4">
              {posts.map((post) => (
                <div key={post.id} className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-base font-semibold text-brand-900">{post.title}</h3>
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {new Date(post.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="text-sm text-slate-700 line-clamp-4">
                    <MarkdownContent content={post.content} className="space-y-2" />
                  </div>
                  <div className="mt-3 text-xs text-slate-500 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden text-[10px] font-bold text-slate-600">
                      {post.author.avatar ? (
                        <img src={post.author.avatar} alt={post.author.name} className="w-full h-full object-cover" />
                      ) : (
                        getUserInitials(post.author.name)
                      )}
                    </div>
                    <span>{post.author.name}</span>
                    <span>•</span>
                    <span>{post._count?.replies || 0} respostas</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="h-px bg-slate-200" />

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Activities List */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-display font-bold text-brand-900 mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-accent-600" />
              Atividades
            </h2>

            {activities.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                <p className="text-slate-500">
                  Nenhuma atividade disponível para esta turma no momento.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {activities.map((activity) => (
                  <Link
                    key={activity.id}
                    to={`/dashboard/activities/${activity.id}`}
                    className="block group"
                  >
                    <div className="bg-white rounded-xl border border-slate-200 p-5 transition-all hover:shadow-md hover:border-accent-200 group-hover:translate-x-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getDifficultyColor(activity.difficulty)}`}>
                              {activity.difficulty}
                            </span>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Entrega: {formatDate(activity.deadline)}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-slate-800 group-hover:text-brand-700 transition-colors">
                            {activity.title}
                          </h3>
                          <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                            {activity.description}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-3">
                          <div className="flex items-center gap-1 text-accent-600 font-bold bg-accent-50 px-3 py-1 rounded-full border border-accent-100">
                            <Trophy className="w-3 h-3" />
                            <span>{activity.points} XP</span>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-brand-600 transition-colors" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Leaderboard 
              entries={ranking} 
              title="Ranking da Turma"
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
