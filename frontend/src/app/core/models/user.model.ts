export enum Role {
  User = 'User',
  Admin = 'Admin',
  SuperAdmin = 'Super Admin',
}

export const MANAGER_ROLES: Role[] = [Role.Admin, Role.SuperAdmin];

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: Role;
  registeredBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface UserPayload {
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  password?: string;
}
