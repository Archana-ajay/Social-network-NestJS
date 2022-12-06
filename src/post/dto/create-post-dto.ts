import { IsNotEmpty, IsString } from 'class-validator';

export class postDto {
  @IsString()
  @IsNotEmpty()
  description: string;
}
