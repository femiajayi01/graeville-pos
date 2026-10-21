import { trimLower } from '../../../common/utils/transform.util';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@graeville.com' })
  @Transform(trimLower)
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password1!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  password: string;
}
