import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, ILike, Not, Repository } from 'typeorm';
import { paginate } from '../../common/dto/pagination-query.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async findAll(query: ProductQueryDto) {
    const qb = this.productRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.brand', 'brand')
      .leftJoinAndSelect('p.category', 'category')
      .orderBy('p.name', 'ASC')
      .skip(query.skip)
      .take(query.limit);

    const term = query.search?.trim();
    if (term) {
      qb.andWhere(
        new Brackets((w) =>
          w
            .where('p.name ILIKE :term', { term: `%${term}%` })
            .orWhere('p.barcode ILIKE :term'),
        ),
      );
    }
    if (query.brandId)
      qb.andWhere('p.brandId = :brandId', { brandId: query.brandId });
    if (query.categoryId)
      qb.andWhere('p.categoryId = :categoryId', {
        categoryId: query.categoryId,
      });
    if (query.outOfStock) qb.andWhere('p.quantity = 0');

    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, query);
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: { brand: true, category: true },
    });
    if (!product) throw new NotFoundException(`Product #${id} not found`);
    return product;
  }

  /**
   * POS lookup: exact barcode first, then exact (case-insensitive) name.
   * Mirrors Laravel's getAddToCart / getAddToCartNyName.
   */
  async lookup(code: string): Promise<Product> {
    const value = code.trim();
    const product =
      (await this.productRepository.findOneBy({ barcode: value })) ??
      (await this.productRepository.findOneBy({ name: ILike(value) }));
    if (!product) throw new NotFoundException(`No product matches "${value}"`);
    return product;
  }

  /** Autocomplete for the sell screen: name contains or barcode starts with the term. */
  search(term: string, limit = 10): Promise<Product[]> {
    const value = term.trim();
    if (!value) return Promise.resolve([]);
    return this.productRepository
      .createQueryBuilder('p')
      .where('p.name ILIKE :contains', { contains: `%${value}%` })
      .orWhere('p.barcode ILIKE :prefix', { prefix: `${value}%` })
      .orderBy('p.quantity > 0', 'DESC')
      .addOrderBy('p.name', 'ASC')
      .take(Math.min(limit, 50))
      .getMany();
  }

  findOutOfStock(threshold = 0): Promise<Product[]> {
    return this.productRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.brand', 'brand')
      .leftJoinAndSelect('p.category', 'category')
      .where('p.quantity <= :threshold', { threshold })
      .orderBy('p.quantity', 'ASC')
      .addOrderBy('p.name', 'ASC')
      .getMany();
  }

  async create(dto: CreateProductDto): Promise<Product> {
    await this.assertUnique(dto.name, dto.barcode);
    const product = this.productRepository.create({
      ...dto,
      description: dto.description ?? null,
      synced: false,
    });
    const saved = await this.productRepository.save(product);
    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    await this.assertUnique(dto.name, dto.barcode, id);
    // Relations are reloaded below; drop them so the FK ids in the DTO win.
    delete product.brand;
    delete product.category;
    Object.assign(product, dto, { synced: false });
    await this.productRepository.save(product);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.productRepository.remove(await this.findOne(id));
  }

  private async assertUnique(
    name?: string,
    barcode?: string,
    ignoreId?: number,
  ) {
    const notSelf = ignoreId ? { id: Not(ignoreId) } : {};
    if (
      name &&
      (await this.productRepository.existsBy({ name: ILike(name), ...notSelf }))
    ) {
      throw new ConflictException(`A product named "${name}" already exists`);
    }
    if (
      barcode &&
      (await this.productRepository.existsBy({ barcode, ...notSelf }))
    ) {
      throw new ConflictException(
        `Barcode ${barcode} is already used by another product`,
      );
    }
  }
}
