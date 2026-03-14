import { ApiProperty } from '@nestjs/swagger';

class ActivityResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  classId: string | null;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  difficulty: string;

  @ApiProperty()
  points: number;

  @ApiProperty()
  deadline: Date | null;

  @ApiProperty()
  status: string;

  @ApiProperty()
  createdAt: Date;
}

class PaginationMeta {
  @ApiProperty({ description: 'Página atual' })
  page: number;

  @ApiProperty({ description: 'Itens por página' })
  limit: number;

  @ApiProperty({ description: 'Total de itens' })
  total: number;

  @ApiProperty({ description: 'Total de páginas' })
  totalPages: number;
}

export class PaginatedActivitiesDto {
  @ApiProperty({ type: [ActivityResponse] })
  data: ActivityResponse[];

  @ApiProperty({ type: PaginationMeta })
  meta: PaginationMeta;
}
