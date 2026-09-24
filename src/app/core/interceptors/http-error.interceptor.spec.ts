import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { httpErrorInterceptor } from './http-error.interceptor';
import { ErrorNotificationService } from '../services/error-notification.service';

describe('httpErrorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let notification: ErrorNotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    notification = TestBed.inject(ErrorNotificationService);
  });

  afterEach(() => httpMock.verify());

  it('exibe mensagem com o tempo do Retry-After em erro 429', () => {
    const showSpy = vi.spyOn(notification, 'show');

    http.get('/api/v1/lancamentos').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/v1/lancamentos');
    req.flush('Too Many Requests', {
      status: 429,
      statusText: 'Too Many Requests',
      headers: { 'Retry-After': '45' },
    });

    expect(showSpy).toHaveBeenCalledWith('Muitas tentativas. Tente novamente em 45s.');
  });

  it('exibe mensagem padrão em erro 429 sem Retry-After', () => {
    const showSpy = vi.spyOn(notification, 'show');

    http.get('/api/v1/lancamentos').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/v1/lancamentos');
    req.flush('Too Many Requests', { status: 429, statusText: 'Too Many Requests' });

    expect(showSpy).toHaveBeenCalledWith('Muitas tentativas. Aguarde um instante e tente novamente.');
  });

  it('não trata erros de rotas /auth/ — deixa o componente tratar', () => {
    const showSpy = vi.spyOn(notification, 'show');

    http.post('/api/v1/auth/login', {}).subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/v1/auth/login');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(showSpy).not.toHaveBeenCalled();
  });

  it('exibe a mensagem da API em erro 400', () => {
    const showSpy = vi.spyOn(notification, 'show');

    http.post('/api/v1/produtos', {}).subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/v1/produtos');
    req.flush({ message: 'Nome é obrigatório.' }, { status: 400, statusText: 'Bad Request' });

    expect(showSpy).toHaveBeenCalledWith('Nome é obrigatório.');
  });
});
