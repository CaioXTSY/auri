import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, IsInt, Min, Max, MaxLength } from 'class-validator';

export class CreateClassDto {
  @ApiProperty({
    description: 'ID da disciplina',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  disciplineId: string;

  @ApiProperty({
    description: 'Nome da turma',
    example: 'Turma A - Manhã',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({
    description: 'Semestre',
    example: '2024/1',
  })
  @IsString()
  @IsNotEmpty()
  semester: string;

  @ApiProperty({
    description: 'Ano',
    example: 2024,
  })
  @IsInt()
  @Min(2020)
  @Max(2100)
  year: number;
}
