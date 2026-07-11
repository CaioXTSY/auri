import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import {
  CreateClassDto,
  UpdateClassDto,
  EnrollStudentDto,
  QueryClassesDto,
  PaginatedClassesDto,
  UpdateClassSettingsDto,
} from './dto';
import { Class, JoinRequestStatus, Role } from '@prisma/client';

@Injectable()
export class ClassesService {
  constructor(
    private prisma: PrismaService,
    private gamificationService: GamificationService,
  ) {}

  async findByCode(code: string): Promise<any> {
    const classEntity = await this.prisma.class.findUnique({
      where: { code },
      include: {
        settings: true,
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    if (!classEntity) {
      throw new NotFoundException('Turma não encontrada');
    }

    return classEntity;
  }

  async joinClass(code: string, userId: string): Promise<any> {
    const classEntity = await this.findByCode(code);
    const settings = classEntity.settings ?? await this.getOrCreateSettings(classEntity.id);

    if (classEntity.status !== 'ATIVA') {
      throw new BadRequestException('Não é possível entrar em uma turma encerrada');
    }

    if (settings.lockEnrollment) {
      throw new BadRequestException('Novas matrículas estão bloqueadas nesta turma');
    }

    if (!settings.allowJoinByCode) {
      throw new BadRequestException('Entrada por código está desativada nesta turma');
    }

    const existingEnrollment = await this.prisma.classStudent.findUnique({
      where: {
        classId_userId: {
          classId: classEntity.id,
          userId,
        },
      },
    });

    if (existingEnrollment) {
      throw new ConflictException('Você já está matriculado nesta turma');
    }

    if (settings.requireJoinApproval) {
      const request = await this.prisma.classJoinRequest.upsert({
        where: {
          classId_userId: {
            classId: classEntity.id,
            userId,
          },
        },
        update: {
          status: JoinRequestStatus.PENDING,
          reviewedAt: null,
          reviewedById: null,
        },
        create: {
          classId: classEntity.id,
          userId,
        },
        include: {
          class: {
            include: {
              createdBy: {
                select: { id: true, name: true },
              },
              _count: {
                select: {
                  students: true,
                },
              },
            },
          },
        },
      });

      return {
        status: 'PENDING_APPROVAL',
        request,
        class: request.class,
      };
    }

    const enrollment = await this.prisma.classStudent.create({
      data: {
        classId: classEntity.id,
        userId,
      },
      include: {
        class: {
          include: {
            _count: {
              select: {
                students: true,
              },
            },
          },
        },
      },
    });

    await this.gamificationService.checkClassJoinAchievements(userId);

    return enrollment;
  }

  async create(createClassDto: CreateClassDto, createdById: string): Promise<Class> {
    const { settings, ...classData } = createClassDto;

    return this.prisma.class.create({
      data: {
        ...classData,
        createdById,
        settings: {
          create: settings ?? {},
        },
      },
      include: {
        settings: true,
        _count: {
          select: {
            students: true,
          },
        },
      },
    });
  }

  async findAll(
    query?: QueryClassesDto,
    userId?: string,
    userRole?: Role,
  ): Promise<PaginatedClassesDto<Class>> {
    const {
      page = 1,
      limit = 10,
      name,
      year,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query || {};

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (name) {
      where.name = {
        contains: name,
      };
    }

    if (year) {
      where.year = Number(year);
    }

    if (status) {
      where.status = status;
    }

    if (userRole === Role.PROFESSOR && userId) {
      where.createdById = userId;
    }

    if (userRole === Role.ALUNO && userId) {
      where.students = {
        some: { userId },
      };
    }

    const [classes, total] = await Promise.all([
      this.prisma.class.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          settings: true,
          _count: {
            select: {
              students: true,
            },
          },
        },
      }),
      this.prisma.class.count({ where }),
    ]);

    return new PaginatedClassesDto(classes, total, pageNum, limitNum);
  }

  async findOne(id: string, userId?: string, userRole?: Role): Promise<Class> {
    const classEntity = await this.prisma.class.findUnique({
      where: { id },
      include: {
        settings: true,
        students: {
          select: {
            enrolledAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            enrolledAt: 'asc',
          },
        },
      },
    });

    if (!classEntity) {
      throw new NotFoundException('Turma não encontrada');
    }

    if (userRole === Role.PROFESSOR && userId && classEntity.createdById !== userId) {
      throw new ForbiddenException('Você não tem acesso a esta turma');
    }

    if (
      userRole === Role.ALUNO &&
      userId &&
      !classEntity.students.some((student) => student.user.id === userId)
    ) {
      throw new ForbiddenException('Você não tem acesso a esta turma');
    }

    return classEntity;
  }

  async getSettings(classId: string, userId?: string, userRole?: Role) {
    await this.ensureCanAccessClass(classId, userId, userRole);
    return this.getOrCreateSettings(classId);
  }

  async updateSettings(
    classId: string,
    dto: UpdateClassSettingsDto,
    userId?: string,
    userRole?: Role,
  ) {
    await this.ensureCanManageClass(classId, userId, userRole);
    await this.getOrCreateSettings(classId);

    return this.prisma.classSettings.update({
      where: { classId },
      data: dto,
    });
  }

  async listJoinRequests(classId: string, userId?: string, userRole?: Role) {
    await this.ensureCanManageClass(classId, userId, userRole);

    return this.prisma.classJoinRequest.findMany({
      where: { classId, status: JoinRequestStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
    });
  }

  async reviewJoinRequest(
    classId: string,
    requestId: string,
    action: 'approve' | 'reject',
    reviewerId?: string,
    reviewerRole?: Role,
  ) {
    await this.ensureCanManageClass(classId, reviewerId, reviewerRole);

    const request = await this.prisma.classJoinRequest.findFirst({
      where: { id: requestId, classId },
      include: {
        user: {
          select: { id: true, role: true },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Solicitação não encontrada');
    }

    if (request.status !== JoinRequestStatus.PENDING) {
      throw new BadRequestException('Solicitação já revisada');
    }

    if (action === 'reject') {
      return this.prisma.classJoinRequest.update({
        where: { id: request.id },
        data: {
          status: JoinRequestStatus.REJECTED,
          reviewedAt: new Date(),
          reviewedById: reviewerId,
        },
      });
    }

    if (request.user.role !== Role.ALUNO) {
      throw new BadRequestException('Apenas alunos podem entrar em turmas');
    }

    await this.prisma.$transaction([
      this.prisma.classStudent.upsert({
        where: {
          classId_userId: {
            classId,
            userId: request.userId,
          },
        },
        update: {},
        create: {
          classId,
          userId: request.userId,
        },
      }),
      this.prisma.classJoinRequest.update({
        where: { id: request.id },
        data: {
          status: JoinRequestStatus.APPROVED,
          reviewedAt: new Date(),
          reviewedById: reviewerId,
        },
      }),
    ]);

    await this.gamificationService.checkClassJoinAchievements(request.userId);

    return { message: 'Solicitação aprovada' };
  }

  async findStudentsByClass(classId: string, userId?: string, userRole?: Role) {
    const classEntity = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    if (!classEntity) {
      throw new NotFoundException('Turma não encontrada');
    }

    if (userRole === Role.PROFESSOR && userId && classEntity.createdById !== userId) {
      throw new ForbiddenException('Você não tem acesso a esta turma');
    }

    if (userRole === Role.ALUNO && userId) {
      const enrollment = await this.prisma.classStudent.findUnique({
        where: {
          classId_userId: {
            classId,
            userId,
          },
        },
        select: { classId: true },
      });

      if (!enrollment) {
        throw new ForbiddenException('Você não tem acesso a esta turma');
      }
    }

    const students = await this.prisma.classStudent.findMany({
      where: { classId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
      orderBy: {
        enrolledAt: 'asc',
      },
    });

    if (!classEntity.createdBy) {
      return students;
    }

    return [
      {
        classId,
        studentId: classEntity.createdBy.id,
        enrolledAt: classEntity.createdAt,
        user: classEntity.createdBy,
        membershipType: 'OWNER',
      },
      ...students.map((student) => ({
        ...student,
        membershipType: 'STUDENT',
      })),
    ];
  }

  async update(id: string, updateClassDto: UpdateClassDto, userId?: string, userRole?: Role): Promise<Class> {
    const classEntity = await this.prisma.class.findUnique({ where: { id } });
    if (!classEntity) {
      throw new NotFoundException('Turma não encontrada');
    }

    if (userRole === Role.PROFESSOR && userId && classEntity.createdById !== userId) {
      throw new ForbiddenException('Você não pode editar esta turma');
    }

    const { settings, ...classData } = updateClassDto;

    if (settings) {
      await this.getOrCreateSettings(id);
      await this.prisma.classSettings.update({
        where: { classId: id },
        data: settings,
      });
    }

    return this.prisma.class.update({
      where: { id },
      data: classData,
      include: {
        settings: true,
        _count: {
          select: {
            students: true,
          },
        },
      },
    });
  }

  async remove(id: string, userRole: Role): Promise<void> {
    if (userRole !== Role.ADMIN) {
      throw new ForbiddenException('Apenas administradores podem remover turmas');
    }

    const classEntity = await this.prisma.class.findUnique({ where: { id } });
    if (!classEntity) {
      throw new NotFoundException('Turma não encontrada');
    }

    await this.prisma.class.delete({
      where: { id },
    });
  }

  async enrollStudent(
    classId: string,
    enrollStudentDto: EnrollStudentDto,
    userId?: string,
    userRole?: Role,
  ): Promise<any> {
    const classEntity = await this.prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classEntity) {
      throw new NotFoundException('Turma não encontrada');
    }

    if (userRole === Role.PROFESSOR && userId && classEntity.createdById !== userId) {
      throw new ForbiddenException('Você não pode matricular alunos nesta turma');
    }

    if (classEntity.status !== 'ATIVA') {
      throw new BadRequestException(
        'Não é possível matricular aluno em turma encerrada',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: enrollStudentDto.userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (user.role !== 'ALUNO') {
      throw new BadRequestException(
        'Apenas usuários com role ALUNO podem ser matriculados',
      );
    }

    const existingEnrollment = await this.prisma.classStudent.findUnique({
      where: {
        classId_userId: {
          classId,
          userId: enrollStudentDto.userId,
        },
      },
    });

    if (existingEnrollment) {
      throw new ConflictException('Aluno já matriculado nesta turma');
    }

    const enrollment = await this.prisma.classStudent.create({
      data: {
        classId,
        userId: enrollStudentDto.userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            year: true,
          },
        },
      },
    });

    return enrollment;
  }

  async unenrollStudent(classId: string, studentUserId: string, userId?: string, userRole?: Role): Promise<void> {
    const classEntity = await this.prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classEntity) {
      throw new NotFoundException('Turma não encontrada');
    }

    if (userRole === Role.PROFESSOR && userId && classEntity.createdById !== userId) {
      throw new ForbiddenException('Você não pode remover alunos desta turma');
    }

    const enrollment = await this.prisma.classStudent.findUnique({
      where: {
        classId_userId: {
          classId,
          userId: studentUserId,
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Aluno não está matriculado nesta turma');
    }

    await this.prisma.classStudent.delete({
      where: {
        classId_userId: {
          classId,
          userId: studentUserId,
        },
      },
    });
  }

  async getMyClasses(userId: string): Promise<any[]> {
    const enrollments = await this.prisma.classStudent.findMany({
      where: { userId },
      include: {
        class: {
          include: {
            _count: {
              select: {
                students: true,
              },
            },
          },
        },
      },
      orderBy: {
        enrolledAt: 'desc',
      },
    });

    return enrollments.map((enrollment) => ({
      ...enrollment.class,
      enrolledAt: enrollment.enrolledAt,
    }));
  }

  async getMyJoinRequests(userId: string) {
    return this.prisma.classJoinRequest.findMany({
      where: { userId, status: JoinRequestStatus.PENDING },
      orderBy: { createdAt: 'desc' },
      include: {
        class: {
          include: {
            createdBy: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });
  }

  async getMyCreatedClasses(userId: string): Promise<any[]> {
    return this.prisma.class.findMany({
      where: { createdById: userId },
      include: {
        _count: {
          select: { students: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async getOrCreateSettings(classId: string) {
    return this.prisma.classSettings.upsert({
      where: { classId },
      update: {},
      create: { classId },
    });
  }

  private async ensureCanAccessClass(classId: string, userId?: string, userRole?: Role) {
    const classEntity = await this.prisma.class.findUnique({
      where: { id: classId },
      select: {
        id: true,
        createdById: true,
        students: userRole === Role.ALUNO && userId
          ? {
              where: { userId },
              select: { userId: true },
            }
          : false,
      },
    });

    if (!classEntity) {
      throw new NotFoundException('Turma não encontrada');
    }

    if (userRole === Role.ADMIN) {
      return classEntity;
    }

    if (userRole === Role.PROFESSOR && classEntity.createdById === userId) {
      return classEntity;
    }

    if (userRole === Role.ALUNO && classEntity.students.length > 0) {
      return classEntity;
    }

    throw new ForbiddenException('Você não tem acesso a esta turma');
  }

  private async ensureCanManageClass(classId: string, userId?: string, userRole?: Role) {
    const classEntity = await this.prisma.class.findUnique({
      where: { id: classId },
      select: { id: true, createdById: true },
    });

    if (!classEntity) {
      throw new NotFoundException('Turma não encontrada');
    }

    if (userRole === Role.ADMIN || (userRole === Role.PROFESSOR && classEntity.createdById === userId)) {
      return classEntity;
    }

    throw new ForbiddenException('Você não pode gerenciar esta turma');
  }
}
