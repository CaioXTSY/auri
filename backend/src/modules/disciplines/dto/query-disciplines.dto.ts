import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class QueryDisciplinesDto {
  @ApiPropertyOptional({
    description: 'Número da página',
    example: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Quantidade de itens por página',
    example: 10,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filtrar por ID do criador',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsOptional()
  createdById?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por nome (busca parcial)',
    example: 'Programação',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por linguagem',
    example: 'Python',
  })
  @IsString()
  @IsOptional()
  language?: string;

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
    enum: ['name', 'language', 'createdAt'],
  })
  @IsString()
  @IsOptional()
  sortBy?: 'name' | 'language' | 'createdAt' = 'createdAt';

  @ApiPropertyOptional({
    description: 'Ordem de ordenação',
    example: 'asc',
    enum: ['asc', 'desc'],
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
