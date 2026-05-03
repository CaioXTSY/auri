import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Difficulty } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export enum GeneratedMissionType {
  SEMANAL = 'SEMANAL',
  PERSONALIZADA = 'PERSONALIZADA',
}

export class GenerateMissionQuizDto {
  @ApiProperty({
    description: 'Tema central que a IA deve usar para gerar a questao',
    example: 'arrays e complexidade de algoritmos',
    maxLength: 120,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  theme: string;

  @ApiProperty({
    description: 'Dificuldade alvo da questao',
    enum: Difficulty,
    example: Difficulty.MEDIO,
  })
  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @ApiPropertyOptional({
    description: 'Linguagem de programacao preferida',
    example: 'Python',
    maxLength: 40,
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  language?: string;

  @ApiPropertyOptional({
    description: 'Publico alvo usado no prompt',
    example: 'alunos iniciantes de programacao',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  audience?: string;

  @ApiPropertyOptional({
    description: 'Objetivo pedagogico da questao',
    example: 'avaliar rastreamento de loops e indices',
    maxLength: 240,
  })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  learningObjective?: string;

  @ApiPropertyOptional({
    description: 'Instrucoes extras para a IA',
    example: 'inclua um trecho de codigo curto e evite pegadinhas de sintaxe',
    maxLength: 600,
  })
  @IsOptional()
  @IsString()
  @MaxLength(600)
  extraInstructions?: string;

  @ApiPropertyOptional({
    description: 'Tipo da missao criada. Questoes geradas pelo admin nao sao diarias.',
    enum: GeneratedMissionType,
    default: GeneratedMissionType.PERSONALIZADA,
  })
  @IsOptional()
  @IsEnum(GeneratedMissionType)
  type?: GeneratedMissionType;

  @ApiPropertyOptional({
    description: 'Pontos da missao. Se omitido, sera calculado pela dificuldade.',
    example: 100,
    minimum: 0,
    maximum: 1000,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  points?: number;

  @ApiPropertyOptional({
    description: 'Inicio da disponibilidade. Padrao: agora.',
    example: '2026-05-03T12:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

}
