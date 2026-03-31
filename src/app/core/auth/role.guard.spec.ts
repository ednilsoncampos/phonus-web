import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { roleGuard } from './role.guard';
import { AuthService } from './auth.service';
import { Usuario } from '../models/usuario.model';

function mockRoute(roles: string[]): ActivatedRouteSnapshot {
  return { data: { roles } } as unknown as ActivatedRouteSnapshot;
}

function runGuard(route: ActivatedRouteSnapshot) {
  return TestBed.runInInjectionContext(() =>
    roleGuard(route, {} as RouterStateSnapshot),
  );
}

describe('roleGuard', () => {
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    authService = TestBed.inject(AuthService);
  });

  it('retorna true quando papel do usuário está na lista', () => {
    const user: Usuario = { id: '1', nome: 'Root', email: 'r@r.com', papel: 'ROOT', ativo: true };
    vi.spyOn(authService, 'currentUser').mockReturnValue(user as any);

    expect(runGuard(mockRoute(['ROOT', 'SUPER_ROOT']))).toBe(true);
  });

  it('redireciona para /dashboard quando papel não está na lista', () => {
    const user: Usuario = { id: '1', nome: 'Op', email: 'o@o.com', papel: 'OPERADOR', ativo: true };
    vi.spyOn(authService, 'currentUser').mockReturnValue(user as any);

    const result = runGuard(mockRoute(['ROOT', 'ADMIN']));
    expect(result).not.toBe(true);
    expect(result.toString()).toContain('dashboard');
  });

  it('redireciona para /dashboard quando usuário é null', () => {
    vi.spyOn(authService, 'currentUser').mockReturnValue(null as any);

    const result = runGuard(mockRoute(['ROOT']));
    expect(result).not.toBe(true);
    expect(result.toString()).toContain('dashboard');
  });
});
