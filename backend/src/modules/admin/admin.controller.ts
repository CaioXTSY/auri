import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { NotificationsService } from '../notifications/notifications.service';
import { AdminService } from './admin.service';
import { BroadcastNotificationDto } from './dto/broadcast-notification.dto';
import { CreateAchievementDto } from './dto/create-achievement.dto';
import { UpdateAchievementDto } from './dto/update-achievement.dto';
import { ListAIGenerationsDto } from './dto/list-ai-generations.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Visão geral da plataforma' })
  getStats() {
    return this.adminService.getStats();
  }

  @Get('stats/timeseries')
  @ApiOperation({ summary: 'Séries diárias (usuários, missões, quiz) dos últimos 30 dias' })
  getTimeseries() {
    return this.adminService.getTimeseries(30);
  }

  @Get('stats/top')
  @ApiOperation({ summary: 'Top 5 turmas e conquistas' })
  getTopLists() {
    return this.adminService.getTopLists();
  }

  @Get('ai-generations')
  @ApiOperation({ summary: 'Listar gerações de IA (auditoria)' })
  listAIGenerations(@Query() query: ListAIGenerationsDto) {
    return this.adminService.listAIGenerations(query);
  }

  @Get('ai-generations/:id')
  @ApiOperation({ summary: 'Detalhe de uma geração de IA' })
  getAIGeneration(@Param('id') id: string) {
    return this.adminService.getAIGeneration(id);
  }

  @Get('achievements')
  @ApiOperation({ summary: 'Listar conquistas cadastradas' })
  listAchievements() {
    return this.adminService.listAchievements();
  }

  @Post('achievements')
  @ApiOperation({ summary: 'Criar conquista' })
  createAchievement(@Body() dto: CreateAchievementDto) {
    return this.adminService.createAchievement(dto);
  }

  @Patch('achievements/:id')
  @ApiOperation({ summary: 'Atualizar conquista' })
  updateAchievement(@Param('id') id: string, @Body() dto: UpdateAchievementDto) {
    return this.adminService.updateAchievement(id, dto);
  }

  @Delete('achievements/:id')
  @ApiOperation({ summary: 'Remover conquista' })
  deleteAchievement(@Param('id') id: string) {
    return this.adminService.deleteAchievement(id);
  }

  @Post('notifications/broadcast')
  @ApiOperation({ summary: 'Enviar notificação para todos ou por role' })
  broadcastNotification(@Body() dto: BroadcastNotificationDto) {
    return this.notificationsService.createBroadcast(dto);
  }
}
