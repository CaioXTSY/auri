import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, Max } from 'class-validator';

export class AnswerQuizDto {
  @ApiProperty({ description: 'Índice da alternativa escolhida (0..3)', example: 2 })
  @IsInt()
  @Min(0)
  @Max(3)
  selectedIndex: number;
}
