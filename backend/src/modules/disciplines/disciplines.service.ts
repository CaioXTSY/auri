import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateDisciplineDto,
  UpdateDisciplineDto,
  QueryDisciplinesDto,
  PaginatedDisciplinesDto,
} from './dto';
import { Discipline } from '@prisma/client';

@Injectable()
export class DisciplinesService {
  constructor(private prisma: PrismaService) {}

  async create(
    createDisciplineDto: CreateDisciplineDto,
    userId: string,
  ): Promise<Discipline> {
    // Verificar se o usuário existe e tem permissão
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (user.role !== 'PROFESSOR' && user.role !== 'ADMIN') {
      throw new BadRequestException(
        'Usuário precisa ter role PROFESSOR ou ADMIN',
      );
    }

    return this.prisma.discipline.create({
      data: {
        ...createDisciplineDto,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async findAll(
    query?: QueryDisciplinesDto,
  ): Promise<PaginatedDisciplinesDto<Discipline>> {
    const {
      page = 1,
      limit = 10,
      createdById,
      name,
      language,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query || {};

    // Garantir que page e limit sejam números
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (createdById) {
      where.createdById = createdById;
    }

    if (name) {
      where.name = {
        contains: name,
      };
    }

    if (language) {
      where.language = {
        contains: language,
      };
    }

    if (status) {
      where.status = status;
    }

    const [disciplines, total] = await Promise.all([
      this.prisma.discipline.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          _count: {
            select: {
              classes: true,
            },
          },
        },
      }),
      this.prisma.discipline.count({ where }),
    ]);

    return new PaginatedDisciplinesDto(disciplines, total, pageNum, limitNum);
  }

  async findOne(id: string): Promise<Discipline> {
    const discipline = await this.prisma.discipline.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        classes: {
          select: {
            id: true,
            name: true,
            semester: true,
            year: true,
            status: true,
            _count: {
              select: {
                students: true,
              },
            },
          },
        },
      },
    });

    if (!discipline) {
      throw new NotFoundException('Disciplina não encontrada');
    }

    return discipline;
  }

  async update(
    id: string,
    updateDisciplineDto: UpdateDisciplineDto,
  ): Promise<Discipline> {
    await this.findOne(id);

    return this.prisma.discipline.update({
      where: { id },
      data: updateDisciplineDto,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);

    // Verificar se existem turmas associadas
    const classesCount = await this.prisma.class.count({
      where: { disciplineId: id },
    });

    if (classesCount > 0) {
      throw new BadRequestException(
        'Não é possível remover disciplina com turmas associadas',
      );
    }

    await this.prisma.discipline.delete({
      where: { id },
    });
  }
}
