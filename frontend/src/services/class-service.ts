import api from '@/lib/api';

export interface Class {
  id: string;
  name: string;
  semester: string;
  year: number;
  code: string;
  status: 'ATIVA' | 'ENCERRADA';
  enrolledAt?: string;
  _count?: {
    students: number;
    activities: number;
  };
}

export interface CreateClassDto {
  name: string;
  semester: string;
  year: number;
}

export interface StudentInClass {
  classId: string;
  studentId: string;
  enrolledAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
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

  joinClass: async (code: string): Promise<{ class: Class }> => {
    const response = await api.post<{ class: Class }>('/classes/join', { code });
    return response.data;
  },

  getStudents: async (classId: string): Promise<StudentInClass[]> => {
    const response = await api.get<StudentInClass[]>(`/classes/${classId}/students`);
    return response.data;
  },

  removeStudent: async (classId: string, userId: string): Promise<void> => {
    await api.delete(`/classes/${classId}/students/${userId}`);
  },
};
