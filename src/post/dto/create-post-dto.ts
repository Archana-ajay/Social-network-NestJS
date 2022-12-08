import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class postDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsString()
  image?: string;
}
