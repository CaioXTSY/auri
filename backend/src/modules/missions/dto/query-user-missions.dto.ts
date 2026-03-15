import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { MissionStatus } from './update-progress.dto';

export class QueryUserMissionsDto {
  @ApiPropertyOptional({
    description: 'Filtrar por status do progresso da missão',
    enum: MissionStatus,
    example: MissionStatus.EM_PROGRESSO,
  })
  @IsOptional()
  @IsEnum(MissionStatus)
  status?: MissionStatus;

  @ApiPropertyOptional({
    description: 'Filtrar por turma',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  classId?: string;
}
