import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EstoqueService } from './estoque.service';

describe('EstoqueService', () => {
  let service: EstoqueService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EstoqueService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('listarMovimentacoes faz GET /estoque/movimentacoes', () => {
    service.listarMovimentacoes().subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/estoque/movimentacoes'));
    expect(req.request.method).toBe('GET');
    req.flush({ content: [], totalElements: 0, totalPages: 0, page: 0, size: 20, last: true });
  });

  it('listarMovimentacoes envia filtros como query params', () => {
    service.listarMovimentacoes({ produtoId: 'p1', origem: 'AJUSTE_POSITIVO' }).subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/estoque/movimentacoes'));
    expect(req.request.params.get('produtoId')).toBe('p1');
    expect(req.request.params.get('origem')).toBe('AJUSTE_POSITIVO');
    req.flush({ content: [], totalElements: 0, totalPages: 0, page: 0, size: 20, last: true });
  });

  it('ajustar faz POST /estoque/ajuste com produtoId no path', () => {
    service.ajustar('p1', { tipo: 'AJUSTE_POSITIVO', quantidade: 5, observacao: 'entrada' }).subscribe();

    const req = httpMock.expectOne((r) => r.url.includes('/estoque/ajuste'));
    expect(req.request.method).toBe('POST');
    expect(req.request.url).toContain('produtoId=p1');
    req.flush({});
  });
});
