import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CodeSubmissionsService } from './code-submissions.service';
import {
  CreateProblemTestCaseDto,
  CreateProgrammingAssignmentDto,
  CreateProgrammingProblemDto,
  QueryProgrammingListDto,
  UpdateProblemTestCaseDto,
  UpdateProgrammingAssignmentDto,
  UpdateProgrammingProblemDto,
} from './dto';
import { ProgrammingAssignmentsService } from './programming-assignments.service';
import { ProgrammingProblemsService } from './programming-problems.service';

@ApiTags('programming')
@ApiBearerAuth()
@Controller('programming')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgrammingController {
  constructor(
    private readonly problemsService: ProgrammingProblemsService,
    private readonly assignmentsService: ProgrammingAssignmentsService,
    private readonly submissionsService: CodeSubmissionsService,
  ) {}

  @Post('problems')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'Criar problema de programacao' })
  @ApiBody({ type: CreateProgrammingProblemDto })
  @ApiResponse({ status: 201, description: 'Problema criado com sucesso' })
  createProblem(@Body() dto: CreateProgrammingProblemDto, @Request() req) {
    return this.problemsService.create(req.user.id, dto);
  }

  @Get('problems')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'Listar problemas de programacao' })
  findProblems(@Query() query: QueryProgrammingListDto, @Request() req) {
    return this.problemsService.findAll(req.user.id, req.user.role, query);
  }

  @Get('problems/:id')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'Buscar problema de programacao por ID' })
  findProblem(@Param('id') id: string, @Request() req) {
    return this.problemsService.findOne(id, req.user.id, req.user.role);
  }

  @Patch('problems/:id')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'Atualizar problema de programacao' })
  @ApiBody({ type: UpdateProgrammingProblemDto })
  updateProblem(
    @Param('id') id: string,
    @Body() dto: UpdateProgrammingProblemDto,
    @Request() req,
  ) {
    return this.problemsService.update(id, dto, req.user.id, req.user.role);
  }

  @Delete('problems/:id')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'Remover problema de programacao' })
  removeProblem(@Param('id') id: string, @Request() req) {
    return this.problemsService.remove(id, req.user.id, req.user.role);
  }

  @Post('problems/:id/test-cases')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'Criar caso de teste para problema' })
  @ApiBody({ type: CreateProblemTestCaseDto })
  createTestCase(
    @Param('id') id: string,
    @Body() dto: CreateProblemTestCaseDto,
    @Request() req,
  ) {
    return this.problemsService.createTestCase(
      id,
      dto,
      req.user.id,
      req.user.role,
    );
  }

  @Get('problems/:id/test-cases')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'Listar casos de teste de um problema' })
  findTestCases(@Param('id') id: string, @Request() req) {
    return this.problemsService.findTestCases(
      id,
      true,
      req.user.id,
      req.user.role,
    );
  }

  @Patch('test-cases/:id')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'Atualizar caso de teste' })
  @ApiBody({ type: UpdateProblemTestCaseDto })
  updateTestCase(
    @Param('id') id: string,
    @Body() dto: UpdateProblemTestCaseDto,
    @Request() req,
  ) {
    return this.problemsService.updateTestCase(
      id,
      dto,
      req.user.id,
      req.user.role,
    );
  }

  @Delete('test-cases/:id')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'Remover caso de teste' })
  removeTestCase(@Param('id') id: string, @Request() req) {
    return this.problemsService.removeTestCase(id, req.user.id, req.user.role);
  }

  @Post('assignments')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'Publicar problema como atividade de turma' })
  @ApiBody({ type: CreateProgrammingAssignmentDto })
  createAssignment(
    @Body() dto: CreateProgrammingAssignmentDto,
    @Request() req,
  ) {
    return this.assignmentsService.create(dto, req.user.id, req.user.role);
  }

  @Get('assignments')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'Listar atividades de programacao' })
  findAssignments(@Query() query: QueryProgrammingListDto, @Request() req) {
    return this.assignmentsService.findAll(req.user.id, req.user.role, query);
  }

  @Get('assignments/my')
  @Roles(Role.ALUNO)
  @ApiOperation({ summary: 'Listar minhas atividades de programacao' })
  findMyAssignments(@Request() req) {
    return this.assignmentsService.findMyAssignments(req.user.id);
  }

  @Get('assignments/:id/solve')
  @Roles(Role.ALUNO)
  @ApiOperation({ summary: 'Abrir atividade para resolucao pelo aluno' })
  getSolveView(@Param('id') id: string, @Request() req) {
    return this.assignmentsService.getSolveView(id, req.user.id);
  }

  @Get('assignments/:id/submissions/my')
  @Roles(Role.ALUNO)
  @ApiOperation({ summary: 'Listar minhas submissoes em uma atividade' })
  findMyAssignmentSubmissions(@Param('id') id: string, @Request() req) {
    return this.submissionsService.findMyAssignmentSubmissions(req.user.id, id);
  }

  @Get('assignments/:id/submissions')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'Listar submissoes de uma atividade' })
  findAssignmentSubmissions(@Param('id') id: string, @Request() req) {
    return this.submissionsService.findByAssignment(
      id,
      req.user.id,
      req.user.role,
    );
  }

  @Get('assignments/:id')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'Buscar atividade de programacao por ID' })
  findAssignment(@Param('id') id: string, @Request() req) {
    return this.assignmentsService.findOne(id, req.user.id, req.user.role);
  }

  @Patch('assignments/:id')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'Atualizar atividade de programacao' })
  @ApiBody({ type: UpdateProgrammingAssignmentDto })
  updateAssignment(
    @Param('id') id: string,
    @Body() dto: UpdateProgrammingAssignmentDto,
    @Request() req,
  ) {
    return this.assignmentsService.update(id, dto, req.user.id, req.user.role);
  }

  @Delete('assignments/:id')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'Remover atividade de programacao' })
  removeAssignment(@Param('id') id: string, @Request() req) {
    return this.assignmentsService.remove(id, req.user.id, req.user.role);
  }
}

