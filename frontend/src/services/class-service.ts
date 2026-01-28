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
  status: 'ATIVA' | 'ENCERRADA';
  discipline: Discipline;
  enrolledAt?: string;
  _count?: {
    students: number;
    activities: number;
  };
}

export const classService = {
  getMyClasses: async (): Promise<Class[]> => {
    const response = await api.get<Class[]>('/classes/my-classes');
    return response.data;
  },

  getClassDetails: async (id: string): Promise<Class> => {
    const response = await api.get<Class>(`/classes/${id}`);
    return response.data;
  },
};
