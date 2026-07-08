import { PartialType } from '@nestjs/swagger';
import { CreateProgrammingAssignmentDto } from './create-programming-assignment.dto';

export class UpdateProgrammingAssignmentDto extends PartialType(
  CreateProgrammingAssignmentDto,
) {}

