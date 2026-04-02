import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RelatorioService } from './relatorio.service';
import { RelatorioMargemResponse } from '../models/relatorio.model';

const mockMargem: RelatorioMargemResponse = {
  totalProdutos: 3,
  margemMedia: 42.5,
  itens: [
    { produtoId: 'p1', nome: 'Produto A', precoVenda: 1000, precoCusto: 600, margemPercentual: 40 },
    { produtoId: 'p2', nome: 'Produto B', precoVenda: 2000, precoCusto: 1000, margemPercentual: 50 },
    { produtoId: 'p3', nome: 'Produto C', precoVenda: 500, precoCusto: 320, margemPercentual: 36 },
  ],
};

describe('RelatorioService', () => {
  let service: RelatorioService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RelatorioService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('buscarMargem faz GET /relatorios/margem', () => {
    let result: RelatorioMargemResponse | undefined;
    service.buscarMargem().subscribe((r) => (result = r));

    httpMock.expectOne((r) => r.url.endsWith('/relatorios/margem')).flush(mockMargem);
    expect(result?.totalProdutos).toBe(3);
    expect(result?.margemMedia).toBe(42.5);
    expect(result?.itens).toHaveLength(3);
  });

  it('buscarMargem retorna lista vazia quando não há produtos', () => {
    let result: RelatorioMargemResponse | undefined;
    service.buscarMargem().subscribe((r) => (result = r));

    httpMock
      .expectOne((r) => r.url.endsWith('/relatorios/margem'))
      .flush({ totalProdutos: 0, margemMedia: 0, itens: [] });
    expect(result?.itens).toHaveLength(0);
  });
});
