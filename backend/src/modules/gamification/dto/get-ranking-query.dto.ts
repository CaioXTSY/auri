import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GetRankingQueryDto {
  @ApiProperty({
    description: 'Tipo de ranking',
    enum: ['GLOBAL', 'DISCIPLINA', 'TURMA'],
    example: 'GLOBAL',
  })
  @IsEnum(['GLOBAL', 'DISCIPLINA', 'TURMA'])
  type: 'GLOBAL' | 'DISCIPLINA' | 'TURMA';

  @ApiProperty({
    description: 'ID de referência (disciplina ou turma)',
    required: false,
    example: 'uuid-disciplina',
  })
  @IsString()
  @IsOptional()
  referenceId?: string;

  @ApiProperty({
    description: 'Limite de resultados',
    required: false,
    example: 50,
    minimum: 1,
    maximum: 100,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
