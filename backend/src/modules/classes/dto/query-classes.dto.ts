import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class QueryClassesDto {
  @ApiPropertyOptional({
    description: 'Número da página',
    example: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Quantidade de itens por página',
    example: 10,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit: number = 10;

  @ApiPropertyOptional({
    description: 'Filtrar por ID da disciplina',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsOptional()
  disciplineId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por nome (busca parcial)',
    example: 'Turma A',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por semestre',
    example: '2024/1',
  })
  @IsString()
  @IsOptional()
  semester?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ano',
    example: 2024,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  year?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por status',
    example: 'ATIVA',
    enum: ['ATIVA', 'ENCERRADA'],
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    description: 'Campo para ordenação',
    example: 'name',
    enum: ['name', 'semester', 'year', 'createdAt'],
  })
  @IsString()
  @IsOptional()
  sortBy?: 'name' | 'semester' | 'year' | 'createdAt' = 'createdAt';

  @ApiPropertyOptional({
    description: 'Ordem de ordenação',
    example: 'desc',
    enum: ['asc', 'desc'],
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
