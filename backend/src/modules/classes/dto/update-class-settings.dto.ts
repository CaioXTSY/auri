import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateClassSettingsDto {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  allowStudentPosts?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  allowStudentReplies?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  requirePostApproval?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  requireReplyApproval?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  allowJoinByCode?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  requireJoinApproval?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  lockEnrollment?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  activitiesEnabled?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  allowLateSubmissions?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  showRankingToStudents?: boolean;
}
