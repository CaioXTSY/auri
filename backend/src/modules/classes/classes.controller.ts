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
  @ApiOperation({ summary: 'Criar nova turma' })
  @ApiResponse({
    status: 201,
    description: 'Turma criada com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Disciplina não encontrada',
  })
  create(@Body() createClassDto: CreateClassDto) {
    return this.classesService.create(createClassDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.PROFESSOR, Role.ALUNO)
  @ApiOperation({ summary: 'Listar todas as turmas com paginação' })
  @ApiResponse({
    status: 200,
    description: 'Lista de turmas retornada com sucesso',
  })
  @ApiQuery({ type: QueryClassesDto })
  findAll(@Query() query: QueryClassesDto) {
    return this.classesService.findAll(query);
  }

  @Get('my-classes')
  @Roles(Role.ALUNO)
  @ApiOperation({ summary: 'Listar minhas turmas (aluno)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de turmas do aluno',
  })
  getMyClasses(@Request() req) {
    return this.classesService.getMyClasses(req.user.id);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.PROFESSOR, Role.ALUNO)
  @ApiOperation({ summary: 'Buscar turma por ID' })
  @ApiResponse({
    status: 200,
    description: 'Turma encontrada',
  })
  @ApiResponse({
    status: 404,
    description: 'Turma não encontrada',
  })
  findOne(@Param('id') id: string) {
    return this.classesService.findOne(id);
  }

  @Get(':id/students')
  @Roles(Role.ADMIN, Role.PROFESSOR, Role.ALUNO)
  @ApiOperation({ summary: 'Listar alunos da turma' })
  @ApiResponse({
    status: 200,
    description: 'Lista de alunos retornada',
  })
  @ApiResponse({
    status: 404,
    description: 'Turma não encontrada',
  })
  findStudents(@Param('id') id: string) {
    return this.classesService.findStudentsByClass(id);
  }

  @Post(':id/enroll')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'Matricular aluno na turma' })
  @ApiResponse({
    status: 201,
    description: 'Aluno matriculado com sucesso',
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
  enrollStudent(
    @Param('id') id: string,
    @Body() enrollStudentDto: EnrollStudentDto,
  ) {
    return this.classesService.enrollStudent(id, enrollStudentDto);
  }

  @Delete(':id/students/:userId')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'Remover aluno da turma' })
  @ApiResponse({
    status: 200,
    description: 'Aluno removido com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Turma ou matrícula não encontrada',
  })
  unenrollStudent(@Param('id') id: string, @Param('userId') userId: string) {
    return this.classesService.unenrollStudent(id, userId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'Atualizar turma' })
  @ApiResponse({
    status: 200,
    description: 'Turma atualizada com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Turma não encontrada',
  })
  update(@Param('id') id: string, @Body() updateClassDto: UpdateClassDto) {
    return this.classesService.update(id, updateClassDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Remover turma' })
  @ApiResponse({
    status: 200,
    description: 'Turma removida com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Turma não encontrada',
  })
  @ApiResponse({
    status: 400,
    description: 'Não é possível remover turma com atividades associadas',
  })
  remove(@Param('id') id: string) {
    return this.classesService.remove(id);
  }
}
