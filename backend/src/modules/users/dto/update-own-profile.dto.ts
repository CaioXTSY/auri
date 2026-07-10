import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateOwnProfileDto {
  @ApiPropertyOptional({ example: 'João Silva Santos' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @ApiPropertyOptional({ example: 'joao.novo@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'NovaSenhaSegura123!' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
