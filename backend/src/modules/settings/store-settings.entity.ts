import {
  Check,
  Column,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * The customer's store details printed on receipts, e-mails and the login page.
 * A single row (id = 1), editable by managers in Administration → Store settings.
 */
@Entity('store_settings')
@Check('CHK_store_settings_single_row', '"id" = 1')
export class StoreSettings {
  @PrimaryColumn({ type: 'int', default: 1 })
  id: number;

  @Column({ type: 'varchar', length: 150 })
  storeName: string;

  @Column({ type: 'text', default: '' })
  address: string;

  @Column({ type: 'varchar', length: 100, default: '' })
  phone: string;

  @Column({ type: 'varchar', length: 150, default: '' })
  email: string;

  @Column({ type: 'text', default: '' })
  receiptFooter: string;

  @Column({ type: 'varchar', length: 3, default: 'NGN' })
  currency: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  updatedBy: string | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
