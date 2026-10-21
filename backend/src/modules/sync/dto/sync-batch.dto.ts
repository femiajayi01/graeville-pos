import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsObject, IsString } from 'class-validator';

export class SyncBatchDto {
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  @IsArray()
  @ArrayMaxSize(1000)
  @IsObject({ each: true })
  records: Record<string, unknown>[];
}

export class SyncAckDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(1000)
  @IsString({ each: true })
  keys: string[];
}
