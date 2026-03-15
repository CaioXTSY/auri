import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdatePostReplyDto {
  @ApiProperty({
    description: 'Conteúdo atualizado da resposta em markdown',
    example: 'Atualizei minha resposta com uma explicação melhor.',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}
