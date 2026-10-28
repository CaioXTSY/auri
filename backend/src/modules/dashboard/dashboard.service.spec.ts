import { Role } from '@prisma/client';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { MissionsService } from '../missions/missions.service';

describe('Teacher dashboard', () => {
  const prisma = {
    class: { findMany: jest.fn() },
    activitySubmission: { findMany: jest.fn() },
    codeSubmission: { findMany: jest.fn() },
  };
  const service = new DashboardService(
    prisma as unknown as PrismaService,
    {} as GamificationService,
    {} as MissionsService,
  );
  const classroom = {
    id: 'class-1', name: 'Algoritmos', year: 2026, status: 'ATIVA',
    _count: { students: 32, activities: 10, programmingAssignments: 2 },
  };
  const academic = (id: string, status = 'SUBMITTED', gradedById: string | null = null) => ({
    id, status, gradedById, submittedAt: new Date('2026-10-15T11:00:00Z'),
    user: { name: 'Maria Santos' },
    activity: { id: 'activity-1', title: 'Lista 03', class: { name: 'Algoritmos' } },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-10-15T12:00:00Z'));
    prisma.class.findMany.mockResolvedValue([classroom]);
    prisma.activitySubmission.findMany.mockResolvedValue([]);
    prisma.codeSubmission.findMany.mockResolvedValue([]);
  });

  afterEach(() => jest.useRealTimers());

  it('limits every query to the teacher and excludes drafts and practice runs', async () => {
    await service.getTeacherDashboard('teacher-1');
    expect(prisma.class.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { createdById: 'teacher-1' },
      select: expect.objectContaining({
        _count: { select: {
          students: { where: { user: { role: Role.ALUNO } } },
          activities: true, programmingAssignments: true,
        } },
      }),
    }));
    expect(prisma.activitySubmission.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        activity: { class: { createdById: 'teacher-1' } },
        submittedAt: { gte: new Date('2026-10-14T12:00:00Z') },
        status: { not: 'DRAFT' },
      },
      take: 5,
    }));
    expect(prisma.codeSubmission.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        assignment: { class: { createdById: 'teacher-1' } },
        mode: 'SUBMIT',
        createdAt: { gte: new Date('2026-10-14T12:00:00Z') },
      },
      take: 5,
    }));
  });

  it('counts all classes, enrollments and both activity types without list pagination', async () => {
    prisma.class.findMany.mockResolvedValue([
      ...Array.from({ length: 12 }, (_, index) => ({ ...classroom, id: String(index) })),
      { ...classroom, id: 'closed', status: 'ENCERRADA', _count: { students: 2, activities: 1, programmingAssignments: 0 } },
    ]);
    const result = await service.getTeacherDashboard('teacher-1');
    expect(result.totals).toEqual({ classes: 13, activeClasses: 12, students: 386 });
    expect(result.classes[0].activityCount).toBe(12);
    expect(result.classes[12].activityCount).toBe(1);
    expect(result.recentSubmissions).toEqual([]);
  });

  it('merges the five newest deliveries and distinguishes manual, automatic and pending grades', async () => {
    prisma.activitySubmission.findMany.mockResolvedValue([
      academic('a', 'GRADED', 'teacher-1'),
      academic('b', 'GRADED'),
      academic('c'),
      academic('d', 'RETURNED'),
      { ...academic('old'), submittedAt: new Date('2026-10-15T10:00:00Z') },
    ]);
    prisma.codeSubmission.findMany.mockResolvedValue([{
      id: 'code-1', status: 'ACCEPTED', createdAt: new Date('2026-10-15T11:30:00Z'),
      user: { name: 'João Lima' },
      assignment: { id: 'assignment-1', title: 'Soma', class: { name: 'Algoritmos' } },
    }]);
    const { recentSubmissions } = await service.getTeacherDashboard('teacher-1');
    expect(recentSubmissions.map(({ id, status }) => ({ id, status }))).toEqual([
      { id: 'code-1', status: 'AUTOMATIC' },
      { id: 'a', status: 'GRADED' },
      { id: 'b', status: 'AUTOMATIC' },
      { id: 'c', status: 'PENDING_REVIEW' },
      { id: 'd', status: 'RETURNED' },
    ]);
    expect(recentSubmissions[0]).toMatchObject({ kind: 'CODE', activityId: 'assignment-1' });
    expect(recentSubmissions[1]).toMatchObject({ kind: 'ACTIVITY', activityId: 'activity-1' });
  });

  it('exposes the aggregate only to the professor role', () => {
    expect(Reflect.getMetadata('roles', DashboardController.prototype.getTeacherDashboard))
      .toEqual([Role.PROFESSOR]);
  });
});
