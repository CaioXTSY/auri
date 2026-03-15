import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePostReplyDto {
  @ApiProperty({
    description: 'Conteúdo da resposta em markdown',
    example: 'Professor, eu tentei resolver e cheguei neste resultado:\n\n```python\nprint(42)\n```',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}
