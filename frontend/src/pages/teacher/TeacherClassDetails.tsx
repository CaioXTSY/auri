import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { ConfirmAction } from '@/components/ui/confirm-action';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { ModalDialog } from '@/components/ui/modal-dialog';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { Button } from '@/components/ui/button';
import { MarkdownContent } from '@/components/ui/markdown-content';
import { classService, type Class, type StudentInClass } from '@/services/class-service';
import { postsService, type PostItem } from '@/services/posts-service';
import { Calendar, Check, ChevronLeft, Copy, Loader2, Trash2, Users } from 'lucide-react';
import { getAssetUrl } from '@/lib/assets';

const getUserInitials = (name?: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'U';
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
  const [studentToRemove, setStudentToRemove] = useState<StudentInClass | null>(null);

  useEffect(() => {
    let isMounted = true;

    classService
      .getStudents(classId)
      .then((data) => {
        if (!isMounted) return;
        setStudents(data);
        setIsLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setError('Não foi possível carregar os alunos.');
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [classId]);

  const handleRemove = async () => {
    if (!studentToRemove) return;

    setRemovingId(studentToRemove.user.id);
    setError(null);

    try {
      await classService.removeStudent(classId, studentToRemove.user.id);
      setStudents((prev) => prev.filter((student) => student.user.id !== studentToRemove.user.id));
      setStudentToRemove(null);
    } catch {
      setError('Erro ao remover aluno. Tente novamente.');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <>
      <ModalDialog
        open
        title="Gerenciar alunos"
        description="Visualize quem está matriculado e remova acessos quando necessário."
        onClose={onClose}
        initialFocusSelector='button[data-close-modal="students"]'
        footer={
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {students.length} aluno{students.length !== 1 ? 's' : ''}
            </span>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-close-modal="students"
            >
              Fechar
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
            </div>
          ) : null}

          {!isLoading && error ? <ErrorState message={error} /> : null}

          {!isLoading && !error && students.length === 0 ? (
            <EmptyState message="Nenhum aluno matriculado ainda." className="py-10" />
          ) : null}

          {!isLoading && !error && students.length > 0 ? (
            <ul className="space-y-2">
              {students.map((student) => (
                <li
                  key={student.user.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 p-3 hover:bg-slate-50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-xs font-bold uppercase text-brand-700">
                      {student.user.avatar ? (
                        <img
                          src={getAssetUrl(student.user.avatar) ?? ''}
                          alt={student.user.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        getUserInitials(student.user.name)
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {student.user.name}
                      </p>
                      <p className="truncate text-xs text-slate-500">{student.user.email}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStudentToRemove(student)}
                    disabled={removingId === student.user.id}
                    aria-label={`Remover ${student.user.name} da turma`}
                    className="shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                  >
                    {removingId === student.user.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </ModalDialog>

      <ConfirmAction
        open={Boolean(studentToRemove)}
        title="Remover aluno"
        description="Essa ação revoga o vínculo do aluno com a turma."
        body={
          studentToRemove ? (
            <p>
              Remover <strong>{studentToRemove.user.name}</strong> da turma agora?
            </p>
          ) : null
        }
        confirmLabel="Remover"
        destructive
        isConfirming={Boolean(removingId)}
        onConfirm={handleRemove}
        onClose={() => {
          if (removingId) return;
          setStudentToRemove(null);
        }}
      />
    </>
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
    if (!classData?.code) return;
    navigator.clipboard.writeText(classData.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
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

        if (!isMounted) return;
        setClassData(cls);
        setPosts(postsData.data);
      } catch (loadError) {
        if (!isMounted) return;
        setError('Erro ao carregar detalhes da turma.');
        console.error(loadError);
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
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !classData) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <ErrorState message={error || 'Turma não encontrada.'} />
          <Button variant="outline" onClick={() => navigate('/dashboard/teacher/classes')}>
            Voltar para lista
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {showStudentsModal && id ? (
        <ManageStudentsModal classId={id} onClose={() => setShowStudentsModal(false)} />
      ) : null}

      <div className="space-y-8">
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard/teacher/classes')}
            className="flex items-center text-slate-500 transition-colors hover:text-brand-900"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Voltar
          </button>

          <PageHeader
            title={classData.name}
            description="Acompanhe alunos, código de convite e publicações recentes da turma."
            actions={
              <Button variant="outline" onClick={() => setShowStudentsModal(true)}>
                <Users className="mr-2 h-4 w-4" />
                Gerenciar alunos
              </Button>
            }
          />

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {classData.semester}
            </span>
            <div className="flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                Código:
              </span>
              <code className="font-mono font-bold text-brand-900">{classData.code}</code>
              <button
                type="button"
                onClick={copyToClipboard}
                aria-label={copiedCode ? 'Código copiado' : 'Copiar código da turma'}
                className="ml-1 text-brand-500 transition-colors hover:text-brand-700"
              >
                {copiedCode ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                classData.status === 'ATIVA'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {classData.status}
            </span>
          </div>
        </div>

        <SectionCard className="inline-block p-6">
          <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500">
            Total de alunos
          </h2>
          <p className="mt-2 text-3xl font-bold text-brand-900">
            {classData._count?.students ?? 0}
          </p>
        </SectionCard>

        <div className="space-y-4">
          <PageHeader
            title="Postagens da turma"
            description="Resumo das publicações mais recentes vinculadas a esta turma."
            actions={
              <Button variant="outline" onClick={() => navigate('/dashboard/posts')}>
                Gerenciar postagens
              </Button>
            }
            className="gap-3"
          />

          {posts.length === 0 ? (
            <EmptyState message="Nenhuma postagem publicada ainda." />
          ) : (
            <div className="grid gap-4">
              {posts.map((post) => (
                <SectionCard key={post.id} className="p-4">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold text-brand-900">{post.title}</h3>
                    <span className="whitespace-nowrap text-xs text-slate-500">
                      {new Date(post.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="text-sm text-slate-700">
                    <MarkdownContent content={post.content} className="space-y-2" />
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                    <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">
                      {post.author.avatar ? (
                        <img
                          src={getAssetUrl(post.author.avatar) ?? ''}
                          alt={post.author.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        getUserInitials(post.author.name)
                      )}
                    </div>
                    <span>{post.author.name}</span>
                    <span>•</span>
                    <span>{post._count?.replies || 0} respostas</span>
                  </div>
                </SectionCard>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
