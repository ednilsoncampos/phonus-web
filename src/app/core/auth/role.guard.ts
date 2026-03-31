import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Papel } from '../models/usuario.model';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const roles: Papel[] = route.data['roles'] ?? [];
  const papel = auth.currentUser()?.papel;
  return roles.includes(papel as Papel)
    ? true
    : router.createUrlTree(['/dashboard']);
};
