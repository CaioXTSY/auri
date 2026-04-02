import { useCallback, useEffect, useMemo, useState } from 'react';
import Editor from '@monaco-editor/react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { MarkdownContent } from '@/components/ui/markdown-content';
import { classService, type Class } from '@/services/class-service';
import {
  postsService,
  type PostDetails,
  type PostItem,
  type PostReply,
} from '@/services/posts-service';
import { useAuthStore } from '@/stores/auth-store';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronDown, ChevronUp, Eye, Loader2, MessageSquare, Pencil, Plus, Send, Trash2, X } from 'lucide-react';

const getUserInitials = (name?: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'U';
};

const formatRelativeDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);
  if (diffMin < 1) return 'agora mesmo';
  if (diffMin < 60) return `há ${diffMin} min`;
  if (diffH < 24) return `há ${diffH}h`;
  if (diffD === 1) return 'ontem';
  if (diffD < 7) return `há ${diffD} dias`;
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
};

export const PostsPage = () => {
  const user = useAuthStore((state) => state.user);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<PostDetails | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isLoadingPostDetails, setIsLoadingPostDetails] = useState(false);
  const [isSavingPost, setIsSavingPost] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isEditingPost, setIsEditingPost] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postClassId, setPostClassId] = useState<string>('');
  const [postContent, setPostContent] = useState('');
  const [replyContent, setReplyContent] = useState('');

  const isProfessor = user?.role === 'PROFESSOR' || user?.role === 'ADMIN';

  const loadPosts = useCallback(async () => {
    setIsLoadingPosts(true);
    setError(null);
    try {
      const response = await postsService.list({ page: 1, limit: 30 });
      setPosts(response.data);
      if (response.data.length === 0) {
        setSelectedPost(null);
        setSelectedPostId(null);
      }
    } catch {
      setError('Não foi possível carregar as postagens.');
    } finally {
      setIsLoadingPosts(false);
    }
  }, []);

  const loadPostDetails = useCallback(async (postId: string) => {
    setIsLoadingPostDetails(true);
    setError(null);
    try {
      const details = await postsService.getById(postId);
      setSelectedPost(details);
      setReplyContent('');
      if (isProfessor && !isEditingPost) {
        setPostTitle(details.title);
        setPostContent(details.content);
        setPostClassId(details.classId || '');
      }
    } catch {
      setError('Não foi possível carregar os comentários.');
    } finally {
      setIsLoadingPostDetails(false);
    }
  }, [isEditingPost, isProfessor]);

  const loadClasses = useCallback(async () => {
    try {
      const response = isProfessor
        ? await classService.getAllClasses()
        : await classService.getMyClasses();
      setClasses(response);
    } catch {
      setClasses([]);
    }
  }, [isProfessor]);

  useEffect(() => {
    loadPosts();
    loadClasses();
  }, [loadClasses, loadPosts]);

  useEffect(() => {
    if (selectedPostId) {
      loadPostDetails(selectedPostId);
    } else {
      setSelectedPost(null);
    }
  }, [loadPostDetails, selectedPostId]);

  const canEditSelectedPost = useMemo(() => {
    if (!selectedPost || !user) return false;
    if (user.role === 'ADMIN') return true;
    return selectedPost.authorId === user.id;
  }, [selectedPost, user]);

  const startCreatePost = () => {
    setIsEditingPost(true);
    setSelectedPostId(null);
    setSelectedPost(null);
    setPostTitle('');
    setPostClassId('');
    setPostContent('');
  };

  const startEditPost = (post: PostItem) => {
    setIsEditingPost(true);
    setPostTitle(post.title);
    setPostClassId(post.classId || '');
    setPostContent(post.content);
  };

  const cancelEdit = () => {
    setIsEditingPost(false);
    if (selectedPost) {
      setPostTitle(selectedPost.title);
      setPostClassId(selectedPost.classId || '');
      setPostContent(selectedPost.content);
    }
  };

  const handleSavePost = async () => {
    if (!postTitle.trim() || !postContent.trim()) {
      setError('Título e conteúdo são obrigatórios.');
      return;
    }
    setIsSavingPost(true);
    setError(null);
    try {
      if (selectedPost) {
        await postsService.update(selectedPost.id, {
          title: postTitle,
          content: postContent,
          classId: postClassId || undefined,
        });
        setSelectedPostId(selectedPost.id);
      } else {
        const created = await postsService.create({
          title: postTitle,
          content: postContent,
          classId: postClassId || undefined,
        });
        setSelectedPostId(created.id);
      }
      setIsEditingPost(false);
      await loadPosts();
    } catch {
      setError('Não foi possível salvar a postagem.');
    } finally {
      setIsSavingPost(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    const shouldDelete = window.confirm('Deseja remover esta postagem?');
    if (!shouldDelete) return;
    setError(null);
    try {
      await postsService.remove(postId);
      setSelectedPost(null);
      setSelectedPostId(null);
      await loadPosts();
    } catch {
      setError('Não foi possível remover a postagem.');
    }
  };

  const handleCreateReply = async () => {
    if (!selectedPost || !replyContent.trim()) return;
    setIsSendingReply(true);
    setError(null);
    try {
      await postsService.createReply(selectedPost.id, { content: replyContent });
      setReplyContent('');
      await loadPostDetails(selectedPost.id);
      await loadPosts();
    } catch {
      setError('Não foi possível enviar o comentário.');
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleDeleteReply = async (reply: PostReply) => {
    if (!selectedPost || !user) return;
    if (reply.authorId !== user.id && user.role !== 'ADMIN') return;
    const shouldDelete = window.confirm('Deseja remover este comentário?');
    if (!shouldDelete) return;
    setError(null);
    try {
      await postsService.removeReply(selectedPost.id, reply.id);
      await loadPostDetails(selectedPost.id);
      await loadPosts();
    } catch {
      setError('Não foi possível remover o comentário.');
    }
  };

  const insertTemplate = (template: string) => {
    setPostContent((current) => `${current}${current.endsWith('\n') ? '' : '\n'}${template}`);
  };

  const toggleComments = (postId: string) => {
    if (selectedPostId === postId) {
      setSelectedPostId(null);
    } else {
      setSelectedPostId(postId);
    }
  };

  const markdownHelpers = [
    { label: 'H1', template: '\n# Título' },
    { label: 'H2', template: '\n## Subtítulo' },
    { label: 'Lista', template: '\n- Item 1\n- Item 2' },
    { label: 'Código', template: '\n```python\nprint("hello")\n```' },
    { label: 'Citação', template: '\n> Aviso importante' },
  ];

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-5 pb-10">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-brand-900">Mural da Turma</h1>
            <p className="text-sm text-slate-500 mt-0.5">Postagens e comunicados</p>
          </div>
          {isProfessor && !isEditingPost && (
            <Button
              type="button"
              className="bg-brand-900 hover:bg-brand-800 text-white"
              onClick={startCreatePost}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova postagem
            </Button>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* Editor card */}
        {isProfessor && isEditingPost && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className={`h-1.5 ${selectedPost ? 'bg-amber-400' : 'bg-brand-900'}`} />
            <div className="p-5 space-y-5">
              {/* Editor header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold overflow-hidden flex-shrink-0">
                    {user?.avatar
                      ? <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                      : getUserInitials(user?.name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                    <p className="text-xs text-slate-400">{selectedPost ? 'Editando postagem' : 'Nova postagem'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Title + Class */}
              <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="Título da postagem"
                />
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-200"
                  value={postClassId}
                  onChange={(e) => setPostClassId(e.target.value)}
                >
                  <option value="">Todas as turmas</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Markdown helpers */}
              <div className="flex flex-wrap gap-1.5">
                {markdownHelpers.map(({ label, template }) => (
                  <button
                    key={label}
                    type="button"
                    className="text-xs rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 hover:bg-slate-100 text-slate-600 transition-colors"
                    onClick={() => insertTemplate(template)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Editor + Preview */}
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Editor</p>
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <Editor
                      height="300px"
                      language="markdown"
                      theme="vs"
                      value={postContent}
                      onChange={(value) => setPostContent(value || '')}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: 'off',
                        wordWrap: 'on',
                        automaticLayout: true,
                        padding: { top: 12, bottom: 12 },
                        scrollBeyondLastLine: false,
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Prévia
                  </p>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 min-h-[300px] text-sm text-slate-700 overflow-auto">
                    <MarkdownContent content={postContent || '*Comece a escrever para visualizar...*'} />
                  </div>
                </div>
              </div>

              {/* Save / Cancel */}
              <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="bg-brand-900 hover:bg-brand-800 text-white"
                  onClick={handleSavePost}
                  disabled={isSavingPost}
                >
                  {isSavingPost
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</>
                    : 'Publicar'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Feed */}
        {isLoadingPosts ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="h-1.5 bg-slate-200" />
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                    <div className="space-y-2 flex-1">
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
                  <div className="pt-3 border-t border-slate-100">
                    <Skeleton className="h-3.5 w-28" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center text-slate-500">
            Nenhuma postagem ainda.
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => {
              const isExpanded = selectedPostId === post.id;
              const replyCount = post._count?.replies ?? 0;

              return (
                <div
                  key={post.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
                >
                  {/* Top color bar */}
                  <div className="h-1.5 bg-brand-900" />

                  <div className="p-5">
                    {/* Author row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold overflow-hidden flex-shrink-0">
                          {post.author.avatar
                            ? <img src={post.author.avatar} alt={post.author.name} className="h-full w-full object-cover" />
                            : getUserInitials(post.author.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center flex-wrap gap-2">
                            <p className="text-sm font-semibold text-slate-900">{post.author.name}</p>
                            {post.class && (
                              <span className="text-[10px] font-semibold rounded-full bg-brand-50 text-brand-700 border border-brand-100 px-2 py-0.5 whitespace-nowrap">
                                {post.class.name}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{formatRelativeDate(post.createdAt)}</p>
                        </div>
                      </div>

                      {/* Edit / Delete — only show when post is selected and user can edit */}
                      {isProfessor && isExpanded && selectedPost && canEditSelectedPost && (
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditPost(post)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePost(post.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="mt-4 text-lg font-bold text-brand-900">{post.title}</h3>

                    {/* Content */}
                    <div className="mt-3 text-sm text-slate-700 leading-relaxed">
                      <MarkdownContent content={post.content} />
                    </div>

                    {/* Comments toggle */}
                    <div className="mt-5 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => toggleComments(post.id)}
                        className="flex items-center gap-2 text-sm text-slate-500 hover:text-brand-700 transition-colors"
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span>{replyCount === 0 ? 'Nenhum comentário' : `${replyCount} ${replyCount === 1 ? 'comentário' : 'comentários'}`}</span>
                        {isExpanded
                          ? <ChevronUp className="h-4 w-4 ml-1" />
                          : <ChevronDown className="h-4 w-4 ml-1" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded comments section */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 space-y-4">
                      {isLoadingPostDetails ? (
                        <div className="space-y-3">
                          {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} className="flex gap-3">
                              <Skeleton className="h-8 w-8 rounded-full flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <div className="bg-white rounded-xl px-4 py-3 border border-slate-200 space-y-2">
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
                          {/* Replies list */}
                          {selectedPost && selectedPost.replies.length > 0 ? (
                            <div className="space-y-3">
                              {selectedPost.replies.map((reply) => {
                                const canDeleteReply = user?.role === 'ADMIN' || reply.authorId === user?.id;
                                return (
                                  <div key={reply.id} className="flex gap-3">
                                    <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold overflow-hidden flex-shrink-0 mt-0.5">
                                      {reply.author.avatar
                                        ? <img src={reply.author.avatar} alt={reply.author.name} className="h-full w-full object-cover" />
                                        : getUserInitials(reply.author.name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="bg-white rounded-xl px-4 py-3 border border-slate-200">
                                        <div className="flex items-center justify-between gap-2 mb-1.5">
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold text-slate-800">{reply.author.name}</span>
                                            <span className="text-[10px] text-slate-400">{formatRelativeDate(reply.createdAt)}</span>
                                          </div>
                                          {canDeleteReply && (
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteReply(reply)}
                                              className="text-slate-300 hover:text-rose-500 transition-colors"
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                          )}
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
                            !isLoadingPostDetails && (
                              <p className="text-sm text-slate-400 text-center py-2">Seja o primeiro a comentar.</p>
                            )
                          )}

                          {/* Reply input */}
                          <div className="flex gap-3 pt-1">
                            <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold overflow-hidden flex-shrink-0 mt-1">
                              {user?.avatar
                                ? <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                                : getUserInitials(user?.name)}
                            </div>
                            <div className="flex-1 flex items-start gap-2">
                              <textarea
                                rows={1}
                                className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-200 resize-none"
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                onInput={(e) => {
                                  const el = e.currentTarget;
                                  el.style.height = 'auto';
                                  el.style.height = `${el.scrollHeight}px`;
                                }}
                                placeholder="Adicionar comentário..."
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleCreateReply();
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={handleCreateReply}
                                disabled={!replyContent.trim() || isSendingReply}
                                className="mt-0.5 p-2.5 rounded-xl bg-brand-900 hover:bg-brand-800 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                              >
                                {isSendingReply
                                  ? <Loader2 className="h-4 w-4 animate-spin" />
                                  : <Send className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
