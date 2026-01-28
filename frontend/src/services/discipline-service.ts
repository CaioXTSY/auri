import api from '@/lib/api';

export interface Discipline {
  id: string;
  name: string;
  description?: string;
  language: string;
  status: string;
}

export interface CreateDisciplineDto {
  name: string;
  description?: string;
  language: string;
}

export const disciplineService = {
  getAllDisciplines: async (): Promise<Discipline[]> => {
    const response = await api.get<{ data: Discipline[] }>('/disciplines');
    return response.data.data;
  },

  getMyDisciplines: async (): Promise<Discipline[]> => {
    const response = await api.get<{ data: Discipline[] }>('/disciplines/my-disciplines');
    return response.data.data;
  },

  createDiscipline: async (data: CreateDisciplineDto): Promise<Discipline> => {
    const response = await api.post<Discipline>('/disciplines', data);
    return response.data;
  },
};
