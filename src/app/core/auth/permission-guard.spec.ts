import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { permissionGuard } from './permission-guard';
import { AuthService } from './auth.service';
import { Usuario } from '../models/usuario.model';

function mockRoute(permissao: string): ActivatedRouteSnapshot {
  return { data: { permissao } } as unknown as ActivatedRouteSnapshot;
}

function runGuard(route: ActivatedRouteSnapshot) {
  return TestBed.runInInjectionContext(() =>
    permissionGuard(route, {} as RouterStateSnapshot),
  );
}

describe('permissionGuard', () => {
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

  it('retorna true quando o usuário tem a permissão exigida pela rota', () => {
    const user: Usuario = {
      id: '1', nome: 'Root', email: 'r@r.com', papel: 'ROOT', status: 'ATIVO',
      permissoes: ['USUARIOS_GERENCIAR', 'FINANCEIRO_CONSULTAR'],
    };
    vi.spyOn(authService, 'currentUser').mockReturnValue(user);

    expect(runGuard(mockRoute('USUARIOS_GERENCIAR'))).toBe(true);
  });

  it('redireciona para a landing route do usuário quando falta a permissão', () => {
    const user: Usuario = {
      id: '1', nome: 'Op', email: 'o@o.com', papel: 'OPERADOR', status: 'ATIVO',
      permissoes: ['LANCAMENTOS_REGISTRAR', 'FINANCEIRO_CONSULTAR'],
    };
    vi.spyOn(authService, 'currentUser').mockReturnValue(user);

    const result = runGuard(mockRoute('USUARIOS_GERENCIAR'));
    expect(result).not.toBe(true);
    expect(result.toString()).toContain('dashboard');
  });

  it('redireciona para /403 quando o usuário não tem nenhuma permissão conhecida', () => {
    const user: Usuario = { id: '1', nome: 'X', email: 'x@x.com', papel: 'OPERADOR', status: 'ATIVO', permissoes: [] };
    vi.spyOn(authService, 'currentUser').mockReturnValue(user);

    const result = runGuard(mockRoute('USUARIOS_GERENCIAR'));
    expect(result).not.toBe(true);
    expect(result.toString()).toContain('403');
  });

  it('redireciona quando usuário é null', () => {
    vi.spyOn(authService, 'currentUser').mockReturnValue(null);

    const result = runGuard(mockRoute('FINANCEIRO_CONSULTAR'));
    expect(result).not.toBe(true);
    expect(result.toString()).toContain('403');
  });
});
