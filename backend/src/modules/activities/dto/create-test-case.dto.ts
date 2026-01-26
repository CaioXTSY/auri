import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class CreateTestCaseDto {
  @ApiProperty({
    description: 'Entrada/input do caso de teste',
    example: '5',
  })
  @IsNotEmpty()
  @IsString()
  input: string;

  @ApiProperty({
    description: 'Saída/output esperado',
    example: '1\n2\nFizz\n4\nBuzz',
  })
  @IsNotEmpty()
  @IsString()
  expectedOutput: string;

  @ApiProperty({
    description: 'Pontos deste caso de teste',
    example: 10,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  points: number;

  @ApiProperty({
    description: 'Caso de teste visível para o aluno',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiProperty({
    description: 'Descrição/dica do caso de teste',
    example: 'Teste com números de 1 a 5',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
