import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdatePostDto {
  @ApiPropertyOptional({
    description: 'Título do post',
    example: 'Atualização sobre o cronograma',
    maxLength: 180,
  })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  title?: string;

  @ApiPropertyOptional({
    description: 'Conteúdo em markdown',
    example: 'Atualizamos os prazos da entrega.',
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    description: 'ID da turma alvo',
    example: '550e8400-e29b-41d4-a716-446655440000',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  classId?: string | null;
}
