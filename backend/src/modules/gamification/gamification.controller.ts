import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import {
  AddPointsDto,
  CreateAchievementDto,
  GetRankingQueryDto,
} from './dto';

@ApiTags('gamification')
@ApiBearerAuth()
@Controller('gamification')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  /**
   * PONTOS
   */

  @Get('points/me')
  @Roles(Role.ALUNO, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Obter meus pontos totais' })
  @ApiResponse({ status: 200, description: 'Pontos do usuário' })
  async getMyPoints(@Request() req) {
    const totalPoints = await this.gamificationService.getUserTotalPoints(
      req.user.id,
    );
    return { userId: req.user.id, totalPoints };
  }

  @Get('stats/me')
  @Roles(Role.ALUNO, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Obter estatísticas do usuário' })
  @ApiResponse({ status: 200, description: 'Estatísticas do usuário' })
  async getMyStats(@Request() req) {
    return this.gamificationService.getUserStats(req.user.id);
  }

  @Get('points/history')
  @Roles(Role.ALUNO, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Obter histórico de pontos' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Histórico de pontos' })
  async getMyPointsHistory(@Request() req, @Query('limit') limit?: number) {
    return this.gamificationService.getUserPointsHistory(
      req.user.id,
      limit ? parseInt(limit as any) : 50,
    );
  }

  @Post('points/add')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({
    summary: 'Adicionar pontos manualmente',
    description: 'Apenas Admin e Professor podem adicionar pontos manualmente',
  })
  @ApiResponse({ status: 201, description: 'Pontos adicionados com sucesso' })
  async addPoints(@Body() addPointsDto: AddPointsDto) {
    return this.gamificationService.addPoints(
      addPointsDto.userId,
      addPointsDto.points,
      addPointsDto.source,
      addPointsDto.description,
      addPointsDto.referenceId,
    );
  }

  /**
   * NÍVEIS
   */

  @Get('level/me')
  @Roles(Role.ALUNO, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Obter meu nível atual' })
  @ApiResponse({
    status: 200,
    description: 'Informações de nível',
    schema: {
      example: {
        userId: 'uuid',
        totalPoints: 1250,
        currentLevel: 3,
        levelName: 'Desenvolvedor (Nível 3)',
        pointsInCurrentLevel: 350,
        pointsNeededForNextLevel: 250,
        progressToNextLevel: 58.33,
      },
    },
  })
  async getMyLevel(@Request() req) {
    return this.gamificationService.getUserLevel(req.user.id);
  }

  @Get('level/:userId')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Obter nível de um usuário' })
  @ApiParam({ name: 'userId', type: String })
  @ApiResponse({ status: 200, description: 'Nível do usuário' })
  async getUserLevel(@Param('userId') userId: string) {
    return this.gamificationService.getUserLevel(userId);
  }

  /**
   * CONQUISTAS
   */

  @Get('achievements')
  @Roles(Role.ALUNO, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Listar todas as conquistas disponíveis' })
  @ApiResponse({ status: 200, description: 'Lista de conquistas' })
  async getAllAchievements() {
    return this.gamificationService.getAllAchievements();
  }

  @Get('achievements/me')
  @Roles(Role.ALUNO, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Obter minhas conquistas (paginado)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'filter',
    required: false,
    enum: ['ALL', 'UNLOCKED', 'LOCKED'],
  })
  @ApiResponse({
    status: 200,
    description: 'Conquistas do usuário paginadas',
    schema: {
      example: {
        data: [
          {
            id: 'uuid',
            name: 'Primeira Submissão',
            description: 'Completou sua primeira atividade',
            icon: '🎯',
            category: 'SUBMISSÕES',
            points: 10,
            rarity: 'COMUM',
            unlockedAt: '2024-01-26T00:00:00.000Z',
            isUnlocked: true,
          },
        ],
        meta: {
          total: 50,
          page: 1,
          limit: 10,
          totalPages: 5,
          hasNextPage: true,
          totalUnlocked: 5,
          totalAchievements: 50,
        },
      },
    },
  })
  async getMyAchievements(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('filter') filter?: 'ALL' | 'UNLOCKED' | 'LOCKED',
  ) {
    return this.gamificationService.getUserAchievements(
      req.user.id,
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
      filter || 'ALL',
    );
  }

  @Post('achievements')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Criar nova conquista',
    description: 'Apenas Admin pode criar conquistas',
  })
  @ApiResponse({ status: 201, description: 'Conquista criada' })
  async createAchievement(@Body() createAchievementDto: CreateAchievementDto) {
    return this.gamificationService.createAchievement(createAchievementDto);
  }

  @Post('achievements/:achievementId/unlock/:userId')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Desbloquear conquista para usuário',
    description: 'Apenas Admin',
  })
  @ApiParam({ name: 'achievementId', type: String })
  @ApiParam({ name: 'userId', type: String })
  @ApiResponse({ status: 201, description: 'Conquista desbloqueada' })
  async unlockAchievement(
    @Param('achievementId') achievementId: string,
    @Param('userId') userId: string,
  ) {
    return this.gamificationService.unlockAchievement(userId, achievementId);
  }

  /**
   * RANKING
   */

  @Get('ranking')
  @Roles(Role.ALUNO, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Obter ranking' })
  @ApiQuery({
    name: 'type',
    enum: ['GLOBAL', 'DISCIPLINA', 'TURMA'],
    required: true,
  })
  @ApiQuery({ name: 'referenceId', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Ranking',
    schema: {
      example: [
        {
          position: 1,
          points: 5000,
          user: {
            id: 'uuid',
            name: 'João Silva',
            email: 'joao@example.com',
            avatar: 'url',
          },
        },
      ],
    },
  })
  async getRanking(@Query() query: GetRankingQueryDto) {
    return this.gamificationService.getRanking(
      query.type,
      query.referenceId,
      query.limit || 50,
    );
  }

  @Get('ranking/me')
  @Roles(Role.ALUNO, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Obter minha posição no ranking' })
  @ApiQuery({
    name: 'type',
    enum: ['GLOBAL', 'DISCIPLINA', 'TURMA'],
    required: true,
  })
  @ApiQuery({ name: 'referenceId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Posição no ranking' })
  async getMyRankingPosition(
    @Request() req,
    @Query('type') type: 'GLOBAL' | 'DISCIPLINA' | 'TURMA',
    @Query('referenceId') referenceId?: string,
  ) {
    return this.gamificationService.getUserRankingPosition(
      req.user.id,
      type,
      referenceId,
    );
  }

  @Post('ranking/update/global')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Atualizar ranking global',
    description: 'Apenas Admin - executar periodicamente',
  })
  @ApiResponse({ status: 200, description: 'Ranking atualizado' })
  async updateGlobalRanking() {
    await this.gamificationService.updateGlobalRanking();
    return { message: 'Ranking global atualizado com sucesso' };
  }

  @Post('ranking/update/class/:classId')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'Atualizar ranking de turma' })
  @ApiParam({ name: 'classId', type: String })
  @ApiResponse({ status: 200, description: 'Ranking atualizado' })
  async updateClassRanking(@Param('classId') classId: string) {
    await this.gamificationService.updateClassRanking(classId);
    return { message: 'Ranking da turma atualizado com sucesso' };
  }

  /**
   * DASHBOARD
   */

  @Get('stats/me')
  @Roles(Role.ALUNO, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({
    summary: 'Obter estatísticas completas de gamificação',
    description:
      'Dashboard com pontos, nível, conquistas e ranking do usuário',
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas de gamificação',
    schema: {
      example: {
        points: { total: 1250 },
        level: {
          userId: 'uuid',
          totalPoints: 1250,
          currentLevel: 3,
          levelName: 'Desenvolvedor (Nível 3)',
          pointsInCurrentLevel: 350,
          pointsNeededForNextLevel: 250,
          progressToNextLevel: 58.33,
        },
        achievements: {
          unlocked: 5,
          total: 50,
          progress: 10,
        },
        ranking: {
          global: 42,
          points: 1250,
        },
      },
    },
  })
  async getMyGamificationStats(@Request() req) {
    return this.gamificationService.getUserGamificationStats(req.user.id);
  }

  @Get('stats/:userId')
  @Roles(Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Obter estatísticas de um usuário' })
  @ApiParam({ name: 'userId', type: String })
  @ApiResponse({ status: 200, description: 'Estatísticas do usuário' })
  async getUserGamificationStats(@Param('userId') userId: string) {
    return this.gamificationService.getUserGamificationStats(userId);
  }
}
