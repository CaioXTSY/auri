import { PartialType } from '@nestjs/swagger';
import { CreateClassDto } from './create-class.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsIn, IsOptional } from 'class-validator';

export class UpdateClassDto extends PartialType(CreateClassDto) {
  @ApiPropertyOptional({
    description: 'Status da turma',
    example: 'ATIVA',
    enum: ['ATIVA', 'ENCERRADA'],
  })
  @IsString()
  @IsOptional()
  @IsIn(['ATIVA', 'ENCERRADA'])
  status?: string;
}
