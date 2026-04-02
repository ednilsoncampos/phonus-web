import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ProdutoFormComponent } from './produto-form.component';
import { ProdutoService } from '../../../core/services/produto.service';
import { CategoriaProdutoService } from '../../../core/services/categoria-produto.service';
import { Produto } from '../../../core/models/produto.model';

const mockProduto: Produto = {
  id: 'p1',
  nome: 'Produto Teste',
  precoVenda: 2000,
  precoCusto: 1200,
  quantidadeEstoque: 5,
  estoqueMinimo: 2,
  abaixoDoMinimo: false,
  unidadeMedida: 'UN',
  ativo: true,
  criadoPor: 'u1',
};

describe('ProdutoFormComponent — modo criação', () => {
  let produtoService: ProdutoService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProdutoFormComponent],
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => null } } },
        },
      ],
    });
    vi.spyOn(TestBed.inject(CategoriaProdutoService), 'listar').mockReturnValue(of([]));
    produtoService = TestBed.inject(ProdutoService);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  it('não salva quando o formulário está inválido', () => {
    const criarSpy = vi.spyOn(produtoService, 'criar');
    const fixture = TestBed.createComponent(ProdutoFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.form.controls.nome.setValue('');
    comp.salvar();

    expect(criarSpy).not.toHaveBeenCalled();
  });

  it('salvar chama criar e converte preço para centavos', () => {
    vi.spyOn(produtoService, 'criar').mockReturnValue(of(mockProduto));
    const fixture = TestBed.createComponent(ProdutoFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.form.patchValue({ nome: 'Produto X', precoVenda: 20, unidadeMedida: 'UN', estoqueMinimo: 1 });
    comp.salvar();

    expect(produtoService.criar).toHaveBeenCalledWith(
      expect.objectContaining({ nome: 'Produto X', precoVenda: 2000 }),
    );
    expect(router.navigate).toHaveBeenCalledWith(['/produtos', 'p1']);
  });

  it('salvar exibe erro em caso de falha', () => {
    vi.spyOn(produtoService, 'criar').mockReturnValue(
      throwError(() => ({ error: { message: 'Nome duplicado.' } })),
    );
    const fixture = TestBed.createComponent(ProdutoFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.form.patchValue({ nome: 'Produto X', precoVenda: 10, unidadeMedida: 'UN', estoqueMinimo: 0 });
    comp.salvar();

    expect(comp.erro()).toBe('Nome duplicado.');
    expect(comp.salvando()).toBe(false);
  });

  it('cancelar navega para /produtos', () => {
    const fixture = TestBed.createComponent(ProdutoFormComponent);
    fixture.detectChanges();
    fixture.componentInstance.cancelar();
    expect(router.navigate).toHaveBeenCalledWith(['/produtos']);
  });
});

describe('ProdutoFormComponent — modo edição', () => {
  let produtoService: ProdutoService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProdutoFormComponent],
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'p1' } } },
        },
      ],
    });
    vi.spyOn(TestBed.inject(CategoriaProdutoService), 'listar').mockReturnValue(of([]));
    produtoService = TestBed.inject(ProdutoService);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  it('preenche o formulário com os dados do produto ao carregar', () => {
    vi.spyOn(produtoService, 'buscar').mockReturnValue(of(mockProduto));

    const fixture = TestBed.createComponent(ProdutoFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(comp.editando).toBe(true);
    expect(comp.form.controls.nome.value).toBe('Produto Teste');
    expect(comp.form.controls.precoVenda.value).toBe(20); // 2000 centavos → R$ 20,00
  });

  it('salvar chama atualizar em modo edição', () => {
    vi.spyOn(produtoService, 'buscar').mockReturnValue(of(mockProduto));
    vi.spyOn(produtoService, 'atualizar').mockReturnValue(of(mockProduto));

    const fixture = TestBed.createComponent(ProdutoFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.salvar();

    expect(produtoService.atualizar).toHaveBeenCalledWith('p1', expect.objectContaining({ nome: 'Produto Teste' }));
  });
});
