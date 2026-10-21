import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { trim } from '../../../common/utils/transform.util';

export class UpdateStoreSettingsDto {
  @ApiPropertyOptional({ example: 'Mecca Beauty' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  storeName?: string;

  @ApiPropertyOptional({ example: '12 Admiralty Way, Lekki Phase 1, Lagos' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ example: '0800 000 0000' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  phone?: string;

  @ApiPropertyOptional({ example: 'hello@meccabeauty.ng' })
  @IsOptional()
  @Transform(trim)
  @ValidateIf((o: UpdateStoreSettingsDto) => !!o.email)
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @ApiPropertyOptional({ example: 'Thank you for shopping with us!' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  receiptFooter?: string;

  @ApiPropertyOptional({
    example: 'NGN',
    description: 'ISO 4217 currency code',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Length(3, 3)
  currency?: string;
}
