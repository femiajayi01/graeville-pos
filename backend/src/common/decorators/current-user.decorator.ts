import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AppRequest } from '../interfaces/app-request.interface';
import { AuthUser } from '../interfaces/auth-user.interface';

/** Injects the authenticated user: `@CurrentUser() user: AuthUser`. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser =>
    ctx.switchToHttp().getRequest<AppRequest>().user!,
);
