import { PartialType } from '@nestjs/swagger';
import { CreateProgrammingProblemDto } from './create-programming-problem.dto';

export class UpdateProgrammingProblemDto extends PartialType(
  CreateProgrammingProblemDto,
) {}

