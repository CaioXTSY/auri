import { Check, Loader2, Plus, ShieldCheck, Trash2, X } from "lucide-react";
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
}: {
  isTeacherView: boolean;
  activitiesEnabled: boolean;
}) => (
  <SectionCard className="p-6">
    <EmptyState
      message={
        !activitiesEnabled
          ? "Atividades estão desativadas nesta turma."
          : isTeacherView
            ? "As atividades da turma serão centralizadas aqui quando o módulo estiver disponível."
            : "Nenhuma atividade publicada para esta turma."
      }
      className="border-slate-200 bg-white py-12"
    />
  </SectionCard>
);

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
