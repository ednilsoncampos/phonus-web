import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from './token.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const token = tokenService.getAccessToken();

  if (!token) {
    return next(req);
  }

  return next(
    req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }),
  );
};
