import { Column, Entity, OneToMany } from 'typeorm';
import { SyncableEntity } from '../../common/entities/syncable.entity';
import { Product } from '../products/product.entity';

@Entity('categories')
export class Category extends SyncableEntity {
  @Column({ type: 'varchar', length: 150, unique: true })
  name: string;

  /** Stable public identifier used to match records between the shop and the online server. */
  @Column({ type: 'varchar', length: 20, unique: true })
  categoryNo: string;

  @OneToMany(() => Product, (product) => product.category)
  products?: Product[];
}
