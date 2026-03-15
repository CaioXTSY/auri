import { ApiProperty } from '@nestjs/swagger';

export class UpcomingActivityDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  className: string;

  @ApiProperty()
  deadline: Date;

  @ApiProperty()
  status: 'PENDENTE' | 'EM_ANDAMENTO';
}

