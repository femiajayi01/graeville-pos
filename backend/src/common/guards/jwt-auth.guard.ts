import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { User } from '../../modules/users/user.entity';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AppRequest } from '../interfaces/app-request.interface';
import { AuthUser, JwtPayload } from '../interfaces/auth-user.interface';

/**
 * Global guard: every route needs a valid Bearer token unless decorated with @Public().
 * The user is re-loaded on each request so deleted users / role changes take effect immediately.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AppRequest>();
    const [scheme, token] = (request.headers.authorization ?? '').split(' ');
    if (scheme !== 'Bearer' || !token)
      throw new UnauthorizedException('Missing access token');

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    const user = await this.dataSource
      .getRepository(User)
      .findOneBy({ id: payload.sub });
    if (!user) throw new UnauthorizedException('User no longer exists');

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };
    request.user = authUser;
    return true;
  }
}
