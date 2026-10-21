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
import { Category } from './category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async findAll(query: PaginationQueryDto) {
    const term = query.search?.trim();
    const [data, total] = await this.categoryRepository.findAndCount({
      where: term ? { name: ILike(`%${term}%`) } : {},
      order: { name: 'ASC' },
      skip: query.skip,
      take: query.limit,
    });
    return paginate(data, total, query);
  }

  /** Unpaginated list for dropdowns. */
  findAllOptions() {
    return this.categoryRepository.find({
      select: { id: true, name: true, categoryNo: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOneBy({ id });
    if (!category) throw new NotFoundException(`Category #${id} not found`);
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    await this.assertNameAvailable(dto.name);
    const category = this.categoryRepository.create({
      name: dto.name,
      categoryNo: await this.uniqueCode(),
      synced: false,
    });
    return this.categoryRepository.save(category);
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);
    if (dto.name) await this.assertNameAvailable(dto.name, id);
    Object.assign(category, dto, { synced: false });
    return this.categoryRepository.save(category);
  }

  async remove(id: number): Promise<void> {
    await this.categoryRepository.remove(await this.findOne(id));
  }

  /** Finds a category by name, creating it if needed (used by the Excel import). */
  async findOrCreateByName(name: string): Promise<Category> {
    const existing = await this.categoryRepository.findOneBy({
      name: ILike(name.trim()),
    });
    return existing ?? this.create({ name: name.trim() });
  }

  private async assertNameAvailable(name: string, ignoreId?: number) {
    const clash = await this.categoryRepository.findOneBy({
      name: ILike(name.trim()),
      ...(ignoreId ? { id: Not(ignoreId) } : {}),
    });
    if (clash) throw new ConflictException(`Category "${name}" already exists`);
  }

  private async uniqueCode(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt++) {
      const code = sixDigitCode();
      if (!(await this.categoryRepository.existsBy({ categoryNo: code })))
        return code;
    }
    throw new ConflictException(
      'Could not generate a unique category number, please retry',
    );
  }
}
