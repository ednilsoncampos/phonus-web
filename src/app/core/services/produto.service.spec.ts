import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProdutoService } from './produto.service';
import { Produto } from '../models/produto.model';
import { PageResponse } from '../models/page-response.model';

const mockProduto: Produto = {
  id: 'p1',
  nome: 'Produto A',
  precoVenda: 1000,
  quantidadeEstoque: 10,
  estoqueMinimo: 2,
  abaixoDoMinimo: false,
  unidadeMedida: 'UN',
  ativo: true,
  criadoPor: 'user1',
};

describe('ProdutoService', () => {
  let service: ProdutoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProdutoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('listar faz GET /produtos', () => {
    const page: PageResponse<Produto> = { content: [mockProduto], totalElements: 1, totalPages: 1, page: 0, size: 20, last: false };
    let result: PageResponse<Produto> | undefined;

    service.listar().subscribe((r) => (result = r));

    httpMock.expectOne((r) => r.url.endsWith('/produtos')).flush(page);
    expect(result?.content).toHaveLength(1);
  });

  it('listar envia params de filtro', () => {
    service.listar({ ativos: true, abaixoDoMinimo: true }).subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/produtos'));
    expect(req.request.params.get('ativos')).toBe('true');
    expect(req.request.params.get('abaixoDoMinimo')).toBe('true');
    req.flush({ content: [], totalElements: 0, totalPages: 0, page: 0, size: 20, last: true });
  });

  it('buscar faz GET /produtos/:id', () => {
    let result: Produto | undefined;
    service.buscar('p1').subscribe((r) => (result = r));

    httpMock.expectOne((r) => r.url.endsWith('/produtos/p1')).flush(mockProduto);
    expect(result?.id).toBe('p1');
  });

  it('criar faz POST /produtos', () => {
    service.criar({ nome: 'X', precoVenda: 500, estoqueMinimo: 1, unidadeMedida: 'UN' }).subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/produtos') && r.method === 'POST');
    expect(req.request.body.nome).toBe('X');
    req.flush(mockProduto);
  });

  it('desativar faz PATCH /produtos/:id/desativar', () => {
    service.desativar('p1').subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/produtos/p1/desativar'));
    expect(req.request.method).toBe('PATCH');
    req.flush(mockProduto);
  });
});
