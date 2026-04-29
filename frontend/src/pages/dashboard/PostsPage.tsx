import { useState } from 'react';
import { Plus } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { ConfirmAction } from '@/components/ui/confirm-action';
import { ErrorState } from '@/components/ui/error-state';
import { PageHeader } from '@/components/ui/page-header';
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
      <div className="mx-auto max-w-5xl space-y-5 pb-10">
        <PageHeader
          title="Mural da Turma"
          description="Postagens e comunicados"
          actions={board.isProfessor && !board.isEditingPost ? (
            <Button type="button" className="bg-brand-900 text-white hover:bg-brand-800" onClick={board.startCreatePost}>
              <Plus className="mr-2 h-4 w-4" />
              Nova postagem
            </Button>
          ) : null}
        />

        {board.error ? <ErrorState message={board.error} /> : null}

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

      <ConfirmAction
        open={Boolean(pendingDelete)}
        title={pendingDelete?.type === 'post' ? 'Excluir postagem' : 'Excluir comentário'}
        description="Essa ação não pode ser desfeita."
        onClose={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
        confirmLabel="Confirmar exclusão"
        destructive
        body={pendingDelete?.type === 'post'
            ? 'A postagem e o contexto visível no mural serão removidos.'
            : 'O comentário selecionado será removido da discussão.'}
      />
    </DashboardLayout>
  );
};
