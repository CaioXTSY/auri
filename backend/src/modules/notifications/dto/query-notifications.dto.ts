import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryNotificationsDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  limit?: number;
}
