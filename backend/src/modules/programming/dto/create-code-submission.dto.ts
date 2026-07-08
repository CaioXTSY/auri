import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProgrammingLanguage } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateCodeSubmissionDto {
  @ApiProperty({ example: 'uuid-do-problema' })
  @IsUUID()
  problemId: string;

  @ApiPropertyOptional({ example: 'uuid-da-atividade' })
  @IsOptional()
  @IsUUID()
  assignmentId?: string;

  @ApiProperty({ enum: ProgrammingLanguage, example: ProgrammingLanguage.PYTHON })
  @IsEnum(ProgrammingLanguage)
  language: ProgrammingLanguage;

  @ApiProperty({
    example: 'def solve(input: str) -> str:\n    return ""',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50000)
  code: string;
}

