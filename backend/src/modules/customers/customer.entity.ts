import { Column, Entity, Index, OneToMany } from 'typeorm';
import { SyncableEntity } from '../../common/entities/syncable.entity';
import { Order } from '../orders/order.entity';

@Entity('customers')
export class Customer extends SyncableEntity {
  @Index()
  @Column({ type: 'varchar', length: 200 })
  fullName: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email: string | null;

  /** Phone number is the customer's natural key (lookup at checkout + sync). */
  @Column({ type: 'varchar', length: 30, unique: true })
  phoneNo: string;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'date', nullable: true })
  birthdate: string | null;

  @Column({ type: 'varchar', length: 200, default: 'system' })
  registeredBy: string;

  @OneToMany(() => Order, (order) => order.customer)
  orders?: Order[];
}
