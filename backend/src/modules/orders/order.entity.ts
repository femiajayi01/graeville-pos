import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { SyncableEntity } from '../../common/entities/syncable.entity';
import { PaymentType } from '../../common/enums/payment-type.enum';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';
import { Customer } from '../customers/customer.entity';
import { User } from '../users/user.entity';
import { OrderItem } from './order-item.entity';

@Entity('orders')
@Index('IDX_orders_createdAt', ['createdAt'])
export class Order extends SyncableEntity {
  /** yymmdd + 4-digit daily sequence, e.g. 2610150001 (same format as the Laravel app). */
  @Column({ type: 'varchar', length: 30, unique: true })
  orderNumber: string;

  @Column({ type: 'int', nullable: true })
  salespersonId: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'salespersonId' })
  salespersonUser?: User | null;

  /** Salesperson's name at the time of sale (reports group by this, like Laravel). */
  @Index()
  @Column({ type: 'varchar', length: 200 })
  salesperson: string;

  @Column({ type: 'int', nullable: true })
  customerId: number | null;

  @ManyToOne(() => Customer, (customer) => customer.orders, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'customerId' })
  customer?: Customer | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  customerName: string | null;

  /** Total number of units sold. */
  @Column({ type: 'int' })
  quantity: number;

  /** Sum of line totals before discount. */
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  totalPrice: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  discount: number;

  /** totalPrice - discount. */
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  amountPaid: number;

  @Column({ type: 'enum', enum: PaymentType, enumName: 'payment_type' })
  paymentType: PaymentType;

  /** Till/computer the sale was made on (Laravel: system_number = gethostname()). */
  @Column({ type: 'varchar', length: 100, nullable: true })
  terminal: string | null;

  @Index()
  @Column({ type: 'boolean', default: false })
  isReturned: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  returnedAt: Date | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  returnedBy: string | null;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];
}
