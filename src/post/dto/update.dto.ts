import { IsOptional, IsString } from 'class-validator';

export class updateDto {
  @IsOptional()
  @IsString()
  description: string;
}
