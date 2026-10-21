import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import {
  paginate,
  PaginationQueryDto,
} from '../../common/dto/pagination-query.dto';
import { Role } from '../../common/enums/role.enum';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { hashPassword } from '../auth/password.util';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly config: ConfigService,
  ) {}

  async findAll(query: PaginationQueryDto) {
    const term = query.search?.trim();
    const where = term
      ? [
          { firstName: ILike(`%${term}%`) },
          { lastName: ILike(`%${term}%`) },
          { email: ILike(`%${term}%`) },
        ]
      : {};
    const [data, total] = await this.userRepository.findAndCount({
      where,
      order: { firstName: 'ASC', lastName: 'ASC' },
      skip: query.skip,
      take: query.limit,
    });
    return paginate(data, total, query);
  }

  /** Names of everyone who can make sales (used by the salesperson report filter). */
  async listSalespeople() {
    const users = await this.userRepository.find({
      order: { firstName: 'ASC' },
    });
    return users.map((u) => ({ id: u.id, fullName: u.fullName, role: u.role }));
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOneBy({ email: email.trim().toLowerCase() });
  }

  async create(dto: CreateUserDto, actor: AuthUser): Promise<User> {
    this.assertCanAssignRole(actor, dto.role);
    if (await this.findByEmail(dto.email))
      throw new ConflictException('A user with this email already exists');

    const password =
      dto.password ??
      this.config.getOrThrow<string>('auth.defaultUserPassword');
    const user = this.userRepository.create({
      ...dto,
      password: await hashPassword(password),
      registeredBy: actor.fullName,
      synced: false,
    });
    return this.userRepository.save(user);
  }

  async update(id: number, dto: UpdateUserDto, actor: AuthUser): Promise<User> {
    const user = await this.findOne(id);
    if (user.role === Role.SUPER_ADMIN || dto.role)
      this.assertCanAssignRole(actor, dto.role ?? user.role);

    if (
      dto.email &&
      dto.email !== user.email &&
      (await this.findByEmail(dto.email))
    ) {
      throw new ConflictException('A user with this email already exists');
    }

    const { password, ...rest } = dto;
    Object.assign(user, rest, { synced: false });
    if (password) user.password = await hashPassword(password);
    return this.userRepository.save(user);
  }

  async updateProfile(
    id: number,
    firstName?: string,
    lastName?: string,
  ): Promise<User> {
    const user = await this.findOne(id);
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    user.synced = false;
    return this.userRepository.save(user);
  }

  async setPassword(id: number, password: string): Promise<void> {
    await this.userRepository.update(id, {
      password: await hashPassword(password),
      synced: false,
    });
  }

  async remove(id: number, actor: AuthUser): Promise<void> {
    if (id === actor.id)
      throw new ForbiddenException('You cannot delete your own account');
    const user = await this.findOne(id);
    this.assertCanAssignRole(actor, user.role);
    await this.userRepository.remove(user);
  }

  /** Only a Super Admin may create, edit or delete Super Admin accounts. */
  private assertCanAssignRole(actor: AuthUser, role: Role) {
    if (role === Role.SUPER_ADMIN && actor.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Only a Super Admin can manage Super Admin accounts',
      );
    }
  }
}
