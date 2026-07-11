import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ActivityStatus, ActivityType, QuestionType, SubmissionStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateActivityDto {
  @ApiProperty()
  @IsString() classId: string;
  @ApiProperty({ enum: ActivityType })
  @IsEnum(ActivityType) type: ActivityType;
  @ApiProperty({ maxLength: 200 })
  @IsString() @MaxLength(200) title: string;
  @ApiProperty()
  @IsString() description: string;
  @ApiPropertyOptional({ default: 100 })
  @IsOptional() @IsInt() @Min(0) @Max(100000) maxScore?: number;
  @ApiPropertyOptional({ default: 0 })
  @IsOptional() @IsInt() @Min(0) @Max(100000) xpReward?: number;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional() @IsDateString() dueDate?: string | null;
  @ApiPropertyOptional({ default: false })
  @IsOptional() @IsBoolean() allowLateSubmissions?: boolean;
  @ApiPropertyOptional({ default: false })
  @IsOptional() @IsBoolean() allowResubmission?: boolean;
  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @IsInt() @Min(1) @Max(20) maxAttempts?: number;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) allowedFileTypes?: string[];
  @ApiPropertyOptional({ default: 10485760 })
  @IsOptional() @IsInt() @Min(1024) @Max(10 * 1024 * 1024) maxFileSize?: number;
  @ApiPropertyOptional({ default: 5 })
  @IsOptional() @IsInt() @Min(1) @Max(5) maxFiles?: number;
  @ApiPropertyOptional({ default: false })
  @IsOptional() @IsBoolean() showResultsImmediately?: boolean;
}

export class UpdateActivityDto {
  @IsOptional() @IsString() classId?: string;
  @IsOptional() @IsEnum(ActivityType) type?: ActivityType;
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsInt() @Min(0) @Max(100000) maxScore?: number;
  @IsOptional() @IsInt() @Min(0) @Max(100000) xpReward?: number;
  @IsOptional() @IsDateString() dueDate?: string | null;
  @IsOptional() @IsBoolean() allowLateSubmissions?: boolean;
  @IsOptional() @IsBoolean() allowResubmission?: boolean;
  @IsOptional() @IsInt() @Min(1) @Max(20) maxAttempts?: number;
  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) allowedFileTypes?: string[];
  @IsOptional() @IsInt() @Min(1024) @Max(10 * 1024 * 1024) maxFileSize?: number;
  @IsOptional() @IsInt() @Min(1) @Max(5) maxFiles?: number;
  @IsOptional() @IsBoolean() showResultsImmediately?: boolean;
}

export class QueryActivitiesDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
  @IsOptional() @IsString() classId?: string;
  @IsOptional() @IsEnum(ActivityType) type?: ActivityType;
  @IsOptional() @IsEnum(ActivityStatus) status?: ActivityStatus;
  @IsOptional() @IsEnum(SubmissionStatus) submissionStatus?: SubmissionStatus;
}

export class CreateQuestionOptionDto {
  @ApiProperty()
  @IsString() text: string;
  @ApiProperty()
  @IsBoolean() isCorrect: boolean;
  @ApiProperty()
  @IsInt() @Min(1) position: number;
}

export class CreateActivityQuestionDto {
  @ApiProperty({ enum: QuestionType })
  @IsEnum(QuestionType) type: QuestionType;
  @ApiProperty()
  @IsString() prompt: string;
  @ApiProperty()
  @IsInt() @Min(0) points: number;
  @ApiProperty()
  @IsInt() @Min(1) position: number;
  @ApiPropertyOptional({ type: [CreateQuestionOptionDto] })
  @IsOptional() @IsArray() @ArrayMinSize(2) @ArrayMaxSize(10)
  @ValidateNested({ each: true }) @Type(() => CreateQuestionOptionDto)
  options?: CreateQuestionOptionDto[];
}

export class UpdateActivityQuestionDto {
  @IsOptional() @IsEnum(QuestionType) type?: QuestionType;
  @IsOptional() @IsString() prompt?: string;
  @IsOptional() @IsInt() @Min(0) points?: number;
  @IsOptional() @IsInt() @Min(1) position?: number;
  @IsOptional() @IsArray() @ArrayMinSize(2) @ArrayMaxSize(10)
  @ValidateNested({ each: true }) @Type(() => CreateQuestionOptionDto)
  options?: CreateQuestionOptionDto[];
}

export class SubmissionAnswerDto {
  @ApiProperty()
  @IsString() questionId: string;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional() @IsString() selectedOptionId?: string | null;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional() @IsString() textAnswer?: string | null;
}

export class SaveSubmissionDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional() @IsString() textAnswer?: string | null;
  @ApiPropertyOptional({ type: [SubmissionAnswerDto] })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => SubmissionAnswerDto)
  answers?: SubmissionAnswerDto[];
}

export class GradeSubmissionDto {
  @ApiProperty()
  @IsInt() @Min(0) score: number;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional() @IsString() feedback?: string | null;
}

export class ReturnSubmissionDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional() @IsString() feedback?: string | null;
}
