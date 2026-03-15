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
import { ActivitiesService } from './activities.service';
import {
  CreateActivityDto,
  UpdateActivityDto,
  CreateTestCaseDto,
  QueryActivitiesDto,
  UpcomingActivityDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('activities')
@ApiBearerAuth()
@Controller('activities')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({
    summary: 'Criar nova atividade',
    description:
      'Cria atividade de programação. Atividades podem ser vinculadas a turmas (opcional).',
  })
  @ApiBody({
    type: CreateActivityDto,
    examples: {
      exercise: {
        summary: 'Exercício de programação',
        value: {
          classId: 'uuid-turma',
          title: 'FizzBuzz',
          description:
            'Escreva um programa que imprime números de 1 a 100. Para múltiplos de 3, imprime "Fizz", para múltiplos de 5 imprime "Buzz", e para múltiplos de ambos imprime "FizzBuzz".',
          type: 'EXERCICIO',
          difficulty: 'FACIL',
          points: 100,
          deadline: '2024-12-31T23:59:59.000Z',
          starterCode: 'function fizzBuzz(n) {\n  // seu código aqui\n}',
          allowLateSubmission: true,
        },
      },
      challenge: {
        summary: 'Desafio avançado',
        value: {
          classId: 'uuid-turma',
          title: 'Sistema de Gerenciamento',
          description: 'Implemente um sistema completo de gerenciamento...',
          type: 'DESAFIO',
          difficulty: 'DIFICIL',
          points: 500,
          deadline: '2024-12-31T23:59:59.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Atividade criada com sucesso',
    schema: {
      example: {
        id: 'uuid-here',
        classId: 'uuid-turma',
        title: 'FizzBuzz',
        description: 'Escreva um programa...',
        type: 'EXERCICIO',
        difficulty: 'FACIL',
        points: 100,
        deadline: '2024-12-31T23:59:59.000Z',
        status: 'ATIVA',
        starterCode: 'function fizzBuzz(n) {...}',
        allowLateSubmission: true,
        createdById: 'uuid-professor',
        createdAt: '2024-01-26T00:00:00.000Z',
        class: {
          id: 'uuid-turma',
          name: 'Turma A - 2024.1',
          semester: '2024.1',
          year: 2024,
        },
        _count: {
          testCases: 0,
          submissions: 0,
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou deadline no passado' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão (apenas Admin/Professor)' })
  @ApiResponse({ status: 404, description: 'Turma não encontrada' })
  create(@Body() createActivityDto: CreateActivityDto, @Request() req) {
    return this.activitiesService.create(createActivityDto, req.user.id);
  }

  @Get()
  @Roles(Role.ADMIN, Role.PROFESSOR, Role.ALUNO)
  @ApiOperation({
    summary: 'Listar todas as atividades com paginação',
    description: 'Retorna lista paginada de atividades com filtros opcionais',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'classId',
    required: false,
    type: String,
    description: 'UUID da turma',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['EXERCICIO', 'DESAFIO', 'PROJETO', 'QUIZ'],
  })
  @ApiQuery({
    name: 'difficulty',
    required: false,
    enum: ['FACIL', 'MEDIO', 'DIFICIL'],
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['ATIVA', 'INATIVA'],
    example: 'ATIVA',
  })
  @ApiQuery({ name: 'title', required: false, type: String, example: 'FizzBuzz' })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    example: 'deadline',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    example: 'asc',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de atividades',
    schema: {
      example: {
        data: [
          {
            id: 'uuid-here',
            title: 'FizzBuzz',
            description: 'Escreva um programa...',
            type: 'EXERCICIO',
            difficulty: 'FACIL',
            points: 100,
            deadline: '2024-12-31T23:59:59.000Z',
            status: 'ATIVA',
            class: {
              id: 'uuid-turma',
              name: 'Turma A - 2024.1',
              semester: '2024.1',
              year: 2024,
            },
            _count: {
              testCases: 5,
              submissions: 23,
            },
            createdAt: '2024-01-26T00:00:00.000Z',
          },
        ],
        meta: {
          page: 1,
          limit: 10,
          total: 25,
          totalPages: 3,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  findAll(@Query() query: QueryActivitiesDto) {
    return this.activitiesService.findAll(query);
  }

  @Get('upcoming')
  @Roles(Role.ALUNO)
  @ApiOperation({
    summary: 'Listar próximas atividades do aluno',
    description: 'Retorna até N atividades com deadline futuro, ordenadas pela data mais próxima',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 3 })
  @ApiResponse({
    status: 200,
    description: 'Lista de próximas atividades',
    type: UpcomingActivityDto,
    isArray: true,
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Apenas alunos podem acessar' })
  getUpcoming(@Request() req, @Query('limit') limit?: number) {
    const parsedLimit = limit ? Number(limit) : 3;
    return this.activitiesService.findUpcomingForStudent(req.user.id, parsedLimit);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.PROFESSOR, Role.ALUNO)
  @ApiOperation({
    summary: 'Buscar atividade por ID',
    description:
      'Retorna detalhes completos de uma atividade, incluindo casos de teste',
  })
  @ApiResponse({
    status: 200,
    description: 'Atividade encontrada',
    schema: {
      example: {
        id: 'uuid-here',
        classId: 'uuid-turma',
        title: 'FizzBuzz',
        description: 'Escreva um programa...',
        type: 'EXERCICIO',
        difficulty: 'FACIL',
        points: 100,
        deadline: '2024-12-31T23:59:59.000Z',
        status: 'ATIVA',
        starterCode: 'function fizzBuzz(n) {...}',
        allowLateSubmission: true,
        class: {
          id: 'uuid-turma',
          name: 'Turma A - 2024.1',
          semester: '2024.1',
          year: 2024,
          status: 'ATIVA',
        },
        createdBy: {
          id: 'uuid-professor',
          name: 'Prof. Maria',
          email: 'maria@example.com',
          role: 'PROFESSOR',
        },
        testCases: [
          {
            id: 'uuid-test',
            input: '5',
            expectedOutput: '1\n2\nFizz\n4\nBuzz',
            points: 20,
            isVisible: true,
            description: 'Teste com números de 1 a 5',
            createdAt: '2024-01-26T00:00:00.000Z',
          },
        ],
        _count: {
          submissions: 23,
        },
        createdAt: '2024-01-26T00:00:00.000Z',
        updatedAt: '2024-01-26T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 404, description: 'Atividade não encontrada' })
  findOne(@Param('id') id: string) {
    return this.activitiesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({
    summary: 'Atualizar atividade',
    description:
      'Atualiza dados de uma atividade. Admin e Professor podem atualizar.',
  })
  @ApiBody({
    type: UpdateActivityDto,
    examples: {
      update: {
        summary: 'Atualizar atividade',
        value: {
          title: 'FizzBuzz Avançado',
          difficulty: 'MEDIO',
          points: 150,
        },
      },
      inactivate: {
        summary: 'Inativar atividade',
        value: {
          status: 'INATIVA',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Atividade atualizada com sucesso',
    schema: {
      example: {
        id: 'uuid-here',
        title: 'FizzBuzz Avançado',
        difficulty: 'MEDIO',
        points: 150,
        updatedAt: '2024-01-26T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Atividade não encontrada' })
  update(@Param('id') id: string, @Body() updateActivityDto: UpdateActivityDto) {
    return this.activitiesService.update(id, updateActivityDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Remover atividade',
    description:
      'Remove permanentemente uma atividade. Apenas Admin pode remover. Não permite remover se houver submissões.',
  })
  @ApiResponse({
    status: 200,
    description: 'Atividade removida com sucesso',
    schema: {
      example: {
        message: 'Activity successfully deleted',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Atividade possui submissões' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão (apenas Admin)' })
  @ApiResponse({ status: 404, description: 'Atividade não encontrada' })
  remove(@Param('id') id: string) {
    return this.activitiesService.remove(id);
  }

  // ==================== TEST CASES ====================

  @Post(':id/test-cases')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({
    summary: 'Adicionar caso de teste',
    description:
      'Adiciona um caso de teste à atividade. Define input, output esperado e pontuação.',
  })
  @ApiBody({
    type: CreateTestCaseDto,
    examples: {
      visible: {
        summary: 'Caso de teste visível',
        value: {
          input: '5',
          expectedOutput: '1\n2\nFizz\n4\nBuzz',
          points: 20,
          isVisible: true,
          description: 'Teste com números de 1 a 5',
        },
      },
      hidden: {
        summary: 'Caso de teste oculto',
        value: {
          input: '100',
          expectedOutput: '1\n2\nFizz\n...\nBuzz',
          points: 30,
          isVisible: false,
          description: 'Teste com 100 números (oculto do aluno)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Caso de teste criado',
    schema: {
      example: {
        id: 'uuid-test',
        activityId: 'uuid-atividade',
        input: '5',
        expectedOutput: '1\n2\nFizz\n4\nBuzz',
        points: 20,
        isVisible: true,
        description: 'Teste com números de 1 a 5',
        createdAt: '2024-01-26T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão (apenas Admin/Professor)' })
  @ApiResponse({ status: 404, description: 'Atividade não encontrada' })
  createTestCase(
    @Param('id') id: string,
    @Body() createTestCaseDto: CreateTestCaseDto,
  ) {
    return this.activitiesService.createTestCase(id, createTestCaseDto);
  }

  @Get(':id/test-cases')
  @Roles(Role.ADMIN, Role.PROFESSOR, Role.ALUNO)
  @ApiOperation({
    summary: 'Listar casos de teste',
    description:
      'Retorna todos os casos de teste de uma atividade. Alunos veem apenas casos visíveis.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de casos de teste',
    schema: {
      example: [
        {
          id: 'uuid-test',
          activityId: 'uuid-atividade',
          input: '5',
          expectedOutput: '1\n2\nFizz\n4\nBuzz',
          points: 20,
          isVisible: true,
          description: 'Teste com números de 1 a 5',
          createdAt: '2024-01-26T00:00:00.000Z',
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 404, description: 'Atividade não encontrada' })
  findTestCases(@Param('id') id: string) {
    return this.activitiesService.findTestCases(id);
  }

  @Delete(':id/test-cases/:testId')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({
    summary: 'Remover caso de teste',
    description: 'Remove um caso de teste específico de uma atividade',
  })
  @ApiResponse({
    status: 200,
    description: 'Caso de teste removido',
    schema: {
      example: {
        message: 'Test case successfully deleted',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão (apenas Admin/Professor)' })
  @ApiResponse({ status: 404, description: 'Caso de teste não encontrado' })
  removeTestCase(@Param('id') id: string, @Param('testId') testId: string) {
    return this.activitiesService.removeTestCase(id, testId);
  }
}
