import { PartialType } from '@nestjs/swagger';
import { CreateActivityDto } from './create-activity.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateActivityDto extends PartialType(CreateActivityDto) {
  @ApiProperty({
    description: 'Status da atividade',
    enum: ['ATIVA', 'INATIVA'],
    example: 'ATIVA',
    required: false,
  })
  @IsOptional()
  @IsEnum(['ATIVA', 'INATIVA'])
  status?: string;
}
