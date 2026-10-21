import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Brackets,
  DataSource,
  EntityManager,
  In,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import {
  paginate,
  PaginationQueryDto,
} from '../../common/dto/pagination-query.dto';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import {
  dayRange,
  orderNumberPrefix,
  toDateKey,
} from '../../common/utils/date.util';
import { multiply, sum } from '../../common/utils/money.util';
import { Customer } from '../customers/customer.entity';
import { CustomersService } from '../customers/customers.service';
import { MailService } from '../mail/mail.service';
import { renderReceiptEmail } from '../mail/templates/receipt.template';
import { Packing } from '../packings/packing.entity';
import { Product } from '../products/product.entity';
import { SettingsService } from '../settings/settings.service';
import { CheckoutDto } from './dto/checkout.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { OrderItem } from './order-item.entity';
import { Order } from './order.entity';

/** Arbitrary constant used with pg_advisory_xact_lock to serialise order-number generation. */
const ORDER_NUMBER_LOCK = 734_001;

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly dataSource: DataSource,
    private readonly customersService: CustomersService,
    private readonly mailService: MailService,
    private readonly settings: SettingsService,
  ) {}

  // ───────────────────────────── Checkout ─────────────────────────────

  /**
   * Completes a sale (Laravel: ProductController@postCheckoutPage).
   * Everything happens in one transaction with the product rows locked, so two tills
   * selling the last unit at the same moment cannot both succeed.
   */
  async checkout(
    dto: CheckoutDto,
    user: AuthUser,
    terminal: string,
  ): Promise<Order> {
    const lines = this.mergeLines(dto.items);

    const orderId = await this.dataSource.transaction(async (manager) => {
      const productRepo = manager.getRepository(Product);
      const products = await productRepo.find({
        where: { id: In(lines.map((l) => l.productId)) },
        lock: { mode: 'pessimistic_write' },
      });
      const byId = new Map(products.map((p) => [p.id, p]));

      // 1. Validate stock for every line before touching anything.
      const problems: string[] = [];
      for (const line of lines) {
        const product = byId.get(line.productId);
        if (!product)
          problems.push(`Product #${line.productId} no longer exists`);
        else if (product.quantity < line.quantity) {
          problems.push(
            `${product.name}: only ${product.quantity} left (requested ${line.quantity})`,
          );
        }
      }
      if (problems.length)
        throw new BadRequestException({
          message: 'Insufficient stock',
          errors: problems,
        });

      // 2. Build order lines & totals (prices always come from the database, never the client).
      const items = lines.map((line) => {
        const product = byId.get(line.productId)!;
        return manager.getRepository(OrderItem).create({
          productId: product.id,
          productName: product.name,
          barcode: product.barcode,
          unitPrice: product.sellingPrice,
          quantity: line.quantity,
          subtotal: multiply(product.sellingPrice, line.quantity),
        });
      });
      const totalPrice = sum(items.map((i) => i.subtotal));
      const discount = dto.discount ?? 0;
      if (discount > totalPrice)
        throw new BadRequestException(
          'Discount cannot be more than the total price',
        );

      // 3. Resolve the customer (existing, newly registered, or walk-in).
      const customer = await this.resolveCustomer(dto, user, manager);

      // 4. Deduct stock.
      for (const line of lines) {
        const product = byId.get(line.productId)!;
        product.quantity -= line.quantity;
        product.synced = false;
      }
      await productRepo.save(products);

      // 5. Save the order.
      const order = manager.getRepository(Order).create({
        orderNumber: await this.nextOrderNumber(manager),
        salespersonId: user.id,
        salesperson: user.fullName,
        customerId: customer?.id ?? null,
        customerName: customer?.fullName ?? null,
        quantity: lines.reduce((acc, l) => acc + l.quantity, 0),
        totalPrice,
        discount,
        amountPaid: sum([totalPrice, -discount]),
        paymentType: dto.paymentType,
        terminal,
        isReturned: false,
        synced: false,
        items,
      });
      const saved = await manager.getRepository(Order).save(order);

      // 6. A resumed parked sale is finished — remove it.
      if (dto.packingId)
        await manager.getRepository(Packing).delete({ id: dto.packingId });

      return saved.id;
    });

    return this.findOne(orderId);
  }

  private mergeLines(items: CheckoutDto['items']) {
    const merged = new Map<number, number>();
    for (const item of items)
      merged.set(
        item.productId,
        (merged.get(item.productId) ?? 0) + item.quantity,
      );
    return [...merged.entries()].map(([productId, quantity]) => ({
      productId,
      quantity,
    }));
  }

  private async resolveCustomer(
    dto: CheckoutDto,
    user: AuthUser,
    manager: EntityManager,
  ): Promise<Customer | null> {
    if (dto.newCustomer) {
      const existing = await manager
        .getRepository(Customer)
        .findOneBy({ phoneNo: dto.newCustomer.phoneNo });
      return (
        existing ??
        this.customersService.create(dto.newCustomer, user.fullName, manager)
      );
    }
    if (dto.customerId) {
      const customer = await manager
        .getRepository(Customer)
        .findOneBy({ id: dto.customerId });
      if (!customer)
        throw new NotFoundException(`Customer #${dto.customerId} not found`);
      return customer;
    }
    return null;
  }

  /** yymmdd + 4-digit sequence that restarts every day (Laravel: get_order_number). */
  private async nextOrderNumber(manager: EntityManager): Promise<string> {
    await manager.query('SELECT pg_advisory_xact_lock($1)', [
      ORDER_NUMBER_LOCK,
    ]);
    const prefix = orderNumberPrefix();
    const last = await manager
      .getRepository(Order)
      .createQueryBuilder('o')
      .select('o.orderNumber', 'orderNumber')
      .where('o.orderNumber LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('LENGTH(o.orderNumber)', 'DESC')
      .addOrderBy('o.orderNumber', 'DESC')
      .limit(1)
      .getRawOne<{ orderNumber: string }>();
    const next = last
      ? parseInt(last.orderNumber.slice(prefix.length), 10) + 1
      : 1;
    return `${prefix}${String(next).padStart(4, '0')}`;
  }

  // ───────────────────────────── Queries ─────────────────────────────

  /** All sales (admin). Laravel: getRecentSales. */
  async findAll(query: OrderQueryDto) {
    const qb = this.baseQuery(query.includeReturned)
      .orderBy('o.createdAt', 'DESC')
      .skip(query.skip)
      .take(query.limit);

    if (query.from || query.to) {
      const { start, end } = dayRange(query.from, query.to);
      qb.andWhere('o.createdAt BETWEEN :start AND :end', { start, end });
    }
    if (query.salesperson)
      qb.andWhere('o.salesperson = :salesperson', {
        salesperson: query.salesperson,
      });
    const term = query.search?.trim();
    if (term) {
      qb.andWhere(
        new Brackets((w) =>
          w
            .where('o.orderNumber ILIKE :term', { term: `%${term}%` })
            .orWhere('o.customerName ILIKE :term'),
        ),
      );
    }
    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, query);
  }

  /** Current user's sales today (Laravel: getMySales). */
  async findMineToday(user: AuthUser, query: PaginationQueryDto) {
    const { start, end } = dayRange();
    return this.findMineBetween(user, start, end, query);
  }

  /** Current user's sales over the last month (Laravel: getMyRecentSales). */
  async findMineRecent(user: AuthUser, query: PaginationQueryDto) {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const { start } = dayRange(toDateKey(lastMonth));
    const { end } = dayRange();
    return this.findMineBetween(user, start, end, query);
  }

  private async findMineBetween(
    user: AuthUser,
    start: Date,
    end: Date,
    query: PaginationQueryDto,
  ) {
    const qb = this.baseQuery(false)
      .andWhere('o.createdAt BETWEEN :start AND :end', { start, end })
      .orderBy('o.createdAt', 'DESC')
      .skip(query.skip)
      .take(query.limit);
    this.whereSoldBy(qb, user);
    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, query);
  }

  /** Orders made by a user: matched on user id, or on name for orders synced in without one. */
  whereSoldBy(
    qb: SelectQueryBuilder<Order>,
    user: Pick<AuthUser, 'id' | 'fullName'>,
  ) {
    return qb.andWhere(
      new Brackets((w) =>
        w
          .where('o.salespersonId = :uid', { uid: user.id })
          .orWhere('(o.salespersonId IS NULL AND o.salesperson = :uname)', {
            uname: user.fullName,
          }),
      ),
    );
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: { items: true, customer: true },
      order: { items: { id: 'ASC' } },
    });
    if (!order) throw new NotFoundException(`Order #${id} not found`);
    return order;
  }

  /** Invoice search (Laravel: getInvoice / getInvoice2). */
  async findByOrderNumber(orderNumber: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { orderNumber: orderNumber.trim() },
      relations: { items: true, customer: true },
    });
    if (!order)
      throw new NotFoundException(
        `Could not find invoice number ${orderNumber}`,
      );
    return order;
  }

  private baseQuery(includeReturned = false) {
    const qb = this.orderRepository
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.customer', 'customer')
      .where('1 = 1');
    if (!includeReturned) qb.andWhere('o.isReturned = false');
    return qb;
  }

  // ───────────────────────────── Returns & receipts ─────────────────────────────

  /**
   * Returns every item of an order and puts the stock back (Laravel: postReturn with items = "all").
   */
  async returnOrder(id: number, user: AuthUser): Promise<Order> {
    await this.dataSource.transaction(async (manager) => {
      const order = await manager.getRepository(Order).findOne({
        where: { id },
        relations: { items: true },
        lock: { mode: 'pessimistic_write', tables: ['orders'] },
      });
      if (!order) throw new NotFoundException(`Order #${id} not found`);
      if (order.isReturned)
        throw new ConflictException('This order has already been returned');

      const productIds = order.items
        .map((i) => i.productId)
        .filter((pid): pid is number => pid !== null);
      if (productIds.length) {
        const products = await manager.getRepository(Product).find({
          where: { id: In(productIds) },
          lock: { mode: 'pessimistic_write' },
        });
        const byId = new Map(products.map((p) => [p.id, p]));
        for (const item of order.items) {
          const product = item.productId ? byId.get(item.productId) : undefined;
          if (product) {
            product.quantity += item.quantity;
            product.synced = false;
          }
        }
        await manager.getRepository(Product).save(products);
      }

      await manager.getRepository(Order).update(order.id, {
        isReturned: true,
        returnedAt: new Date(),
        returnedBy: user.fullName,
        synced: false,
      });
    });
    return this.findOne(id);
  }

  async emailReceipt(id: number, email: string): Promise<{ message: string }> {
    const order = await this.findOne(id);
    const store = await this.settings.getPublicInfo();
    await this.mailService.send(
      email,
      `Your receipt from ${store.name} (#${order.orderNumber})`,
      renderReceiptEmail(order, store),
    );
    return { message: `Receipt sent to ${email}` };
  }
}
