import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';

export interface PackedItem {
  productId: number;
  productName: string;
  barcode: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

/**
 * A "parked" (packed) sale: a cart put on hold so the cashier can serve someone else,
 * then resumed later on the same till.
 */
@Entity('packings')
export class Packing extends BaseEntity {
  @Column({ type: 'jsonb' })
  items: PackedItem[];

  @Column({ type: 'int' })
  totalQty: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  totalPrice: number;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  terminal: string;

  @Column({ type: 'int', nullable: true })
  parkedById: number | null;

  @Column({ type: 'varchar', length: 200 })
  parkedBy: string;

  /** Optional label to tell parked carts apart, e.g. the customer's name. */
  @Column({ type: 'varchar', length: 200, nullable: true })
  label: string | null;
}
