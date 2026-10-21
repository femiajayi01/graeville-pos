import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/product.entity';
import { Packing } from './packing.entity';
import { PackingsController } from './packings.controller';
import { PackingsService } from './packings.service';

@Module({
  imports: [TypeOrmModule.forFeature([Packing, Product])],
  controllers: [PackingsController],
  providers: [PackingsService],
  exports: [PackingsService],
})
export class PackingsModule {}
