import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../../common/interfaces/auth-user.interface';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { verifyPassword } from './password.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<{ accessToken: string; user: User }> {
    const user = await this.usersService.findByEmail(dto.email);
    // Same message for unknown email and wrong password, so accounts can't be enumerated.
    if (!user || !(await verifyPassword(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return { accessToken: await this.jwtService.signAsync(payload), user };
  }

  async changePassword(
    userId: number,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException(
        'New password and confirmation do not match',
      );
    }
    const user = await this.usersService.findOne(userId);
    if (!(await verifyPassword(dto.currentPassword, user.password))) {
      throw new BadRequestException('Current password is incorrect');
    }
    await this.usersService.setPassword(userId, dto.newPassword);
    return { message: 'Password has been changed' };
  }
}
