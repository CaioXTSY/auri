import { PartialType } from '@nestjs/swagger';
import { CreateProblemTestCaseDto } from './create-problem-test-case.dto';

export class UpdateProblemTestCaseDto extends PartialType(
  CreateProblemTestCaseDto,
) {}

