import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient,
  withInterceptors,
  HttpClient,
  HttpErrorResponse,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { tokenRefreshInterceptor } from './token-refresh.interceptor';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { of, throwError } from 'rxjs';

describe('tokenRefreshInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authService: AuthService;
  let tokenService: TokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([tokenRefreshInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    tokenService = TestBed.inject(TokenService);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('não intercepta rotas /auth/', () => {
    http.post('/auth/login', {}).subscribe();

    const req = httpMock.expectOne('/auth/login');
    req.flush({ accessToken: 'a', refreshToken: 'r' });
  });

  it('passa resposta bem-sucedida sem modificar', () => {
    let result: unknown;
    http.get('/api/data').subscribe((r) => (result = r));

    httpMock.expectOne('/api/data').flush({ ok: true });

    expect(result).toEqual({ ok: true });
  });

  it('propaga erros não-401 sem fazer refresh', () => {
    let error: unknown;
    http.get('/api/data').subscribe({ error: (e) => (error = e) });

    httpMock.expectOne('/api/data').flush(null, { status: 500, statusText: 'Server Error' });

    expect((error as HttpErrorResponse).status).toBe(500);
  });

  it('faz logout e propaga erro quando 401 e sem refresh token', () => {
    const logoutSpy = vi.spyOn(authService, 'logout').mockImplementation(() => {});
    vi.spyOn(tokenService, 'getRefreshToken').mockReturnValue(null);

    let error: unknown;
    http.get('/api/data').subscribe({ error: (e) => (error = e) });

    httpMock.expectOne('/api/data').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(logoutSpy).toHaveBeenCalled();
    expect((error as HttpErrorResponse).status).toBe(401);
  });

  it('faz logout quando refresh falha', () => {
    const logoutSpy = vi.spyOn(authService, 'logout').mockImplementation(() => {});
    vi.spyOn(tokenService, 'getRefreshToken').mockReturnValue('oldRef');
    vi.spyOn(authService, 'refresh').mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 401 })),
    );

    http.get('/api/data').subscribe({ error: () => {} });

    httpMock.expectOne('/api/data').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(logoutSpy).toHaveBeenCalled();
  });
});
