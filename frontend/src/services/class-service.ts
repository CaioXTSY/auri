import api from '@/lib/api';

export interface Discipline {
  id: string;
  name: string;
  description?: string;
  language: string;
  status: string;
}

export interface Class {
  id: string;
  disciplineId: string;
  name: string;
  semester: string;
  year: number;
  code: string;
  status: 'ATIVA' | 'ENCERRADA';
  discipline: Discipline;
  enrolledAt?: string;
  _count?: {
    students: number;
    activities: number;
  };
}

export interface CreateClassDto {
  disciplineId: string;
  name: string;
  semester: string;
  year: number;
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

  joinClass: async (code: string): Promise<void> => {
    await api.post('/classes/join', { code });
  },
};
