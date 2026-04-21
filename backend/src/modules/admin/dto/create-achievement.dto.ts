import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateAchievementDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  icon?: string;

  @ApiProperty({ example: 'STREAK' })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  category: string;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(0)
  points: number;

  @ApiPropertyOptional({ example: 'COMUM' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  rarity?: string;

  @ApiProperty({
    example: 'STREAK_7',
    description: 'Chave única usada pelo sistema pra desbloquear a conquista',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  condition: string;
}
