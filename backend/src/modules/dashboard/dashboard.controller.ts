import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { AuthenticatedRequest } from '../../common/types/authenticated-request';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('teacher')
  @Roles(Role.PROFESSOR)
  @ApiOperation({ summary: 'Resumo das turmas e entregas recentes do professor' })
  getTeacherDashboard(@Request() req: AuthenticatedRequest) {
    return this.dashboardService.getTeacherDashboard(req.user.id);
  }

  @Get('student')
  @Roles(Role.ALUNO)
  @ApiOperation({ summary: 'Resumo agregado do aluno' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard agregado do aluno',
  })
  getStudentDashboard(@Request() req: AuthenticatedRequest) {
    return this.dashboardService.getStudentDashboard(req.user.id);
  }
}
