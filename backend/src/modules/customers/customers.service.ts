import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, ILike, Not, Repository } from 'typeorm';
import {
  paginate,
  PaginationQueryDto,
} from '../../common/dto/pagination-query.dto';
import { Order } from '../orders/order.entity';
import { Customer } from './customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async findAll(query: PaginationQueryDto) {
    const term = query.search?.trim();
    const where = term
      ? [{ fullName: ILike(`%${term}%`) }, { phoneNo: ILike(`%${term}%`) }]
      : {};
    const [data, total] = await this.customerRepository.findAndCount({
      where,
      order: { fullName: 'ASC' },
      skip: query.skip,
      take: query.limit,
    });
    return paginate(data, total, query);
  }

  async findOne(id: number): Promise<Customer> {
    const customer = await this.customerRepository.findOneBy({ id });
    if (!customer) throw new NotFoundException(`Customer #${id} not found`);
    return customer;
  }

  /** Exact phone lookup used on the checkout screen. Returns null when not registered. */
  findByPhone(phoneNo: string): Promise<Customer | null> {
    return this.customerRepository.findOneBy({
      phoneNo: phoneNo.replace(/\s+/g, ''),
    });
  }

  /** Customers whose birthday is today (month + day match). */
  findBirthdaysToday(): Promise<Customer[]> {
    const now = new Date();
    return this.customerRepository
      .createQueryBuilder('c')
      .where('EXTRACT(MONTH FROM c.birthdate) = :month', {
        month: now.getMonth() + 1,
      })
      .andWhere('EXTRACT(DAY FROM c.birthdate) = :day', { day: now.getDate() })
      .orderBy('c.fullName', 'ASC')
      .getMany();
  }

  async countBirthdaysToday(): Promise<number> {
    return (await this.findBirthdaysToday()).length;
  }

  async findOrders(id: number, query: PaginationQueryDto) {
    await this.findOne(id);
    const [data, total] = await this.orderRepository.findAndCount({
      where: { customerId: id },
      relations: { items: true },
      order: { createdAt: 'DESC' },
      skip: query.skip,
      take: query.limit,
    });
    return paginate(data, total, query);
  }

  async create(
    dto: CreateCustomerDto,
    registeredBy: string,
    manager?: EntityManager,
  ): Promise<Customer> {
    const repo = manager?.getRepository(Customer) ?? this.customerRepository;
    if (await repo.existsBy({ phoneNo: dto.phoneNo })) {
      throw new ConflictException(
        `A customer with phone number ${dto.phoneNo} already exists`,
      );
    }
    return repo.save(
      repo.create({
        fullName: dto.fullName,
        phoneNo: dto.phoneNo,
        email: dto.email ?? null,
        address: dto.address ?? null,
        birthdate: dto.birthdate ?? null,
        registeredBy,
        synced: false,
      }),
    );
  }

  async update(id: number, dto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(id);
    if (
      dto.phoneNo &&
      (await this.customerRepository.existsBy({
        phoneNo: dto.phoneNo,
        id: Not(id),
      }))
    ) {
      throw new ConflictException(
        `A customer with phone number ${dto.phoneNo} already exists`,
      );
    }
    Object.assign(customer, dto, { synced: false });
    return this.customerRepository.save(customer);
  }

  async remove(id: number): Promise<void> {
    await this.customerRepository.remove(await this.findOne(id));
  }
}
