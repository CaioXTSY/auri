import { IsIn, IsString, Length } from 'class-validator';
export class ReviewQuizDto {
  @IsIn(['APPROVED', 'REJECTED'])
  decision: 'APPROVED' | 'REJECTED';
  @IsString()
  @Length(3, 2000)
  reason: string;
}
