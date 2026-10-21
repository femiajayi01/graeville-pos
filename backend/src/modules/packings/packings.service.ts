import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { multiply, sum } from '../../common/utils/money.util';
import { Product } from '../products/product.entity';
import { CreatePackingDto } from './dto/create-packing.dto';
import { PackedItem, Packing } from './packing.entity';

/**
 * Parked ("packed") sales. Laravel: finalCartPage(pack) / ViewPacked / getUnpack / sellPacked.
 * Stock is NOT reserved while a sale is parked — it is checked again at checkout, as before.
 */
@Injectable()
export class PackingsService {
  constructor(
    @InjectRepository(Packing)
    private readonly packingRepository: Repository<Packing>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  findForTerminal(terminal: string): Promise<Packing[]> {
    return this.packingRepository.find({
      where: { terminal },
      order: { createdAt: 'ASC' },
    });
  }

  countForTerminal(terminal: string): Promise<number> {
    return this.packingRepository.countBy({ terminal });
  }

  async findOne(id: number): Promise<Packing> {
    const packing = await this.packingRepository.findOneBy({ id });
    if (!packing) throw new NotFoundException(`Parked sale #${id} not found`);
    return packing;
  }

  async create(
    dto: CreatePackingDto,
    user: AuthUser,
    terminal: string,
  ): Promise<Packing> {
    const products = await this.productRepository.findBy({
      id: In(dto.items.map((i) => i.productId)),
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    const items: PackedItem[] = dto.items.map((line) => {
      const product = byId.get(line.productId);
      if (!product)
        throw new NotFoundException(`Product #${line.productId} not found`);
      return {
        productId: product.id,
        productName: product.name,
        barcode: product.barcode,
        unitPrice: product.sellingPrice,
        quantity: line.quantity,
        subtotal: multiply(product.sellingPrice, line.quantity),
      };
    });

    return this.packingRepository.save(
      this.packingRepository.create({
        items,
        totalQty: items.reduce((acc, i) => acc + i.quantity, 0),
        totalPrice: sum(items.map((i) => i.subtotal)),
        terminal,
        parkedById: user.id,
        parkedBy: user.fullName,
        label: dto.label ?? null,
      }),
    );
  }

  /** Discards a parked sale without selling it (Laravel: getUnpack). */
  async remove(id: number): Promise<void> {
    await this.packingRepository.remove(await this.findOne(id));
  }
}
