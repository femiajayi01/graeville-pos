import { toBoolean } from '../../../common/utils/transform.util';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class OrderQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: '2026-10-01' })
  @IsOptional()
  @IsDateString({ strict: true })
  from?: string;

  @ApiPropertyOptional({ example: '2026-10-15' })
  @IsOptional()
  @IsDateString({ strict: true })
  to?: string;

  @ApiPropertyOptional({ description: 'Salesperson full name' })
  @IsOptional()
  @IsString()
  salesperson?: string;

  @ApiPropertyOptional({
    description: 'Include returned orders (excluded by default, like Laravel)',
  })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  includeReturned?: boolean;
}
