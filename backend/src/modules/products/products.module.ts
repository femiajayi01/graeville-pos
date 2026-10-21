import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandsModule } from '../brands/brands.module';
import { CategoriesModule } from '../categories/categories.module';
import { Product } from './product.entity';
import { ProductsExcelService } from './products-excel.service';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
    BrandsModule,
    CategoriesModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService, ProductsExcelService],
  exports: [ProductsService],
})
export class ProductsModule {}
