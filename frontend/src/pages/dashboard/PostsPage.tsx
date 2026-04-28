import { useState } from 'react';
import { Plus } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { ModalDialog } from '@/components/ui/modal-dialog';
import { PostEditor } from '@/components/posts/PostEditor';
import { PostFeed } from '@/components/posts/PostFeed';
import { usePostsBoard } from '@/hooks/use-posts-board';
import type { PostReply } from '@/services/posts-service';
import { useAuthStore } from '@/stores/auth-store';

export const PostsPage = () => {
  const user = useAuthStore((state) => state.user);
  const board = usePostsBoard(user);
  const [pendingDelete, setPendingDelete] = useState<
    | { type: 'post'; postId: string }
    | { type: 'reply'; reply: PostReply }
    | null
  >(null);

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;

    if (pendingDelete.type === 'post') {
      await board.handleDeletePost(pendingDelete.postId);
    } else {
      await board.handleDeleteReply(pendingDelete.reply);
    }

    setPendingDelete(null);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-5 pb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-brand-900">Mural da Turma</h1>
            <p className="mt-0.5 text-sm text-slate-500">Postagens e comunicados</p>
          </div>
          {board.isProfessor && !board.isEditingPost ? (
            <Button type="button" className="bg-brand-900 text-white hover:bg-brand-800" onClick={board.startCreatePost}>
              <Plus className="mr-2 h-4 w-4" />
              Nova postagem
            </Button>
          ) : null}
        </div>

        {board.error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {board.error}
          </div>
        ) : null}

        {board.isProfessor && board.isEditingPost ? (
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
          replyContent={board.replyContent}
          onReplyContentChange={board.setReplyContent}
          onToggleComments={board.toggleComments}
          onStartEditPost={board.startEditPost}
          onRequestDeletePost={(postId) => setPendingDelete({ type: 'post', postId })}
          onCreateReply={board.handleCreateReply}
          onRequestDeleteReply={(reply) => setPendingDelete({ type: 'reply', reply })}
        />
      </div>

      <ModalDialog
        open={Boolean(pendingDelete)}
        title={pendingDelete?.type === 'post' ? 'Excluir postagem' : 'Excluir comentário'}
        description="Essa ação não pode ser desfeita."
        onClose={() => setPendingDelete(null)}
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setPendingDelete(null)}>
              Cancelar
            </Button>
            <Button type="button" className="bg-rose-600 text-white hover:bg-rose-700" onClick={handleConfirmDelete}>
              Confirmar exclusão
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          {pendingDelete?.type === 'post'
            ? 'A postagem e o contexto visível no mural serão removidos.'
            : 'O comentário selecionado será removido da discussão.'}
        </p>
      </ModalDialog>
    </DashboardLayout>
  );
};
