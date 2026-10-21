export enum Role {
  USER = 'User',
  ADMIN = 'Admin',
  SUPER_ADMIN = 'Super Admin',
}

/** Roles allowed to see sales, reports, returns and user management. */
export const MANAGER_ROLES: Role[] = [Role.ADMIN, Role.SUPER_ADMIN];
