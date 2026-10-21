import { Column, Entity, OneToMany } from 'typeorm';
import { SyncableEntity } from '../../common/entities/syncable.entity';
import { Product } from '../products/product.entity';

@Entity('brands')
export class Brand extends SyncableEntity {
  @Column({ type: 'varchar', length: 150, unique: true })
  name: string;

  /** Stable public identifier used to match records between the shop and the online server. */
  @Column({ type: 'varchar', length: 20, unique: true })
  brandNo: string;

  @OneToMany(() => Product, (product) => product.brand)
  products?: Product[];
}
