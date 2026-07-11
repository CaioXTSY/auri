import api from '@/lib/api';

export type ActivityType = 'TEXT' | 'FILE' | 'QUIZ' | 'CODE';
export type ActivityStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type SubmissionStatus = 'DRAFT' | 'SUBMITTED' | 'LATE' | 'UNDER_REVIEW' | 'GRADED' | 'RETURNED';
export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';

export interface ActivityOption {
  id: string;
  text: string;
  position: number;
  isCorrect?: boolean;
}

export interface ActivityQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  points: number;
  position: number;
  options: ActivityOption[];
}

export interface ActivityFile {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface ActivitySubmission {
  id: string;
  activityId: string;
  userId: string;
  attemptNumber: number;
  status: SubmissionStatus;
  textAnswer?: string | null;
  score?: number | null;
  feedback?: string | null;
  xpAwarded: number;
  submittedAt?: string | null;
  gradedAt?: string | null;
  createdAt: string;
  user?: { id: string; name: string; email: string; avatar?: string | null };
  attachments: ActivityFile[];
  answers: Array<{
    id: string;
    questionId: string;
    selectedOptionId?: string | null;
    textAnswer?: string | null;
    score?: number | null;
    feedback?: string | null;
    question?: ActivityQuestion;
    selectedOption?: ActivityOption | null;
  }>;
}

export interface Activity {
  id: string;
  classId: string;
  createdById: string;
  type: ActivityType;
  status: ActivityStatus;
  title: string;
  description: string;
  maxScore: number;
  xpReward: number;
  dueDate?: string | null;
  allowLateSubmissions: boolean;
  allowResubmission: boolean;
  maxAttempts: number;
  allowedFileTypes?: string[] | null;
  maxFileSize: number;
  maxFiles: number;
  showResultsImmediately: boolean;
  createdAt: string;
  updatedAt: string;
  class?: { id: string; name: string; year: number };
  questions?: ActivityQuestion[];
  materials?: ActivityFile[];
  submissions?: ActivitySubmission[];
  _count?: { submissions: number; questions: number };
}

export interface ActivityPayload {
  classId: string;
  type: ActivityType;
  title: string;
  description: string;
  maxScore: number;
  xpReward: number;
  dueDate: string | null;
  allowLateSubmissions: boolean;
  allowResubmission: boolean;
  maxAttempts: number;
  allowedFileTypes?: string[];
  maxFileSize?: number;
  maxFiles?: number;
  showResultsImmediately?: boolean;
}

interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface ActivityQuestionPayload {
  type: QuestionType;
  prompt: string;
  points: number;
  position: number;
  options?: Array<{ text: string; position: number; isCorrect: boolean }>;
}

const upload = async (url: string, files: File[]) => {
  const form = new FormData();
  files.forEach((file) => form.append('files', file));
  const response = await api.post<ActivityFile[]>(url, form);
  return response.data;
};

const download = async (url: string, fileName: string) => {
  const response = await api.get<Blob>(url, { responseType: 'blob' });
  const objectUrl = URL.createObjectURL(response.data);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
};

export const activityService = {
  listTeacher: async (classId?: string) => {
    const response = await api.get<Paginated<Activity>>('/activities/teacher', { params: { classId, limit: 100 } });
    return response.data;
  },
  listMine: async (classId?: string) => {
    const response = await api.get<Paginated<Activity>>('/activities/my', { params: { classId, limit: 100 } });
    return response.data;
  },
  get: async (id: string) => (await api.get<Activity>(`/activities/${id}`)).data,
  create: async (payload: ActivityPayload) => (await api.post<Activity>('/activities', payload)).data,
  update: async (id: string, payload: Partial<ActivityPayload>) => (await api.patch<Activity>(`/activities/${id}`, payload)).data,
  publish: async (id: string) => (await api.post<Activity>(`/activities/${id}/publish`)).data,
  archive: async (id: string) => (await api.post<Activity>(`/activities/${id}/archive`)).data,
  remove: async (id: string) => api.delete(`/activities/${id}`),
  createQuestion: async (activityId: string, payload: ActivityQuestionPayload) =>
    (await api.post<ActivityQuestion>(`/activities/${activityId}/questions`, payload)).data,
  updateQuestion: async (activityId: string, questionId: string, payload: ActivityQuestionPayload) =>
    (await api.patch<ActivityQuestion>(`/activities/${activityId}/questions/${questionId}`, payload)).data,
  removeQuestion: async (activityId: string, questionId: string) =>
    api.delete(`/activities/${activityId}/questions/${questionId}`),
  uploadMaterials: (activityId: string, files: File[]) => upload(`/activities/${activityId}/materials`, files),
  saveDraft: async (activityId: string, payload: { textAnswer?: string; answers?: Array<{ questionId: string; selectedOptionId?: string; textAnswer?: string }> }) =>
    (await api.post<ActivitySubmission>(`/activities/${activityId}/submissions/draft`, payload)).data,
  submit: async (activityId: string, payload: { textAnswer?: string; answers?: Array<{ questionId: string; selectedOptionId?: string; textAnswer?: string }> }) =>
    (await api.post<ActivitySubmission>(`/activities/${activityId}/submissions/submit`, payload)).data,
  mySubmissions: async (activityId: string) =>
    (await api.get<ActivitySubmission[]>(`/activities/${activityId}/submissions/my`)).data,
  listSubmissions: async (activityId: string) =>
    (await api.get<ActivitySubmission[]>(`/activities/${activityId}/submissions`)).data,
  getSubmission: async (activityId: string, submissionId: string) =>
    (await api.get<ActivitySubmission>(`/activities/${activityId}/submissions/${submissionId}`)).data,
  grade: async (activityId: string, submissionId: string, score: number, feedback: string) =>
    (await api.patch<ActivitySubmission>(`/activities/${activityId}/submissions/${submissionId}/grade`, { score, feedback })).data,
  returnSubmission: async (activityId: string, submissionId: string, feedback: string) =>
    (await api.post<ActivitySubmission>(`/activities/${activityId}/submissions/${submissionId}/return`, { feedback })).data,
  uploadAttachments: (activityId: string, submissionId: string, files: File[]) =>
    upload(`/activities/${activityId}/submissions/${submissionId}/attachments`, files),
  downloadAttachment: (id: string, fileName: string) => download(`/activities/attachments/${id}`, fileName),
  downloadMaterial: (id: string, fileName: string) => download(`/activities/materials/${id}`, fileName),
};
