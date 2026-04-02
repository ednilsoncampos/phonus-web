import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ProdutoDetailComponent } from './produto-detail.component';
import { ProdutoService } from '../../../core/services/produto.service';
import { CategoriaProdutoService } from '../../../core/services/categoria-produto.service';
import { Produto } from '../../../core/models/produto.model';

const mockProduto: Produto = {
  id: 'p1',
  nome: 'Arroz',
  precoVenda: 1000,
  quantidadeEstoque: 50,
  estoqueMinimo: 5,
  abaixoDoMinimo: false,
  unidadeMedida: 'UN',
  ativo: true,
  criadoPor: 'u1',
};

describe('ProdutoDetailComponent', () => {
  let produtoService: ProdutoService;
  let categoriaService: CategoriaProdutoService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProdutoDetailComponent],
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'p1' } } },
        },
      ],
    });
    produtoService = TestBed.inject(ProdutoService);
    categoriaService = TestBed.inject(CategoriaProdutoService);
    router = TestBed.inject(Router);

    vi.spyOn(categoriaService, 'listar').mockReturnValue(of([]));
    vi.spyOn(produtoService, 'buscar').mockReturnValue(of(mockProduto));
  });

  it('carregar carrega o produto e preenche o signal produto', () => {
    const fixture = TestBed.createComponent(ProdutoDetailComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(produtoService.buscar).toHaveBeenCalledWith('p1');
    expect(comp.produto()).toEqual(mockProduto);
  });

  it('carregar define erro quando falha', () => {
    vi.spyOn(produtoService, 'buscar').mockReturnValue(
      throwError(() => new Error('falha')),
    );
    const fixture = TestBed.createComponent(ProdutoDetailComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(comp.erro()).toBe('Não foi possível carregar o produto.');
    expect(comp.produto()).toBeNull();
  });

  it('nomeCategoria() retorna "—" quando produto não tem categoria', () => {
    const fixture = TestBed.createComponent(ProdutoDetailComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    // mockProduto não tem categoriaId
    expect(comp.nomeCategoria()).toBe('—');
  });

  it('editar() navega para /produtos/p1/editar', () => {
    vi.spyOn(router, 'navigate');
    const fixture = TestBed.createComponent(ProdutoDetailComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.editar();

    expect(router.navigate).toHaveBeenCalledWith(['/produtos', 'p1', 'editar']);
  });

  it('irEstoque() navega para /estoque com queryParam produtoId=p1', () => {
    vi.spyOn(router, 'navigate');
    const fixture = TestBed.createComponent(ProdutoDetailComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.irEstoque();

    expect(router.navigate).toHaveBeenCalledWith(['/estoque'], { queryParams: { produtoId: 'p1' } });
  });
});
