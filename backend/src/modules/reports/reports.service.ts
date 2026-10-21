import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { PaymentType } from '../../common/enums/payment-type.enum';
import { MANAGER_ROLES } from '../../common/enums/role.enum';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { dayRange, toDateKey } from '../../common/utils/date.util';
import { CustomersService } from '../customers/customers.service';
import { Order } from '../orders/order.entity';
import { OrdersService } from '../orders/orders.service';
import { PackingsService } from '../packings/packings.service';
import { Product } from '../products/product.entity';
import { ProductsService } from '../products/products.service';
import { UsersService } from '../users/users.service';
import { CloseDayQueryDto } from './dto/close-day-query.dto';
import { SalesReportQueryDto } from './dto/sales-report-query.dto';

export interface Totals {
  orderCount: number;
  itemCount: number;
  totalSales: number;
  totalDiscount: number;
  amountPaid: number;
  byPaymentType: Record<PaymentType, number>;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly ordersService: OrdersService,
    private readonly productsService: ProductsService,
    private readonly customersService: CustomersService,
    private readonly packingsService: PackingsService,
    private readonly usersService: UsersService,
  ) {}

  /** Sales between two dates, optionally for one salesperson (Laravel: postSalesReport / postSalesPersonReport). */
  async sales(query: SalesReportQueryDto) {
    const { start, end } = dayRange(query.from, query.to);
    const scope = (qb: SelectQueryBuilder<Order>) => {
      qb.where('o.isReturned = false').andWhere(
        'o.createdAt BETWEEN :start AND :end',
        { start, end },
      );
      if (query.salesperson)
        qb.andWhere('o.salesperson = :sp', { sp: query.salesperson });
      return qb;
    };

    const orders = await scope(this.orderRepository.createQueryBuilder('o'))
      .leftJoinAndSelect('o.customer', 'customer')
      .orderBy('o.createdAt', 'DESC')
      .getMany();

    return {
      from: toDateKey(start),
      to: toDateKey(end),
      salesperson: query.salesperson ?? null,
      ...(await this.totals(scope)),
      orders,
    };
  }

  /** Per-cashier end-of-day summary (Laravel: closeDayReport). */
  async closeDay(query: CloseDayQueryDto, actor: AuthUser) {
    let target: Pick<AuthUser, 'id' | 'fullName'> = actor;
    if (query.userId && query.userId !== actor.id) {
      if (!MANAGER_ROLES.includes(actor.role))
        throw new ForbiddenException('You can only close your own day');
      target = await this.usersService.findOne(query.userId);
    }

    const { start, end } = dayRange(query.date, query.date);
    const scope = (qb: SelectQueryBuilder<Order>) => {
      qb.where('o.isReturned = false').andWhere(
        'o.createdAt BETWEEN :start AND :end',
        { start, end },
      );
      return this.ordersService.whereSoldBy(qb, target);
    };

    return {
      date: toDateKey(start),
      user: target.fullName,
      ...(await this.totals(scope)),
    };
  }

  outOfStock(threshold = 0) {
    return this.productsService.findOutOfStock(threshold);
  }

  /** Numbers for the dashboard tiles and the header badges. */
  async dashboard(user: AuthUser, terminal: string) {
    const { start, end } = dayRange();
    const mine = await this.totals((qb) =>
      this.ordersService.whereSoldBy(
        qb
          .where('o.isReturned = false')
          .andWhere('o.createdAt BETWEEN :start AND :end', { start, end }),
        user,
      ),
    );

    const isManager = MANAGER_ROLES.includes(user.role);
    const store = isManager
      ? await this.totals((qb) =>
          qb
            .where('o.isReturned = false')
            .andWhere('o.createdAt BETWEEN :start AND :end', { start, end }),
        )
      : null;

    const [birthdaysToday, parkedSales, outOfStock, productCount] =
      await Promise.all([
        this.customersService.countBirthdaysToday(),
        this.packingsService.countForTerminal(terminal),
        this.productRepository.countBy({ quantity: 0 }),
        this.productRepository.count(),
      ]);

    return {
      date: toDateKey(),
      mySalesToday: mine,
      storeSalesToday: store,
      birthdaysToday,
      parkedSales,
      outOfStock,
      productCount,
    };
  }

  private async totals(
    scope: (qb: SelectQueryBuilder<Order>) => SelectQueryBuilder<Order>,
  ): Promise<Totals> {
    const raw = await scope(this.orderRepository.createQueryBuilder('o'))
      .select('COUNT(o.id)', 'orderCount')
      .addSelect('COALESCE(SUM(o.quantity), 0)', 'itemCount')
      .addSelect('COALESCE(SUM(o.totalPrice), 0)', 'totalSales')
      .addSelect('COALESCE(SUM(o.discount), 0)', 'totalDiscount')
      .addSelect('COALESCE(SUM(o.amountPaid), 0)', 'amountPaid')
      .getRawOne<Record<string, string>>();

    const byType = await scope(this.orderRepository.createQueryBuilder('o'))
      .select('o.paymentType', 'paymentType')
      .addSelect('COALESCE(SUM(o.amountPaid), 0)', 'amount')
      .groupBy('o.paymentType')
      .getRawMany<{ paymentType: PaymentType; amount: string }>();

    const byPaymentType = Object.fromEntries(
      Object.values(PaymentType).map((t) => [t, 0]),
    ) as Record<PaymentType, number>;
    byType.forEach(
      (row) => (byPaymentType[row.paymentType] = parseFloat(row.amount)),
    );

    return {
      orderCount: parseInt(raw?.orderCount ?? '0', 10),
      itemCount: parseInt(raw?.itemCount ?? '0', 10),
      totalSales: parseFloat(raw?.totalSales ?? '0'),
      totalDiscount: parseFloat(raw?.totalDiscount ?? '0'),
      amountPaid: parseFloat(raw?.amountPaid ?? '0'),
      byPaymentType,
    };
  }
}
