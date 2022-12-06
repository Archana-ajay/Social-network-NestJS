import { IsNotEmpty, IsString } from 'class-validator';

export class profileDto {
  @IsString()
  @IsNotEmpty()
  description: string;
}

