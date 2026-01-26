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
  @ApiOperation({ summary: 'Criar nova disciplina' })
  @ApiResponse({
    status: 201,
    description: 'Disciplina criada com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Usuário não tem permissão',
  })
  create(@Body() createDisciplineDto: CreateDisciplineDto, @Request() req) {
    return this.disciplinesService.create(createDisciplineDto, req.user.id);
  }

  @Get()
  @Roles(Role.ADMIN, Role.PROFESSOR, Role.ALUNO)
  @ApiOperation({ summary: 'Listar todas as disciplinas com paginação' })
  @ApiResponse({
    status: 200,
    description: 'Lista de disciplinas retornada com sucesso',
  })
  @ApiQuery({ type: QueryDisciplinesDto })
  findAll(@Query() query: QueryDisciplinesDto) {
    return this.disciplinesService.findAll(query);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.PROFESSOR, Role.ALUNO)
  @ApiOperation({ summary: 'Buscar disciplina por ID' })
  @ApiResponse({
    status: 200,
    description: 'Disciplina encontrada',
  })
  @ApiResponse({
    status: 404,
    description: 'Disciplina não encontrada',
  })
  findOne(@Param('id') id: string) {
    return this.disciplinesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'Atualizar disciplina' })
  @ApiResponse({
    status: 200,
    description: 'Disciplina atualizada com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Disciplina não encontrada',
  })
  update(
    @Param('id') id: string,
    @Body() updateDisciplineDto: UpdateDisciplineDto,
  ) {
    return this.disciplinesService.update(id, updateDisciplineDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Remover disciplina' })
  @ApiResponse({
    status: 200,
    description: 'Disciplina removida com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Disciplina não encontrada',
  })
  @ApiResponse({
    status: 400,
    description: 'Não é possível remover disciplina com turmas associadas',
  })
  remove(@Param('id') id: string) {
    return this.disciplinesService.remove(id);
  }
}
