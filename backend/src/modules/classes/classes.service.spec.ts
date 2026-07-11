import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { ClassesService } from './classes.service';

describe('ClassesService.remove', () => {
  const prisma = {
    class: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };
  const gamificationService = {};
  const service = new ClassesService(
    prisma as unknown as PrismaService,
    gamificationService as GamificationService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('impede que professor remova qualquer turma', async () => {
    await expect(service.remove('class-id', Role.PROFESSOR)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.class.findUnique).not.toHaveBeenCalled();
    expect(prisma.class.delete).not.toHaveBeenCalled();
  });

  it('permite que administrador remova uma turma existente', async () => {
    prisma.class.findUnique.mockResolvedValue({ id: 'class-id' });
    prisma.class.delete.mockResolvedValue({ id: 'class-id' });

    await expect(service.remove('class-id', Role.ADMIN)).resolves.toBeUndefined();
    expect(prisma.class.delete).toHaveBeenCalledWith({ where: { id: 'class-id' } });
  });

  it('retorna not found quando a turma nao existe', async () => {
    prisma.class.findUnique.mockResolvedValue(null);

    await expect(service.remove('missing-id', Role.ADMIN)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.class.delete).not.toHaveBeenCalled();
  });
});
