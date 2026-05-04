import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MissionsService } from './missions.service';
import { CreateMissionDto } from './dto/create-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';
import { AnswerQuizDto } from './dto/answer-quiz.dto';
import { QueryMissionsDto } from './dto/query-missions.dto';
import { QueryUserMissionsDto } from './dto/query-user-missions.dto';
import { GenerateMissionQuizDto } from './dto/generate-mission-quiz.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('missions')
@Controller('missions')
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Post()
  @Roles('ADMIN', 'PROFESSOR')
  @ApiOperation({ summary: 'Criar nova missão (Admin/Professor)' })
  @ApiBody({ type: CreateMissionDto })
  @ApiResponse({ status: 201, description: 'Missão criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos para criação de missão' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  create(@Body() createMissionDto: CreateMissionDto, @Request() req) {
    return this.missionsService.create(createMissionDto, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Post('generate-quiz')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Gerar questao com IA e criar missao global (Admin)' })
  @ApiBody({ type: GenerateMissionQuizDto })
  @ApiResponse({ status: 201, description: 'Missao com quiz gerada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados invalidos ou falha na geracao' })
  @ApiResponse({ status: 401, description: 'Nao autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissao' })
  generateQuizMission(@Body() generateMissionQuizDto: GenerateMissionQuizDto, @Request() req) {
    return this.missionsService.generateQuizMission(generateMissionQuizDto, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Get()
  @Roles('ADMIN', 'PROFESSOR')
  @ApiOperation({ summary: 'Listar todas as missões com filtros (Admin/Professor)' })
  @ApiResponse({ status: 200, description: 'Lista de missões retornada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  findAll(@Query() query: QueryMissionsDto, @Request() req) {
    return this.missionsService.findAll(query, req.user.id, req.user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ALUNO', 'PROFESSOR', 'ADMIN')
  @ApiBearerAuth()
  @Get('daily-quiz')
  @ApiOperation({ summary: 'Obter quiz diário da plataforma' })
  @ApiResponse({ status: 200, description: 'Quiz diário retornado com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 404, description: 'Quiz diário não encontrado' })
  getDailyQuiz() {
    return this.missionsService.getDailyQuiz();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ALUNO', 'PROFESSOR', 'ADMIN')
  @ApiBearerAuth()
  @Get('daily-quiz/me')
  @ApiOperation({ summary: 'Obter quiz diário com tentativa do usuário' })
  @ApiResponse({ status: 200, description: 'Quiz diário do usuário retornado com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  getDailyQuizForUser(@Request() req) {
    return this.missionsService.getDailyQuizForUser(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('available')
  @Roles('ALUNO')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar missões disponíveis para o aluno' })
  @ApiQuery({ name: 'classId', required: false, description: 'Filtrar por turma' })
  @ApiResponse({ status: 200, description: 'Lista de missões disponíveis retornada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Apenas alunos podem acessar' })
  getAvailableMissions(@Request() req, @Query('classId') classId?: string) {
    return this.missionsService.getAvailableMissions(req.user.id, classId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('my-missions')
  @Roles('ALUNO')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Histórico de missões do aluno' })
  @ApiResponse({ status: 200, description: 'Histórico de missões retornado com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Apenas alunos podem acessar' })
  getMyMissions(
    @Request() req,
    @Query() query: QueryUserMissionsDto,
  ) {
    return this.missionsService.getUserMissionHistory(req.user.id, query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('my-stats')
  @Roles('ALUNO')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Estatísticas de missões do aluno' })
  @ApiResponse({ status: 200, description: 'Estatísticas do aluno retornadas com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Apenas alunos podem acessar' })
  getMyStats(@Request() req) {
    return this.missionsService.getUserMissionStats(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Get(':id')
  @Roles('ADMIN', 'PROFESSOR')
  @ApiOperation({ summary: 'Buscar missão por ID' })
  @ApiResponse({ status: 200, description: 'Missão retornada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 404, description: 'Missão não encontrada' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.missionsService.findOne(id, req.user.id, req.user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Patch(':id')
  @Roles('ADMIN', 'PROFESSOR')
  @ApiOperation({ summary: 'Atualizar missão (Admin/Professor)' })
  @ApiBody({ type: UpdateMissionDto })
  @ApiResponse({ status: 200, description: 'Missão atualizada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos para atualização' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Missão não encontrada' })
  update(@Param('id') id: string, @Body() updateMissionDto: UpdateMissionDto, @Request() req) {
    return this.missionsService.update(id, updateMissionDto, req.user.id, req.user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Delete(':id')
  @Roles('ADMIN', 'PROFESSOR')
  @ApiOperation({ summary: 'Deletar missão (Admin/Professor)' })
  @ApiResponse({ status: 200, description: 'Missão deletada com sucesso' })
  @ApiResponse({ status: 400, description: 'Missão possui usuários em progresso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Missão não encontrada' })
  remove(@Param('id') id: string, @Request() req) {
    return this.missionsService.remove(id, req.user.id, req.user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Post(':id/start')
  @Roles('ALUNO')
  @ApiOperation({ summary: 'Iniciar missão (Aluno)' })
  @ApiResponse({ status: 201, description: 'Missão iniciada com sucesso' })
  @ApiResponse({ status: 400, description: 'Missão indisponível para início' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Apenas alunos podem acessar' })
  @ApiResponse({ status: 404, description: 'Missão não encontrada' })
  startMission(@Param('id') id: string, @Request() req) {
    return this.missionsService.startMission(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Get(':id/quiz')
  @ApiOperation({ summary: 'Obter quiz da missão' })
  @ApiResponse({ status: 200, description: 'Quiz da missão retornado com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Não matriculado na turma' })
  @ApiResponse({ status: 404, description: 'Quiz da missão não encontrado' })
  getMissionQuiz(@Param('id') id: string, @Request() req) {
    return this.missionsService.getMissionQuiz(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Get(':id/quiz/admin')
  @Roles('ADMIN', 'PROFESSOR')
  @ApiOperation({ summary: 'Obter quiz completo da missão para revisão (Admin/Professor)' })
  @ApiResponse({ status: 200, description: 'Quiz completo retornado com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Quiz da missão não encontrado' })
  getMissionQuizDetails(@Param('id') id: string, @Request() req) {
    return this.missionsService.getMissionQuizDetails(id, req.user.id, req.user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Post(':id/quiz/answer')
  @Roles('ALUNO')
  @ApiOperation({ summary: 'Responder quiz da missão (Aluno)' })
  @ApiBody({ type: AnswerQuizDto })
  @ApiResponse({ status: 201, description: 'Resposta registrada com sucesso' })
  @ApiResponse({ status: 400, description: 'Resposta inválida ou missão indisponível' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Apenas alunos podem acessar' })
  @ApiResponse({ status: 404, description: 'Quiz não encontrado' })
  answerMissionQuiz(
    @Param('id') id: string,
    @Request() req,
    @Body() answerQuizDto: AnswerQuizDto,
  ) {
    return this.missionsService.answerMissionQuiz(id, req.user.id, answerQuizDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Post(':id/complete')
  @Roles('ALUNO')
  @ApiOperation({ summary: 'Completar missão (Aluno)' })
  @ApiResponse({ status: 200, description: 'Missão concluída com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Apenas alunos podem acessar' })
  @ApiResponse({ status: 404, description: 'Missão não encontrada' })
  completeMission(@Param('id') id: string, @Request() req) {
    return this.missionsService.completeMission(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Get('user/:userId/history')
  @Roles('ADMIN', 'PROFESSOR')
  @ApiOperation({ summary: 'Ver histórico de missões de um usuário (Admin/Professor)' })
  @ApiResponse({ status: 200, description: 'Histórico do usuário retornado com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  getUserHistory(
    @Param('userId') userId: string,
    @Query() query: QueryUserMissionsDto,
  ) {
    return this.missionsService.getUserMissionHistory(userId, query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Get('user/:userId/stats')
  @Roles('ADMIN', 'PROFESSOR')
  @ApiOperation({ summary: 'Ver estatísticas de missões de um usuário (Admin/Professor)' })
  @ApiResponse({ status: 200, description: 'Estatísticas do usuário retornadas com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  getUserStats(@Param('userId') userId: string) {
    return this.missionsService.getUserMissionStats(userId);
  }
}
