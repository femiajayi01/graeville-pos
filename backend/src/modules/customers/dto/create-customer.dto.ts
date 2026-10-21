import {
  emptyToUndefined,
  stripSpaces,
  trim,
} from '../../../common/utils/transform.util';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Bola Ade' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  fullName: string;

  @ApiProperty({ example: '08031234567' })
  @Transform(stripSpaces)
  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/, {
    message: 'phoneNo must be a valid phone number',
  })
  phoneNo: string;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '1990-05-21' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsDateString({ strict: true })
  birthdate?: string;
}
