import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Not, Repository } from 'typeorm';
import {
  paginate,
  PaginationQueryDto,
} from '../../common/dto/pagination-query.dto';
import { sixDigitCode } from '../../common/utils/random.util';
import { Brand } from './brand.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
  ) {}

  async findAll(query: PaginationQueryDto) {
    const term = query.search?.trim();
    const [data, total] = await this.brandRepository.findAndCount({
      where: term ? { name: ILike(`%${term}%`) } : {},
      order: { name: 'ASC' },
      skip: query.skip,
      take: query.limit,
    });
    return paginate(data, total, query);
  }

  /** Unpaginated list for dropdowns. */
  findAllOptions() {
    return this.brandRepository.find({
      select: { id: true, name: true, brandNo: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Brand> {
    const brand = await this.brandRepository.findOneBy({ id });
    if (!brand) throw new NotFoundException(`Brand #${id} not found`);
    return brand;
  }

  async create(dto: CreateBrandDto): Promise<Brand> {
    await this.assertNameAvailable(dto.name);
    const brand = this.brandRepository.create({
      name: dto.name,
      brandNo: await this.uniqueCode(),
      synced: false,
    });
    return this.brandRepository.save(brand);
  }

  async update(id: number, dto: UpdateBrandDto): Promise<Brand> {
    const brand = await this.findOne(id);
    if (dto.name) await this.assertNameAvailable(dto.name, id);
    Object.assign(brand, dto, { synced: false });
    return this.brandRepository.save(brand);
  }

  async remove(id: number): Promise<void> {
    await this.brandRepository.remove(await this.findOne(id));
  }

  /** Finds a brand by name, creating it if needed (used by the Excel import). */
  async findOrCreateByName(name: string): Promise<Brand> {
    const existing = await this.brandRepository.findOneBy({
      name: ILike(name.trim()),
    });
    return existing ?? this.create({ name: name.trim() });
  }

  private async assertNameAvailable(name: string, ignoreId?: number) {
    const clash = await this.brandRepository.findOneBy({
      name: ILike(name.trim()),
      ...(ignoreId ? { id: Not(ignoreId) } : {}),
    });
    if (clash) throw new ConflictException(`Brand "${name}" already exists`);
  }

  private async uniqueCode(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt++) {
      const code = sixDigitCode();
      if (!(await this.brandRepository.existsBy({ brandNo: code })))
        return code;
    }
    throw new ConflictException(
      'Could not generate a unique brand number, please retry',
    );
  }
}
