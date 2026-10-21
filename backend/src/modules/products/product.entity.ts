import { Check, Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { SyncableEntity } from '../../common/entities/syncable.entity';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';
import { Brand } from '../brands/brand.entity';
import { Category } from '../categories/category.entity';

@Entity('products')
@Check('CHK_products_quantity_non_negative', '"quantity" >= 0')
export class Product extends SyncableEntity {
  @Column({ type: 'varchar', length: 200, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  barcode: string;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  costPrice: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  sellingPrice: number;

  /** Units in stock. */
  @Column({ type: 'int', default: 0 })
  quantity: number;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'int', nullable: true })
  brandId: number | null;

  @ManyToOne(() => Brand, (brand) => brand.products, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'brandId' })
  brand?: Brand | null;

  @Column({ type: 'int', nullable: true })
  categoryId: number | null;

  @ManyToOne(() => Category, (category) => category.products, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'categoryId' })
  category?: Category | null;
}
