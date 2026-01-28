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
import { DisciplinesService } from './disciplines.service';
import {
  CreateDisciplineDto,
  UpdateDisciplineDto,
  QueryDisciplinesDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('disciplines')
@ApiBearerAuth()
@Controller('disciplines')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DisciplinesController {
  constructor(private readonly disciplinesService: DisciplinesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ 
    summary: 'Criar nova disciplina',
    description: 'Cria uma nova disciplina. Apenas Admin e Professor podem criar.'
  })
  @ApiBody({
    type: CreateDisciplineDto,
    examples: {
      javascript: {
        summary: 'Disciplina de JavaScript',
        value: {
          name: 'Introdução ao JavaScript',
          description: 'Aprenda os fundamentos da linguagem JavaScript',
          language: 'javascript',
          imageUrl: 'https://example.com/js.png'
        }
      },
      python: {
        summary: 'Disciplina de Python',
        value: {
          name: 'Python para Iniciantes',
          description: 'Primeiros passos com Python',
          language: 'python'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Disciplina criada com sucesso',
    schema: {
      example: {
        id: 'uuid-here',
        name: 'Introdução ao JavaScript',
        description: 'Aprenda os fundamentos da linguagem JavaScript',
        language: 'javascript',
        imageUrl: 'https://example.com/js.png',
        status: 'ATIVA',
        createdById: 'uuid-professor',
        createdAt: '2024-01-26T00:00:00.000Z',
        updatedAt: '2024-01-26T00:00:00.000Z'
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou usuário sem permissão',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão (apenas Admin/Professor)' })
  create(@Body() createDisciplineDto: CreateDisciplineDto, @Request() req) {
    return this.disciplinesService.create(createDisciplineDto, req.user.id);
  }

  @Get()
  @Roles(Role.ADMIN, Role.PROFESSOR, Role.ALUNO)
  @ApiOperation({ 
    summary: 'Listar todas as disciplinas com paginação',
    description: 'Retorna lista paginada de disciplinas com filtros opcionais'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'name', required: false, type: String, example: 'JavaScript' })
  @ApiQuery({ name: 'language', required: false, type: String, example: 'javascript' })
  @ApiQuery({ name: 'status', required: false, enum: ['ATIVA', 'INATIVA'], example: 'ATIVA' })
  @ApiQuery({ name: 'createdById', required: false, type: String, description: 'UUID do criador' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, example: 'createdAt' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], example: 'desc' })
  @ApiResponse({
    status: 200,
    description: 'Lista de disciplinas retornada com sucesso',
    schema: {
      example: {
        data: [
          {
            id: 'uuid-here',
            name: 'Introdução ao JavaScript',
            description: 'Aprenda os fundamentos da linguagem JavaScript',
            language: 'javascript',
            imageUrl: 'https://example.com/js.png',
            status: 'ATIVA',
            createdBy: {
              id: 'uuid-professor',
              name: 'Prof. Maria',
              email: 'maria@example.com'
            },
            _count: {
              classes: 3
            },
            createdAt: '2024-01-26T00:00:00.000Z'
          }
        ],
        meta: {
          page: 1,
          limit: 10,
          total: 25,
          totalPages: 3
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  findAll(@Query() query: QueryDisciplinesDto) {
    return this.disciplinesService.findAll(query);
  }

  @Get('my-disciplines')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ 
    summary: 'Listar minhas disciplinas',
    description: 'Retorna lista de disciplinas criadas pelo professor logado'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de disciplinas retornada com sucesso',
  })
  getMyDisciplines(@Request() req) {
    return this.disciplinesService.findAll({ createdById: req.user.id, limit: 100 });
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.PROFESSOR, Role.ALUNO)
  @ApiOperation({ 
    summary: 'Buscar disciplina por ID',
    description: 'Retorna detalhes completos de uma disciplina específica'
  })
  @ApiResponse({
    status: 200,
    description: 'Disciplina encontrada',
    schema: {
      example: {
        id: 'uuid-here',
        name: 'Introdução ao JavaScript',
        description: 'Aprenda os fundamentos da linguagem JavaScript',
        language: 'javascript',
        imageUrl: 'https://example.com/js.png',
        status: 'ATIVA',
        createdBy: {
          id: 'uuid-professor',
          name: 'Prof. Maria',
          email: 'maria@example.com',
          role: 'PROFESSOR'
        },
        classes: [
          {
            id: 'uuid-class',
            name: 'Turma A - 2024.1',
            semester: '2024.1',
            year: 2024,
            status: 'ATIVA'
          }
        ],
        _count: {
          classes: 3
        },
        createdAt: '2024-01-26T00:00:00.000Z',
        updatedAt: '2024-01-26T00:00:00.000Z'
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Disciplina não encontrada',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  findOne(@Param('id') id: string) {
    return this.disciplinesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ 
    summary: 'Atualizar disciplina',
    description: 'Atualiza dados de uma disciplina. Admin e Professor podem atualizar.'
  })
  @ApiBody({
    type: UpdateDisciplineDto,
    examples: {
      update: {
        summary: 'Atualizar disciplina',
        value: {
          name: 'JavaScript Avançado',
          description: 'Conceitos avançados de JavaScript',
          status: 'ATIVA'
        }
      },
      inactivate: {
        summary: 'Inativar disciplina',
        value: {
          status: 'INATIVA'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Disciplina atualizada com sucesso',
    schema: {
      example: {
        id: 'uuid-here',
        name: 'JavaScript Avançado',
        description: 'Conceitos avançados de JavaScript',
        language: 'javascript',
        status: 'ATIVA',
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
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  update(
    @Param('id') id: string,
    @Body() updateDisciplineDto: UpdateDisciplineDto,
  ) {
    return this.disciplinesService.update(id, updateDisciplineDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ 
    summary: 'Remover disciplina',
    description: 'Remove permanentemente uma disciplina. Apenas Admin pode remover. Não permite remover se houver turmas associadas.'
  })
  @ApiResponse({
    status: 200,
    description: 'Disciplina removida com sucesso',
    schema: {
      example: {
        message: 'Discipline successfully deleted'
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Disciplina não encontrada',
  })
  @ApiResponse({
    status: 400,
    description: 'Não é possível remover disciplina com turmas associadas',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão (apenas Admin)' })
  remove(@Param('id') id: string) {
    return this.disciplinesService.remove(id);
  }
}
