/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument --
 * Sync payloads are untyped JSON from another install; every field is read through the
 * str/num/optional/required helpers below, which coerce and validate it explicitly. */
import { EntityManager, ILike, In } from 'typeorm';
import { PaymentType } from '../../common/enums/payment-type.enum';
import { Role } from '../../common/enums/role.enum';
import { Brand } from '../brands/brand.entity';
import { Category } from '../categories/category.entity';
import { Customer } from '../customers/customer.entity';
import { OrderItem } from '../orders/order-item.entity';
import { Order } from '../orders/order.entity';
import { Product } from '../products/product.entity';
import { User } from '../users/user.entity';

/**
 * Entities replicated between a shop install and the online server,
 * in dependency order (brands/categories before products, customers/users before orders).
 */
export const SYNC_ENTITIES = [
  'users',
  'brands',
  'categories',
  'customers',
  'products',
  'orders',
] as const;
export type SyncEntityName = (typeof SYNC_ENTITIES)[number];

export type SyncRecord = Record<string, any>;

/**
 * How one entity is serialised and merged. Records are matched on a natural key
 * (barcode, phone number, order number…) because database ids differ between installs.
 */
export interface SyncHandler {
  /** Natural key field in the payload. */
  key: string;
  loadUnsynced(manager: EntityManager, limit: number): Promise<SyncRecord[]>;
  /** Inserts or updates one incoming record and marks it synced. Returns its key. */
  upsert(manager: EntityManager, record: SyncRecord): Promise<string>;
  markSynced(manager: EntityManager, keys: string[]): Promise<void>;
}

const str = (v: unknown): string => {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString();
  const text =
    typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
      ? String(v)
      : JSON.stringify(v);
  return text.trim();
};
const optional = (v: unknown): string | null => (str(v) === '' ? null : str(v));
const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const required = (record: SyncRecord, field: string): string => {
  const value = str(record[field]);
  if (!value) throw new Error(`Missing ${field}`);
  return value;
};

// ───────────────────────── users ─────────────────────────
const users: SyncHandler = {
  key: 'email',
  async loadUnsynced(manager, limit) {
    const rows = await manager
      .getRepository(User)
      .find({ where: { synced: false }, take: limit });
    return rows.map((u) => ({
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      password: u.password,
      role: u.role,
      registeredBy: u.registeredBy,
      createdAt: u.createdAt,
    }));
  },
  async upsert(manager, r) {
    const repo = manager.getRepository(User);
    const email = required(r, 'email').toLowerCase();
    const role = Object.values(Role).includes(r.role)
      ? (r.role as Role)
      : Role.USER;
    const user =
      (await repo.findOneBy({ email })) ??
      repo.create({ email, createdAt: r.createdAt ?? undefined });
    Object.assign(user, {
      firstName: required(r, 'firstName'),
      lastName: str(r.lastName),
      password: required(r, 'password'),
      role,
      registeredBy: str(r.registeredBy) || 'sync',
      synced: true,
    });
    await repo.save(user);
    return email;
  },
  async markSynced(manager, keys) {
    if (keys.length)
      await manager
        .getRepository(User)
        .update({ email: In(keys) }, { synced: true });
  },
};

// ───────────────────────── brands / categories ─────────────────────────
const brands: SyncHandler = {
  key: 'brandNo',
  async loadUnsynced(manager, limit) {
    const rows = await manager
      .getRepository(Brand)
      .find({ where: { synced: false }, take: limit });
    return rows.map((b) => ({
      brandNo: b.brandNo,
      name: b.name,
      createdAt: b.createdAt,
    }));
  },
  async upsert(manager, r) {
    const repo = manager.getRepository(Brand);
    const brandNo = required(r, 'brandNo');
    const name = required(r, 'name');
    const brand =
      (await repo.findOneBy({ brandNo })) ??
      (await repo.findOneBy({ name: ILike(name) })) ??
      repo.create();
    Object.assign(brand, { brandNo, name, synced: true });
    await repo.save(brand);
    return brandNo;
  },
  async markSynced(manager, keys) {
    if (keys.length)
      await manager
        .getRepository(Brand)
        .update({ brandNo: In(keys) }, { synced: true });
  },
};

const categories: SyncHandler = {
  key: 'categoryNo',
  async loadUnsynced(manager, limit) {
    const rows = await manager
      .getRepository(Category)
      .find({ where: { synced: false }, take: limit });
    return rows.map((c) => ({
      categoryNo: c.categoryNo,
      name: c.name,
      createdAt: c.createdAt,
    }));
  },
  async upsert(manager, r) {
    const repo = manager.getRepository(Category);
    const categoryNo = required(r, 'categoryNo');
    const name = required(r, 'name');
    const category =
      (await repo.findOneBy({ categoryNo })) ??
      (await repo.findOneBy({ name: ILike(name) })) ??
      repo.create();
    Object.assign(category, { categoryNo, name, synced: true });
    await repo.save(category);
    return categoryNo;
  },
  async markSynced(manager, keys) {
    if (keys.length)
      await manager
        .getRepository(Category)
        .update({ categoryNo: In(keys) }, { synced: true });
  },
};

// ───────────────────────── customers ─────────────────────────
const customers: SyncHandler = {
  key: 'phoneNo',
  async loadUnsynced(manager, limit) {
    const rows = await manager
      .getRepository(Customer)
      .find({ where: { synced: false }, take: limit });
    return rows.map((c) => ({
      phoneNo: c.phoneNo,
      fullName: c.fullName,
      email: c.email,
      address: c.address,
      birthdate: c.birthdate,
      registeredBy: c.registeredBy,
      createdAt: c.createdAt,
    }));
  },
  async upsert(manager, r) {
    const repo = manager.getRepository(Customer);
    const phoneNo = required(r, 'phoneNo');
    const customer =
      (await repo.findOneBy({ phoneNo })) ??
      repo.create({ phoneNo, createdAt: r.createdAt ?? undefined });
    Object.assign(customer, {
      fullName: required(r, 'fullName'),
      email: optional(r.email),
      address: optional(r.address),
      birthdate: optional(r.birthdate)?.slice(0, 10) ?? null,
      registeredBy: str(r.registeredBy) || 'sync',
      synced: true,
    });
    await repo.save(customer);
    return phoneNo;
  },
  async markSynced(manager, keys) {
    if (keys.length)
      await manager
        .getRepository(Customer)
        .update({ phoneNo: In(keys) }, { synced: true });
  },
};

// ───────────────────────── products ─────────────────────────
const products: SyncHandler = {
  key: 'barcode',
  async loadUnsynced(manager, limit) {
    const rows = await manager.getRepository(Product).find({
      where: { synced: false },
      relations: { brand: true, category: true },
      take: limit,
    });
    return rows.map((p) => ({
      barcode: p.barcode,
      name: p.name,
      costPrice: p.costPrice,
      sellingPrice: p.sellingPrice,
      quantity: p.quantity,
      description: p.description,
      brandNo: p.brand?.brandNo ?? null,
      categoryNo: p.category?.categoryNo ?? null,
      createdAt: p.createdAt,
    }));
  },
  async upsert(manager, r) {
    const repo = manager.getRepository(Product);
    const barcode = required(r, 'barcode');
    const name = required(r, 'name');
    const brand = r.brandNo
      ? await manager
          .getRepository(Brand)
          .findOneBy({ brandNo: str(r.brandNo) })
      : null;
    const category = r.categoryNo
      ? await manager
          .getRepository(Category)
          .findOneBy({ categoryNo: str(r.categoryNo) })
      : null;
    const product =
      (await repo.findOneBy({ barcode })) ??
      (await repo.findOneBy({ name: ILike(name) })) ??
      repo.create({ createdAt: r.createdAt ?? undefined });
    Object.assign(product, {
      barcode,
      name,
      costPrice: num(r.costPrice),
      sellingPrice: num(r.sellingPrice),
      quantity: Math.max(0, Math.trunc(num(r.quantity))),
      description: optional(r.description),
      brandId: brand?.id ?? null,
      categoryId: category?.id ?? null,
      synced: true,
    });
    delete product.brand;
    delete product.category;
    await repo.save(product);
    return barcode;
  },
  async markSynced(manager, keys) {
    if (keys.length)
      await manager
        .getRepository(Product)
        .update({ barcode: In(keys) }, { synced: true });
  },
};

// ───────────────────────── orders ─────────────────────────
const orders: SyncHandler = {
  key: 'orderNumber',
  async loadUnsynced(manager, limit) {
    const rows = await manager.getRepository(Order).find({
      where: { synced: false },
      relations: { items: true, customer: true, salespersonUser: true },
      take: limit,
    });
    return rows.map((o) => ({
      orderNumber: o.orderNumber,
      salesperson: o.salesperson,
      salespersonEmail: o.salespersonUser?.email ?? null,
      customerPhone: o.customer?.phoneNo ?? null,
      customerName: o.customerName,
      quantity: o.quantity,
      totalPrice: o.totalPrice,
      discount: o.discount,
      amountPaid: o.amountPaid,
      paymentType: o.paymentType,
      terminal: o.terminal,
      isReturned: o.isReturned,
      returnedAt: o.returnedAt,
      returnedBy: o.returnedBy,
      createdAt: o.createdAt,
      items: o.items.map((i) => ({
        productName: i.productName,
        barcode: i.barcode,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
        subtotal: i.subtotal,
      })),
    }));
  },
  async upsert(manager, r) {
    const repo = manager.getRepository(Order);
    const orderNumber = required(r, 'orderNumber');
    const paymentType = Object.values(PaymentType).includes(r.paymentType)
      ? (r.paymentType as PaymentType)
      : PaymentType.CASH;
    const customer = r.customerPhone
      ? await manager
          .getRepository(Customer)
          .findOneBy({ phoneNo: str(r.customerPhone) })
      : null;
    const salesperson = r.salespersonEmail
      ? await manager
          .getRepository(User)
          .findOneBy({ email: str(r.salespersonEmail).toLowerCase() })
      : null;

    const incomingItems: SyncRecord[] = Array.isArray(r.items) ? r.items : [];
    const barcodes = incomingItems.map((i) => str(i.barcode)).filter(Boolean);
    const productsByBarcode = new Map(
      (barcodes.length
        ? await manager.getRepository(Product).findBy({ barcode: In(barcodes) })
        : []
      ).map((p) => [p.barcode, p.id]),
    );

    let order = await repo.findOneBy({ orderNumber });
    if (order) {
      await manager.getRepository(OrderItem).delete({ orderId: order.id });
    } else {
      order = repo.create({
        orderNumber,
        createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
      });
    }

    Object.assign(order, {
      salesperson: str(r.salesperson) || 'Unknown',
      salespersonId: salesperson?.id ?? null,
      customerId: customer?.id ?? null,
      customerName: optional(r.customerName),
      quantity: Math.trunc(num(r.quantity)),
      totalPrice: num(r.totalPrice),
      discount: num(r.discount),
      amountPaid: num(r.amountPaid),
      paymentType,
      terminal: optional(r.terminal),
      isReturned: r.isReturned === true || r.isReturned === 'true',
      returnedAt: r.returnedAt ? new Date(r.returnedAt) : null,
      returnedBy: optional(r.returnedBy),
      synced: true,
      items: incomingItems.map((i) =>
        manager.getRepository(OrderItem).create({
          productId: productsByBarcode.get(str(i.barcode)) ?? null,
          productName: str(i.productName) || 'Unknown item',
          barcode: optional(i.barcode),
          unitPrice: num(i.unitPrice),
          quantity: Math.trunc(num(i.quantity)),
          subtotal: num(i.subtotal),
        }),
      ),
    });
    await repo.save(order);
    return orderNumber;
  },
  async markSynced(manager, keys) {
    if (keys.length)
      await manager
        .getRepository(Order)
        .update({ orderNumber: In(keys) }, { synced: true });
  },
};

export const SYNC_HANDLERS: Record<SyncEntityName, SyncHandler> = {
  users,
  brands,
  categories,
  customers,
  products,
  orders,
};
