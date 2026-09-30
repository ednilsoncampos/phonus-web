import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { landingRoute } from './landing-route';
import { Permissao } from '../models/usuario.model';

export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const permissao: Permissao | undefined = route.data['permissao'];
  const minhas = auth.currentUser()?.permissoes ?? [];

  return permissao && minhas.includes(permissao)
    ? true
    : router.createUrlTree([landingRoute(minhas)]);
};
