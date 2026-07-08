import { ApiProperty } from '@nestjs/swagger';
import { ProgrammingLanguage } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SubmitAssignmentCodeDto {
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

