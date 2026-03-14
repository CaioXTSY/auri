import { ApiProperty } from '@nestjs/swagger';
import { ActivityType, Difficulty } from '@prisma/client';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  Min,
  IsOptional,
  IsDateString,
  IsUUID,
  MaxLength,
  IsBoolean,
} from 'class-validator';

export class CreateActivityDto {
  @ApiProperty({
    description: 'ID da turma (opcional - atividades podem ser independentes)',
    example: 'uuid-turma',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiProperty({
    description: 'Título da atividade',
    example: 'FizzBuzz',
    maxLength: 200,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'Descrição detalhada da atividade',
    example: 'Escreva um programa que imprime números de 1 a 100...',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Tipo da atividade',
    enum: ActivityType,
    example: 'EXERCISE',
  })
  @IsNotEmpty()
  @IsEnum(ActivityType)
  type: ActivityType;

  @ApiProperty({
    description: 'Nível de dificuldade',
    enum: Difficulty,
    example: 'FACIL',
  })
  @IsNotEmpty()
  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @ApiProperty({
    description: 'Pontuação máxima da atividade',
    example: 100,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  points: number;

  @ApiProperty({
    description: 'Data limite para entrega (ISO 8601)',
    example: '2024-12-31T23:59:59.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  deadline?: string;

  @ApiProperty({
    description: 'Código inicial/template para o aluno',
    example: 'function fizzBuzz(n) {\n  // seu código aqui\n}',
    required: false,
  })
  @IsOptional()
  @IsString()
  starterCode?: string;

  @ApiProperty({
    description: 'Permite reenvio após prazo',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  allowLateSubmission?: boolean;
}
