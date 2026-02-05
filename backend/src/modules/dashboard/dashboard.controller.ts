import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('student')
  @Roles(Role.ALUNO)
  @ApiOperation({ summary: 'Resumo agregado do aluno' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard agregado do aluno',
  })
  getStudentDashboard(@Request() req) {
    return this.dashboardService.getStudentDashboard(req.user.id);
  }
}
