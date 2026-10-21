import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';
import { Product } from '../products/product.entity';
import { Order } from './order.entity';

/**
 * One line of a sale. Replaces the PHP-serialised cart that Laravel stored in orders.orderItems.
 * Product name/barcode/price are copied so receipts stay correct if the product changes later.
 */
@Entity('order_items')
export class OrderItem extends BaseEntity {
  @Index()
  @Column({ type: 'int' })
  orderId: number;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order?: Order;

  @Column({ type: 'int', nullable: true })
  productId: number | null;

  @ManyToOne(() => Product, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'productId' })
  product?: Product | null;

  @Column({ type: 'varchar', length: 200 })
  productName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  barcode: string | null;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  unitPrice: number;

  @Column({ type: 'int' })
  quantity: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  subtotal: number;
}
