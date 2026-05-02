import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsInt, Min, Max, MaxLength, IsOptional, ValidateNested } from 'class-validator';
import { UpdateClassSettingsDto } from './update-class-settings.dto';

export class CreateClassDto {
  @ApiProperty({
    description: 'Nome da turma',
    example: 'Turma A - Manhã',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({
    description: 'Ano',
    example: 2024,
  })
  @IsInt()
  @Min(2020)
  @Max(2100)
  year: number;

  @ApiProperty({
    description: 'Configurações iniciais da turma',
    required: false,
    type: UpdateClassSettingsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateClassSettingsDto)
  settings?: UpdateClassSettingsDto;
}
