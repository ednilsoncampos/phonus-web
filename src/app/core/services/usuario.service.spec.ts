import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UsuarioService } from './usuario.service';

describe('UsuarioService', () => {
  let service: UsuarioService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UsuarioService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('listar faz GET /usuarios', () => {
    service.listar().subscribe();
    httpMock.expectOne((r) => r.url.endsWith('/usuarios') && r.method === 'GET').flush([]);
  });

  it('convidar faz POST /usuarios com body correto', () => {
    const body = { email: 'a@b.com', nome: 'Ana', papel: 'OPERADOR' as const };
    service.convidar(body).subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/usuarios') && r.method === 'POST');
    expect(req.request.body).toEqual(body);
    req.flush({ id: '1', ...body, ativo: true });
  });

  it('desativar faz DELETE /usuarios/:id', () => {
    service.desativar('u1').subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/usuarios/u1'));
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('alterarPapel faz PATCH /usuarios/:id/papel', () => {
    service.alterarPapel('u1', { papel: 'ADMIN' }).subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/usuarios/u1/papel'));
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });
});
