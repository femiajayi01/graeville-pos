import { Exclude, Expose } from 'class-transformer';
import { Column, Entity } from 'typeorm';
import { SyncableEntity } from '../../common/entities/syncable.entity';
import { Role } from '../../common/enums/role.enum';

@Entity('users')
export class User extends SyncableEntity {
  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  /** bcrypt hash. Never serialised in API responses. */
  @Exclude()
  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({
    type: 'enum',
    enum: Role,
    enumName: 'user_role',
    default: Role.USER,
  })
  role: Role;

  /** Name of the user who created this account (kept as text, like the Laravel app). */
  @Column({ type: 'varchar', length: 200, default: 'system' })
  registeredBy: string;

  @Expose()
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }
}
