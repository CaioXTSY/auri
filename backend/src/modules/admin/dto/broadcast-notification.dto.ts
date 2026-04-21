import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { NotificationType, Role } from '@prisma/client';

export class BroadcastNotificationDto {
  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ example: 'Manutenção programada' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title: string;

  @ApiProperty({ example: 'O sistema ficará offline das 2h às 4h da manhã.' })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  message: string;

  @ApiPropertyOptional({ enum: Role, description: 'Filtrar envio por role' })
  @IsOptional()
  @IsEnum(Role)
  targetRole?: Role;
}
