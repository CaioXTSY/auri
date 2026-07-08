import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Difficulty, ProgrammingLanguage } from '@prisma/client';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProgrammingProblemDto {
  @ApiProperty({ example: 'Soma simples' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    example: 'Leia dois numeros inteiros e retorne a soma.',
  })
  @IsString()
  @IsNotEmpty()
  statement: string;

  @ApiPropertyOptional({ enum: Difficulty, example: Difficulty.FACIL })
  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @ApiProperty({
    enum: ProgrammingLanguage,
    isArray: true,
    example: [ProgrammingLanguage.JAVASCRIPT, ProgrammingLanguage.PYTHON],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(ProgrammingLanguage, { each: true })
  allowedLanguages: ProgrammingLanguage[];

  @ApiProperty({
    example: {
      JAVASCRIPT:
        'function solve(input) {\n  return "";\n}\n\nmodule.exports = solve;',
      PYTHON: 'def solve(input: str) -> str:\n    return ""',
    },
  })
  @IsObject()
  starterCode: Record<ProgrammingLanguage, string>;

  @ApiPropertyOptional({ example: 2000, minimum: 100, maximum: 30000 })
  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(30000)
  timeLimitMs?: number;

  @ApiPropertyOptional({ example: 128, minimum: 32, maximum: 512 })
  @IsOptional()
  @IsInt()
  @Min(32)
  @Max(512)
  memoryLimitMb?: number;
}

