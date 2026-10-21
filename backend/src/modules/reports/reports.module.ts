import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersModule } from '../customers/customers.module';
import { Order } from '../orders/order.entity';
import { OrdersModule } from '../orders/orders.module';
import { PackingsModule } from '../packings/packings.module';
import { Product } from '../products/product.entity';
import { ProductsModule } from '../products/products.module';
import { UsersModule } from '../users/users.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Product]),
    OrdersModule,
    ProductsModule,
    CustomersModule,
    PackingsModule,
    UsersModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
