import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, Min, Max, IsOptional, IsEnum } from 'class-validator';

export enum MissionStatus {
  NAO_INICIADA = 'NAO_INICIADA',
  EM_PROGRESSO = 'EM_PROGRESSO',
  CONCLUIDA = 'CONCLUIDA',
  EXPIRADA = 'EXPIRADA',
}

export class UpdateProgressDto {
  @ApiProperty({ 
    description: 'Progresso da missão (0-100%)', 
    example: 60,
    minimum: 0,
    maximum: 100
  })
  @IsInt()
  @Min(0)
  @Max(100)
  progress: number;

  @ApiPropertyOptional({ 
    description: 'Status da missão', 
    enum: MissionStatus,
    example: MissionStatus.EM_PROGRESSO
  })
  @IsOptional()
  @IsEnum(MissionStatus)
  status?: MissionStatus;
}
