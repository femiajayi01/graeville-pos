import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional } from 'class-validator';

export class CloseDayQueryDto {
  @ApiPropertyOptional({
    example: '2026-10-15',
    description: 'Defaults to today',
  })
  @IsOptional()
  @IsDateString({ strict: true })
  date?: string;

  @ApiPropertyOptional({
    description: 'Managers only: close-day report for another user',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;
}
