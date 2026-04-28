import type { User } from '@/types/auth';

export const getAppEntryPath = (role?: User['role'] | null) => {
  if (role === 'ADMIN') return '/admin';
  return '/dashboard';
};
