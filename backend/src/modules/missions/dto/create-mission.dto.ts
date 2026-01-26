import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsInt, Min, IsDateString, IsOptional, IsUUID } from 'class-validator';

export enum MissionType {
  DIARIA = 'DIARIA',
  SEMANAL = 'SEMANAL',
  PERSONALIZADA = 'PERSONALIZADA',
}

export class CreateMissionDto {
  @ApiProperty({ description: 'Título da missão', example: 'Complete 5 exercícios' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Descrição detalhada da missão', example: 'Complete 5 exercícios de lógica para ganhar pontos extras' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ 
    description: 'Tipo da missão', 
    enum: MissionType,
    example: MissionType.DIARIA
  })
  @IsEnum(MissionType)
  type: MissionType;

  @ApiProperty({ description: 'Pontos de recompensa', example: 100, minimum: 0 })
  @IsInt()
  @Min(0)
  points: number;

  @ApiProperty({ description: 'Data de início (ISO 8601)', example: '2024-01-26T00:00:00Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Data de término (ISO 8601)', example: '2024-01-27T23:59:59Z' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'ID da turma (null = para todos)', example: 'uuid-da-turma' })
  @IsOptional()
  @IsUUID()
  classId?: string;
}
