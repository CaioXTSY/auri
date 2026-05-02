import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Calendar,
  Check,
  ChevronLeft,
  Copy,
  GraduationCap,
  Loader2,
  MessageSquare,
  Plus,
  Settings,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ConfirmAction } from '@/components/ui/confirm-action';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { Button } from '@/components/ui/button';
import { PostEditor } from '@/components/posts/PostEditor';
import { PostFeed } from '@/components/posts/PostFeed';
import { Leaderboard } from '@/components/gamification/Leaderboard';
import {
  classService,
  type Class,
  type ClassJoinRequest,
  type ClassSettings,
  type StudentInClass,
  type UpdateClassSettingsPayload,
} from '@/services/class-service';
import type { RankingEntry } from '@/services/gamification-service';
import type { PostReply } from '@/services/posts-service';
import { getAssetUrl } from '@/lib/assets';
import { cn } from '@/lib/utils';
import { getUserInitials, usePostsBoard } from '@/hooks/use-posts-board';
import { useAuthStore } from '@/stores/auth-store';

type WorkspaceRole = 'ALUNO' | 'PROFESSOR' | 'ADMIN';
type WorkspaceTab = 'mural' | 'activities' | 'students' | 'progress' | 'settings';

interface ClassWorkspaceProps {
  classroom: Class;
  role: WorkspaceRole;
  ranking?: RankingEntry[];
}

const TAB_LABELS: Record<WorkspaceTab, string> = {
  mural: 'Mural',
  activities: 'Atividades',
  students: 'Alunos',
  progress: 'Progresso',
  settings: 'Configurações',
};

const TAB_ICONS = {
  mural: MessageSquare,
  activities: BookOpen,
  students: Users,
  progress: BarChart3,
  settings: Settings,
};

const roleLabel = {
  ADMIN: 'Admin',
  PROFESSOR: 'Professor',
  ALUNO: 'Aluno',
};

export const ClassWorkspace = ({ classroom, role, ranking = [] }: ClassWorkspaceProps) => {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const isTeacherView = role === 'PROFESSOR' || role === 'ADMIN';
  const [settings, setSettings] = useState<ClassSettings | null>(classroom.settings ?? null);
  const tabs = useMemo<WorkspaceTab[]>(
    () => {
      if (isTeacherView) {
        return ['mural', 'activities', 'students', 'progress', 'settings'];
      }

      const studentTabs: WorkspaceTab[] = ['mural', 'students'];
      if (settings?.activitiesEnabled !== false) {
        studentTabs.splice(1, 0, 'activities');
        studentTabs.push('progress');
      }
      return studentTabs;
    },
    [isTeacherView, settings?.activitiesEnabled],
  );
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('mural');
  const [copiedCode, setCopiedCode] = useState(false);
  const [students, setStudents] = useState<StudentInClass[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [studentsError, setStudentsError] = useState<string | null>(null);
  const [studentToRemove, setStudentToRemove] = useState<StudentInClass | null>(null);
  const [isRemovingStudent, setIsRemovingStudent] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [savingSetting, setSavingSetting] = useState<keyof UpdateClassSettingsPayload | null>(null);
  const [joinRequests, setJoinRequests] = useState<ClassJoinRequest[]>([]);
  const [isLoadingJoinRequests, setIsLoadingJoinRequests] = useState(false);
  const [reviewingJoinRequestId, setReviewingJoinRequestId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<
    | { type: 'post'; postId: string }
    | { type: 'reply'; reply: PostReply }
    | null
  >(null);

  const board = usePostsBoard(user, classroom.id);

  const studentCount = classroom._count?.students ?? students.length;

  const loadStudents = useCallback(async () => {
    setIsLoadingStudents(true);
    setStudentsError(null);
    try {
      const data = await classService.getStudents(classroom.id);
      setStudents(data);
    } catch {
      setStudentsError('Não foi possível carregar os alunos da turma.');
    } finally {
      setIsLoadingStudents(false);
    }
  }, [classroom.id]);

  const loadSettings = useCallback(async () => {
    setSettingsError(null);
    try {
      const data = await classService.getSettings(classroom.id);
      setSettings(data);
    } catch {
      setSettingsError('Não foi possível carregar as configurações da turma.');
    }
  }, [classroom.id]);

  const loadJoinRequests = useCallback(async () => {
    if (!isTeacherView) return;
    setIsLoadingJoinRequests(true);
    try {
      const data = await classService.getJoinRequests(classroom.id);
      setJoinRequests(data);
    } catch {
      setSettingsError('Não foi possível carregar as solicitações de matrícula.');
    } finally {
      setIsLoadingJoinRequests(false);
    }
  }, [classroom.id, isTeacherView]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    loadJoinRequests();
  }, [loadJoinRequests]);

  useEffect(() => {
    if (tabs.includes(activeTab)) return;
    setActiveTab('mural');
  }, [activeTab, tabs]);

  const copyToClipboard = async () => {
    if (!classroom.code) return;
    await navigator.clipboard.writeText(classroom.code);
    setCopiedCode(true);
    window.setTimeout(() => setCopiedCode(false), 1800);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    if (pendingDelete.type === 'post') {
      await board.handleDeletePost(pendingDelete.postId);
    } else {
      await board.handleDeleteReply(pendingDelete.reply);
    }
    setPendingDelete(null);
  };

  const handleRemoveStudent = async () => {
    if (!studentToRemove) return;
    setIsRemovingStudent(true);
    setStudentsError(null);
    try {
      await classService.removeStudent(classroom.id, studentToRemove.user.id);
      setStudents((current) => current.filter((student) => student.user.id !== studentToRemove.user.id));
      setStudentToRemove(null);
    } catch {
      setStudentsError('Não foi possível remover o aluno.');
    } finally {
      setIsRemovingStudent(false);
    }
  };

  const handleSettingChange = async (key: keyof UpdateClassSettingsPayload, value: boolean) => {
    if (!settings) return;
    const previous = settings;
    setSavingSetting(key);
    setSettingsError(null);
    setSettings({ ...settings, [key]: value });
    try {
      const updated = await classService.updateSettings(classroom.id, { [key]: value });
      setSettings(updated);
    } catch {
      setSettings(previous);
      setSettingsError('Não foi possível salvar a configuração.');
    } finally {
      setSavingSetting(null);
    }
  };

  const handleReviewJoinRequest = async (requestId: string, action: 'approve' | 'reject') => {
    setReviewingJoinRequestId(requestId);
    setSettingsError(null);
    try {
      if (action === 'approve') {
        await classService.approveJoinRequest(classroom.id, requestId);
        await loadStudents();
      } else {
        await classService.rejectJoinRequest(classroom.id, requestId);
      }
      setJoinRequests((current) => current.filter((request) => request.id !== requestId));
    } catch {
      setSettingsError('Não foi possível revisar a solicitação.');
    } finally {
      setReviewingJoinRequestId(null);
    }
  };

  const canCreatePost = board.isProfessor || settings?.allowStudentPosts !== false;
  const canCreateReply = board.isProfessor || settings?.allowStudentReplies !== false;

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      <button
        type="button"
        onClick={() => navigate(isTeacherView ? '/dashboard/teacher/classes' : '/dashboard/classes')}
        className="inline-flex items-center text-sm font-medium text-slate-500 transition-colors hover:text-brand-900"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Voltar para turmas
      </button>

      <SectionCard className="overflow-hidden">
        <div className="border-b border-slate-100 p-5 md:p-6">
          <PageHeader
            title={classroom.name}
            description={isTeacherView ? 'Gerencie a rotina da turma em um único lugar.' : 'Acompanhe mural, atividades e seu progresso nesta turma.'}
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                    classroom.status === 'ATIVA'
                      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
                      : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
                  )}
                >
                  {classroom.status === 'ATIVA' ? 'Em andamento' : 'Encerrada'}
                </span>
                {isTeacherView ? (
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="inline-flex items-center gap-2 rounded-lg border border-brand-100 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800 transition-colors hover:bg-brand-100"
                  >
                    <span className="font-mono">{classroom.code}</span>
                    {copiedCode ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                ) : null}
              </div>
            }
          />
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {classroom.year}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4" />
              {studentCount} aluno{studentCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto border-b border-slate-100 px-4">
          <div className="flex min-w-max gap-1 py-2">
            {tabs.map((tab) => {
              const Icon = TAB_ICONS[tab];
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
                    active
                      ? 'bg-brand-900 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-brand-900',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {TAB_LABELS[tab]}
                </button>
              );
            })}
          </div>
        </div>
      </SectionCard>

      {activeTab === 'mural' ? (
        <MuralTab
          board={board}
          user={user}
          classId={classroom.id}
          settings={settings}
          canCreatePost={canCreatePost}
          canCreateReply={canCreateReply}
          pendingError={board.error}
          onDeletePost={(postId) => setPendingDelete({ type: 'post', postId })}
          onDeleteReply={(reply) => setPendingDelete({ type: 'reply', reply })}
        />
      ) : null}

      {activeTab === 'activities' ? <ActivitiesTab isTeacherView={isTeacherView} activitiesEnabled={settings?.activitiesEnabled ?? true} /> : null}
      {activeTab === 'students' ? (
        <StudentsTab
          students={students}
          isLoading={isLoadingStudents}
          error={studentsError}
          onRetry={loadStudents}
          onRequestRemove={setStudentToRemove}
          canManage={isTeacherView}
        />
      ) : null}
      {activeTab === 'progress' ? (
        <ProgressTab isTeacherView={isTeacherView} ranking={ranking} students={students} showRanking={isTeacherView || settings?.showRankingToStudents !== false} />
      ) : null}
      {activeTab === 'settings' && isTeacherView ? (
        <SettingsTab
          settings={settings}
          error={settingsError}
          savingSetting={savingSetting}
          joinRequests={joinRequests}
          isLoadingJoinRequests={isLoadingJoinRequests}
          reviewingJoinRequestId={reviewingJoinRequestId}
          onSettingChange={handleSettingChange}
          onReviewJoinRequest={handleReviewJoinRequest}
        />
      ) : null}

      <ConfirmAction
        open={Boolean(pendingDelete)}
        title={pendingDelete?.type === 'post' ? 'Excluir postagem' : 'Excluir comentário'}
        description="Essa ação não pode ser desfeita."
        onClose={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
        confirmLabel="Confirmar exclusão"
        destructive
        body={pendingDelete?.type === 'post'
          ? 'A postagem e seus comentários serão removidos do mural.'
          : 'O comentário selecionado será removido da discussão.'}
      />

      <ConfirmAction
        open={Boolean(studentToRemove)}
        title="Remover aluno"
        description="Essa ação revoga o vínculo do aluno com a turma."
        onClose={() => {
          if (!isRemovingStudent) setStudentToRemove(null);
        }}
        onConfirm={handleRemoveStudent}
        confirmLabel="Remover"
        destructive
        isConfirming={isRemovingStudent}
        body={studentToRemove ? `Remover ${studentToRemove.user.name} desta turma?` : null}
      />
    </div>
  );
};

const MuralTab = ({
  board,
  user,
  classId,
  settings,
  canCreatePost,
  canCreateReply,
  pendingError,
  onDeletePost,
  onDeleteReply,
}: {
  board: ReturnType<typeof usePostsBoard>;
  user: ReturnType<typeof useAuthStore.getState>['user'];
  classId: string;
  settings: ClassSettings | null;
  canCreatePost: boolean;
  canCreateReply: boolean;
  pendingError: string | null;
  onDeletePost: (postId: string) => void;
  onDeleteReply: (reply: PostReply) => void;
}) => (
  <div className="space-y-5">
    <PageHeader
      title="Mural"
      description="Comunicados, dúvidas e discussões da turma."
      actions={canCreatePost && !board.isEditingPost ? (
        <Button
          type="button"
          className="bg-brand-900 text-white hover:bg-brand-800"
          onClick={() => board.startCreatePost(classId)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova postagem
        </Button>
      ) : null}
    />

    {pendingError ? <ErrorState message={pendingError} /> : null}

    {!canCreatePost ? (
      <SectionCard className="border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
        Postagens de alunos estão desativadas nesta turma.
      </SectionCard>
    ) : null}

    {canCreatePost && settings?.requirePostApproval && !board.isProfessor ? (
      <SectionCard className="border-amber-100 bg-amber-50 p-4 text-sm text-amber-700">
        Suas postagens precisam de aprovação do professor antes de aparecer para a turma.
      </SectionCard>
    ) : null}

    {canCreatePost && board.isEditingPost ? (
      <PostEditor
        user={user}
        classes={board.classes}
        selectedPost={board.selectedPost}
        isSavingPost={board.isSavingPost}
        postTitle={board.postTitle}
        postClassId={board.postClassId}
        postContent={board.postContent}
        onTitleChange={board.setPostTitle}
        onClassChange={board.setPostClassId}
        onContentChange={board.setPostContent}
        onInsertTemplate={board.insertTemplate}
        onCancel={board.cancelEdit}
        onSave={board.handleSavePost}
      />
    ) : null}

    <PostFeed
      user={user}
      posts={board.posts}
      selectedPostId={board.selectedPostId}
      selectedPost={board.selectedPost}
      isProfessor={board.isProfessor}
      canEditSelectedPost={board.canEditSelectedPost}
      isLoadingPosts={board.isLoadingPosts}
      isLoadingPostDetails={board.isLoadingPostDetails}
      isSendingReply={board.isSendingReply}
      canCreateReply={canCreateReply}
      replyContent={board.replyContent}
      onReplyContentChange={board.setReplyContent}
      onToggleComments={board.toggleComments}
      onStartEditPost={board.startEditPost}
      onRequestDeletePost={onDeletePost}
      onCreateReply={board.handleCreateReply}
      onRequestDeleteReply={onDeleteReply}
      onApprovePost={board.handleApprovePost}
      onRejectPost={board.handleRejectPost}
      onApproveReply={board.handleApproveReply}
      onRejectReply={board.handleRejectReply}
    />
  </div>
);

const ActivitiesTab = ({ isTeacherView, activitiesEnabled }: { isTeacherView: boolean; activitiesEnabled: boolean }) => (
  <SectionCard className="p-6">
    <EmptyState
      message={!activitiesEnabled
        ? 'Atividades estão desativadas nesta turma.'
        : isTeacherView
        ? 'As atividades da turma serão centralizadas aqui quando o módulo de atividades estiver disponível.'
        : 'Nenhuma atividade publicada para esta turma.'}
      className="border-slate-200 bg-white py-12"
    />
  </SectionCard>
);

const StudentsTab = ({
  students,
  isLoading,
  error,
  onRetry,
  onRequestRemove,
  canManage,
}: {
  students: StudentInClass[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onRequestRemove: (student: StudentInClass) => void;
  canManage: boolean;
}) => {
  if (isLoading) {
    return (
      <SectionCard className="flex justify-center p-10">
        <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
      </SectionCard>
    );
  }

  if (error) {
    return (
      <SectionCard className="p-5">
        <ErrorState message={error} />
        <Button type="button" variant="outline" className="mt-4" onClick={onRetry}>
          Tentar novamente
        </Button>
      </SectionCard>
    );
  }

  if (students.length === 0) {
    return (
      <SectionCard className="p-6">
        <EmptyState message="Nenhum aluno matriculado ainda." className="border-slate-200 bg-white py-12" />
      </SectionCard>
    );
  }

  return (
    <SectionCard className="overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-display text-lg font-bold text-brand-900">Alunos</h2>
        <p className="mt-1 text-sm text-slate-500">
          {canManage ? 'Matrículas ativas nesta turma.' : 'Colegas matriculados nesta turma.'}
        </p>
      </div>
      <div className="divide-y divide-slate-100">
        {students.map((student) => (
          <div key={student.user.id} className="flex items-center justify-between gap-3 px-5 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-xs font-bold uppercase text-brand-700">
                {student.user.avatar ? (
                  <img src={getAssetUrl(student.user.avatar) ?? ''} alt={student.user.name} className="h-full w-full object-cover" />
                ) : (
                  getUserInitials(student.user.name)
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{student.user.name}</p>
                <p className="truncate text-xs text-slate-500">
                  {canManage ? student.user.email : roleLabel[student.user.role]}
                </p>
              </div>
            </div>
            {canManage && student.membershipType !== 'OWNER' ? (
              <button
                type="button"
                aria-label={`Remover ${student.user.name} da turma`}
                className="shrink-0 rounded-md p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                onClick={() => onRequestRemove(student)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </SectionCard>
  );
};

const SettingsTab = ({
  settings,
  error,
  savingSetting,
  joinRequests,
  isLoadingJoinRequests,
  reviewingJoinRequestId,
  onSettingChange,
  onReviewJoinRequest,
}: {
  settings: ClassSettings | null;
  error: string | null;
  savingSetting: keyof UpdateClassSettingsPayload | null;
  joinRequests: ClassJoinRequest[];
  isLoadingJoinRequests: boolean;
  reviewingJoinRequestId: string | null;
  onSettingChange: (key: keyof UpdateClassSettingsPayload, value: boolean) => void;
  onReviewJoinRequest: (requestId: string, action: 'approve' | 'reject') => void;
}) => {
  if (!settings) {
    return (
      <SectionCard className="flex justify-center p-10">
        <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
      </SectionCard>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-5">
        {error ? <ErrorState message={error} /> : null}
        <SettingsGroup
          title="Participação"
          description="Controle quem pode publicar e quando o professor precisa revisar."
          icon={MessageSquare}
          items={[
            ['allowStudentPosts', 'Alunos podem criar postagens'],
            ['allowStudentReplies', 'Alunos podem responder postagens'],
            ['requirePostApproval', 'Professor precisa aprovar novas postagens'],
            ['requireReplyApproval', 'Professor precisa aprovar respostas'],
          ]}
          settings={settings}
          savingSetting={savingSetting}
          onSettingChange={onSettingChange}
        />
        <SettingsGroup
          title="Matrícula"
          description="Defina como novos alunos entram na turma."
          icon={UserPlus}
          items={[
            ['allowJoinByCode', 'Permitir entrada por código'],
            ['requireJoinApproval', 'Exigir aprovação do professor para entrar'],
            ['lockEnrollment', 'Bloquear novas matrículas'],
          ]}
          settings={settings}
          savingSetting={savingSetting}
          onSettingChange={onSettingChange}
        />
        <SettingsGroup
          title="Atividades"
          description="Ajustes do módulo de atividades e visibilidade de ranking."
          icon={BookOpen}
          items={[
            ['activitiesEnabled', 'Habilitar atividades nesta turma'],
            ['allowLateSubmissions', 'Permitir entrega atrasada'],
            ['showRankingToStudents', 'Mostrar ranking da turma para alunos'],
          ]}
          settings={settings}
          savingSetting={savingSetting}
          onSettingChange={onSettingChange}
        />
      </div>

      <SectionCard className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand-700" />
            <h2 className="font-display text-lg font-bold text-brand-900">Solicitações</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">Alunos aguardando aprovação para entrar.</p>
        </div>

        {isLoadingJoinRequests ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          </div>
        ) : joinRequests.length === 0 ? (
          <div className="p-5 text-sm text-slate-500">Nenhuma solicitação pendente.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {joinRequests.map((request) => (
              <div key={request.id} className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-xs font-bold uppercase text-brand-700">
                    {request.user.avatar ? (
                      <img src={getAssetUrl(request.user.avatar) ?? ''} alt={request.user.name} className="h-full w-full object-cover" />
                    ) : (
                      getUserInitials(request.user.name)
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{request.user.name}</p>
                    <p className="truncate text-xs text-slate-500">{request.user.email}</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="bg-brand-900 text-white hover:bg-brand-800"
                    disabled={reviewingJoinRequestId === request.id}
                    onClick={() => onReviewJoinRequest(request.id, 'approve')}
                  >
                    <Check className="mr-1.5 h-4 w-4" />
                    Aprovar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={reviewingJoinRequestId === request.id}
                    onClick={() => onReviewJoinRequest(request.id, 'reject')}
                  >
                    <X className="mr-1.5 h-4 w-4" />
                    Rejeitar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
};

const SettingsGroup = ({
  title,
  description,
  icon: Icon,
  items,
  settings,
  savingSetting,
  onSettingChange,
}: {
  title: string;
  description: string;
  icon: typeof MessageSquare;
  items: [keyof UpdateClassSettingsPayload, string][];
  settings: ClassSettings;
  savingSetting: keyof UpdateClassSettingsPayload | null;
  onSettingChange: (key: keyof UpdateClassSettingsPayload, value: boolean) => void;
}) => (
  <SectionCard className="overflow-hidden">
    <div className="border-b border-slate-100 px-5 py-4">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-brand-700" />
        <h2 className="font-display text-lg font-bold text-brand-900">{title}</h2>
      </div>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
    <div className="divide-y divide-slate-100">
      {items.map(([key, label]) => (
        <label key={key} className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4">
          <span className="text-sm font-medium text-slate-700">{label}</span>
          <div className="flex items-center gap-2">
            {savingSetting === key ? <Loader2 className="h-4 w-4 animate-spin text-brand-600" /> : null}
            <input
              type="checkbox"
              className="h-4 w-4 shrink-0 rounded border-slate-300 text-brand-900 accent-brand-900 focus:ring-brand-900 disabled:cursor-not-allowed disabled:opacity-50"
              checked={Boolean(settings[key])}
              disabled={Boolean(savingSetting)}
              onChange={(event) => onSettingChange(key, event.target.checked)}
            />
          </div>
        </label>
      ))}
    </div>
  </SectionCard>
);

const ProgressTab = ({
  isTeacherView,
  ranking,
  students,
  showRanking,
}: {
  isTeacherView: boolean;
  ranking: RankingEntry[];
  students: StudentInClass[];
  showRanking: boolean;
}) => (
  <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
    <SectionCard className="p-6">
      {isTeacherView ? (
        <>
          <h2 className="font-display text-lg font-bold text-brand-900">Progresso da turma</h2>
          <p className="mt-1 text-sm text-slate-500">
            A grade de atividades e o cálculo de risco serão ativados junto com o módulo de atividades.
          </p>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="py-3 pr-4">Aluno</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Atividades pendentes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.length > 0 ? students.map((student) => (
                  <tr key={student.user.id}>
                    <td className="py-3 pr-4 font-medium text-slate-800">{student.user.name}</td>
                    <td className="py-3 pr-4">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">Sem dados</span>
                    </td>
                    <td className="py-3 pr-4 text-slate-500">0</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-500">Nenhum aluno para exibir.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <EmptyState message="Seu progresso por atividade aparecerá aqui quando houver atividades publicadas." className="border-slate-200 bg-white py-12" />
      )}
    </SectionCard>

    {showRanking && ranking.length > 0 ? (
      <Leaderboard entries={ranking} title="Ranking da Turma" />
    ) : showRanking ? (
      <SectionCard className="p-6">
        <h2 className="font-display text-lg font-bold text-brand-900">Ranking da turma</h2>
        <p className="mt-2 text-sm text-slate-500">Ainda não há pontuação suficiente para montar o ranking.</p>
        <Link to="/dashboard/missions" className="mt-4 inline-flex text-sm font-semibold text-brand-700 hover:text-brand-900">
          Ver missões
        </Link>
      </SectionCard>
    ) : (
      <SectionCard className="p-6">
        <h2 className="font-display text-lg font-bold text-brand-900">Ranking da turma</h2>
        <p className="mt-2 text-sm text-slate-500">O ranking não está visível para alunos nesta turma.</p>
      </SectionCard>
    )}
  </div>
);
