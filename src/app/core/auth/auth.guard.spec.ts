import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { signal } from '@angular/core';

function runGuard() {
  return TestBed.runInInjectionContext(() =>
    authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
  );
}

describe('authGuard', () => {
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  it('retorna true quando usuário está logado', () => {
    vi.spyOn(authService, 'isLoggedIn').mockReturnValue(true as any);
    expect(runGuard()).toBe(true);
  });

  it('redireciona para /login quando não está logado', () => {
    vi.spyOn(authService, 'isLoggedIn').mockReturnValue(false as any);
    const result = runGuard();
    expect(result).not.toBe(true);
    expect(result.toString()).toContain('login');
  });
});
