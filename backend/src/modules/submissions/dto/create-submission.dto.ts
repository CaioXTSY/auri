import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubmissionDto {
  @ApiProperty({
    description: 'ID da atividade',
    example: 'uuid-atividade',
  })
  @IsUUID()
  @IsNotEmpty()
  activityId: string;

  @ApiProperty({
    description: 'Código submetido pelo aluno',
    example: 'function fizzBuzz(n) {\n  for(let i=1; i<=n; i++) {\n    if(i%15===0) console.log("FizzBuzz");\n    else if(i%3===0) console.log("Fizz");\n    else if(i%5===0) console.log("Buzz");\n    else console.log(i);\n  }\n}',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: 'Linguagem de programação utilizada',
    example: 'javascript',
    enum: ['javascript', 'python', 'java', 'c', 'cpp'],
  })
  @IsString()
  @IsNotEmpty()
  language: string;
}
