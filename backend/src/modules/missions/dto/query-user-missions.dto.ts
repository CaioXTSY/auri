import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
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

  @ApiPropertyOptional({ description: 'Página (começa em 1)', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Itens por página (máx 100)', example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
