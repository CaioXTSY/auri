import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsIn } from 'class-validator';
import { Role } from '@prisma/client';

const ALLOWED_ROLES = [Role.ALUNO, Role.PROFESSOR] as const;
type AllowedRole = (typeof ALLOWED_ROLES)[number];

export class RegisterDto {
  @ApiProperty({ example: 'usuario@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'SenhaSegura123!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: ALLOWED_ROLES, example: Role.ALUNO })
  @IsIn(ALLOWED_ROLES)
  @IsNotEmpty()
  role: AllowedRole;
}
