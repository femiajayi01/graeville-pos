import { Role } from '../enums/role.enum';

/** The authenticated user attached to `request.user` by the JwtAuthGuard. */
export interface AuthUser {
  id: number;
  email: string;
  role: Role;
  fullName: string;
}

export interface JwtPayload {
  sub: number;
  email: string;
  role: Role;
}
