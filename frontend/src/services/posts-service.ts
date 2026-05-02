import api from '@/lib/api';

export interface PostAuthor {
  id: string;
  name: string;
  role: 'ADMIN' | 'PROFESSOR' | 'ALUNO';
  avatar?: string | null;
}

export interface PostClassInfo {
  id: string;
  name: string;
}

export interface PostReply {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  author: PostAuthor;
}

export interface PostItem {
  id: string;
  classId: string;
  authorId: string;
  title: string;
  content: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  class: PostClassInfo;
  author: PostAuthor;
  _count?: {
    replies: number;
  };
}

export interface PostDetails extends PostItem {
  replies: PostReply[];
}

export interface PaginatedPosts {
  data: PostItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreatePostDto {
  title: string;
  content: string;
  classId: string;
}

export interface UpdatePostDto {
  title?: string;
  content?: string;
  classId?: string;
}

export interface CreatePostReplyDto {
  content: string;
}

export const postsService = {
  list: async (params?: { page?: number; limit?: number; classId?: string }) => {
    const response = await api.get<PaginatedPosts>('/posts', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<PostDetails>(`/posts/${id}`);
    return response.data;
  },

  create: async (payload: CreatePostDto) => {
    const response = await api.post<PostItem>('/posts', payload);
    return response.data;
  },

  update: async (id: string, payload: UpdatePostDto) => {
    const response = await api.patch<PostItem>(`/posts/${id}`, payload);
    return response.data;
  },

  remove: async (id: string) => {
    const response = await api.delete<{ message: string }>(`/posts/${id}`);
    return response.data;
  },

  createReply: async (postId: string, payload: CreatePostReplyDto) => {
    const response = await api.post<PostReply>(`/posts/${postId}/replies`, payload);
    return response.data;
  },

  updateReply: async (postId: string, replyId: string, payload: CreatePostReplyDto) => {
    const response = await api.patch<PostReply>(
      `/posts/${postId}/replies/${replyId}`,
      payload,
    );
    return response.data;
  },

  removeReply: async (postId: string, replyId: string) => {
    const response = await api.delete<{ message: string }>(`/posts/${postId}/replies/${replyId}`);
    return response.data;
  },

  approvePost: async (id: string) => {
    const response = await api.patch<PostItem>(`/posts/${id}/approve`);
    return response.data;
  },

  rejectPost: async (id: string) => {
    const response = await api.patch<PostItem>(`/posts/${id}/reject`);
    return response.data;
  },

  approveReply: async (postId: string, replyId: string) => {
    const response = await api.patch<PostReply>(`/posts/${postId}/replies/${replyId}/approve`);
    return response.data;
  },

  rejectReply: async (postId: string, replyId: string) => {
    const response = await api.patch<PostReply>(`/posts/${postId}/replies/${replyId}/reject`);
    return response.data;
  },
};
