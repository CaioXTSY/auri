import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsOptional,
  IsIn,
} from 'class-validator';

export class CreateAchievementDto {
  @ApiProperty({
    description: 'Nome da conquista',
    example: 'Primeira Submissão',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Descrição da conquista',
    example: 'Completou sua primeira atividade',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Ícone da conquista (emoji ou URL)',
    example: '🎯',
    required: false,
  })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({
    description: 'Categoria da conquista',
    example: 'SUBMISSÕES',
    enum: [
      'SUBMISSÕES',
      'PONTOS',
      'NÍVEIS',
      'SEQUÊNCIA',
      'TEMPO',
      'SOCIAL',
      'ESPECIAL',
    ],
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({
    description: 'Pontos que a conquista concede',
    example: 50,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  points: number;

  @ApiProperty({
    description: 'Raridade da conquista',
    example: 'RARO',
    enum: ['COMUM', 'INCOMUM', 'RARO', 'ÉPICO', 'LENDÁRIO'],
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['COMUM', 'INCOMUM', 'RARO', 'ÉPICO', 'LENDÁRIO'])
  rarity?: string;

  @ApiProperty({
    description: 'Condição para desbloquear (identificador)',
    example: 'FIRST_SUBMISSION',
  })
  @IsString()
  @IsNotEmpty()
  condition: string;

  @ApiProperty({
    description: 'Critérios detalhados em JSON',
    example: '{"type":"submission_count","value":1}',
    required: false,
  })
  @IsString()
  @IsOptional()
  criteria?: string;
}
