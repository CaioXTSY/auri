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
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
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
  @ApiResponse({
    status: 200,
    description: 'Lista de notificações paginada',
    schema: {
      example: {
        data: [
          {
            id: 'uuid-notification',
            userId: 'uuid-user',
            type: 'SISTEMA',
            title: 'Nova atividade disponível',
            message: 'A atividade FizzBuzz foi publicada na sua turma.',
            read: false,
            createdAt: '2026-03-14T10:00:00.000Z',
          },
        ],
        meta: {
          page: 1,
          limit: 10,
          total: 34,
          totalPages: 4,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
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
  @ApiResponse({
    status: 200,
    description: 'Quantidade de notificações não lidas',
    schema: {
      example: 5,
    },
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  getUnreadCount(@Request() req) {
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  @Patch(':id/read')
  @Roles(Role.ALUNO, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Marcar notificação como lida' })
  @ApiParam({
    name: 'id',
    description: 'ID da notificação',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Notificação marcada como lida',
    schema: {
      example: {
        id: 'uuid-notification',
        userId: 'uuid-user',
        type: 'SISTEMA',
        title: 'Nova atividade disponível',
        message: 'A atividade FizzBuzz foi publicada na sua turma.',
        read: true,
        createdAt: '2026-03-14T10:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Notificação não encontrada' })
  markAsRead(@Request() req, @Param('id') id: string) {
    return this.notificationsService.markAsRead(req.user.id, id);
  }

  @Patch('read-all')
  @Roles(Role.ALUNO, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Marcar todas como lidas' })
  @ApiResponse({
    status: 200,
    description: 'Todas as notificações não lidas foram marcadas como lidas',
    schema: {
      example: {
        message: 'Notificações marcadas como lidas',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @Delete(':id')
  @Roles(Role.ALUNO, Role.PROFESSOR, Role.ADMIN)
  @ApiOperation({ summary: 'Remover notificação' })
  @ApiParam({
    name: 'id',
    description: 'ID da notificação',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Notificação removida com sucesso',
    schema: {
      example: {
        message: 'Notificação removida',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Notificação não encontrada' })
  remove(@Request() req, @Param('id') id: string) {
    return this.notificationsService.deleteNotification(req.user.id, id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @ApiOperation({ summary: 'Criar notificação manual' })
  @ApiBody({ type: CreateNotificationDto })
  @ApiResponse({
    status: 201,
    description: 'Notificação criada com sucesso',
    schema: {
      example: {
        id: 'uuid-notification',
        userId: 'uuid-user',
        type: 'SISTEMA',
        title: 'Lembrete de entrega',
        message: 'Você possui atividade com prazo para hoje.',
        read: false,
        createdAt: '2026-03-14T10:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão (apenas Admin/Professor)' })
  create(@Body() body: CreateNotificationDto, @Request() req) {
    return this.notificationsService.createNotification(body, req.user);
  }
}
