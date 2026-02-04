import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class AnswerQuizDto {
  @ApiProperty({ description: 'Índice da alternativa escolhida (0..n-1)', example: 2 })
  @IsInt()
  @Min(0)
  selectedIndex: number;
}
