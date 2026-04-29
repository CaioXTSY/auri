import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { classService, type Class } from '@/services/class-service';
import { gamificationService, type RankingEntry } from '@/services/gamification-service';
import { postsService, type PostItem } from '@/services/posts-service';
import { Leaderboard } from '@/components/gamification/Leaderboard';
import { MarkdownContent } from '@/components/ui/markdown-content';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare } from 'lucide-react';
import { getAssetUrl } from '@/lib/assets';

const getUserInitials = (name?: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'U';
};

export const ClassDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [classroom, setClassroom] = useState<Class | null>(null);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [classData, rankingData, postsData] = await Promise.all([
        classService.getClassDetails(id),
        gamificationService.getRanking('TURMA', id, 10),
        postsService.list({ classId: id, page: 1, limit: 8 }),
      ]);
      setClassroom(classData);
      setRanking(rankingData);
      setPosts(postsData.data);
    } catch {
      setError('Não foi possível carregar os detalhes da turma.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);


  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header skeleton */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8">
            <div className="flex items-center gap-3 mb-3">
              <Skeleton className="h-5 w-28 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-9 w-64" />
          </div>

          {/* Posts skeleton */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="grid gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3.5 w-20" />
                  </div>
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3.5 w-3/4" />
                  <div className="flex items-center gap-2 mt-1">
                    <Skeleton className="h-7 w-7 rounded-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="h-px bg-slate-200" />

          {/* Leaderboard skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <Skeleton className="h-5 w-36" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !classroom) {
    return (
      <DashboardLayout>
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <span>{error || 'Turma não encontrada'}</span>
          {error && (
            <button
              type="button"
              onClick={loadData}
              className="ml-auto shrink-0 font-semibold underline underline-offset-2 hover:text-red-800"
            >
              Tentar novamente
            </button>
          )}
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
                        <img src={getAssetUrl(post.author.avatar) ?? ''} alt={post.author.name} className="w-full h-full object-cover" />
                      ) : (
                        getUserInitials(post.author.name)
                      )}
                    </div>
                    <span>{post.author.name}</span>
                    <span>•</span>
                    <span>{post._count?.replies || 0} respostas</span>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Link
                      to={`/dashboard/posts?postId=${post.id}`}
                      className="inline-flex items-center rounded-lg border border-brand-100 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800 transition-colors hover:border-brand-200 hover:bg-brand-100"
                    >
                      Abrir post
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="h-px bg-slate-200" />

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ranking */}
          <div className="lg:col-span-1">
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
