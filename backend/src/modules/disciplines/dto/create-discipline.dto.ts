import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, IsIn } from 'class-validator';

export class CreateDisciplineDto {
  @ApiProperty({
    description: 'Nome da disciplina',
    example: 'Introdução à Programação',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({
    description: 'Descrição da disciplina',
    example: 'Fundamentos de programação utilizando linguagem Python',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Linguagem de programação da disciplina',
    example: 'Python',
    enum: ['Python', 'Java', 'C', 'C++', 'JavaScript', 'TypeScript'],
  })
  @IsString()
  @IsNotEmpty()
  language: string;

  @ApiProperty({
    description: 'Status da disciplina',
    example: 'ATIVA',
    enum: ['ATIVA', 'ENCERRADA'],
    default: 'ATIVA',
  })
  @IsString()
  @IsOptional()
  @IsIn(['ATIVA', 'ENCERRADA'])
  status?: string = 'ATIVA';
}
