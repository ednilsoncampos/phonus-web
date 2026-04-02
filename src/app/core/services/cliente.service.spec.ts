import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ClienteService } from './cliente.service';
import { Cliente } from '../models/cliente.model';
import { PageResponse } from '../models/page-response.model';

const mockCliente: Cliente = {
  id: 'c1',
  nome: 'João Silva',
  ativo: true,
};

const mockPage: PageResponse<Cliente> = {
  content: [mockCliente],
  totalElements: 1,
  totalPages: 1,
  page: 0,
  size: 20,
  last: true,
};

describe('ClienteService', () => {
  let service: ClienteService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ClienteService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('listar faz GET /clientes sem parâmetros', () => {
    let result: PageResponse<Cliente> | undefined;
    service.listar().subscribe((r) => (result = r));

    httpMock.expectOne((r) => r.url.endsWith('/clientes')).flush(mockPage);
    expect(result?.content).toHaveLength(1);
    expect(result?.content[0].nome).toBe('João Silva');
  });

  it('listar envia parâmetros de filtro', () => {
    service.listar({ page: 1, size: 10, ativos: true }).subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/clientes'));
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('size')).toBe('10');
    expect(req.request.params.get('ativos')).toBe('true');
    req.flush(mockPage);
  });

  it('criar faz POST /clientes com os dados corretos', () => {
    let result: Cliente | undefined;
    service.criar({ nome: 'Maria', email: 'maria@test.com' }).subscribe((r) => (result = r));

    const req = httpMock.expectOne((r) => r.url.endsWith('/clientes') && r.method === 'POST');
    expect(req.request.body.nome).toBe('Maria');
    req.flush({ ...mockCliente, nome: 'Maria' });
    expect(result?.nome).toBe('Maria');
  });

  it('atualizar faz PUT /clientes/:id', () => {
    service.atualizar('c1', { nome: 'João Atualizado', ativo: false }).subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/clientes/c1') && r.method === 'PUT');
    expect(req.request.body.nome).toBe('João Atualizado');
    expect(req.request.body.ativo).toBe(false);
    req.flush(mockCliente);
  });
});
