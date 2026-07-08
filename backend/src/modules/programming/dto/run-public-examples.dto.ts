import { OmitType } from '@nestjs/swagger';
import { CreateCodeSubmissionDto } from './create-code-submission.dto';

export class RunPublicExamplesDto extends OmitType(CreateCodeSubmissionDto, [
  'assignmentId',
] as const) {}

