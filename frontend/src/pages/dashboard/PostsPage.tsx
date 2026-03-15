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
import { Eye, Loader2, MessageSquare, Pencil, Plus, Send, Trash2 } from 'lucide-react';

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
      setSelectedPostId((currentPostId) =>
        !currentPostId && response.data.length > 0 ? response.data[0].id : currentPostId,
      );
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
      setError('Não foi possível carregar os detalhes da postagem.');
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

  const startEditPost = () => {
    if (!selectedPost) return;
    setIsEditingPost(true);
    setPostTitle(selectedPost.title);
    setPostClassId(selectedPost.classId || '');
    setPostContent(selectedPost.content);
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
      if (selectedPostId) {
        await loadPostDetails(selectedPostId);
      }
    } catch {
      setError('Não foi possível salvar a postagem.');
    } finally {
      setIsSavingPost(false);
    }
  };

  const handleDeletePost = async () => {
    if (!selectedPost) return;
    const shouldDelete = window.confirm('Deseja remover esta postagem?');
    if (!shouldDelete) return;

    setError(null);
    try {
      await postsService.remove(selectedPost.id);
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
      setError('Não foi possível enviar a resposta.');
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleDeleteReply = async (reply: PostReply) => {
    if (!selectedPost || !user) return;
    if (reply.authorId !== user.id && user.role !== 'ADMIN') return;
    const shouldDelete = window.confirm('Deseja remover esta resposta?');
    if (!shouldDelete) return;

    setError(null);
    try {
      await postsService.removeReply(selectedPost.id, reply.id);
      await loadPostDetails(selectedPost.id);
      await loadPosts();
    } catch {
      setError('Não foi possível remover a resposta.');
    }
  };

  const insertTemplate = (template: string) => {
    setPostContent((current) => `${current}${current.endsWith('\n') ? '' : '\n'}${template}`);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-[1360px] grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <section className="bg-white rounded-2xl shadow-sm p-4 space-y-4 lg:sticky lg:top-4 h-fit">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Comunidade da turma
              </p>
              <h2 className="mt-1 text-lg font-display font-bold text-brand-900">Postagens</h2>
            </div>
            {isProfessor && (
              <Button type="button" className="bg-brand-900 hover:bg-brand-800 text-white rounded-full" onClick={startCreatePost}>
                <Plus className="h-4 w-4 mr-2" />
                Novo
              </Button>
            )}
          </div>

          {isLoadingPosts ? (
            <div className="py-8 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-brand-700" />
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 px-3 py-6 text-sm text-slate-500 text-center">
              Nenhuma postagem encontrada.
            </div>
          ) : (
            <div className="space-y-2 max-h-[680px] overflow-y-auto pr-1">
              {posts.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => {
                    setIsEditingPost(false);
                    setSelectedPostId(post.id);
                  }}
                  className={`w-full text-left rounded-xl p-3 transition-all ${
                    selectedPostId === post.id
                      ? 'bg-brand-50 shadow-sm'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm text-slate-900 line-clamp-2">{post.title}</p>
                    <span className="text-[10px] font-semibold uppercase rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                      {post.class?.name || 'Geral'}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 flex items-center gap-2">
                    <span>{post.author.name}</span>
                    <span>•</span>
                    <span>{post._count?.replies || 0} respostas</span>
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          {isProfessor && isEditingPost && (
            <div className="space-y-5">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Modo criador</p>
                <h3 className="mt-1 text-xl font-display font-bold text-brand-900">
                  {selectedPost ? 'Editar postagem' : 'Criar nova postagem'}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Escreva em markdown e veja a prévia no estilo feed.
                </p>
              </div>

              <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Título
                  </label>
                  <input
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    value={postTitle}
                    onChange={(event) => setPostTitle(event.target.value)}
                    placeholder="Ex: Aviso da semana"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Turma
                  </label>
                  <select
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    value={postClassId}
                    onChange={(event) => setPostClassId(event.target.value)}
                  >
                    <option value="">Todas as turmas</option>
                    {classes.map((classItem) => (
                      <option key={classItem.id} value={classItem.id}>
                        {classItem.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button type="button" className="text-xs rounded-full bg-white px-3 py-1 hover:bg-slate-100" onClick={() => insertTemplate('\n# Título')}>
                  H1
                </button>
                <button type="button" className="text-xs rounded-full bg-white px-3 py-1 hover:bg-slate-100" onClick={() => insertTemplate('\n## Subtítulo')}>
                  H2
                </button>
                <button type="button" className="text-xs rounded-full bg-white px-3 py-1 hover:bg-slate-100" onClick={() => insertTemplate('\n- Item 1\n- Item 2')}>
                  Lista
                </button>
                <button type="button" className="text-xs rounded-full bg-white px-3 py-1 hover:bg-slate-100" onClick={() => insertTemplate('\n```python\nprint("hello")\n```')}>
                  Código
                </button>
                <button type="button" className="text-xs rounded-full bg-white px-3 py-1 hover:bg-slate-100" onClick={() => insertTemplate('\n> Aviso importante para a turma')}>
                  Citação
                </button>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Editor Markdown
                  </label>
                  <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                    <Editor
                      height="360px"
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

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    Pré-visualização
                  </p>
                  <div className="rounded-xl bg-slate-50 p-4 min-h-[360px]">
                    <article className="rounded-xl bg-white p-4 shadow-sm">
                      <h4 className="text-lg font-bold text-slate-900">{postTitle || 'Sem título'}</h4>
                      <p className="mt-1 text-xs text-slate-500">
                        {user?.name || 'Professor'} • {postClassId ? classes.find((classItem) => classItem.id === postClassId)?.name : 'Todas as turmas'}
                      </p>
                      <div className="mt-4 text-sm text-slate-700">
                        <MarkdownContent content={postContent || 'Comece a escrever para visualizar o markdown...'} />
                      </div>
                    </article>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={cancelEdit} className="rounded-full">
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="bg-brand-900 hover:bg-brand-800 text-white rounded-full"
                  onClick={handleSavePost}
                  disabled={isSavingPost}
                >
                  {isSavingPost ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar postagem'
                  )}
                </Button>
              </div>
            </div>
          )}

          {!isEditingPost && (
            <>
              {!selectedPostId && (
                <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-slate-500">
                  Selecione uma postagem para visualizar.
                </div>
              )}

              {selectedPostId && isLoadingPostDetails && (
                <div className="py-10 flex items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-brand-700" />
                </div>
              )}

              {selectedPost && !isLoadingPostDetails && (
                <div className="space-y-5">
                  <article className="rounded-xl bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          {selectedPost.class?.name || 'Comunicado geral'}
                        </p>
                        <h3 className="text-2xl font-display font-bold text-brand-900 mt-1">{selectedPost.title}</h3>
                        <p className="text-xs text-slate-500 mt-1">
                          enviado por {selectedPost.author.name}
                        </p>
                      </div>
                      {isProfessor && canEditSelectedPost && (
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" onClick={startEditPost}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                          <Button type="button" variant="outline" onClick={handleDeletePost}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remover
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700 mt-4">
                      <MarkdownContent content={selectedPost.content} />
                    </div>
                  </article>

                  <div className="pt-2 border-t border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-[0.14em]">
                        Respostas ({selectedPost.replies.length})
                      </h4>
                    </div>

                    {selectedPost.replies.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">
                        Ainda não há respostas.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedPost.replies.map((reply) => {
                          const canDeleteReply = user?.role === 'ADMIN' || reply.authorId === user?.id;
                          return (
                            <div key={reply.id} className="rounded-lg p-3 bg-slate-50">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-slate-500">
                                  <span className="font-semibold text-slate-700">{reply.author.name}</span>{' '}
                                  • {new Date(reply.createdAt).toLocaleString('pt-BR')}
                                </p>
                                {canDeleteReply && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteReply(reply)}
                                    className="text-slate-400 hover:text-rose-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                              <div className="text-sm text-slate-700">
                                <MarkdownContent content={reply.content} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="rounded-lg p-3 space-y-2 bg-slate-50">
                      <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Responder em markdown
                      </label>
                      <textarea
                        className="w-full min-h-[120px] rounded-md border border-slate-300 px-3 py-2 text-sm"
                        value={replyContent}
                        onChange={(event) => setReplyContent(event.target.value)}
                        placeholder="Digite sua resposta em markdown..."
                      />
                      <div className="flex justify-between items-center gap-2">
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <MessageSquare className="h-3.5 w-3.5" />
                          Suporta markdown e blocos de código
                        </div>
                        <Button
                          type="button"
                          className="bg-brand-900 hover:bg-brand-800 text-white"
                          onClick={handleCreateReply}
                          disabled={!replyContent.trim() || isSendingReply}
                        >
                          {isSendingReply ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Responder
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
};
