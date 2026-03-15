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
import { SubmissionsService } from './submissions.service';
import {
  CreateSubmissionDto,
  UpdateSubmissionDto,
  QuerySubmissionsDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('submissions')
@ApiBearerAuth()
@Controller('submissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  @Roles(Role.ALUNO)
  @ApiOperation({
    summary: 'Submeter código para atividade',
    description:
      'Aluno submete código para uma atividade. Valida matrícula na turma, deadline e status da atividade.',
  })
  @ApiBody({
    type: CreateSubmissionDto,
    examples: {
      javascript: {
        summary: 'Submissão em JavaScript',
        value: {
          activityId: 'uuid-atividade',
          code: 'function fizzBuzz(n) {\n  for(let i=1; i<=n; i++) {\n    if(i%15===0) console.log("FizzBuzz");\n    else if(i%3===0) console.log("Fizz");\n    else if(i%5===0) console.log("Buzz");\n    else console.log(i);\n  }\n}',
          language: 'javascript',
        },
      },
      python: {
        summary: 'Submissão em Python',
        value: {
          activityId: 'uuid-atividade',
          code: 'def fizz_buzz(n):\n    for i in range(1, n+1):\n        if i % 15 == 0:\n            print("FizzBuzz")\n        elif i % 3 == 0:\n            print("Fizz")\n        elif i % 5 == 0:\n            print("Buzz")\n        else:\n            print(i)',
          language: 'python',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Submissão criada com sucesso',
    schema: {
      example: {
        id: 'uuid-submission',
        activityId: 'uuid-atividade',
        userId: 'uuid-aluno',
        code: 'function fizzBuzz(n) {...}',
        language: 'javascript',
        status: 'PENDENTE',
        result: null,
        executionTime: null,
        memoryUsed: null,
        pointsEarned: 0,
        submittedAt: '2024-01-26T00:00:00.000Z',
        activity: {
          id: 'uuid-atividade',
          title: 'FizzBuzz',
          points: 100,
        },
        user: {
          id: 'uuid-aluno',
          name: 'João Silva',
          email: 'joao@example.com',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Atividade inativa ou deadline expirado' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Não matriculado na turma' })
  @ApiResponse({ status: 404, description: 'Atividade não encontrada' })
  create(@Body() createSubmissionDto: CreateSubmissionDto, @Request() req) {
    return this.submissionsService.create(createSubmissionDto, req.user.id);
  }

  @Get()
  @Roles(Role.ADMIN, Role.PROFESSOR, Role.ALUNO)
  @ApiOperation({
    summary: 'Listar submissões',
    description:
      'Lista submissões com paginação. Alunos veem apenas suas submissões. Professores e Admin veem todas.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'activityId',
    required: false,
    type: String,
    description: 'UUID da atividade',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'UUID do usuário (apenas Admin/Professor)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PENDENTE', 'EXECUTANDO', 'APROVADO', 'PARCIAL', 'REPROVADO', 'ERRO'],
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    example: 'submittedAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de submissões',
    schema: {
      example: {
        data: [
          {
            id: 'uuid-submission',
            activityId: 'uuid-atividade',
            userId: 'uuid-aluno',
            code: 'function fizzBuzz(n) {...}',
            language: 'javascript',
            status: 'APROVADO',
            result: '✅ All 5 test cases passed!',
            executionTime: 523,
            memoryUsed: 34567,
            pointsEarned: 100,
            submittedAt: '2024-01-26T00:00:00.000Z',
            activity: {
              id: 'uuid-atividade',
              title: 'FizzBuzz',
              points: 100,
            },
            user: {
              id: 'uuid-aluno',
              name: 'João Silva',
              email: 'joao@example.com',
              role: 'ALUNO',
            },
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
  findAll(@Query() query: QuerySubmissionsDto, @Request() req) {
    return this.submissionsService.findAll(query, req.user.id, req.user.role);
  }

  @Get('stats')
  @Roles(Role.ALUNO)
  @ApiOperation({
    summary: 'Obter estatísticas do usuário',
    description: 'Retorna estatísticas de submissões do aluno logado',
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas do usuário',
    schema: {
      example: {
        totalSubmissions: 25,
        approved: 18,
        partial: 5,
        rejected: 2,
        pending: 0,
        totalPoints: 1850,
        approvalRate: '72.00',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  getUserStats(@Request() req) {
    return this.submissionsService.getUserStats(req.user.id);
  }

  @Get('activity/:activityId')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({
    summary: 'Obter submissões de uma atividade',
    description:
      'Lista todas as submissões de uma atividade específica com estatísticas',
  })
  @ApiResponse({
    status: 200,
    description: 'Submissões da atividade',
    schema: {
      example: {
        submissions: [
          {
            id: 'uuid-submission',
            userId: 'uuid-aluno',
            code: 'function fizzBuzz(n) {...}',
            language: 'javascript',
            status: 'APROVADO',
            result: '✅ All test cases passed',
            pointsEarned: 100,
            submittedAt: '2024-01-26T00:00:00.000Z',
            user: {
              id: 'uuid-aluno',
              name: 'João Silva',
              email: 'joao@example.com',
            },
          },
        ],
        stats: {
          total: 23,
          approved: 18,
          partial: 3,
          rejected: 2,
          pending: 0,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Atividade não encontrada' })
  getActivitySubmissions(@Param('activityId') activityId: string) {
    return this.submissionsService.getActivitySubmissions(activityId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.PROFESSOR, Role.ALUNO)
  @ApiOperation({
    summary: 'Buscar submissão por ID',
    description:
      'Retorna detalhes de uma submissão. Alunos só podem ver suas próprias submissões.',
  })
  @ApiResponse({
    status: 200,
    description: 'Submissão encontrada',
    schema: {
      example: {
        id: 'uuid-submission',
        activityId: 'uuid-atividade',
        userId: 'uuid-aluno',
        code: 'function fizzBuzz(n) {...}',
        language: 'javascript',
        status: 'APROVADO',
        result: '✅ All 5 test cases passed!',
        executionTime: 523,
        memoryUsed: 34567,
        pointsEarned: 100,
        submittedAt: '2024-01-26T00:00:00.000Z',
        activity: {
          id: 'uuid-atividade',
          title: 'FizzBuzz',
          description: 'Implementar FizzBuzz',
          points: 100,
          class: {
            id: 'uuid-turma',
            name: 'Turma A - 2024.1',
            language: 'javascript',
          },
          testCases: [
            {
              id: 'uuid-test',
              input: '5',
              expectedOutput: '1\n2\nFizz\n4\nBuzz',
              points: 20,
              isVisible: true,
            },
          ],
        },
        user: {
          id: 'uuid-aluno',
          name: 'João Silva',
          email: 'joao@example.com',
          role: 'ALUNO',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão para ver esta submissão' })
  @ApiResponse({ status: 404, description: 'Submissão não encontrada' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.submissionsService.findOne(id, req.user.id, req.user.role);
  }

  @Post(':id/execute')
  @Roles(Role.ADMIN, Role.PROFESSOR, Role.ALUNO)
  @ApiOperation({
    summary: 'Executar submissão',
    description:
      'Executa uma submissão pendente, validando código contra casos de teste. Em produção, integraria com Judge0.',
  })
  @ApiResponse({
    status: 200,
    description: 'Submissão executada',
    schema: {
      example: {
        id: 'uuid-submission',
        activityId: 'uuid-atividade',
        userId: 'uuid-aluno',
        status: 'APROVADO',
        result: '✅ All 5 test cases passed!',
        executionTime: 523,
        memoryUsed: 34567,
        pointsEarned: 100,
        submittedAt: '2024-01-26T00:00:00.000Z',
        activity: {
          id: 'uuid-atividade',
          title: 'FizzBuzz',
          points: 100,
        },
        user: {
          id: 'uuid-aluno',
          name: 'João Silva',
          email: 'joao@example.com',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Submissão não pode ser executada' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 404, description: 'Submissão não encontrada' })
  execute(@Param('id') id: string) {
    return this.submissionsService.execute(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Atualizar submissão manualmente',
    description:
      'Atualiza status, resultado ou pontos de uma submissão. Apenas Admin.',
  })
  @ApiBody({
    type: UpdateSubmissionDto,
    examples: {
      update: {
        summary: 'Atualizar resultado',
        value: {
          status: 'APROVADO',
          result: 'Manual review: All good!',
          pointsEarned: 100,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Submissão atualizada',
    schema: {
      example: {
        id: 'uuid-submission',
        status: 'APROVADO',
        result: 'Manual review: All good!',
        pointsEarned: 100,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Submissão não encontrada' })
  update(
    @Param('id') id: string,
    @Body() updateSubmissionDto: UpdateSubmissionDto,
  ) {
    return this.submissionsService.update(id, updateSubmissionDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.ALUNO)
  @ApiOperation({
    summary: 'Remover submissão',
    description:
      'Remove uma submissão. Alunos podem deletar apenas suas próprias submissões.',
  })
  @ApiResponse({
    status: 200,
    description: 'Submissão removida',
    schema: {
      example: {
        message: 'Submission successfully deleted',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão para deletar' })
  @ApiResponse({ status: 404, description: 'Submissão não encontrada' })
  remove(@Param('id') id: string, @Request() req) {
    return this.submissionsService.remove(id, req.user.id, req.user.role);
  }
}
