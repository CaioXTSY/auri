import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { ClassesService } from './classes.service';
import {
  CreateClassDto,
  UpdateClassDto,
  EnrollStudentDto,
  QueryClassesDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('classes')
@ApiBearerAuth()
@Controller('classes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ 
    summary: 'Criar nova turma',
    description: 'Cria uma turma para organizar alunos. Turmas são opcionais - usuários podem usar a plataforma sem estar em turmas.'
  })
  @ApiBody({
    type: CreateClassDto,
    examples: {
      turma: {
        summary: 'Criar turma',
        value: {
          disciplineId: 'uuid-disciplina',
          name: 'Turma A - Manhã',
          semester: '2024.1',
          year: 2024
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Turma criada com sucesso',
    schema: {
      example: {
        id: 'uuid-here',
        disciplineId: 'uuid-disciplina',
        name: 'Turma A - Manhã',
        semester: '2024.1',
        year: 2024,
        status: 'ATIVA',
        createdAt: '2024-01-26T00:00:00.000Z',
        updatedAt: '2024-01-26T00:00:00.000Z'
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Disciplina não encontrada',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão (apenas Admin/Professor)' })
  create(@Body() createClassDto: CreateClassDto) {
    return this.classesService.create(createClassDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.PROFESSOR, Role.ALUNO)
  @ApiOperation({ 
    summary: 'Listar todas as turmas com paginação',
    description: 'Retorna lista paginada de turmas com filtros opcionais'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'disciplineId', required: false, type: String, description: 'UUID da disciplina' })
  @ApiQuery({ name: 'name', required: false, type: String, example: 'Turma A' })
  @ApiQuery({ name: 'semester', required: false, type: String, example: '2024.1' })
  @ApiQuery({ name: 'year', required: false, type: Number, example: 2024 })
  @ApiQuery({ name: 'status', required: false, enum: ['ATIVA', 'ENCERRADA'], example: 'ATIVA' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, example: 'createdAt' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], example: 'desc' })
  @ApiResponse({
    status: 200,
    description: 'Lista de turmas retornada com sucesso',
    schema: {
      example: {
        data: [
          {
            id: 'uuid-here',
            disciplineId: 'uuid-disciplina',
            name: 'Turma A - Manhã',
            semester: '2024.1',
            year: 2024,
            status: 'ATIVA',
            discipline: {
              id: 'uuid-disciplina',
              name: 'Lógica de Programação',
              language: 'javascript'
            },
            _count: {
              students: 25,
              activities: 12
            },
            createdAt: '2024-01-26T00:00:00.000Z'
          }
        ],
        meta: {
          page: 1,
          limit: 10,
          total: 15,
          totalPages: 2
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  findAll(@Query() query: QueryClassesDto) {
    return this.classesService.findAll(query);
  }

  @Get('my-classes')
  @Roles(Role.ALUNO)
  @ApiOperation({ 
    summary: 'Listar minhas turmas (aluno)',
    description: 'Retorna todas as turmas em que o aluno está matriculado'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de turmas do aluno',
    schema: {
      example: [
        {
          id: 'uuid-here',
          name: 'Turma A - Manhã',
          semester: '2024.1',
          year: 2024,
          status: 'ATIVA',
          discipline: {
            id: 'uuid-disciplina',
            name: 'Lógica de Programação',
            language: 'javascript'
          },
          enrolledAt: '2024-01-26T00:00:00.000Z'
        }
      ]
    }
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão (apenas Aluno)' })
  getMyClasses(@Request() req) {
    return this.classesService.getMyClasses(req.user.id);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.PROFESSOR, Role.ALUNO)
  @ApiOperation({ 
    summary: 'Buscar turma por ID',
    description: 'Retorna detalhes completos de uma turma, incluindo disciplina, alunos e contadores'
  })
  @ApiResponse({
    status: 200,
    description: 'Turma encontrada',
    schema: {
      example: {
        id: 'uuid-here',
        disciplineId: 'uuid-disciplina',
        name: 'Turma A - Manhã',
        semester: '2024.1',
        year: 2024,
        status: 'ATIVA',
        discipline: {
          id: 'uuid-disciplina',
          name: 'Lógica de Programação',
          language: 'javascript',
          description: 'Aprenda lógica de programação'
        },
        students: [
          {
            userId: 'uuid-aluno',
            enrolledAt: '2024-01-26T00:00:00.000Z',
            user: {
              id: 'uuid-aluno',
              name: 'João Silva',
              email: 'joao@example.com'
            }
          }
        ],
        _count: {
          students: 25,
          activities: 12
        },
        createdAt: '2024-01-26T00:00:00.000Z',
        updatedAt: '2024-01-26T00:00:00.000Z'
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Turma não encontrada',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  findOne(@Param('id') id: string) {
    return this.classesService.findOne(id);
  }

  @Get(':id/students')
  @Roles(Role.ADMIN, Role.PROFESSOR, Role.ALUNO)
  @ApiOperation({ 
    summary: 'Listar alunos da turma',
    description: 'Retorna lista de todos os alunos matriculados na turma'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de alunos retornada',
    schema: {
      example: [
        {
          userId: 'uuid-aluno',
          enrolledAt: '2024-01-26T00:00:00.000Z',
          user: {
            id: 'uuid-aluno',
            name: 'João Silva',
            email: 'joao@example.com',
            role: 'ALUNO',
            avatar: '/uploads/avatars/avatar.jpg'
          }
        }
      ]
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Turma não encontrada',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  findStudents(@Param('id') id: string) {
    return this.classesService.findStudentsByClass(id);
  }

  @Post(':id/enroll')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ 
    summary: 'Matricular aluno na turma',
    description: 'Matricula um aluno em uma turma ativa. Apenas usuários com role ALUNO podem ser matriculados.'
  })
  @ApiBody({
    type: EnrollStudentDto,
    examples: {
      enroll: {
        summary: 'Matricular aluno',
        value: {
          userId: 'uuid-aluno'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Aluno matriculado com sucesso',
    schema: {
      example: {
        classId: 'uuid-turma',
        userId: 'uuid-aluno',
        enrolledAt: '2024-01-26T00:00:00.000Z'
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Turma ou aluno não encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'Turma encerrada ou usuário não é aluno',
  })
  @ApiResponse({
    status: 409,
    description: 'Aluno já matriculado',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão (apenas Admin/Professor)' })
  enrollStudent(
    @Param('id') id: string,
    @Body() enrollStudentDto: EnrollStudentDto,
  ) {
    return this.classesService.enrollStudent(id, enrollStudentDto);
  }

  @Delete(':id/students/:userId')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ 
    summary: 'Remover aluno da turma',
    description: 'Remove a matrícula de um aluno da turma'
  })
  @ApiResponse({
    status: 200,
    description: 'Aluno removido com sucesso',
    schema: {
      example: {
        message: 'Student successfully unenrolled'
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Turma ou matrícula não encontrada',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão (apenas Admin/Professor)' })
  unenrollStudent(@Param('id') id: string, @Param('userId') userId: string) {
    return this.classesService.unenrollStudent(id, userId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ 
    summary: 'Atualizar turma',
    description: 'Atualiza informações da turma. Pode alterar status para ENCERRADA.'
  })
  @ApiBody({
    type: UpdateClassDto,
    examples: {
      update: {
        summary: 'Atualizar nome',
        value: {
          name: 'Turma A - Tarde',
          semester: '2024.2'
        }
      },
      close: {
        summary: 'Encerrar turma',
        value: {
          status: 'ENCERRADA'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Turma atualizada com sucesso',
    schema: {
      example: {
        id: 'uuid-here',
        name: 'Turma A - Tarde',
        semester: '2024.2',
        year: 2024,
        status: 'ATIVA',
        updatedAt: '2024-01-26T00:00:00.000Z'
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Turma não encontrada',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão (apenas Admin/Professor)' })
  update(@Param('id') id: string, @Body() updateClassDto: UpdateClassDto) {
    return this.classesService.update(id, updateClassDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ 
    summary: 'Remover turma',
    description: 'Remove permanentemente uma turma. Apenas Admin pode remover. Não permite remover se houver atividades associadas.'
  })
  @ApiResponse({
    status: 200,
    description: 'Turma removida com sucesso',
    schema: {
      example: {
        message: 'Class successfully deleted'
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Turma não encontrada',
  })
  @ApiResponse({
    status: 400,
    description: 'Não é possível remover turma com atividades associadas',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão (apenas Admin)' })
  remove(@Param('id') id: string) {
    return this.classesService.remove(id);
  }
}
