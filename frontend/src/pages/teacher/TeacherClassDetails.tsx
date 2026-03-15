import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { classService, type Class } from '@/services/class-service';
import { postsService, type PostItem } from '@/services/posts-service';
import { Button } from '@/components/ui/button';
import { MarkdownContent } from '@/components/ui/markdown-content';
import { ChevronLeft, Calendar, Users, Loader2, Copy, Check, MessageSquare } from 'lucide-react';

const getUserInitials = (name?: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'U';
};

export const TeacherClassDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [classData, setClassData] = useState<Class | null>(null);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const copyToClipboard = () => {
    if (classData?.code) {
      navigator.clipboard.writeText(classData.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const [cls, postsData] = await Promise.all([
          classService.getClassDetails(id),
          postsService.list({ classId: id, page: 1, limit: 8 }),
        ]);
        
        if (isMounted) {
          setClassData(cls);
          setPosts(postsData.data);
        }
      } catch (err) {
        if (isMounted) {
          setError('Erro ao carregar detalhes da turma.');
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

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !classData) {
    return (
      <DashboardLayout>
        <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
          {error || 'Turma não encontrada'}
        </div>
        <Button variant="link" onClick={() => navigate('/dashboard/teacher/classes')}>
          Voltar para lista
        </Button>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <button 
            onClick={() => navigate('/dashboard/teacher/classes')}
            className="flex items-center text-slate-500 hover:text-brand-900 mb-4 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Voltar
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-brand-900 font-display">{classData.name}</h1>
              <div className="flex items-center gap-4 mt-2 text-slate-600">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {classData.semester}
                </span>
                <div className="flex items-center gap-2 bg-brand-50 px-3 py-1 rounded-full border border-brand-100">
                  <span className="text-xs font-semibold text-brand-700 uppercase tracking-wide">Código:</span>
                  <code className="font-mono font-bold text-brand-900">{classData.code}</code>
                  <button 
                    onClick={copyToClipboard}
                    className="ml-1 text-brand-500 hover:text-brand-700 transition-colors"
                    title="Copiar código"
                  >
                    {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                  classData.status === 'ATIVA' 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {classData.status}
                </span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Gerenciar Alunos
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total de Alunos</h3>
            <p className="text-3xl font-bold text-brand-900 mt-2">{classData._count?.students || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Média da Turma</h3>
            <p className="text-3xl font-bold text-brand-900 mt-2">-</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-brand-900 font-display flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-accent-600" />
              Postagens da Turma
            </h2>
            <Button variant="outline" onClick={() => navigate('/dashboard/posts')}>
              Gerenciar Postagens
            </Button>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-lg border border-slate-200 border-dashed text-slate-500">
              Nenhuma postagem publicada ainda.
            </div>
          ) : (
            <div className="grid gap-4">
              {posts.map((post) => (
                <div key={post.id} className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-base font-semibold text-brand-900">{post.title}</h3>
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {new Date(post.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="text-sm text-slate-700">
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
      </div>
    </DashboardLayout>
  );
};
