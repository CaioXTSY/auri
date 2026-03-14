import { ApiProperty } from '@nestjs/swagger';
import { ActivityType, Difficulty } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsInt,
  Min,
  IsEnum,
  IsString,
  IsUUID,
  IsIn,
} from 'class-validator';

export class QueryActivitiesDto {
  @ApiProperty({
    description: 'Número da página',
    example: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Itens por página',
    example: 10,
    default: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({
    description: 'Filtrar por ID da turma',
    example: 'uuid-turma',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiProperty({
    description: 'Filtrar por tipo de atividade',
    enum: ActivityType,
    required: false,
  })
  @IsOptional()
  @IsEnum(ActivityType)
  type?: ActivityType;

  @ApiProperty({
    description: 'Filtrar por dificuldade',
    enum: Difficulty,
    required: false,
  })
  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @ApiProperty({
    description: 'Filtrar por status',
    enum: ['ATIVA', 'INATIVA'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['ATIVA', 'INATIVA'])
  status?: string;

  @ApiProperty({
    description: 'Buscar por título',
    example: 'FizzBuzz',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Campo para ordenação',
    example: 'deadline',
    default: 'createdAt',
    required: false,
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiProperty({
    description: 'Ordem de ordenação',
    enum: ['asc', 'desc'],
    example: 'desc',
    default: 'desc',
    required: false,
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
