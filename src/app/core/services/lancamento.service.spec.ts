import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LancamentoService } from './lancamento.service';
import { LancamentoResponse } from '../models/lancamento.model';
import { PageResponse } from '../models/page-response.model';

const mockLancamento: LancamentoResponse = {
  id: 'l1',
  usuarioId: 'u1',
  tipo: 'SAIDA_CAIXA',
  descricao: 'Compra de material',
  valorTotal: 5000,
  formaPagamento: 'PIX',
  origem: 'TEXTO',
  dataLancamento: '2026-04-01',
  parcelas: [],
  itens: [],
};

const mockPage: PageResponse<LancamentoResponse> = {
  content: [mockLancamento],
  totalElements: 1,
  totalPages: 1,
  page: 0,
  size: 20,
  last: true,
};

describe('LancamentoService', () => {
  let service: LancamentoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(LancamentoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('listar faz GET /lancamentos sem parâmetros', () => {
    let result: PageResponse<LancamentoResponse> | undefined;
    service.listar().subscribe((r) => (result = r));

    httpMock.expectOne((r) => r.url.endsWith('/lancamentos')).flush(mockPage);
    expect(result?.content).toHaveLength(1);
    expect(result?.content[0].tipo).toBe('SAIDA_CAIXA');
  });

  it('listar envia filtros de tipo e data', () => {
    service
      .listar({ tipo: 'ENTRADA_CAIXA', dataInicio: '2026-01-01', dataFim: '2026-01-31' })
      .subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/lancamentos'));
    expect(req.request.params.get('tipo')).toBe('ENTRADA_CAIXA');
    expect(req.request.params.get('dataInicio')).toBe('2026-01-01');
    expect(req.request.params.get('dataFim')).toBe('2026-01-31');
    req.flush(mockPage);
  });

  it('buscar faz GET /lancamentos/:id', () => {
    let result: LancamentoResponse | undefined;
    service.buscar('l1').subscribe((r) => (result = r));

    httpMock.expectOne((r) => r.url.endsWith('/lancamentos/l1')).flush(mockLancamento);
    expect(result?.id).toBe('l1');
    expect(result?.descricao).toBe('Compra de material');
  });

  it('criar faz POST /lancamentos com valorTotal em centavos', () => {
    service
      .criar({
        tipo: 'SAIDA_CAIXA',
        descricao: 'Teste',
        valorTotal: 5000,
        formaPagamento: 'PIX',
        origem: 'TEXTO',
        dataLancamento: '2026-04-01',
        itens: [],
      })
      .subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/lancamentos') && r.method === 'POST');
    expect(req.request.body.valorTotal).toBe(5000);
    expect(req.request.body.origem).toBe('TEXTO');
    req.flush(mockLancamento);
  });
});
