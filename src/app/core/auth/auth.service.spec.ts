import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { Usuario } from '../models/usuario.model';

const mockUser: Usuario = {
  id: '1',
  nome: 'Admin',
  email: 'admin@test.com',
  papel: 'ADMIN',
  ativo: true,
};

describe('AuthService', () => {
  let service: AuthService;
  let tokenService: TokenService;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    service = TestBed.inject(AuthService);
    tokenService = TestBed.inject(TokenService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('isLoggedIn é false sem usuário', () => {
    expect(service.isLoggedIn()).toBe(false);
  });

  it('hasRole retorna false sem usuário', () => {
    expect(service.hasRole('ADMIN')).toBe(false);
  });

  it('login salva tokens e retorna resposta', () => {
    const saveSpy = vi.spyOn(tokenService, 'save');

    service.login({ email: 'a@b.com', senha: '123' }).subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/auth/login'));
    req.flush({ accessToken: 'acc', refreshToken: 'ref' });

    expect(saveSpy).toHaveBeenCalledWith('acc', 'ref');
  });

  it('loadMe define currentUser e isLoggedIn fica true', () => {
    service.loadMe().subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/auth/me'));
    req.flush(mockUser);

    expect(service.isLoggedIn()).toBe(true);
    expect(service.currentUser()).toEqual(mockUser);
  });

  it('hasRole retorna true quando papel bate', () => {
    service.loadMe().subscribe();
    httpMock.expectOne((r) => r.url.endsWith('/auth/me')).flush(mockUser);

    expect(service.hasRole('ADMIN')).toBe(true);
    expect(service.hasRole('ROOT')).toBe(false);
  });

  it('logout limpa tokens e usuário', () => {
    const clearSpy = vi.spyOn(tokenService, 'clear');
    service.loadMe().subscribe();
    httpMock.expectOne((r) => r.url.endsWith('/auth/me')).flush(mockUser);

    service.logout();

    expect(clearSpy).toHaveBeenCalled();
    expect(service.isLoggedIn()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });

  it('refresh chama endpoint e salva novos tokens', () => {
    const saveSpy = vi.spyOn(tokenService, 'save');

    service.refresh('oldRef').subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/auth/refresh'));
    req.flush({ accessToken: 'newAcc', refreshToken: 'newRef' });

    expect(saveSpy).toHaveBeenCalledWith('newAcc', 'newRef');
  });
});
