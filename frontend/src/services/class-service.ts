import api from '@/lib/api';

export interface Class {
  id: string;
  name: string;
  year: number;
  code: string;
  status: 'ATIVA' | 'ENCERRADA';
  enrolledAt?: string;
  settings?: ClassSettings | null;
  _count?: {
    students: number;
    activities: number;
  };
}

export interface CreateClassDto {
  name: string;
  year: number;
  settings?: UpdateClassSettingsPayload;
}

export interface StudentInClass {
  classId: string;
  studentId: string;
  enrolledAt: string;
  membershipType?: 'OWNER' | 'STUDENT';
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: 'ADMIN' | 'PROFESSOR' | 'ALUNO';
  };
}

export interface ClassSettings {
  id: string;
  classId: string;
  allowStudentPosts: boolean;
  allowStudentReplies: boolean;
  requirePostApproval: boolean;
  requireReplyApproval: boolean;
  allowJoinByCode: boolean;
  requireJoinApproval: boolean;
  lockEnrollment: boolean;
  activitiesEnabled: boolean;
  allowLateSubmissions: boolean;
  showRankingToStudents: boolean;
}

export type UpdateClassSettingsPayload = Partial<
  Pick<
    ClassSettings,
    | 'allowStudentPosts'
    | 'allowStudentReplies'
    | 'requirePostApproval'
    | 'requireReplyApproval'
    | 'allowJoinByCode'
    | 'requireJoinApproval'
    | 'lockEnrollment'
    | 'activitiesEnabled'
    | 'allowLateSubmissions'
    | 'showRankingToStudents'
  >
>;

export interface ClassJoinRequest {
  id: string;
  classId: string;
  userId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
    role: 'ADMIN' | 'PROFESSOR' | 'ALUNO';
  };
}

export const classService = {
  getAllClasses: async (): Promise<Class[]> => {
    const response = await api.get<{ data: Class[] }>('/classes');
    return response.data.data;
  },

  createClass: async (data: CreateClassDto): Promise<Class> => {
    const response = await api.post<Class>('/classes', data);
    return response.data;
  },

  getMyClasses: async (): Promise<Class[]> => {
    const response = await api.get<Class[]>('/classes/my-classes');
    return response.data;
  },

  getClassDetails: async (id: string): Promise<Class> => {
    const response = await api.get<Class>(`/classes/${id}`);
    return response.data;
  },

  joinClass: async (code: string): Promise<{ class: Class; status?: 'PENDING_APPROVAL' }> => {
    const response = await api.post<{ class: Class; status?: 'PENDING_APPROVAL' }>('/classes/join', { code });
    return response.data;
  },

  getStudents: async (classId: string): Promise<StudentInClass[]> => {
    const response = await api.get<StudentInClass[]>(`/classes/${classId}/students`);
    return response.data;
  },

  removeStudent: async (classId: string, userId: string): Promise<void> => {
    await api.delete(`/classes/${classId}/students/${userId}`);
  },

  getSettings: async (classId: string): Promise<ClassSettings> => {
    const response = await api.get<ClassSettings>(`/classes/${classId}/settings`);
    return response.data;
  },

  updateSettings: async (
    classId: string,
    payload: UpdateClassSettingsPayload,
  ): Promise<ClassSettings> => {
    const response = await api.patch<ClassSettings>(`/classes/${classId}/settings`, payload);
    return response.data;
  },

  getJoinRequests: async (classId: string): Promise<ClassJoinRequest[]> => {
    const response = await api.get<ClassJoinRequest[]>(`/classes/${classId}/join-requests`);
    return response.data;
  },

  approveJoinRequest: async (classId: string, requestId: string): Promise<void> => {
    await api.post(`/classes/${classId}/join-requests/${requestId}/approve`);
  },

  rejectJoinRequest: async (classId: string, requestId: string): Promise<void> => {
    await api.post(`/classes/${classId}/join-requests/${requestId}/reject`);
  },
};
