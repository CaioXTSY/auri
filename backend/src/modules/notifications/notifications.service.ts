import { Injectable, NotFoundException } from '@nestjs/common';
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
  }) {
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
