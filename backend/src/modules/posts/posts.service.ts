import {
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

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  private async validateClassExists(classId?: string) {
    if (!classId) {
      return;
    }
    const classExists = await this.prisma.class.findUnique({
      where: { id: classId },
      select: { id: true },
    });
    if (!classExists) {
      throw new NotFoundException('Turma não encontrada');
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
    classId?: string | null,
  ) {
    if (userRole === 'ADMIN') {
      return;
    }
    if (!classId) {
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

  async create(userId: string, createPostDto: CreatePostDto) {
    await this.validateClassExists(createPostDto.classId);

    return this.prisma.post.create({
      data: {
        title: createPostDto.title,
        content: createPostDto.content,
        classId: createPostDto.classId,
        authorId: userId,
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
  }

  async findAll(userId: string, userRole: 'ADMIN' | 'PROFESSOR' | 'ALUNO', query: QueryPostsDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: {
      classId?: string;
      OR?: Array<{ classId: null } | { classId: { in: string[] } }>;
    } = {};

    if (query.classId) {
      where.classId = query.classId;
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
    } else if (userRole === 'ALUNO') {
      const enrollments = await this.prisma.classStudent.findMany({
        where: { userId },
        select: { classId: true },
      });
      const classIds = enrollments.map((enrollment) => enrollment.classId);
      where.OR = [{ classId: null }, { classId: { in: classIds } }];
    } else if (userRole === 'PROFESSOR') {
      const ownClasses = await this.prisma.class.findMany({
        where: { createdById: userId },
        select: { id: true },
      });
      const classIds = ownClasses.map((c) => c.id);
      where.OR = [{ classId: null }, { classId: { in: classIds } }];
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
      select: { id: true, authorId: true },
    });

    if (!post) {
      throw new NotFoundException('Post não encontrado');
    }

    if (userRole !== 'ADMIN' && post.authorId !== userId) {
      throw new ForbiddenException('Você não pode editar este post');
    }

    await this.validateClassExists(updatePostDto.classId);

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

    return this.prisma.postReply.create({
      data: {
        postId,
        authorId: userId,
        content: createReplyDto.content,
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
}
