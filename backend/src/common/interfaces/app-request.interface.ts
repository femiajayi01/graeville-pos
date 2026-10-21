import type { Request } from 'express';
import { AuthUser } from './auth-user.interface';

/** Express request after the JwtAuthGuard has run. */
export type AppRequest = Request & { user?: AuthUser };
