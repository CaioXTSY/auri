import { useMemo, useState } from "react";
import {
  BarChart3,
  BookOpen,
  Calendar,
  Check,
  ChevronLeft,
  Copy,
  GraduationCap,
  MessageSquare,
  Settings,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { usePostsBoard } from "@/hooks/use-posts-board";
import { useClassMembers } from "@/hooks/use-class-members";
import { useClassSettings } from "@/hooks/use-class-settings";
import { useClassJoinRequests } from "@/hooks/use-class-join-requests";
import type { Class, StudentInClass } from "@/services/class-service";
import type { RankingEntry } from "@/services/gamification-service";
import type { PostReply } from "@/services/posts-service";
import {
  ClassActivitiesTab,
  ClassMembersTab,
  ClassPostsTab,
  ClassProgressTab,
  ClassSettingsTab,
} from "./workspace/ClassTabs";

type WorkspaceRole = "ALUNO" | "PROFESSOR" | "ADMIN";
type WorkspaceTab =
  "mural" | "activities" | "students" | "progress" | "settings";

const tabs: Record<
  WorkspaceTab,
  { label: string; icon: typeof MessageSquare }
> = {
  mural: { label: "Mural", icon: MessageSquare },
  activities: { label: "Atividades", icon: BookOpen },
  students: { label: "Alunos", icon: Users },
  progress: { label: "Progresso", icon: BarChart3 },
  settings: { label: "Configurações", icon: Settings },
};

export const ClassWorkspace = ({
  classroom,
  role,
  ranking = [],
}: {
  classroom: Class;
  role: WorkspaceRole;
  ranking?: RankingEntry[];
}) => {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const isTeacherView = role !== "ALUNO";
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("mural");
  const [copiedCode, setCopiedCode] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState<StudentInClass | null>(
    null,
  );
  const [pendingDelete, setPendingDelete] = useState<
    | { type: "post"; postId: string }
    | { type: "reply"; reply: PostReply }
    | null
  >(null);
  const members = useClassMembers(classroom.id);
  const settings = useClassSettings(classroom.id, classroom.settings);
  const requests = useClassJoinRequests(
    classroom.id,
    isTeacherView,
    members.reload,
  );
  const board = usePostsBoard(user, classroom.id);
  const visibleTabs = useMemo<WorkspaceTab[]>(
    () =>
      isTeacherView
        ? ["mural", "activities", "students", "progress", "settings"]
        : [
            "mural",
            "students",
            ...(settings.settings?.activitiesEnabled === false
              ? []
              : (["activities", "progress"] as WorkspaceTab[])),
          ],
    [isTeacherView, settings.settings?.activitiesEnabled],
  );

  const selectedTab = visibleTabs.includes(activeTab) ? activeTab : "mural";

  const copyCode = async () => {
    await navigator.clipboard.writeText(classroom.code);
    setCopiedCode(true);
    window.setTimeout(() => setCopiedCode(false), 1800);
  };
  const confirmRemove = async () => {
    if (!studentToRemove) return;
    await members.remove(studentToRemove);
    setStudentToRemove(null);
  };
  const confirmDelete = async () => {
    if (!pendingDelete) return;
    if (pendingDelete.type === "post")
      await board.handleDeletePost(pendingDelete.postId);
    else await board.handleDeleteReply(pendingDelete.reply);
    setPendingDelete(null);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      <button
        type="button"
        onClick={() =>
          navigate(
            isTeacherView ? "/dashboard/teacher/classes" : "/dashboard/classes",
          )
        }
        className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-brand-900"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Voltar para turmas
      </button>
      <SectionCard className="overflow-hidden">
        <div className="border-b border-slate-100 p-5 md:p-6">
          <PageHeader
            title={classroom.name}
            description={
              isTeacherView
                ? "Gerencie a rotina da turma em um único lugar."
                : "Acompanhe mural, atividades e seu progresso nesta turma."
            }
            actions={
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-semibold",
                    classroom.status === "ATIVA"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-600",
                  )}
                >
                  {classroom.status === "ATIVA" ? "Em andamento" : "Encerrada"}
                </span>
                {isTeacherView ? (
                  <button
                    type="button"
                    onClick={copyCode}
                    className="inline-flex items-center gap-2 rounded-lg border border-brand-100 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800"
                  >
                    <span className="font-mono">{classroom.code}</span>
                    {copiedCode ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                ) : null}
              </div>
            }
          />
          <div className="mt-4 flex gap-3 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {classroom.year}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4" />
              {classroom._count?.students ?? members.students.length} alunos
            </span>
          </div>
        </div>
        <div className="overflow-x-auto border-b border-slate-100 px-4">
          <div className="flex min-w-max gap-1 py-2">
            {visibleTabs.map((tab) => {
              const Icon = tabs[tab].icon;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold",
                    selectedTab === tab
                      ? "bg-brand-900 text-white"
                      : "text-slate-600 hover:bg-slate-100",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tabs[tab].label}
                </button>
              );
            })}
          </div>
        </div>
      </SectionCard>
      {selectedTab === "mural" ? (
        <ClassPostsTab
          board={board}
          user={user}
          classId={classroom.id}
          settings={settings.settings}
          onDeletePost={(postId) => setPendingDelete({ type: "post", postId })}
          onDeleteReply={(reply) => setPendingDelete({ type: "reply", reply })}
        />
      ) : null}
      {selectedTab === "activities" ? (
        <ClassActivitiesTab
          isTeacherView={isTeacherView}
          activitiesEnabled={settings.settings?.activitiesEnabled !== false}
          classId={classroom.id}
        />
      ) : null}
      {selectedTab === "students" ? (
        <ClassMembersTab
          students={members.students}
          isLoading={members.isLoading}
          error={members.error}
          onRetry={members.reload}
          onRequestRemove={setStudentToRemove}
          canManage={isTeacherView}
        />
      ) : null}
      {selectedTab === "progress" ? (
        <ClassProgressTab
          isTeacherView={isTeacherView}
          ranking={ranking}
          students={members.students}
          showRanking={
            isTeacherView || settings.settings?.showRankingToStudents !== false
          }
        />
      ) : null}
      {selectedTab === "settings" && isTeacherView ? (
        <ClassSettingsTab
          settings={settings.settings}
          error={settings.error ?? requests.error}
          savingSetting={settings.savingSetting}
          onChange={settings.update}
          requests={requests.requests}
          requestsLoading={requests.isLoading}
          reviewingId={requests.reviewingId}
          onReview={requests.review}
        />
      ) : null}
      <ConfirmAction
        open={Boolean(pendingDelete)}
        title={
          pendingDelete?.type === "post"
            ? "Excluir postagem"
            : "Excluir comentário"
        }
        description="Essa ação não pode ser desfeita."
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        confirmLabel="Confirmar exclusão"
        destructive
        body={
          pendingDelete?.type === "post"
            ? "A postagem e seus comentários serão removidos do mural."
            : "O comentário selecionado será removido da discussão."
        }
      />
      <ConfirmAction
        open={Boolean(studentToRemove)}
        title="Remover aluno"
        description="Essa ação revoga o vínculo do aluno com a turma."
        onClose={() => setStudentToRemove(null)}
        onConfirm={confirmRemove}
        confirmLabel="Remover"
        destructive
        body={
          studentToRemove
            ? `Remover ${studentToRemove.user.name} desta turma?`
            : null
        }
      />
    </div>
  );
};
