import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Verifica a disponibilidade da API e do banco de dados' })
  async check() {
    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'unavailable',
        timestamp: new Date().toISOString(),
      });
    }

    return {
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    };
  }
}
