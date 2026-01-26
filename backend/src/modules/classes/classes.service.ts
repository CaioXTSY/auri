import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateClassDto,
  UpdateClassDto,
  EnrollStudentDto,
  QueryClassesDto,
  PaginatedClassesDto,
} from './dto';
import { Class } from '@prisma/client';

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  async create(createClassDto: CreateClassDto): Promise<Class> {
    // Verificar se a disciplina existe
    const discipline = await this.prisma.discipline.findUnique({
      where: { id: createClassDto.disciplineId },
    });

    if (!discipline) {
      throw new NotFoundException('Disciplina não encontrada');
    }

    return this.prisma.class.create({
      data: createClassDto,
      include: {
        discipline: {
          select: {
            id: true,
            name: true,
            language: true,
            status: true,
          },
        },
        _count: {
          select: {
            students: true,
            activities: true,
          },
        },
      },
    });
  }

  async findAll(
    query?: QueryClassesDto,
  ): Promise<PaginatedClassesDto<Class>> {
    const {
      page = 1,
      limit = 10,
      disciplineId,
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

    if (disciplineId) {
      where.disciplineId = disciplineId;
    }

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

    const [classes, total] = await Promise.all([
      this.prisma.class.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          discipline: {
            select: {
              id: true,
              name: true,
              language: true,
              createdBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          _count: {
            select: {
              students: true,
              activities: true,
            },
          },
        },
      }),
      this.prisma.class.count({ where }),
    ]);

    return new PaginatedClassesDto(classes, total, pageNum, limitNum);
  }

  async findOne(id: string): Promise<Class> {
    const classEntity = await this.prisma.class.findUnique({
      where: { id },
      include: {
        discipline: {
          select: {
            id: true,
            name: true,
            language: true,
            description: true,
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
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
        _count: {
          select: {
            activities: true,
            points: true,
            rankings: true,
          },
        },
      },
    });

    if (!classEntity) {
      throw new NotFoundException('Turma não encontrada');
    }

    return classEntity;
  }

  async findStudentsByClass(classId: string) {
    const classEntity = await this.prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classEntity) {
      throw new NotFoundException('Turma não encontrada');
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

    return students;
  }

  async update(id: string, updateClassDto: UpdateClassDto): Promise<Class> {
    await this.findOne(id);

    // Se está alterando a disciplina, verificar se existe
    if (updateClassDto.disciplineId) {
      const discipline = await this.prisma.discipline.findUnique({
        where: { id: updateClassDto.disciplineId },
      });

      if (!discipline) {
        throw new NotFoundException('Disciplina não encontrada');
      }
    }

    return this.prisma.class.update({
      where: { id },
      data: updateClassDto,
      include: {
        discipline: {
          select: {
            id: true,
            name: true,
            language: true,
          },
        },
        _count: {
          select: {
            students: true,
            activities: true,
          },
        },
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);

    // Verificar se existem atividades associadas
    const activitiesCount = await this.prisma.activity.count({
      where: { classId: id },
    });

    if (activitiesCount > 0) {
      throw new BadRequestException(
        'Não é possível remover turma com atividades associadas. Considere encerrar a turma ao invés de removê-la.',
      );
    }

    await this.prisma.class.delete({
      where: { id },
    });
  }

  async enrollStudent(
    classId: string,
    enrollStudentDto: EnrollStudentDto,
  ): Promise<any> {
    // Verificar se a turma existe
    const classEntity = await this.prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classEntity) {
      throw new NotFoundException('Turma não encontrada');
    }

    // Verificar se a turma está ativa
    if (classEntity.status !== 'ATIVA') {
      throw new BadRequestException(
        'Não é possível matricular aluno em turma encerrada',
      );
    }

    // Verificar se o usuário existe e é aluno
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

    // Verificar se já está matriculado
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

    // Matricular o aluno
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

  async unenrollStudent(classId: string, userId: string): Promise<void> {
    // Verificar se a turma existe
    const classEntity = await this.prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classEntity) {
      throw new NotFoundException('Turma não encontrada');
    }

    // Verificar se a matrícula existe
    const enrollment = await this.prisma.classStudent.findUnique({
      where: {
        classId_userId: {
          classId,
          userId,
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Aluno não está matriculado nesta turma');
    }

    // Remover matrícula
    await this.prisma.classStudent.delete({
      where: {
        classId_userId: {
          classId,
          userId,
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
            discipline: {
              select: {
                id: true,
                name: true,
                language: true,
              },
            },
            _count: {
              select: {
                students: true,
                activities: true,
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
}
