import { Archive, Check, Clock3, Code2, Edit3, Eye, FileUp, HelpCircle, Loader2, Plus, Send, ShieldCheck, Trash2, Type, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { PostEditor } from "@/components/posts/PostEditor";
import { PostFeed } from "@/components/posts/PostFeed";
import { Leaderboard } from "@/components/gamification/Leaderboard";
import { getAssetUrl } from "@/lib/assets";
import { getUserInitials, usePostsBoard } from "@/hooks/use-posts-board";
import type {
  ClassJoinRequest,
  ClassSettings,
  StudentInClass,
  UpdateClassSettingsPayload,
} from "@/services/class-service";
import type { RankingEntry } from "@/services/gamification-service";
import type { PostReply } from "@/services/posts-service";
import { activityService, type Activity, type ActivityType } from "@/services/activity-service";
import { programmingService, type ProgrammingAssignment } from "@/services/programming-service";
import { useNavigate } from "react-router-dom";

export const ClassPostsTab = ({
  board,
  user,
  classId,
  settings,
  onDeletePost,
  onDeleteReply,
}: {
  board: ReturnType<typeof usePostsBoard>;
  user: ReturnType<
    typeof import("@/stores/auth-store").useAuthStore.getState
  >["user"];
  classId: string;
  settings: ClassSettings | null;
  onDeletePost: (id: string) => void;
  onDeleteReply: (reply: PostReply) => void;
}) => {
  const canCreatePost =
    board.isProfessor || settings?.allowStudentPosts !== false;
  const canCreateReply =
    board.isProfessor || settings?.allowStudentReplies !== false;
  return (
    <div className="space-y-5">
      <PageHeader
        title="Mural"
        description="Comunicados, dúvidas e discussões da turma."
        actions={
          canCreatePost && !board.isEditingPost ? (
            <Button
              type="button"
              className="bg-brand-900 text-white hover:bg-brand-800"
              onClick={() => board.startCreatePost(classId)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova postagem
            </Button>
          ) : null
        }
      />
      {board.error ? <ErrorState message={board.error} /> : null}
      {!canCreatePost ? (
        <SectionCard className="p-4 text-sm text-slate-500">
          Postagens de alunos estão desativadas nesta turma.
        </SectionCard>
      ) : null}
      {canCreatePost && settings?.requirePostApproval && !board.isProfessor ? (
        <SectionCard className="border-amber-100 bg-amber-50 p-4 text-sm text-amber-700">
          Suas postagens precisam de aprovação do professor antes de aparecer
          para a turma.
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
};

export const ClassActivitiesTab = ({
  isTeacherView,
  activitiesEnabled,
  classId,
}: {
  isTeacherView: boolean;
  activitiesEnabled: boolean;
  classId: string;
}) => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [codeActivities, setCodeActivities] = useState<ProgrammingAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(activitiesEnabled);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!activitiesEnabled) return;
    setIsLoading(true);
    setError(null);
    try {
      if (isTeacherView) {
        const [general, code] = await Promise.all([
          activityService.listTeacher(classId),
          programmingService.getAssignments(1, 100),
        ]);
        setActivities(general.data);
        setCodeActivities(code.data.filter((item) => item.classId === classId));
      } else {
        const [general, code] = await Promise.all([
          activityService.listMine(classId),
          programmingService.getMyAssignments(),
        ]);
        setActivities(general.data);
        setCodeActivities(code.filter((item) => item.classId === classId));
      }
    } catch {
      setError("Não foi possível carregar as atividades desta turma.");
    } finally {
      setIsLoading(false);
    }
  }, [activitiesEnabled, classId, isTeacherView]);

  useEffect(() => { void load(); }, [load]);

  const publish = async (activityId: string) => {
    try { await activityService.publish(activityId); await load(); }
    catch { setError("Não foi possível publicar a atividade."); }
  };
  const archive = async (activityId: string) => {
    try { await activityService.archive(activityId); await load(); }
    catch { setError("Não foi possível arquivar a atividade."); }
  };

  if (!activitiesEnabled) {
    return <SectionCard className="p-6"><EmptyState message="Atividades estão desativadas nesta turma." className="border-slate-200 bg-white py-12" /></SectionCard>;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Atividades"
        description={isTeacherView ? "Crie atividades e acompanhe as entregas desta turma." : "Acompanhe prazos, entregas e correções desta turma."}
        actions={isTeacherView ? <Button onClick={() => navigate(`/dashboard/teacher/activities/new?classId=${classId}`)}><Plus className="mr-2 h-4 w-4" />Nova atividade</Button> : null}
      />
      {error ? <ErrorState message={error} action={<Button size="sm" variant="outline" onClick={load}>Tentar novamente</Button>} /> : null}
      {isLoading ? <SectionCard className="flex justify-center py-14"><Loader2 className="h-7 w-7 animate-spin text-brand-600" /></SectionCard> : null}
      {!isLoading && !activities.length && !codeActivities.length ? (
        <SectionCard className="p-6"><EmptyState message={isTeacherView ? "Nenhuma atividade criada nesta turma." : "Nenhuma atividade publicada nesta turma."} action={isTeacherView ? <Button onClick={() => navigate(`/dashboard/teacher/activities/new?classId=${classId}`)}>Criar primeira atividade</Button> : undefined} className="border-slate-200 bg-white py-12" /></SectionCard>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {activities.map((activity) => <ClassActivityCard key={activity.id} activity={activity} isTeacherView={isTeacherView} onNavigate={navigate} onPublish={publish} onArchive={archive} />)}
        {codeActivities.map((activity) => (
          <article key={activity.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3"><div className="rounded-lg bg-brand-50 p-2 text-brand-700"><Code2 className="h-5 w-5" /></div><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Código</p><h3 className="mt-1 font-semibold text-brand-900">{activity.title}</h3></div></div>
            <p className="mt-4 text-xs text-slate-500"><Clock3 className="mr-1 inline h-3.5 w-3.5" />{formatActivityDate(activity.dueDate)} · {activity.points} pontos</p>
            <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
              {isTeacherView ? <><Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/teacher/activities/code/${activity.id}/edit`)}><Edit3 className="mr-1 h-3.5 w-3.5" />Editar</Button><Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/teacher/activities/code/${activity.id}/submissions`)}><Eye className="mr-1 h-3.5 w-3.5" />Envios</Button></> : <Button size="sm" onClick={() => navigate(`/dashboard/activities/code/${activity.id}`)}>Resolver atividade</Button>}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

const activityTypes: Record<ActivityType, { label: string; icon: typeof Type }> = {
  TEXT: { label: "Resposta escrita", icon: Type }, FILE: { label: "Arquivo", icon: FileUp }, QUIZ: { label: "Questionário", icon: HelpCircle }, CODE: { label: "Código", icon: Code2 },
};
const formatActivityDate = (value?: string | null) => value ? new Date(value).toLocaleString("pt-BR") : "Sem prazo";

const ClassActivityCard = ({ activity, isTeacherView, onNavigate, onPublish, onArchive }: { activity: Activity; isTeacherView: boolean; onNavigate: ReturnType<typeof useNavigate>; onPublish: (id: string) => void; onArchive: (id: string) => void }) => {
  const info = activityTypes[activity.type];
  const Icon = info.icon;
  const submission = activity.submissions?.[0];
  return <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3"><div className="rounded-lg bg-brand-50 p-2 text-brand-700"><Icon className="h-5 w-5" /></div><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{info.label}</p><h3 className="mt-1 font-semibold text-brand-900">{activity.title}</h3></div></div><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{isTeacherView ? activity.status === "PUBLISHED" ? "Publicada" : activity.status === "DRAFT" ? "Rascunho" : "Arquivada" : submission?.status === "GRADED" ? "Corrigida" : submission ? "Entregue" : "Pendente"}</span></div>
    <p className="mt-3 line-clamp-2 text-sm text-slate-600">{activity.description}</p>
    <p className="mt-4 text-xs text-slate-500"><Clock3 className="mr-1 inline h-3.5 w-3.5" />{formatActivityDate(activity.dueDate)} · {activity.maxScore} pontos · {activity.xpReward} XP</p>
    <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">{isTeacherView ? <><Button size="sm" variant="outline" onClick={() => onNavigate(`/dashboard/teacher/activities/${activity.id}/edit`)}><Edit3 className="mr-1 h-3.5 w-3.5" />Editar</Button><Button size="sm" variant="outline" onClick={() => onNavigate(`/dashboard/teacher/activities/${activity.id}/submissions`)}><Eye className="mr-1 h-3.5 w-3.5" />Entregas</Button>{activity.status === "DRAFT" ? <Button size="sm" onClick={() => onPublish(activity.id)}><Send className="mr-1 h-3.5 w-3.5" />Publicar</Button> : null}{activity.status === "PUBLISHED" ? <Button size="sm" variant="ghost" onClick={() => onArchive(activity.id)}><Archive className="mr-1 h-3.5 w-3.5" />Arquivar</Button> : null}</> : <Button className="w-full" onClick={() => onNavigate(`/dashboard/activities/${activity.id}`)}>{submission?.status === "GRADED" ? "Ver correção" : "Abrir atividade"}</Button>}</div>
  </article>;
};

export const ClassMembersTab = ({
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
  if (isLoading)
    return (
      <SectionCard className="flex justify-center p-10">
        <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
      </SectionCard>
    );
  if (error)
    return (
      <SectionCard className="p-5">
        <ErrorState message={error} />
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={onRetry}
        >
          Tentar novamente
        </Button>
      </SectionCard>
    );
  if (!students.length)
    return (
      <SectionCard className="p-6">
        <EmptyState
          message="Nenhum aluno matriculado ainda."
          className="border-slate-200 bg-white py-12"
        />
      </SectionCard>
    );
  return (
    <SectionCard className="overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-display text-lg font-bold text-brand-900">
          Alunos
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {canManage
            ? "Matrículas ativas nesta turma."
            : "Colegas matriculados nesta turma."}
        </p>
      </div>
      <div className="divide-y divide-slate-100">
        {students.map((student) => (
          <div
            key={student.user.id}
            className="flex items-center justify-between gap-3 px-5 py-4"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-xs font-bold uppercase text-brand-700">
                {student.user.avatar ? (
                  <img
                    src={getAssetUrl(student.user.avatar) ?? ""}
                    alt={student.user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  getUserInitials(student.user.name)
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {student.user.name}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {canManage ? student.user.email : student.user.role}
                </p>
              </div>
            </div>
            {canManage && student.membershipType !== "OWNER" ? (
              <button
                type="button"
                aria-label={`Remover ${student.user.name} da turma`}
                className="rounded-md p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
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

export const ClassProgressTab = ({
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
          <h2 className="font-display text-lg font-bold text-brand-900">
            Progresso da turma
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            A grade de atividades e o cálculo de risco serão ativados junto com
            o módulo de atividades.
          </p>
          <div className="mt-5 space-y-2">
            {students.map((student) => (
              <p key={student.user.id} className="text-sm text-slate-700">
                {student.user.name} — sem dados de atividade
              </p>
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          message="Seu progresso por atividade aparecerá aqui quando houver atividades publicadas."
          className="border-slate-200 bg-white py-12"
        />
      )}
    </SectionCard>
    {showRanking ? (
      <Leaderboard entries={ranking} title="Ranking da Turma" />
    ) : (
      <SectionCard className="p-6">
        <h2 className="font-display text-lg font-bold text-brand-900">
          Ranking da turma
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          O ranking não está visível para alunos nesta turma.
        </p>
      </SectionCard>
    )}
  </div>
);

export const ClassJoinRequestsTab = ({
  requests,
  isLoading,
  reviewingId,
  onReview,
}: {
  requests: ClassJoinRequest[];
  isLoading: boolean;
  reviewingId: string | null;
  onReview: (id: string, action: "approve" | "reject") => void;
}) => (
  <SectionCard className="overflow-hidden">
    <div className="border-b border-slate-100 px-5 py-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-brand-700" />
        <h2 className="font-display text-lg font-bold text-brand-900">
          Solicitações
        </h2>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Alunos aguardando aprovação para entrar.
      </p>
    </div>
    {isLoading ? (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    ) : !requests.length ? (
      <div className="p-5 text-sm text-slate-500">
        Nenhuma solicitação pendente.
      </div>
    ) : (
      <div className="divide-y divide-slate-100">
        {requests.map((request) => (
          <div key={request.id} className="px-5 py-4">
            <p className="font-semibold text-slate-900">{request.user.name}</p>
            <p className="text-xs text-slate-500">{request.user.email}</p>
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                size="sm"
                className="bg-brand-900 text-white"
                disabled={reviewingId === request.id}
                onClick={() => onReview(request.id, "approve")}
              >
                <Check className="mr-1.5 h-4 w-4" />
                Aprovar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={reviewingId === request.id}
                onClick={() => onReview(request.id, "reject")}
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
);

export const ClassSettingsTab = ({
  settings,
  error,
  savingSetting,
  onChange,
  requests,
  requestsLoading,
  reviewingId,
  onReview,
}: {
  settings: ClassSettings | null;
  error: string | null;
  savingSetting: keyof UpdateClassSettingsPayload | null;
  onChange: (key: keyof UpdateClassSettingsPayload, value: boolean) => void;
  requests: ClassJoinRequest[];
  requestsLoading: boolean;
  reviewingId: string | null;
  onReview: (id: string, action: "approve" | "reject") => void;
}) => {
  if (!settings)
    return (
      <SectionCard className="flex justify-center p-10">
        <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
      </SectionCard>
    );
  const groups: Array<
    [string, Array<[keyof UpdateClassSettingsPayload, string]>]
  > = [
    [
      "Participação",
      [
        ["allowStudentPosts", "Alunos podem criar postagens"],
        ["allowStudentReplies", "Alunos podem responder postagens"],
        ["requirePostApproval", "Professor precisa aprovar novas postagens"],
        ["requireReplyApproval", "Professor precisa aprovar respostas"],
      ],
    ],
    [
      "Matrícula",
      [
        ["allowJoinByCode", "Permitir entrada por código"],
        ["requireJoinApproval", "Exigir aprovação para entrar"],
        ["lockEnrollment", "Bloquear novas matrículas"],
      ],
    ],
    [
      "Atividades",
      [
        ["activitiesEnabled", "Habilitar atividades nesta turma"],
        ["allowLateSubmissions", "Permitir entrega atrasada"],
        ["showRankingToStudents", "Mostrar ranking para alunos"],
      ],
    ],
  ];
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-5">
        {error ? <ErrorState message={error} /> : null}
        {groups.map(([title, items]) => (
          <SectionCard key={title} className="overflow-hidden">
            <h2 className="border-b border-slate-100 px-5 py-4 font-display text-lg font-bold text-brand-900">
              {title}
            </h2>
            {items.map(([key, label]) => (
              <label
                key={key}
                className="flex cursor-pointer items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 text-sm font-medium text-slate-700"
              >
                <span>{label}</span>
                <input
                  type="checkbox"
                  checked={Boolean(settings[key])}
                  disabled={Boolean(savingSetting)}
                  onChange={(event) => onChange(key, event.target.checked)}
                />
              </label>
            ))}
          </SectionCard>
        ))}
      </div>
      <ClassJoinRequestsTab
        requests={requests}
        isLoading={requestsLoading}
        reviewingId={reviewingId}
        onReview={onReview}
      />
    </div>
  );
};
