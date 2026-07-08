import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CodeSubmissionsService } from './code-submissions.service';
import { ProgrammingController } from './programming.controller';
import { ProgrammingAssignmentsService } from './programming-assignments.service';
import { ProgrammingProblemsService } from './programming-problems.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProgrammingController],
  providers: [
    ProgrammingProblemsService,
    ProgrammingAssignmentsService,
    CodeSubmissionsService,
  ],
  exports: [
    ProgrammingProblemsService,
    ProgrammingAssignmentsService,
    CodeSubmissionsService,
  ],
})
export class ProgrammingModule {}
