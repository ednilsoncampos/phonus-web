import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { EstoqueListComponent } from './estoque-list.component';
import { EstoqueService } from '../../../core/services/estoque.service';
import { ProdutoService } from '../../../core/services/produto.service';
import { Produto } from '../../../core/models/produto.model';

const emptyMovPage = { content: [], totalElements: 0, totalPages: 0, page: 0, size: 20, last: true };

const mockProdutos: Produto[] = [
  { id: 'p1', nome: 'Arroz', precoVenda: 500, quantidadeEstoque: 10, estoqueMinimo: 2, abaixoDoMinimo: false, unidadeMedida: 'UN', ativo: true, criadoPor: 'u1' },
  { id: 'p2', nome: 'Feijão', precoVenda: 700, quantidadeEstoque: 5, estoqueMinimo: 1, abaixoDoMinimo: false, unidadeMedida: 'UN', ativo: true, criadoPor: 'u1' },
];

describe('EstoqueListComponent', () => {
  let estoqueService: EstoqueService;
  let produtoService: ProdutoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EstoqueListComponent],
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => null } } },
        },
      ],
    });

    estoqueService = TestBed.inject(EstoqueService);
    produtoService = TestBed.inject(ProdutoService);

    vi.spyOn(produtoService, 'listar').mockReturnValue(
      of({ content: mockProdutos, totalElements: 2, totalPages: 1, page: 0, size: 200, last: true }),
    );
    vi.spyOn(estoqueService, 'listarMovimentacoes').mockReturnValue(of(emptyMovPage));
  });

  it('origemLabel retorna o rótulo correto para cada origem', () => {
    const fixture = TestBed.createComponent(EstoqueListComponent);
    const comp = fixture.componentInstance;
    expect(comp.origemLabel('VENDA')).toBe('Venda');
    expect(comp.origemLabel('COMPRA')).toBe('Compra');
    expect(comp.origemLabel('AJUSTE_POSITIVO')).toBe('Ajuste (entrada)');
    expect(comp.origemLabel('AJUSTE_NEGATIVO')).toBe('Ajuste (saída)');
  });

  it('displayProduto retorna string vazia para null', () => {
    const fixture = TestBed.createComponent(EstoqueListComponent);
    const comp = fixture.componentInstance;
    expect(comp.displayProduto(null)).toBe('');
  });

  it('displayProduto retorna a string diretamente quando for string', () => {
    const fixture = TestBed.createComponent(EstoqueListComponent);
    const comp = fixture.componentInstance;
    expect(comp.displayProduto('Arroz')).toBe('Arroz');
  });

  it('displayProduto retorna o nome do produto quando for objeto Produto', () => {
    const fixture = TestBed.createComponent(EstoqueListComponent);
    const comp = fixture.componentInstance;
    expect(comp.displayProduto(mockProdutos[0])).toBe('Arroz');
  });

  it('nomeProduto retorna o nome pelo id após carregar produtos', () => {
    const fixture = TestBed.createComponent(EstoqueListComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    expect(comp.nomeProduto('p1')).toBe('Arroz');
    expect(comp.nomeProduto('p2')).toBe('Feijão');
  });

  it('nomeProduto retorna o próprio id quando produto não é encontrado', () => {
    const fixture = TestBed.createComponent(EstoqueListComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    expect(comp.nomeProduto('nao-existe')).toBe('nao-existe');
  });

  it('onFiltroChange reseta a página para 0 e recarrega', () => {
    const fixture = TestBed.createComponent(EstoqueListComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.page.set(3);
    comp.onFiltroChange();

    expect(comp.page()).toBe(0);
    // listarMovimentacoes: 1x ngOnInit + 1x onFiltroChange
    expect(estoqueService.listarMovimentacoes).toHaveBeenCalledTimes(2);
  });

  it('limparProduto reseta o controle de produto e recarrega', () => {
    const fixture = TestBed.createComponent(EstoqueListComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.produtoCtrl.setValue(mockProdutos[0]);
    comp.page.set(2);
    comp.limparProduto();

    expect(comp.produtoCtrl.value).toBeNull();
    expect(comp.page()).toBe(0);
  });

});

describe('EstoqueListComponent — com query param de produto', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EstoqueListComponent],
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => 'p1' } } },
        },
      ],
    });

    vi.spyOn(TestBed.inject(ProdutoService), 'listar').mockReturnValue(
      of({ content: mockProdutos, totalElements: 2, totalPages: 1, page: 0, size: 200, last: true }),
    );
    vi.spyOn(TestBed.inject(EstoqueService), 'listarMovimentacoes').mockReturnValue(
      of({ content: [], totalElements: 0, totalPages: 0, page: 0, size: 20, last: true }),
    );
  });

  it('pré-seleciona produto quando produtoId é passado como query param', () => {
    const fixture = TestBed.createComponent(EstoqueListComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    const selecionado = comp.produtoCtrl.value as Produto;
    expect(selecionado?.id).toBe('p1');
  });
});
