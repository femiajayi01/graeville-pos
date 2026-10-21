import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { AppConfig } from '../../config/configuration';
import { UpdateStoreSettingsDto } from './dto/update-store-settings.dto';
import { StoreSettings } from './store-settings.entity';

const SETTINGS_ID = 1;

/**
 * Store branding (name, address, phone, e-mail, receipt footer).
 * The row is created from the STORE_* env variables the first time it's needed;
 * after that the database is the source of truth and managers edit it in the app.
 */
@Injectable()
export class SettingsService {
  private cache: StoreSettings | null = null;

  constructor(
    @InjectRepository(StoreSettings)
    private readonly repo: Repository<StoreSettings>,
    private readonly config: ConfigService,
  ) {}

  async getStore(): Promise<StoreSettings> {
    if (this.cache) return this.cache;
    const existing = await this.repo.findOneBy({ id: SETTINGS_ID });
    if (existing) return (this.cache = existing);

    const defaults = this.config.getOrThrow<AppConfig['store']>('store');
    await this.repo
      .createQueryBuilder()
      .insert()
      .values({
        id: SETTINGS_ID,
        storeName: defaults.name,
        address: defaults.address,
        phone: defaults.phone,
        email: defaults.email,
        receiptFooter: defaults.receiptFooter,
        currency: defaults.currency,
        updatedBy: 'env defaults',
      })
      .orIgnore() // another request may have created it at the same moment
      .execute();
    return (this.cache = await this.repo.findOneByOrFail({ id: SETTINGS_ID }));
  }

  async updateStore(
    dto: UpdateStoreSettingsDto,
    user: AuthUser,
  ): Promise<StoreSettings> {
    const current = await this.getStore();
    // Only apply fields that were actually sent (the DTO carries undefined keys for the rest).
    const changes = Object.fromEntries(
      Object.entries(dto).filter(([, value]) => value !== undefined),
    );
    Object.assign(current, changes, { updatedBy: user.fullName });
    this.cache = await this.repo.save(current);
    return this.cache;
  }

  /** Public view used by the login page, header and receipts. */
  async getPublicInfo() {
    const s = await this.getStore();
    return {
      appName: this.config.get<string>('appName') ?? 'Graeville POS',
      name: s.storeName,
      address: s.address,
      phone: s.phone,
      email: s.email,
      receiptFooter: s.receiptFooter,
      currency: s.currency,
    };
  }
}
