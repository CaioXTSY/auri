import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, Min, IsOptional } from 'class-validator';

export class AddPointsDto {
  @ApiProperty({
    description: 'ID do usuário',
    example: 'uuid-usuario',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Quantidade de pontos',
    example: 50,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  points: number;

  @ApiProperty({
    description: 'Fonte dos pontos',
    example: 'BONUS_PROFESSOR',
  })
  @IsString()
  @IsNotEmpty()
  source: string;

  @ApiProperty({
    description: 'Descrição do motivo dos pontos',
    example: 'Bônus por excelente participação',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'ID de referência (opcional)',
    example: 'uuid-atividade',
    required: false,
  })
  @IsString()
  @IsOptional()
  referenceId?: string;
}
