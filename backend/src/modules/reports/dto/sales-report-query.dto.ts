import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { DateRangeQueryDto } from '../../../common/dto/date-range-query.dto';

export class SalesReportQueryDto extends DateRangeQueryDto {
  @ApiPropertyOptional({
    description: 'Salesperson full name (Laravel: Reports (Salesperson))',
  })
  @IsOptional()
  @IsString()
  salesperson?: string;
}
