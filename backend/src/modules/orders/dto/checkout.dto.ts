import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaymentType } from '../../../common/enums/payment-type.enum';
import { CreateCustomerDto } from '../../customers/dto/create-customer.dto';

export class CartItemDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  productId: number;

  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CheckoutDto {
  @ApiProperty({ type: [CartItemDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'The cart is empty' })
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];

  @ApiProperty({ enum: PaymentType })
  @IsEnum(PaymentType, { message: 'Select a payment type' })
  paymentType: PaymentType;

  @ApiPropertyOptional({
    default: 0,
    description: 'Naira amount taken off the total',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({ description: 'Existing customer' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  customerId?: number;

  @ApiPropertyOptional({
    description: 'Register a new customer with this sale',
    type: CreateCustomerDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateCustomerDto)
  newCustomer?: CreateCustomerDto;

  @ApiPropertyOptional({
    description: 'Parked sale being completed (it is removed on success)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  packingId?: number;
}
