import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreatePostDto,
  CreatePostReplyDto,
  QueryPostsDto,
  UpdatePostDto,
  UpdatePostReplyDto,
} from './dto';
import { ModerationStatus, NotificationType, Role } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async validateClassExists(classId: string) {
    const classExists = await this.prisma.class.findUnique({
      where: { id: classId },
      select: { id: true },
    });
    if (!classExists) {
      throw new NotFoundException('Turma não encontrada');
    }
  }

  private async validatePostTargetClassAccess(
    userId: string,
    userRole: 'ADMIN' | 'PROFESSOR' | 'ALUNO',
    classId?: string,
  ) {
    if (!classId) {
      throw new BadRequestException('Selecione uma turma para publicar');
    }

    await this.validateClassExists(classId);

    if (userRole === 'ADMIN') {
      return;
    }

    if (userRole === 'PROFESSOR') {
      const ownClass = await this.prisma.class.findFirst({
        where: { id: classId, createdById: userId },
        select: { id: true },
      });

      if (!ownClass) {
        throw new ForbiddenException('Você não tem acesso aos posts desta turma');
      }
      return;
    }

    const [enrolled, settings] = await Promise.all([
      this.isStudentEnrolled(userId, classId),
      this.getClassSettings(classId),
    ]);

    if (!enrolled) {
      throw new ForbiddenException('Você não tem acesso aos posts desta turma');
    }

    if (!settings.allowStudentPosts) {
      throw new ForbiddenException('Alunos não podem criar postagens nesta turma');
    }
  }

  private async isStudentEnrolled(userId: string, classId: string) {
    const enrollment = await this.prisma.classStudent.findUnique({
      where: {
        classId_userId: {
          classId,
          userId,
        },
      },
      select: {
        classId: true,
      },
    });
    return Boolean(enrollment);
  }

  private async ensureCanReadPost(
    userId: string,
    userRole: 'ADMIN' | 'PROFESSOR' | 'ALUNO',
    classId: string,
  ) {
    if (userRole === 'ADMIN') {
      return;
    }
    if (userRole === 'PROFESSOR') {
      const ownClass = await this.prisma.class.findFirst({
        where: { id: classId, createdById: userId },
        select: { id: true },
      });
      if (!ownClass) {
        throw new ForbiddenException('Você não tem acesso a este post');
      }
      return;
    }
    const enrolled = await this.isStudentEnrolled(userId, classId);
    if (!enrolled) {
      throw new ForbiddenException('Você não tem acesso a este post');
    }
  }

  async create(
    userId: string,
    userRole: 'ADMIN' | 'PROFESSOR' | 'ALUNO',
    createPostDto: CreatePostDto,
  ) {
    await this.validatePostTargetClassAccess(
      userId,
      userRole,
      createPostDto.classId,
    );
    const settings = await this.getClassSettings(createPostDto.classId);
    const status =
      userRole === Role.ALUNO && settings.requirePostApproval
        ? ModerationStatus.PENDING
        : ModerationStatus.APPROVED;

    const post = await this.prisma.post.create({
      data: {
        title: createPostDto.title,
        content: createPostDto.content,
        classId: createPostDto.classId,
        authorId: userId,
        status,
      },
      include: {
        class: {
          select: { id: true, name: true },
        },
        author: {
          select: { id: true, name: true, role: true, avatar: true },
        },
        _count: {
          select: { replies: true },
        },
      },
    });

    if (post.status === ModerationStatus.APPROVED) {
      await this.notifyClassStudentsAboutPost(post);
    }

    return post;
  }

  private async notifyClassStudentsAboutPost(post: {
    id: string;
    title: string;
    classId: string;
    class: { name: string };
    author: { name: string };
  }) {
    const students = await this.prisma.classStudent.findMany({
      where: { classId: post.classId },
      select: { userId: true },
    });

    await this.notificationsService.createNotificationsForUsers({
      userIds: students.map((student) => student.userId),
      type: NotificationType.SISTEMA,
      title: `Nova postagem em ${post.class.name}`,
      message: `${post.author.name} publicou: ${post.title}`,
    });
  }

  async findAll(userId: string, userRole: 'ADMIN' | 'PROFESSOR' | 'ALUNO', query: QueryPostsDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.classId) {
      if (userRole === 'ALUNO') {
        const enrolled = await this.isStudentEnrolled(userId, query.classId);
        if (!enrolled) {
          throw new ForbiddenException('Você não tem acesso aos posts desta turma');
        }
      } else if (userRole === 'PROFESSOR') {
        const ownClass = await this.prisma.class.findFirst({
          where: { id: query.classId, createdById: userId },
          select: { id: true },
        });
        if (!ownClass) {
          throw new ForbiddenException('Você não tem acesso aos posts desta turma');
        }
      }
      where.classId = query.classId;
    } else if (userRole === 'ALUNO') {
      const enrollments = await this.prisma.classStudent.findMany({
        where: { userId },
        select: { classId: true },
      });
      const classIds = enrollments.map((enrollment) => enrollment.classId);
      where.classId = { in: classIds };
    } else if (userRole === 'PROFESSOR') {
      const ownClasses = await this.prisma.class.findMany({
        where: { createdById: userId },
        select: { id: true },
      });
      const classIds = ownClasses.map((c) => c.id);
      where.classId = { in: classIds };
    }

    if (userRole === 'ALUNO') {
      where.OR = [
        { status: ModerationStatus.APPROVED },
        { authorId: userId },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          class: {
            select: { id: true, name: true },
          },
          author: {
            select: { id: true, name: true, role: true, avatar: true },
          },
          _count: {
            select: { replies: true },
          },
        },
      }),
      this.prisma.post.count({ where }),
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

  async findOne(userId: string, userRole: 'ADMIN' | 'PROFESSOR' | 'ALUNO', id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        class: {
          select: { id: true, name: true },
        },
        author: {
          select: { id: true, name: true, role: true, avatar: true },
        },
        replies: {
          where: userRole === 'ALUNO'
            ? {
                OR: [
                  { status: ModerationStatus.APPROVED },
                  { authorId: userId },
                ],
              }
            : undefined,
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: { id: true, name: true, role: true, avatar: true },
            },
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post não encontrado');
    }

    await this.ensureCanReadPost(userId, userRole, post.classId);
    if (
      userRole === 'ALUNO' &&
      post.status !== ModerationStatus.APPROVED &&
      post.authorId !== userId
    ) {
      throw new ForbiddenException('Você não tem acesso a este post');
    }

    return post;
  }

  async update(
    userId: string,
    userRole: 'ADMIN' | 'PROFESSOR' | 'ALUNO',
    id: string,
    updatePostDto: UpdatePostDto,
  ) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      select: { id: true, authorId: true, classId: true },
    });

    if (!post) {
      throw new NotFoundException('Post não encontrado');
    }

    if (userRole !== 'ADMIN' && post.authorId !== userId) {
      throw new ForbiddenException('Você não pode editar este post');
    }

    await this.validatePostTargetClassAccess(
      userId,
      userRole,
      updatePostDto.classId ?? post.classId,
    );

    return this.prisma.post.update({
      where: { id },
      data: updatePostDto,
      include: {
        class: {
          select: { id: true, name: true },
        },
        author: {
          select: { id: true, name: true, role: true, avatar: true },
        },
        _count: {
          select: { replies: true },
        },
      },
    });
  }

  async remove(userId: string, userRole: 'ADMIN' | 'PROFESSOR' | 'ALUNO', id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      select: { id: true, authorId: true },
    });

    if (!post) {
      throw new NotFoundException('Post não encontrado');
    }

    if (userRole !== 'ADMIN' && post.authorId !== userId) {
      throw new ForbiddenException('Você não pode remover este post');
    }

    await this.prisma.post.delete({ where: { id } });
    return { message: 'Post removido com sucesso' };
  }

  async createReply(
    userId: string,
    userRole: 'ADMIN' | 'PROFESSOR' | 'ALUNO',
    postId: string,
    createReplyDto: CreatePostReplyDto,
  ) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, classId: true },
    });
    if (!post) {
      throw new NotFoundException('Post não encontrado');
    }

    await this.ensureCanReadPost(userId, userRole, post.classId);
    if (userRole === 'ALUNO') {
      const settings = await this.getClassSettings(post.classId);
      if (!settings.allowStudentReplies) {
        throw new ForbiddenException('Alunos não podem responder postagens nesta turma');
      }
    }
    const settings = await this.getClassSettings(post.classId);
    const status =
      userRole === Role.ALUNO && settings.requireReplyApproval
        ? ModerationStatus.PENDING
        : ModerationStatus.APPROVED;

    return this.prisma.postReply.create({
      data: {
        postId,
        authorId: userId,
        content: createReplyDto.content,
        status,
      },
      include: {
        author: {
          select: { id: true, name: true, role: true, avatar: true },
        },
      },
    });
  }

  async updateReply(
    userId: string,
    userRole: 'ADMIN' | 'PROFESSOR' | 'ALUNO',
    postId: string,
    replyId: string,
    updateReplyDto: UpdatePostReplyDto,
  ) {
    const reply = await this.prisma.postReply.findUnique({
      where: { id: replyId },
      select: { id: true, postId: true, authorId: true },
    });

    if (!reply || reply.postId !== postId) {
      throw new NotFoundException('Resposta não encontrada');
    }

    if (userRole !== 'ADMIN' && reply.authorId !== userId) {
      throw new ForbiddenException('Você não pode editar esta resposta');
    }

    return this.prisma.postReply.update({
      where: { id: replyId },
      data: { content: updateReplyDto.content },
      include: {
        author: {
          select: { id: true, name: true, role: true, avatar: true },
        },
      },
    });
  }

  async removeReply(
    userId: string,
    userRole: 'ADMIN' | 'PROFESSOR' | 'ALUNO',
    postId: string,
    replyId: string,
  ) {
    const reply = await this.prisma.postReply.findUnique({
      where: { id: replyId },
      select: { id: true, postId: true, authorId: true },
    });

    if (!reply || reply.postId !== postId) {
      throw new NotFoundException('Resposta não encontrada');
    }

    if (userRole !== 'ADMIN' && reply.authorId !== userId) {
      throw new ForbiddenException('Você não pode remover esta resposta');
    }

    await this.prisma.postReply.delete({
      where: { id: replyId },
    });

    return { message: 'Resposta removida com sucesso' };
  }

  async reviewPost(
    userId: string,
    userRole: 'ADMIN' | 'PROFESSOR' | 'ALUNO',
    postId: string,
    action: 'approve' | 'reject',
  ) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        class: { select: { id: true, name: true, createdById: true } },
        author: { select: { name: true } },
      },
    });

    if (!post) {
      throw new NotFoundException('Post não encontrado');
    }

    await this.ensureCanModerateClass(userId, userRole, post.classId);

    const updated = await this.prisma.post.update({
      where: { id: post.id },
      data: {
        status: action === 'approve' ? ModerationStatus.APPROVED : ModerationStatus.REJECTED,
      },
      include: {
        class: { select: { id: true, name: true } },
        author: { select: { id: true, name: true, role: true, avatar: true } },
        _count: { select: { replies: true } },
      },
    });

    if (updated.status === ModerationStatus.APPROVED) {
      await this.notifyClassStudentsAboutPost({
        id: updated.id,
        title: updated.title,
        classId: updated.classId,
        class: updated.class,
        author: updated.author,
      });
    }

    return updated;
  }

  async reviewReply(
    userId: string,
    userRole: 'ADMIN' | 'PROFESSOR' | 'ALUNO',
    postId: string,
    replyId: string,
    action: 'approve' | 'reject',
  ) {
    const reply = await this.prisma.postReply.findUnique({
      where: { id: replyId },
      include: {
        post: { select: { id: true, classId: true } },
        author: { select: { id: true, name: true, role: true, avatar: true } },
      },
    });

    if (!reply || reply.postId !== postId) {
      throw new NotFoundException('Resposta não encontrada');
    }

    await this.ensureCanModerateClass(userId, userRole, reply.post.classId);

    return this.prisma.postReply.update({
      where: { id: reply.id },
      data: {
        status: action === 'approve' ? ModerationStatus.APPROVED : ModerationStatus.REJECTED,
      },
      include: {
        author: {
          select: { id: true, name: true, role: true, avatar: true },
        },
      },
    });
  }

  private async getClassSettings(classId: string) {
    return this.prisma.classSettings.upsert({
      where: { classId },
      update: {},
      create: { classId },
    });
  }

  private async ensureCanModerateClass(
    userId: string,
    userRole: 'ADMIN' | 'PROFESSOR' | 'ALUNO',
    classId: string,
  ) {
    if (userRole === 'ADMIN') {
      return;
    }

    if (userRole !== 'PROFESSOR') {
      throw new ForbiddenException('Você não pode moderar esta turma');
    }

    const ownClass = await this.prisma.class.findFirst({
      where: { id: classId, createdById: userId },
      select: { id: true },
    });

    if (!ownClass) {
      throw new ForbiddenException('Você não pode moderar esta turma');
    }
  }
}
