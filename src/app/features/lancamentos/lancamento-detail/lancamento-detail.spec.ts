import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LancamentoDetail } from './lancamento-detail';
import { LancamentoService } from '../../../core/services/lancamento.service';
import { ProdutoService } from '../../../core/services/produto.service';
import { LancamentoResponse, LancamentoItemResponse, ParcelaResponse } from '../../../core/models/lancamento.model';
import { Produto } from '../../../core/models/produto.model';

const mockProduto: Produto = {
  id: 'prod1',
  nome: 'Produto A',
  precoVenda: 2000,
  quantidadeEstoque: 10,
  estoqueMinimo: 2,
  abaixoDoMinimo: false,
  unidadeMedida: 'UN',
  ativo: true,
  criadoPor: 'u1',
};

const mockItem: LancamentoItemResponse = {
  id: 'i1',
  produtoId: 'prod1',
  quantidade: 2,
  valorUnitarioOriginal: 2000,
  desconto: 0,
  valorUnitario: 2000,
};

const mockParcela: ParcelaResponse = {
  id: 'par1',
  numeroParcela: 1,
  totalParcelas: 2,
  valorParcela: 2000,
  dataVencimento: '2026-05-01',
  status: 'EM_ABERTO',
};

const mockLancamento: LancamentoResponse = {
  id: 'l1',
  usuarioId: 'u1',
  tipo: 'ENTRADA',
  descricao: 'Venda teste',
  valorTotal: 4000,
  formaPagamento: 'PIX',
  origem: 'VOZ',
  dataLancamento: '2026-04-01',
  parcelas: [mockParcela],
  itens: [mockItem],
};

describe('LancamentoDetail', () => {
  let lancamentoService: LancamentoService;
  let produtoService: ProdutoService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LancamentoDetail],
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'l1' } } },
        },
      ],
    });
    lancamentoService = TestBed.inject(LancamentoService);
    produtoService = TestBed.inject(ProdutoService);
    router = TestBed.inject(Router);

    vi.spyOn(produtoService, 'listar').mockReturnValue(
      of({ content: [mockProduto], totalElements: 1, totalPages: 1, page: 0, size: 200, last: true }),
    );
    vi.spyOn(lancamentoService, 'buscar').mockReturnValue(of(mockLancamento));
  });

  it('carregar preenche o signal lancamento com os dados retornados', () => {
    const fixture = TestBed.createComponent(LancamentoDetail);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(lancamentoService.buscar).toHaveBeenCalledWith('l1');
    expect(comp.lancamento()).toEqual(mockLancamento);
    expect(comp.carregando()).toBe(false);
  });

  it('carregar define erro quando o serviço falha', () => {
    vi.spyOn(lancamentoService, 'buscar').mockReturnValue(
      throwError(() => new Error('falha')),
    );
    const fixture = TestBed.createComponent(LancamentoDetail);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(comp.erro()).toBe('Não foi possível carregar o lançamento.');
    expect(comp.lancamento()).toBeNull();
    expect(comp.carregando()).toBe(false);
  });

  it('itensComNome resolve o nome do produto pelo id', () => {
    const fixture = TestBed.createComponent(LancamentoDetail);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    const itens = comp.itensComNome();
    expect(itens).toHaveLength(1);
    expect(itens[0].nomeProduto).toBe('Produto A');
  });

  it('itensComNome usa o produtoId como fallback quando o produto não é encontrado', () => {
    vi.spyOn(produtoService, 'listar').mockReturnValue(
      of({ content: [], totalElements: 0, totalPages: 0, page: 0, size: 200, last: true }),
    );
    const fixture = TestBed.createComponent(LancamentoDetail);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    const itens = comp.itensComNome();
    expect(itens[0].nomeProduto).toBe('prod1');
  });

  it('itensComNome retorna array vazio quando lancamento é null', () => {
    vi.spyOn(lancamentoService, 'buscar').mockReturnValue(
      throwError(() => new Error('falha')),
    );
    const fixture = TestBed.createComponent(LancamentoDetail);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(comp.itensComNome()).toEqual([]);
  });

  it('formaLabel retorna o rótulo correto para cada forma de pagamento', () => {
    const fixture = TestBed.createComponent(LancamentoDetail);
    const comp = fixture.componentInstance as any;

    expect(comp.formaLabel('PIX')).toBe('PIX');
    expect(comp.formaLabel('DINHEIRO')).toBe('Dinheiro');
    expect(comp.formaLabel('DEBITO')).toBe('Débito');
    expect(comp.formaLabel('CREDITO')).toBe('Crédito');
    expect(comp.formaLabel('CHEQUE')).toBe('Cheque');
    expect(comp.formaLabel('PROMISSORIA')).toBe('Promissória');
  });

  it('formaLabel retorna o próprio valor para forma desconhecida', () => {
    const fixture = TestBed.createComponent(LancamentoDetail);
    const comp = fixture.componentInstance as any;

    expect(comp.formaLabel('DESCONHECIDA')).toBe('DESCONHECIDA');
  });

  it('voltar() navega para /lancamentos', () => {
    vi.spyOn(router, 'navigate');
    const fixture = TestBed.createComponent(LancamentoDetail);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.voltar();

    expect(router.navigate).toHaveBeenCalledWith(['/lancamentos']);
  });
});
