import { ApiProperty } from '@nestjs/swagger';

export class PaginatedDisciplinesDto<T> {
  @ApiProperty({
    description: 'Lista de disciplinas',
    isArray: true,
  })
  data: T[];

  @ApiProperty({
    description: 'Total de disciplinas',
    example: 50,
  })
  total: number;

  @ApiProperty({
    description: 'Página atual',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Itens por página',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Total de páginas',
    example: 5,
  })
  totalPages: number;

  constructor(data: T[], total: number, page: number, limit: number) {
    this.data = data;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
  }
}
