import { Role } from '@prisma/client';
import { Request } from 'express';

export type AuthenticatedRequest = Request & {
  user: {
    id: string;
    role: Role;
    email?: string;
  };
};
