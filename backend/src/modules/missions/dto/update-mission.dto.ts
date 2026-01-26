import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsInt, Min, IsDateString, IsOptional, IsUUID } from 'class-validator';
import { MissionType } from './create-mission.dto';

export class UpdateMissionDto {
  @ApiPropertyOptional({ description: 'Título da missão', example: 'Complete 5 exercícios' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Descrição detalhada da missão', example: 'Complete 5 exercícios de lógica para ganhar pontos extras' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ 
    description: 'Tipo da missão', 
    enum: MissionType,
    example: MissionType.DIARIA
  })
  @IsOptional()
  @IsEnum(MissionType)
  type?: MissionType;

  @ApiPropertyOptional({ description: 'Pontos de recompensa', example: 100, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  points?: number;

  @ApiPropertyOptional({ description: 'Data de início (ISO 8601)', example: '2024-01-26T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data de término (ISO 8601)', example: '2024-01-27T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'ID da turma (null = para todos)', example: 'uuid-da-turma' })
  @IsOptional()
  @IsUUID()
  classId?: string;
}
