import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Requires a valid session; otherwise sends the user to /login (remembering where they were going). */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  if (auth.isLoggedIn()) return true;
  auth.logout(false);
  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** Keeps signed-in users away from the login page. */
export const guestGuard: CanActivateFn = () =>
  inject(AuthService).isLoggedIn() ? inject(Router).createUrlTree(['/dashboard']) : true;

/** Admin / Super Admin only (sales, reports, users). */
export const managerGuard: CanActivateFn = () =>
  inject(AuthService).isManager() ? true : inject(Router).createUrlTree(['/dashboard']);
