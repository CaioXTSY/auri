import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateProgrammingAssignmentDto,
  UpdateProgrammingAssignmentDto,
} from './dto';

@Injectable()
export class ProgrammingAssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProgrammingAssignmentDto) {
    await this.ensureProblemExists(dto.problemId);
    await this.ensureClassExists(dto.classId);

    if (dto.published) {
      await this.ensureProblemCanBePublished(dto.problemId);
    }

    return this.prisma.programmingAssignment.create({
      data: {
        problemId: dto.problemId,
        classId: dto.classId,
        title: dto.title,
        points: dto.points,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        published: dto.published,
      },
    });
  }

  findAll() {
    return this.prisma.programmingAssignment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        problem: true,
        class: true,
        _count: { select: { submissions: true } },
      },
    });
  }

  async findOne(id: string) {
    const assignment = await this.prisma.programmingAssignment.findUnique({
      where: { id },
      include: {
        problem: true,
        class: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException('Atividade de programacao nao encontrada');
    }

    return assignment;
  }

  async update(id: string, dto: UpdateProgrammingAssignmentDto) {
    const current = await this.findOne(id);
    const problemId = dto.problemId ?? current.problemId;

    if (dto.problemId) {
      await this.ensureProblemExists(dto.problemId);
    }

    if (dto.classId) {
      await this.ensureClassExists(dto.classId);
    }

    if (dto.published) {
      await this.ensureProblemCanBePublished(problemId);
    }

    return this.prisma.programmingAssignment.update({
      where: { id },
      data: {
        problemId: dto.problemId,
        classId: dto.classId,
        title: dto.title,
        points: dto.points,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        published: dto.published,
      },
    });
  }

  private async ensureProblemExists(id: string) {
    const exists = await this.prisma.programmingProblem.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('Problema de programacao nao encontrado');
    }
  }

  private async ensureClassExists(id: string) {
    const exists = await this.prisma.class.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('Turma nao encontrada');
    }
  }

  private async ensureProblemCanBePublished(problemId: string) {
    const testCasesCount = await this.prisma.problemTestCase.count({
      where: { problemId },
    });

    if (testCasesCount === 0) {
      throw new BadRequestException(
        'Nao e possivel publicar atividade sem casos de teste',
      );
    }
  }
}

