import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { TerminalService } from '../services/terminal.service';

/**
 * Adds the Bearer token and the till identifier (X-Terminal-Id) to API calls,
 * and signs the user out when the API says the session is no longer valid.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const terminal = inject(TerminalService);
  const token = auth.token();

  const authReq = req.clone({
    setHeaders: {
      'X-Terminal-Id': terminal.id(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !req.url.endsWith('/auth/login')
      ) {
        auth.logout();
      }
      return throwError(() => error);
    }),
  );
};
