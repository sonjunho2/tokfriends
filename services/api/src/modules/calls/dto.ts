import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class StartCallDto {
  @IsString()
  @IsNotEmpty()
  hostUserId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;
}
