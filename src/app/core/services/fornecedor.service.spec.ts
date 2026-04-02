import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FornecedorService } from './fornecedor.service';
import { Fornecedor } from '../models/fornecedor.model';
import { PageResponse } from '../models/page-response.model';

const mockFornecedor: Fornecedor = {
  id: 'f1',
  nome: 'Distribuidora ABC',
  ativo: true,
};

const mockPage: PageResponse<Fornecedor> = {
  content: [mockFornecedor],
  totalElements: 1,
  totalPages: 1,
  page: 0,
  size: 20,
  last: true,
};

describe('FornecedorService', () => {
  let service: FornecedorService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FornecedorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('listar faz GET /fornecedores sem parâmetros', () => {
    let result: PageResponse<Fornecedor> | undefined;
    service.listar().subscribe((r) => (result = r));

    httpMock.expectOne((r) => r.url.endsWith('/fornecedores')).flush(mockPage);
    expect(result?.content).toHaveLength(1);
    expect(result?.content[0].nome).toBe('Distribuidora ABC');
  });

  it('listar envia parâmetros de filtro', () => {
    service.listar({ page: 0, size: 50, ativos: true }).subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/fornecedores'));
    expect(req.request.params.get('ativos')).toBe('true');
    expect(req.request.params.get('size')).toBe('50');
    req.flush(mockPage);
  });

  it('criar faz POST /fornecedores com os dados corretos', () => {
    let result: Fornecedor | undefined;
    service.criar({ nome: 'Novo Fornecedor' }).subscribe((r) => (result = r));

    const req = httpMock.expectOne((r) => r.url.endsWith('/fornecedores') && r.method === 'POST');
    expect(req.request.body.nome).toBe('Novo Fornecedor');
    req.flush({ ...mockFornecedor, nome: 'Novo Fornecedor' });
    expect(result?.nome).toBe('Novo Fornecedor');
  });

  it('atualizar faz PUT /fornecedores/:id', () => {
    service.atualizar('f1', { nome: 'Fornecedor Atualizado', ativo: false }).subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/fornecedores/f1') && r.method === 'PUT');
    expect(req.request.body.nome).toBe('Fornecedor Atualizado');
    expect(req.request.body.ativo).toBe(false);
    req.flush(mockFornecedor);
  });
});
