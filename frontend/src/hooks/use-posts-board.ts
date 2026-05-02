import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { classService, type Class } from '@/services/class-service';
import { postsService, type PostDetails, type PostItem, type PostReply } from '@/services/posts-service';
import type { User } from '@/types/auth';

export const getUserInitials = (name?: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'U';
};

export const formatRelativeDate = (dateStr: string) => {
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

export const usePostsBoard = (user: User | null, classId?: string) => {
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
  const isEditingPostRef = useRef(isEditingPost);
  const selectedPostIdRef = useRef(selectedPostId);
  isEditingPostRef.current = isEditingPost;
  selectedPostIdRef.current = selectedPostId;

  const loadPosts = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setIsLoadingPosts(true);
    }
    setError(null);
    try {
      const response = await postsService.list({
        page: 1,
        limit: 30,
        classId: classId || undefined,
      });
      setPosts(response.data);
      const currentSelectedPostId = selectedPostIdRef.current;
      if (response.data.length === 0) {
        setSelectedPost(null);
        setSelectedPostId(null);
      } else if (currentSelectedPostId && !response.data.some((post) => post.id === currentSelectedPostId)) {
        setSelectedPost(null);
        setSelectedPostId(null);
      }
    } catch {
      setError('Não foi possível carregar as postagens.');
    } finally {
      if (!options?.silent) {
        setIsLoadingPosts(false);
      }
    }
  }, [classId]);

  const loadPostDetails = useCallback(async (postId: string) => {
    setIsLoadingPostDetails(true);
    setError(null);
    try {
      const details = await postsService.getById(postId);
      setSelectedPost(details);
      setReplyContent('');
      if (isProfessor && !isEditingPostRef.current) {
        setPostTitle(details.title);
        setPostContent(details.content);
        setPostClassId(details.classId);
      }
    } catch {
      setError('Não foi possível carregar os comentários.');
    } finally {
      setIsLoadingPostDetails(false);
    }
  }, [isProfessor]);

  const loadClasses = useCallback(async () => {
    try {
      const response = isProfessor ? await classService.getAllClasses() : await classService.getMyClasses();
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

  const resetEditor = useCallback(() => {
    setPostTitle('');
    setPostClassId('');
    setPostContent('');
  }, []);

  const startCreatePost = (initialClassId = '') => {
    setIsEditingPost(true);
    setSelectedPostId(null);
    setSelectedPost(null);
    resetEditor();
    setPostClassId(initialClassId || classes[0]?.id || '');
  };

  const startEditPost = (post: PostItem) => {
    setIsEditingPost(true);
    setPostTitle(post.title);
    setPostClassId(post.classId);
    setPostContent(post.content);
  };

  const cancelEdit = () => {
    setIsEditingPost(false);
    if (selectedPost) {
      setPostTitle(selectedPost.title);
      setPostClassId(selectedPost.classId);
      setPostContent(selectedPost.content);
      return;
    }
    resetEditor();
  };

  const handleSavePost = async () => {
    if (!postTitle.trim() || !postContent.trim()) {
      setError('Título e conteúdo são obrigatórios.');
      return;
    }
    if (!postClassId) {
      setError('Selecione uma turma para publicar.');
      return;
    }

    setIsSavingPost(true);
    setError(null);
    try {
      if (selectedPost) {
        await postsService.update(selectedPost.id, {
          title: postTitle,
          content: postContent,
          classId: postClassId,
        });
        setSelectedPostId(selectedPost.id);
      } else {
        const created = await postsService.create({
          title: postTitle,
          content: postContent,
          classId: postClassId,
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
      await loadPosts({ silent: true });
    } catch {
      setError('Não foi possível enviar o comentário.');
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleDeleteReply = async (reply: PostReply) => {
    if (!selectedPost || !user) return;
    if (reply.authorId !== user.id && user.role !== 'ADMIN') return;

    setError(null);
    try {
      await postsService.removeReply(selectedPost.id, reply.id);
      await loadPostDetails(selectedPost.id);
      await loadPosts({ silent: true });
    } catch {
      setError('Não foi possível remover o comentário.');
    }
  };

  const insertTemplate = (template: string) => {
    setPostContent((current) => `${current}${current.endsWith('\n') ? '' : '\n'}${template}`);
  };

  const toggleComments = (postId: string) => {
    setSelectedPostId((current) => (current === postId ? null : postId));
  };

  return {
    posts,
    selectedPostId,
    selectedPost,
    classes,
    isLoadingPosts,
    isLoadingPostDetails,
    isSavingPost,
    isSendingReply,
    error,
    setError,
    isEditingPost,
    postTitle,
    setPostTitle,
    postClassId,
    setPostClassId,
    postContent,
    setPostContent,
    replyContent,
    setReplyContent,
    isProfessor,
    canEditSelectedPost,
    startCreatePost,
    startEditPost,
    cancelEdit,
    handleSavePost,
    handleDeletePost,
    handleCreateReply,
    handleDeleteReply,
    insertTemplate,
    toggleComments,
  };
};
