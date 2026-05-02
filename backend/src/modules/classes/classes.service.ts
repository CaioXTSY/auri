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
} from './dto';
import { Class, Role } from '@prisma/client';

@Injectable()
export class ClassesService {
  constructor(
    private prisma: PrismaService,
    private gamificationService: GamificationService,
  ) {}

  async findByCode(code: string): Promise<Class> {
    const classEntity = await this.prisma.class.findUnique({
      where: { code },
      include: {
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

    if (classEntity.status !== 'ATIVA') {
      throw new BadRequestException('Não é possível entrar em uma turma encerrada');
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
    return this.prisma.class.create({
      data: {
        ...createClassDto,
        createdById,
      },
      include: {
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
      semester,
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

    if (semester) {
      where.semester = semester;
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

    return this.prisma.class.update({
      where: { id },
      data: updateClassDto,
      include: {
        _count: {
          select: {
            students: true,
          },
        },
      },
    });
  }

  async remove(id: string): Promise<void> {
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
            semester: true,
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
}
