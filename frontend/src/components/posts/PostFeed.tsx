import { ChevronDown, ChevronUp, Loader2, MessageSquare, Pencil, Send, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { Label } from '@/components/ui/label';
import { MarkdownContent } from '@/components/ui/markdown-content';
import { SectionCard } from '@/components/ui/section-card';
import { Skeleton } from '@/components/ui/skeleton';
import { getAssetUrl } from '@/lib/assets';
import { formatRelativeDate, getUserInitials } from '@/hooks/use-posts-board';
import type { PostDetails, PostItem, PostReply } from '@/services/posts-service';
import type { User } from '@/types/auth';

interface PostFeedProps {
  user: User | null;
  posts: PostItem[];
  selectedPostId: string | null;
  selectedPost: PostDetails | null;
  isProfessor: boolean;
  canEditSelectedPost: boolean;
  isLoadingPosts: boolean;
  isLoadingPostDetails: boolean;
  isSendingReply: boolean;
  replyContent: string;
  onReplyContentChange: (value: string) => void;
  onToggleComments: (postId: string) => void;
  onStartEditPost: (post: PostItem) => void;
  onRequestDeletePost: (postId: string) => void;
  onCreateReply: () => void;
  onRequestDeleteReply: (reply: PostReply) => void;
}

export const PostFeed = ({
  user,
  posts,
  selectedPostId,
  selectedPost,
  isProfessor,
  canEditSelectedPost,
  isLoadingPosts,
  isLoadingPostDetails,
  isSendingReply,
  replyContent,
  onReplyContentChange,
  onToggleComments,
  onStartEditPost,
  onRequestDeletePost,
  onCreateReply,
  onRequestDeleteReply,
}: PostFeedProps) => {
  if (isLoadingPosts) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="h-1.5 bg-slate-200" />
            <div className="space-y-4 p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-5 w-3/4" />
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-2/3" />
              </div>
              <div className="border-t border-slate-100 pt-3">
                <Skeleton className="h-3.5 w-28" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <EmptyState message="Nenhuma postagem ainda." />
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => {
        const isExpanded = selectedPostId === post.id;
        const replyCount = post._count?.replies ?? 0;

        return (
          <SectionCard key={post.id} className="overflow-hidden">
            <div className="h-1.5 bg-brand-900" />
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                    {post.author.avatar ? <img src={getAssetUrl(post.author.avatar) ?? ''} alt={post.author.name} className="h-full w-full object-cover" /> : getUserInitials(post.author.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{post.author.name}</p>
                      {post.class ? (
                        <span className="whitespace-nowrap rounded-full border border-brand-100 bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                          {post.class.name}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">{formatRelativeDate(post.createdAt)}</p>
                  </div>
                </div>

                {isProfessor && isExpanded && selectedPost && canEditSelectedPost ? (
                  <div className="flex flex-shrink-0 gap-1">
                    <button type="button" aria-label="Editar postagem" onClick={() => onStartEditPost(post)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button type="button" aria-label="Excluir postagem" onClick={() => onRequestDeletePost(post.id)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}
              </div>

              <h3 className="mt-4 text-lg font-bold text-brand-900">{post.title}</h3>
              <div className="mt-3 text-sm leading-relaxed text-slate-700">
                <MarkdownContent content={post.content} />
              </div>

              <div className="mt-5 border-t border-slate-100 pt-3">
                <button type="button" onClick={() => onToggleComments(post.id)} className="flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-brand-700">
                  <MessageSquare className="h-4 w-4" />
                  <span>{replyCount === 0 ? 'Nenhum comentário' : `${replyCount} ${replyCount === 1 ? 'comentário' : 'comentários'}`}</span>
                  {isExpanded ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
                </button>
              </div>
            </div>

            {isExpanded ? (
              <div className="space-y-4 border-t border-slate-100 bg-slate-50 px-5 py-4">
                {isLoadingPostDetails ? (
                  <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, index) => (
                      <div key={index} className="flex gap-3">
                        <Skeleton className="mt-0.5 h-8 w-8 rounded-full flex-shrink-0" />
                        <div className="flex-1">
                          <div className="space-y-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-3 w-24" />
                              <Skeleton className="h-3 w-12" />
                            </div>
                            <Skeleton className="h-3.5 w-full" />
                            <Skeleton className="h-3.5 w-4/5" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {selectedPost && selectedPost.replies.length > 0 ? (
                      <div className="space-y-3">
                        {selectedPost.replies.map((reply) => {
                          const canDeleteReply = user?.role === 'ADMIN' || reply.authorId === user?.id;
                          return (
                            <div key={reply.id} className="flex gap-3">
                              <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">
                                {reply.author.avatar ? <img src={getAssetUrl(reply.author.avatar) ?? ''} alt={reply.author.name} className="h-full w-full object-cover" /> : getUserInitials(reply.author.name)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                                  <div className="mb-1.5 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-semibold text-slate-800">{reply.author.name}</span>
                                      <span className="text-[10px] text-slate-400">{formatRelativeDate(reply.createdAt)}</span>
                                    </div>
                                    {canDeleteReply ? (
                                      <button type="button" aria-label="Excluir comentário" onClick={() => onRequestDeleteReply(reply)} className="text-slate-300 transition-colors hover:text-rose-500">
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    ) : null}
                                  </div>
                                  <div className="text-sm text-slate-700">
                                    <MarkdownContent content={reply.content} />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="py-2 text-center text-sm text-slate-400">Seja o primeiro a comentar.</p>
                    )}

                    <div className="flex gap-3 pt-1">
                      <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">
                        {user?.avatar ? <img src={getAssetUrl(user.avatar) ?? ''} alt={user.name} className="h-full w-full object-cover" /> : getUserInitials(user?.name)}
                      </div>
                      <div className="flex flex-1 items-start gap-2">
                        <div className="flex-1">
                          <Label htmlFor={`reply-input-${post.id}`} className="sr-only">Adicionar comentário</Label>
                          <textarea
                            id={`reply-input-${post.id}`}
                            rows={1}
                            className="flex-1 w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
                            value={replyContent}
                            onChange={(event) => onReplyContentChange(event.target.value)}
                            onInput={(event) => {
                              const element = event.currentTarget;
                              element.style.height = 'auto';
                              element.style.height = `${element.scrollHeight}px`;
                            }}
                            placeholder="Adicionar comentário..."
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' && !event.shiftKey) {
                                event.preventDefault();
                                onCreateReply();
                              }
                            }}
                          />
                        </div>
                        <button type="button" aria-label="Enviar comentário" onClick={onCreateReply} disabled={!replyContent.trim() || isSendingReply} className="mt-0.5 flex-shrink-0 rounded-xl bg-brand-900 p-2.5 text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50">
                          {isSendingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </SectionCard>
        );
      })}
    </div>
  );
};
