import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from '../http/api.service';
import { LoginResponse, MANAGER_ROLES, User } from '../models';

const TOKEN_KEY = 'pos.accessToken';
const USER_KEY = 'pos.user';

/** Holds the session (JWT + current user) as signals, persisted in localStorage. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  private readonly _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private readonly _user = signal<User | null>(this.readUser());

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token() && !this.isExpired(this._token()!));
  readonly isManager = computed(() => !!this._user() && MANAGER_ROLES.includes(this._user()!.role));

  login(email: string, password: string): Observable<LoginResponse> {
    return this.api.post<LoginResponse>('auth/login', { email, password }).pipe(
      tap(({ accessToken, user }) => {
        localStorage.setItem(TOKEN_KEY, accessToken);
        this._token.set(accessToken);
        this.setUser(user);
      }),
    );
  }

  /** Re-reads the profile (e.g. after the user edits their name). */
  refreshProfile(): Observable<User> {
    return this.api.get<User>('auth/me').pipe(tap((user) => this.setUser(user)));
  }

  setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._user.set(user);
  }

  logout(redirect = true): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._user.set(null);
    if (redirect) void this.router.navigate(['/login']);
  }

  private readUser(): User | null {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) ?? 'null') as User | null;
    } catch {
      return null;
    }
  }

  private isExpired(token: string): boolean {
    try {
      const payload = JSON.parse(
        atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')),
      ) as { exp?: number };
      return !!payload.exp && payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}
