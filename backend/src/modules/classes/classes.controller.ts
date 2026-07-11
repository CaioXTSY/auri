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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { ClassesService } from './classes.service';
import { CreateClassDto, UpdateClassDto, QueryClassesDto, UpdateClassSettingsDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { AuthenticatedRequest } from '../../common/types/authenticated-request';

@ApiTags('classes')
@ApiBearerAuth()
@Controller('classes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post('join')
  @Roles(Role.ALUNO)
  @ApiOperation({
    summary: 'Entrar em uma turma pelo código',
    description: 'Permite que um aluno entre em uma turma usando o código de acesso.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          example: 'ckz123456',
        },
      },
      required: ['code'],
    },
  })
  @ApiResponse({ status: 201, description: 'Aluno matriculado com sucesso' })
  @ApiResponse({ status: 404, description: 'Turma não encontrada' })
  @ApiResponse({ status: 409, description: 'Aluno já matriculado' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão (apenas Aluno)' })
  joinClass(@Body('code') code: string, @Request() req: AuthenticatedRequest) {
    return this.classesService.joinClass(code, req.user.id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({
    summary: 'Criar nova turma',
    description: 'Cria uma turma para organizar alunos.',
  })
  @ApiBody({ type: CreateClassDto })
  @ApiResponse({ status: 201, description: 'Turma criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão (apenas Admin/Professor)' })
  create(@Body() createClassDto: CreateClassDto, @Request() req: AuthenticatedRequest) {
    return this.classesService.create(createClassDto, req.user.id);
  }

  @Get()
  @Roles(Role.ADMIN, Role.PROFESSOR, Role.ALUNO)
  @ApiOperation({
    summary: 'Listar turmas com paginação',
    description: 'Professores veem apenas suas próprias turmas. Admins veem todas.',
  })
  @ApiResponse({ status: 200, description: 'Lista de turmas retornada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  findAll(@Query() query: QueryClassesDto, @Request() req: AuthenticatedRequest) {
    return this.classesService.findAll(query, req.user.id, req.user.role);
  }

  @Get('my-classes')
  @Roles(Role.ALUNO)
  @ApiOperation({
    summary: 'Listar minhas turmas (aluno)',
    description: 'Retorna todas as turmas em que o aluno está matriculado',
  })
  @ApiResponse({ status: 200, description: 'Lista de turmas do aluno' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão (apenas Aluno)' })
  getMyClasses(@Request() req: AuthenticatedRequest) {
    return this.classesService.getMyClasses(req.user.id);
  }

  @Get('my-join-requests')
  @Roles(Role.ALUNO)
  @ApiOperation({
    summary: 'Listar minhas solicitações pendentes de entrada',
    description: 'Retorna as solicitações de turma que ainda aguardam aprovação.',
  })
  @ApiResponse({ status: 200, description: 'Lista de solicitações pendentes do aluno' })
  getMyJoinRequests(@Request() req: AuthenticatedRequest) {
    return this.classesService.getMyJoinRequests(req.user.id);
  }

  @Get('my-created-classes')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({
    summary: 'Listar turmas criadas pelo professor',
    description: 'Retorna todas as turmas criadas pelo professor logado',
  })
  @ApiResponse({ status: 200, description: 'Lista de turmas criadas' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão (apenas Professor/Admin)' })
  getMyCreatedClasses(@Request() req: AuthenticatedRequest) {
    return this.classesService.getMyCreatedClasses(req.user.id);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.PROFESSOR, Role.ALUNO)
  @ApiOperation({
    summary: 'Buscar turma por ID',
    description: 'Professores só podem acessar as próprias turmas.',
  })
  @ApiResponse({ status: 200, description: 'Turma encontrada' })
  @ApiResponse({ status: 403, description: 'Sem acesso a esta turma' })
  @ApiResponse({ status: 404, description: 'Turma não encontrada' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.classesService.findOne(id, req.user.id, req.user.role);
  }

  @Get(':id/settings')
  @Roles(Role.ADMIN, Role.PROFESSOR, Role.ALUNO)
  @ApiOperation({ summary: 'Buscar configurações da turma' })
  getSettings(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.classesService.getSettings(id, req.user.id, req.user.role);
  }

  @Patch(':id/settings')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'Atualizar configurações da turma' })
  updateSettings(
    @Param('id') id: string,
    @Body() dto: UpdateClassSettingsDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.classesService.updateSettings(id, dto, req.user.id, req.user.role);
  }

  @Get(':id/join-requests')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'Listar solicitações pendentes de entrada' })
  getJoinRequests(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.classesService.listJoinRequests(id, req.user.id, req.user.role);
  }

  @Post(':id/join-requests/:requestId/approve')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'Aprovar solicitação de entrada' })
  approveJoinRequest(
    @Param('id') id: string,
    @Param('requestId') requestId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.classesService.reviewJoinRequest(
      id,
      requestId,
      'approve',
      req.user.id,
      req.user.role,
    );
  }

  @Post(':id/join-requests/:requestId/reject')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'Rejeitar solicitação de entrada' })
  rejectJoinRequest(
    @Param('id') id: string,
    @Param('requestId') requestId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.classesService.reviewJoinRequest(
      id,
      requestId,
      'reject',
      req.user.id,
      req.user.role,
    );
  }

  @Get(':id/students')
  @Roles(Role.ADMIN, Role.PROFESSOR, Role.ALUNO)
  @ApiOperation({
    summary: 'Listar alunos da turma',
    description: 'Professores só podem acessar alunos das próprias turmas.',
  })
  @ApiResponse({ status: 200, description: 'Lista de alunos retornada' })
  @ApiResponse({ status: 403, description: 'Sem acesso a esta turma' })
  @ApiResponse({ status: 404, description: 'Turma não encontrada' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  findStudents(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.classesService.findStudentsByClass(id, req.user.id, req.user.role);
  }

  @Delete(':id/students/:userId')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({
    summary: 'Remover aluno da turma',
    description: 'Professores só podem remover alunos das próprias turmas.',
  })
  @ApiResponse({ status: 200, description: 'Aluno removido com sucesso' })
  @ApiResponse({ status: 403, description: 'Sem acesso a esta turma' })
  @ApiResponse({ status: 404, description: 'Turma ou matrícula não encontrada' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão (apenas Admin/Professor)' })
  unenrollStudent(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.classesService.unenrollStudent(id, userId, req.user.id, req.user.role);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({
    summary: 'Atualizar turma',
    description: 'Professores só podem editar as próprias turmas.',
  })
  @ApiBody({ type: UpdateClassDto })
  @ApiResponse({ status: 200, description: 'Turma atualizada com sucesso' })
  @ApiResponse({ status: 403, description: 'Sem acesso a esta turma' })
  @ApiResponse({ status: 404, description: 'Turma não encontrada' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  update(
    @Param('id') id: string,
    @Body() updateClassDto: UpdateClassDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.classesService.update(id, updateClassDto, req.user.id, req.user.role);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Remover turma',
    description: 'Remove permanentemente uma turma. Apenas Admin pode remover.',
  })
  @ApiResponse({ status: 200, description: 'Turma removida com sucesso' })
  @ApiResponse({ status: 404, description: 'Turma não encontrada' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão (apenas Admin)' })
  remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.classesService.remove(id, req.user.role);
  }
}
