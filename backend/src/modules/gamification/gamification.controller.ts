import {
  Controller,
  Get,
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
  GetRankingQueryDto,
} from './dto';

@ApiTags('gamification')
@ApiBearerAuth()
@Controller('gamification')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  /**
   * NÍVEIS
   */

  @Get('level/me')
  @Roles(Role.ALUNO)
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

  /**
   * CONQUISTAS
   */

  @Get('achievements/me')
  @Roles(Role.ALUNO)
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

  /**
   * RANKING
   */

  @Get('ranking')
  @Roles(Role.ALUNO, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Obter ranking' })
  @ApiQuery({
    name: 'type',
    enum: ['GLOBAL', 'TURMA'],
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

  /**
   * DASHBOARD
   */

  @Get('stats/me')
  @Roles(Role.ALUNO)
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
