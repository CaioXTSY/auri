import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SubmissionStatus } from '@prisma/client';

export class UpdateSubmissionDto {
  @ApiPropertyOptional({
    description: 'Status da submissão',
    enum: SubmissionStatus,
    example: 'APROVADO',
  })
  @IsOptional()
  @IsEnum(SubmissionStatus)
  status?: SubmissionStatus;

  @ApiPropertyOptional({
    description: 'Resultado da execução',
    example: 'Todos os casos de teste passaram!',
  })
  @IsOptional()
  result?: string;

  @ApiPropertyOptional({
    description: 'Pontos conquistados',
    example: 100,
  })
  @IsOptional()
  pointsEarned?: number;
}
