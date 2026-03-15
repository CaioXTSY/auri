import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GetRankingQueryDto {
  @ApiProperty({
    description: 'Tipo de ranking',
    enum: ['GLOBAL', 'TURMA'],
    example: 'GLOBAL',
  })
  @IsEnum(['GLOBAL', 'TURMA'])
  type: 'GLOBAL' | 'TURMA';

  @ApiProperty({
    description: 'ID de referência da turma',
    required: false,
    example: 'uuid-turma',
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
