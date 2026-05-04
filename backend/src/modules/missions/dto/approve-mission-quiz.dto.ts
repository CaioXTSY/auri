import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Difficulty } from '@prisma/client';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { GeneratedMissionType } from './generate-mission-quiz.dto';

export class ApproveMissionQuizDto {
  @ApiPropertyOptional({ description: 'ID da geração de IA criada na prévia' })
  @IsOptional()
  @IsUUID()
  aiGenerationId?: string;

  @ApiProperty({ description: 'Título da questão', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({ description: 'Enunciado da questão' })
  @IsString()
  question: string;

  @ApiProperty({ enum: Difficulty })
  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @ApiProperty({ description: 'Alternativas', type: [String] })
  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @IsString({ each: true })
  options: string[];

  @ApiProperty({ description: 'Explicações por alternativa', type: [String] })
  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @IsString({ each: true })
  explanations: string[];

  @ApiProperty({ description: 'Índice da alternativa correta', minimum: 0, maximum: 3 })
  @IsInt()
  @Min(0)
  @Max(3)
  correctIndex: number;

  @ApiPropertyOptional({ enum: GeneratedMissionType, default: GeneratedMissionType.PERSONALIZADA })
  @IsOptional()
  @IsEnum(GeneratedMissionType)
  type?: GeneratedMissionType;

  @ApiPropertyOptional({ description: 'Pontos da missão', minimum: 0, maximum: 1000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  points?: number;

  @ApiPropertyOptional({ description: 'Início da disponibilidade' })
  @IsOptional()
  @IsDateString()
  startDate?: string;
}
