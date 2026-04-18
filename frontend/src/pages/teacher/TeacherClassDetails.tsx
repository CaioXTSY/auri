import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { classService, type Class, type StudentInClass } from '@/services/class-service';
import { postsService, type PostItem } from '@/services/posts-service';
import { Button } from '@/components/ui/button';
import { MarkdownContent } from '@/components/ui/markdown-content';
import { ChevronLeft, Calendar, Users, Loader2, Copy, Check, MessageSquare, X, Trash2 } from 'lucide-react';

const getUserInitials = (name?: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'U';
};

const ManageStudentsModal = ({
  classId,
  onClose,
}: {
  classId: string;
  onClose: () => void;
}) => {
  const [students, setStudents] = useState<StudentInClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    classService.getStudents(classId).then((data) => {
      if (isMounted) { setStudents(data); setIsLoading(false); }
    }).catch(() => {
      if (isMounted) { setError('Não foi possível carregar os alunos.'); setIsLoading(false); }
    });
    return () => { isMounted = false; };
  }, [classId]);

  const handleRemove = async (student: StudentInClass) => {
    if (!window.confirm(`Remover ${student.user.name} da turma?`)) return;
    setRemovingId(student.user.id);
    try {
      await classService.removeStudent(classId, student.user.id);
      setStudents((prev) => prev.filter((s) => s.user.id !== student.user.id));
    } catch {
      alert('Erro ao remover aluno. Tente novamente.');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-brand-900 font-display">Gerenciar Alunos</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
            </div>
          )}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
          )}
          {!isLoading && !error && students.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-8">Nenhum aluno matriculado ainda.</p>
          )}
          {!isLoading && !error && students.length > 0 && (
            <ul className="space-y-2">
              {students.map((student) => (
                <li
                  key={student.user.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 shrink-0 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold uppercase overflow-hidden">
                      {student.user.avatar ? (
                        <img src={student.user.avatar} alt={student.user.name} className="w-full h-full object-cover" />
                      ) : (
                        getUserInitials(student.user.name)
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{student.user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{student.user.email}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(student)}
                    disabled={removingId === student.user.id}
                    className="shrink-0 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                    title="Remover aluno"
                  >
                    {removingId === student.user.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex justify-between items-center">
          <span className="text-xs text-slate-500">{students.length} aluno{students.length !== 1 ? 's' : ''}</span>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </div>
      </div>
    </div>
  );
};

export const TeacherClassDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [classData, setClassData] = useState<Class | null>(null);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);

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
      {showStudentsModal && id && (
        <ManageStudentsModal classId={id} onClose={() => setShowStudentsModal(false)} />
      )}

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
              <Button variant="outline" onClick={() => setShowStudentsModal(true)}>
                <Users className="w-4 h-4 mr-2" />
                Gerenciar Alunos
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm inline-block">
          <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total de Alunos</h3>
          <p className="text-3xl font-bold text-brand-900 mt-2">{classData._count?.students ?? 0}</p>
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
