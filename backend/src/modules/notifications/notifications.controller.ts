import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  Request,
  UseGuards,
  Post,
  Body,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @Roles(Role.ALUNO, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Listar notificações do usuário' })
  @ApiResponse({ status: 200, description: 'Lista de notificações' })
  getNotifications(@Request() req, @Query() query: QueryNotificationsDto) {
    return this.notificationsService.getNotifications(
      req.user.id,
      query.page,
      query.limit,
    );
  }

  @Get('unread')
  @Roles(Role.ALUNO, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Total de notificações não lidas' })
  getUnreadCount(@Request() req) {
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  @Patch(':id/read')
  @Roles(Role.ALUNO, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Marcar notificação como lida' })
  markAsRead(@Request() req, @Param('id') id: string) {
    return this.notificationsService.markAsRead(req.user.id, id);
  }

  @Patch('read-all')
  @Roles(Role.ALUNO, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Marcar todas como lidas' })
  markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @Delete(':id')
  @Roles(Role.ALUNO, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Remover notificação' })
  remove(@Request() req, @Param('id') id: string) {
    return this.notificationsService.deleteNotification(req.user.id, id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'Criar notificação manual' })
  create(@Body() body: CreateNotificationDto) {
    return this.notificationsService.createNotification(body);
  }
}
