import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TestCaseVisibility } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateProblemTestCaseDto {
  @ApiProperty({ example: '2 3' })
  @IsString()
  input: string;

  @ApiProperty({ example: '5' })
  @IsString()
  @IsNotEmpty()
  expected: string;

  @ApiPropertyOptional({
    enum: TestCaseVisibility,
    example: TestCaseVisibility.HIDDEN,
  })
  @IsOptional()
  @IsEnum(TestCaseVisibility)
  visibility?: TestCaseVisibility;

  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  weight?: number;
}

