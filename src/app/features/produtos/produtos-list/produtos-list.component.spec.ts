import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { ProdutosListComponent } from './produtos-list.component';
import { ProdutoService } from '../../../core/services/produto.service';
import { CategoriaProdutoService } from '../../../core/services/categoria-produto.service';
import { Produto } from '../../../core/models/produto.model';
import { CategoriaProduto } from '../../../core/models/categoria-produto.model';

const mockCategoria: CategoriaProduto = { id: 'cat1', nome: 'Alimentos', ativo: true };
const mockProduto: Produto = {
  id: 'p1',
  nome: 'Arroz',
  categoriaId: 'cat1',
  precoVenda: 1000,
  quantidadeEstoque: 50,
  estoqueMinimo: 5,
  abaixoDoMinimo: false,
  unidadeMedida: 'UN',
  ativo: true,
  criadoPor: 'u1',
};
const mockPage = {
  content: [mockProduto],
  totalElements: 1,
  totalPages: 1,
  page: 0,
  size: 20,
  last: true,
};

describe('ProdutosListComponent', () => {
  let produtoService: ProdutoService;
  let categoriaService: CategoriaProdutoService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProdutosListComponent],
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => null } } },
        },
      ],
    });
    produtoService = TestBed.inject(ProdutoService);
    categoriaService = TestBed.inject(CategoriaProdutoService);
    router = TestBed.inject(Router);

    vi.spyOn(produtoService, 'listar').mockReturnValue(of(mockPage));
    vi.spyOn(categoriaService, 'listar').mockReturnValue(of([mockCategoria]));
  });

  it('nomeCategoria(undefined) retorna "—"', () => {
    const fixture = TestBed.createComponent(ProdutosListComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    expect(comp.nomeCategoria(undefined)).toBe('—');
  });

  it('nomeCategoria("cat1") retorna nome da categoria após carregar', () => {
    const fixture = TestBed.createComponent(ProdutosListComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    expect(comp.nomeCategoria('cat1')).toBe('Alimentos');
  });

  it('onFiltroChange reseta page para 0 e recarrega', () => {
    const fixture = TestBed.createComponent(ProdutosListComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.page.set(3);
    comp.onFiltroChange();

    expect(comp.page()).toBe(0);
    expect(produtoService.listar).toHaveBeenCalledTimes(2); // ngOnInit + onFiltroChange
  });

  it('setApenasAtivos(false) atualiza signal e recarrega', () => {
    const fixture = TestBed.createComponent(ProdutosListComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.setApenasAtivos(false);

    expect(comp.apenasAtivos()).toBe(false);
    expect(produtoService.listar).toHaveBeenCalledTimes(2); // ngOnInit + setApenasAtivos
  });

  it('novo() navega para /produtos/novo', () => {
    vi.spyOn(router, 'navigate');
    const fixture = TestBed.createComponent(ProdutosListComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.novo();

    expect(router.navigate).toHaveBeenCalledWith(['/produtos/novo']);
  });

  it('verDetalhe("p1") navega para /produtos/p1', () => {
    vi.spyOn(router, 'navigate');
    const fixture = TestBed.createComponent(ProdutosListComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.verDetalhe('p1');

    expect(router.navigate).toHaveBeenCalledWith(['/produtos', 'p1']);
  });
});
