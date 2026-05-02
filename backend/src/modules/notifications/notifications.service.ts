import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType, Role } from '@prisma/client';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
  ) {}

  async getNotifications(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, read: false },
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notificação não encontrada');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    return { message: 'Notificações marcadas como lidas' };
  }

  async deleteNotification(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notificação não encontrada');
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    return { message: 'Notificação removida' };
  }

  async createNotification(input: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
  }, actor?: {
    id: string;
    role: Role;
  }) {
    if (actor) {
      await this.ensureCanCreateNotification(actor, input.userId);
    }

    const notification = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
      },
    });

    this.gateway.emitToUser(input.userId, notification);

    return notification;
  }

  async createNotificationsForUsers(input: {
    userIds: string[];
    type: NotificationType;
    title: string;
    message: string;
  }) {
    const uniqueUserIds = Array.from(new Set(input.userIds));

    if (uniqueUserIds.length === 0) {
      return { count: 0 };
    }

    const now = new Date();

    await this.prisma.notification.createMany({
      data: uniqueUserIds.map((userId) => ({
        userId,
        type: input.type,
        title: input.title,
        message: input.message,
        createdAt: now,
      })),
    });

    for (const userId of uniqueUserIds) {
      this.gateway.emitToUser(userId, {
        type: input.type,
        title: input.title,
        message: input.message,
        createdAt: now,
        read: false,
      });
    }

    return { count: uniqueUserIds.length };
  }

  private async ensureCanCreateNotification(
    actor: { id: string; role: Role },
    recipientUserId: string,
  ) {
    if (actor.role === Role.ADMIN) {
      const recipient = await this.prisma.user.findUnique({
        where: { id: recipientUserId },
        select: { id: true },
      });

      if (!recipient) {
        throw new NotFoundException('Usuário destinatário não encontrado');
      }
      return;
    }

    if (actor.role !== Role.PROFESSOR) {
      throw new ForbiddenException('Sem permissão para criar notificação');
    }

    const enrollmentInOwnClass = await this.prisma.classStudent.findFirst({
      where: {
        userId: recipientUserId,
        user: { role: Role.ALUNO },
        class: { createdById: actor.id },
      },
      select: { userId: true },
    });

    if (!enrollmentInOwnClass) {
      throw new ForbiddenException(
        'Professor só pode notificar alunos matriculados em suas turmas',
      );
    }
  }

  async createBroadcast(input: {
    type: NotificationType;
    title: string;
    message: string;
    targetRole?: Role;
  }) {
    const users = await this.prisma.user.findMany({
      where: input.targetRole ? { role: input.targetRole } : undefined,
      select: { id: true },
    });

    if (users.length === 0) {
      return { count: 0 };
    }

    const now = new Date();
    await this.prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        type: input.type,
        title: input.title,
        message: input.message,
        createdAt: now,
      })),
    });

    for (const u of users) {
      this.gateway.emitToUser(u.id, {
        type: input.type,
        title: input.title,
        message: input.message,
        createdAt: now,
        read: false,
      });
    }

    return { count: users.length };
  }
}
