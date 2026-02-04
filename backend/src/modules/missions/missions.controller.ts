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
import { UpdateProgressDto } from './dto/update-progress.dto';
import { AnswerQuizDto } from './dto/answer-quiz.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Missions')
@Controller('missions')
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  @Roles('ADMIN', 'PROFESSOR')
  @ApiOperation({ summary: 'Criar nova missão (Admin/Professor)' })
  create(@Body() createMissionDto: CreateMissionDto, @Request() req) {
    return this.missionsService.create(createMissionDto, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  @Roles('ADMIN', 'PROFESSOR')
  @ApiOperation({ summary: 'Listar todas as missões com filtros (Admin/Professor)' })
  @ApiQuery({ name: 'classId', required: false, description: 'Filtrar por turma' })
  @ApiQuery({ name: 'type', required: false, enum: ['DIARIA', 'SEMANAL', 'PERSONALIZADA'] })
  @ApiQuery({ name: 'active', required: false, type: Boolean, description: 'Apenas missões ativas' })
  findAll(
    @Query('classId') classId?: string,
    @Query('type') type?: 'DIARIA' | 'SEMANAL' | 'PERSONALIZADA',
    @Query('active') active?: string,
  ) {
    return this.missionsService.findAll({
      classId,
      type,
      active: active === 'true',
    });
  }

  @Get('daily-quiz')
  @ApiOperation({ summary: 'Obter quiz diário da plataforma' })
  getDailyQuiz() {
    return this.missionsService.getDailyQuiz();
  }

  @Get('available')
  @ApiOperation({ summary: 'Listar missões disponíveis para o aluno' })
  @ApiQuery({ name: 'classId', required: false, description: 'Filtrar por turma' })
  getAvailableMissions(@Request() req, @Query('classId') classId?: string) {
    return this.missionsService.getAvailableMissions(req.user?.id, classId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('my-missions')
  @Roles('ALUNO')
  @ApiOperation({ summary: 'Histórico de missões do aluno' })
  @ApiQuery({ name: 'status', required: false, enum: ['NAO_INICIADA', 'EM_PROGRESSO', 'CONCLUIDA', 'EXPIRADA'] })
  @ApiQuery({ name: 'classId', required: false })
  getMyMissions(
    @Request() req,
    @Query('status') status?: 'NAO_INICIADA' | 'EM_PROGRESSO' | 'CONCLUIDA' | 'EXPIRADA',
    @Query('classId') classId?: string,
  ) {
    return this.missionsService.getUserMissionHistory(req.user.id, { status, classId });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('my-stats')
  @Roles('ALUNO')
  @ApiOperation({ summary: 'Estatísticas de missões do aluno' })
  getMyStats(@Request() req) {
    return this.missionsService.getUserMissionStats(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Buscar missão por ID' })
  findOne(@Param('id') id: string) {
    return this.missionsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  @Roles('ADMIN', 'PROFESSOR')
  @ApiOperation({ summary: 'Atualizar missão (Admin/Professor)' })
  update(@Param('id') id: string, @Body() updateMissionDto: UpdateMissionDto) {
    return this.missionsService.update(id, updateMissionDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  @Roles('ADMIN', 'PROFESSOR')
  @ApiOperation({ summary: 'Deletar missão (Admin/Professor)' })
  remove(@Param('id') id: string) {
    return this.missionsService.remove(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':id/start')
  @Roles('ALUNO')
  @ApiOperation({ summary: 'Iniciar missão (Aluno)' })
  startMission(@Param('id') id: string, @Request() req) {
    return this.missionsService.startMission(id, req.user.id);
  }

  @Get(':id/quiz')
  @ApiOperation({ summary: 'Obter quiz da missão' })
  getMissionQuiz(@Param('id') id: string) {
    return this.missionsService.getMissionQuiz(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':id/quiz/answer')
  @Roles('ALUNO')
  @ApiOperation({ summary: 'Responder quiz da missão (Aluno)' })
  answerMissionQuiz(
    @Param('id') id: string,
    @Request() req,
    @Body() answerQuizDto: AnswerQuizDto,
  ) {
    return this.missionsService.answerMissionQuiz(id, req.user.id, answerQuizDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id/progress')
  @Roles('ALUNO')
  @ApiOperation({ summary: 'Atualizar progresso da missão (Aluno)' })
  updateProgress(
    @Param('id') id: string,
    @Request() req,
    @Body() updateProgressDto: UpdateProgressDto,
  ) {
    return this.missionsService.updateProgress(id, req.user.id, updateProgressDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':id/complete')
  @Roles('ALUNO')
  @ApiOperation({ summary: 'Completar missão (Aluno)' })
  completeMission(@Param('id') id: string, @Request() req) {
    return this.missionsService.completeMission(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('user/:userId/history')
  @Roles('ADMIN', 'PROFESSOR')
  @ApiOperation({ summary: 'Ver histórico de missões de um usuário (Admin/Professor)' })
  @ApiQuery({ name: 'status', required: false, enum: ['NAO_INICIADA', 'EM_PROGRESSO', 'CONCLUIDA', 'EXPIRADA'] })
  @ApiQuery({ name: 'classId', required: false })
  getUserHistory(
    @Param('userId') userId: string,
    @Query('status') status?: 'NAO_INICIADA' | 'EM_PROGRESSO' | 'CONCLUIDA' | 'EXPIRADA',
    @Query('classId') classId?: string,
  ) {
    return this.missionsService.getUserMissionHistory(userId, { status, classId });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('user/:userId/stats')
  @Roles('ADMIN', 'PROFESSOR')
  @ApiOperation({ summary: 'Ver estatísticas de missões de um usuário (Admin/Professor)' })
  getUserStats(@Param('userId') userId: string) {
    return this.missionsService.getUserMissionStats(userId);
  }
}
