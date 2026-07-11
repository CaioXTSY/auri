import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ActivityType, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ActivitiesService } from './activities.service';

describe('ActivitiesService authorization', () => {
  const prisma = {
    class: { findUnique: jest.fn() },
    activity: { create: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn() },
    activitySubmission: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  };
  const notifications = {
    createNotification: jest.fn(),
    createNotificationsForUsers: jest.fn(),
  };
  const gamification = {};
  const service = new ActivitiesService(
    prisma as unknown as PrismaService,
    notifications as unknown as NotificationsService,
    gamification as GamificationService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('blocks a professor from creating an activity in another teacher class', async () => {
    prisma.class.findUnique.mockResolvedValue({ id: 'class-1', createdById: 'teacher-2' });

    await expect(
      service.create(
        {
          classId: 'class-1',
          type: ActivityType.TEXT,
          title: 'Activity',
          description: 'Description',
        },
        { id: 'teacher-1', role: Role.PROFESSOR },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.activity.create).not.toHaveBeenCalled();
  });

  it('hides an activity from a student who is not enrolled', async () => {
    prisma.activity.findFirst.mockResolvedValue(null);

    await expect(
      service.findOne('activity-1', { id: 'student-1', role: Role.ALUNO }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('blocks a professor from viewing another teacher submission', async () => {
    prisma.activitySubmission.findUnique.mockResolvedValue({
      id: 'submission-1',
      userId: 'student-1',
      activity: { class: { createdById: 'teacher-2' } },
    });

    await expect(
      service.findSubmission('submission-1', { id: 'teacher-1', role: Role.PROFESSOR }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a grade above the activity maximum', async () => {
    prisma.activitySubmission.findUnique.mockResolvedValue({
      id: 'submission-1',
      userId: 'student-1',
      xpAwarded: 0,
      activity: {
        id: 'activity-1',
        title: 'Activity',
        maxScore: 10,
        xpReward: 50,
        classId: 'class-1',
        class: { createdById: 'teacher-1' },
      },
    });

    await expect(
      service.gradeSubmission(
        'submission-1',
        { score: 11 },
        { id: 'teacher-1', role: Role.PROFESSOR },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
