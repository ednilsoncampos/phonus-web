import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';

export const tokenRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const tokenService = inject(TokenService);

  // Não intercepta rotas de autenticação
  if (req.url.includes('/auth/')) {
    return next(req);
  }

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      const refreshToken = tokenService.getRefreshToken();
      if (!refreshToken) {
        authService.logout();
        return throwError(() => error);
      }

      return authService.refresh(refreshToken).pipe(
        switchMap((res) => {
          return next(
            req.clone({
              setHeaders: { Authorization: `Bearer ${res.accessToken}` },
            }),
          );
        }),
        catchError((refreshError: unknown) => {
          authService.logout();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
