import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CategoriaProdutoService } from './categoria-produto.service';
import { CategoriaProduto } from '../models/categoria-produto.model';

const mockCategoria: CategoriaProduto = {
  id: 'cp1',
  nome: 'Bebidas',
  ativo: true,
};

describe('CategoriaProdutoService', () => {
  let service: CategoriaProdutoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CategoriaProdutoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('listar faz GET /categorias-produto', () => {
    let result: CategoriaProduto[] | undefined;
    service.listar().subscribe((r) => (result = r));

    httpMock.expectOne((r) => r.url.endsWith('/categorias-produto')).flush([mockCategoria]);
    expect(result).toHaveLength(1);
    expect(result![0].nome).toBe('Bebidas');
  });

  it('criar faz POST /categorias-produto com os dados corretos', () => {
    let result: CategoriaProduto | undefined;
    service.criar({ nome: 'Laticínios' }).subscribe((r) => (result = r));

    const req = httpMock.expectOne(
      (r) => r.url.endsWith('/categorias-produto') && r.method === 'POST',
    );
    expect(req.request.body.nome).toBe('Laticínios');
    req.flush({ ...mockCategoria, nome: 'Laticínios' });
    expect(result?.nome).toBe('Laticínios');
  });

  it('editar faz PUT /categorias-produto/:id', () => {
    service.editar('cp1', { nome: 'Bebidas Editado', ativo: false }).subscribe();

    const req = httpMock.expectOne(
      (r) => r.url.endsWith('/categorias-produto/cp1') && r.method === 'PUT',
    );
    expect(req.request.body.nome).toBe('Bebidas Editado');
    expect(req.request.body.ativo).toBe(false);
    req.flush(mockCategoria);
  });
});
