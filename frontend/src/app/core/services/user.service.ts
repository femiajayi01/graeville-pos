import { inject, Injectable } from '@angular/core';
import { ApiService } from '../http/api.service';
import { PageQuery, Paginated, User, UserPayload } from '../models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly api = inject(ApiService);

  list(query: PageQuery) {
    return this.api.get<Paginated<User>>('users', query);
  }
  salespeople() {
    return this.api.get<{ id: number; fullName: string }[]>('users/salespeople');
  }
  create(payload: UserPayload) {
    return this.api.post<User>('users', payload);
  }
  update(id: number, payload: Partial<UserPayload>) {
    return this.api.patch<User>(`users/${id}`, payload);
  }
  delete(id: number) {
    return this.api.delete(`users/${id}`);
  }
  updateProfile(firstName: string, lastName: string) {
    return this.api.patch<User>('auth/me', { firstName, lastName });
  }
  changePassword(currentPassword: string, newPassword: string, confirmPassword: string) {
    return this.api.post<{ message: string }>('auth/change-password', {
      currentPassword,
      newPassword,
      confirmPassword,
    });
  }
}
