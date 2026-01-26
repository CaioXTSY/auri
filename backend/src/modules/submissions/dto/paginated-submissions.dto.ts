import { ApiProperty } from '@nestjs/swagger';

class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 50 })
  total: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}

export class PaginatedSubmissionsDto {
  @ApiProperty({ type: [Object] })
  data: any[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
