import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class DateRangeQueryDto {
  @ApiPropertyOptional({
    example: '2026-10-01',
    description: 'Start date (inclusive), YYYY-MM-DD',
  })
  @IsOptional()
  @IsDateString({ strict: true })
  from?: string;

  @ApiPropertyOptional({
    example: '2026-10-15',
    description: 'End date (inclusive), YYYY-MM-DD',
  })
  @IsOptional()
  @IsDateString({ strict: true })
  to?: string;
}
