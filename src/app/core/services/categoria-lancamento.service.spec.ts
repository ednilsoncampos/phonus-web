import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CategoriaLancamentoService } from './categoria-lancamento.service';
import { CategoriaLancamento } from '../models/categoria-lancamento.model';

const mockCategoria: CategoriaLancamento = {
  id: 'cat1',
  nome: 'Alimentação',
  tipo: 'SAIDA',
  ativo: true,
};

describe('CategoriaLancamentoService', () => {
  let service: CategoriaLancamentoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CategoriaLancamentoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('listar faz GET /categorias-lancamento', () => {
    let result: CategoriaLancamento[] | undefined;
    service.listar().subscribe((r) => (result = r));

    httpMock.expectOne((r) => r.url.endsWith('/categorias-lancamento')).flush([mockCategoria]);
    expect(result).toHaveLength(1);
    expect(result![0].tipo).toBe('SAIDA');
  });

  it('criar faz POST /categorias-lancamento com os dados corretos', () => {
    let result: CategoriaLancamento | undefined;
    service.criar({ nome: 'Salário', tipo: 'ENTRADA' }).subscribe((r) => (result = r));

    const req = httpMock.expectOne(
      (r) => r.url.endsWith('/categorias-lancamento') && r.method === 'POST',
    );
    expect(req.request.body.nome).toBe('Salário');
    expect(req.request.body.tipo).toBe('ENTRADA');
    req.flush({ ...mockCategoria, nome: 'Salário', tipo: 'ENTRADA' });
    expect(result?.nome).toBe('Salário');
  });

  it('editar faz PUT /categorias-lancamento/:id', () => {
    service.editar('cat1', { nome: 'Alimentação Editada', tipo: 'AMBOS', ativo: false }).subscribe();

    const req = httpMock.expectOne(
      (r) => r.url.endsWith('/categorias-lancamento/cat1') && r.method === 'PUT',
    );
    expect(req.request.body.nome).toBe('Alimentação Editada');
    expect(req.request.body.ativo).toBe(false);
    req.flush(mockCategoria);
  });
});
