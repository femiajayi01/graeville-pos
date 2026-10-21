import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CartItemDto } from '../../orders/dto/checkout.dto';

export class CreatePackingDto {
  @ApiProperty({ type: [CartItemDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'Cannot park an empty cart' })
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];

  @ApiPropertyOptional({ example: 'Lady in red' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  label?: string;
}
