import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { MissionType } from './create-mission.dto';

export class QueryMissionsDto {
  @ApiPropertyOptional({
    description: 'Filtrar por turma',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de missão',
    enum: MissionType,
    example: MissionType.DIARIA,
  })
  @IsOptional()
  @IsEnum(MissionType)
  type?: MissionType;

  @ApiPropertyOptional({
    description: 'Retornar apenas missões ativas no período atual',
    example: true,
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  active?: boolean;
}
