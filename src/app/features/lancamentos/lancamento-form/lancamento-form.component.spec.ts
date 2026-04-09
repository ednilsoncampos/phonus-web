import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { of, throwError } from 'rxjs';
import { LancamentoFormComponent } from './lancamento-form.component';
import { LancamentoService } from '../../../core/services/lancamento.service';
import { CategoriaLancamentoService } from '../../../core/services/categoria-lancamento.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { FornecedorService } from '../../../core/services/fornecedor.service';
import { ProdutoService } from '../../../core/services/produto.service';

const emptyPage = { content: [], totalElements: 0, totalPages: 0, page: 0, size: 200, last: true };

describe('LancamentoFormComponent', () => {
  let lancamentoService: LancamentoService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LancamentoFormComponent],
      providers: [provideRouter([]), provideAnimationsAsync()],
    });

    vi.spyOn(TestBed.inject(CategoriaLancamentoService), 'listar').mockReturnValue(of([]));
    vi.spyOn(TestBed.inject(ClienteService), 'listar').mockReturnValue(of(emptyPage));
    vi.spyOn(TestBed.inject(FornecedorService), 'listar').mockReturnValue(of(emptyPage));
    vi.spyOn(TestBed.inject(ProdutoService), 'listar').mockReturnValue(of(emptyPage));

    lancamentoService = TestBed.inject(LancamentoService);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  it('não salva quando o formulário está inválido', () => {
    const criarSpy = vi.spyOn(lancamentoService, 'criar');
    const fixture = TestBed.createComponent(LancamentoFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.form.controls.descricao.setValue('');
    comp.salvar();

    expect(criarSpy).not.toHaveBeenCalled();
  });

  it('isPrazo é true apenas para CREDITO, CHEQUE e PROMISSORIA', () => {
    const fixture = TestBed.createComponent(LancamentoFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.form.controls.formaPagamento.setValue('PIX');
    expect(comp.isPrazo()).toBe(false);

    comp.form.controls.formaPagamento.setValue('CREDITO');
    expect(comp.isPrazo()).toBe(true);

    comp.form.controls.formaPagamento.setValue('CHEQUE');
    expect(comp.isPrazo()).toBe(true);

    comp.form.controls.formaPagamento.setValue('PROMISSORIA');
    expect(comp.isPrazo()).toBe(true);

    comp.form.controls.formaPagamento.setValue('DINHEIRO');
    expect(comp.isPrazo()).toBe(false);
  });

  it('categoriasFiltradas retorna apenas categorias ativas do tipo correto', () => {
    const fixture = TestBed.createComponent(LancamentoFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.todasCategorias.set([
      { id: '1', nome: 'Salário', tipo: 'ENTRADA_CAIXA', ativo: true },
      { id: '2', nome: 'Compras', tipo: 'SAIDA_CAIXA', ativo: true },
      { id: '3', nome: 'Inativo', tipo: 'SAIDA_CAIXA', ativo: false },
    ]);

    comp.form.controls.tipo.setValue('SAIDA_CAIXA');
    const filtradas = comp.categoriasFiltradas();
    expect(filtradas).toHaveLength(1);
    expect(filtradas.map((c) => c.id)).toContain('2');
  });

  it('adicionarItem adiciona um grupo ao array de itens', () => {
    const fixture = TestBed.createComponent(LancamentoFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(comp.itemGroups()).toHaveLength(0);
    comp.adicionarItem();
    expect(comp.itemGroups()).toHaveLength(1);
  });

  it('removerItem remove o grupo correto do array', () => {
    const fixture = TestBed.createComponent(LancamentoFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.adicionarItem();
    comp.adicionarItem();
    expect(comp.itemGroups()).toHaveLength(2);

    comp.removerItem(0);
    expect(comp.itemGroups()).toHaveLength(1);
  });

  it('precoReferencia retorna o preço do produto pelo id', () => {
    const fixture = TestBed.createComponent(LancamentoFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.produtos.set([
      { id: 'p1', nome: 'Produto A', precoVenda: 2500, quantidadeEstoque: 10, estoqueMinimo: 1, abaixoDoMinimo: false, unidadeMedida: 'UN', ativo: true, criadoPor: 'u1' },
    ]);

    expect(comp.precoReferencia('p1')).toBe(2500);
    expect(comp.precoReferencia('nao-existe')).toBe(0);
  });

  it('salvar navega para /lancamentos após sucesso', () => {
    vi.spyOn(lancamentoService, 'criar').mockReturnValue(
      of({ id: 'l1', usuarioId: 'u1', tipo: 'SAIDA_CAIXA', descricao: 'Teste', valorTotal: 100, formaPagamento: 'PIX', origem: 'TEXTO', dataLancamento: '2026-04-01', parcelas: [], itens: [] }),
    );

    const fixture = TestBed.createComponent(LancamentoFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.form.setValue({
      tipo: 'SAIDA_CAIXA',
      descricao: 'Compra teste',
      valorTotal: 100,
      formaPagamento: 'PIX',
      dataLancamento: '2026-04-01',
      quantidadeParcelas: 1,
      categoriaId: '',
      clienteId: '',
      fornecedorId: '',
    });

    comp.salvar();

    expect(router.navigate).toHaveBeenCalledWith(['/lancamentos']);
  });

  it('salvar exibe mensagem de erro em caso de falha', () => {
    vi.spyOn(lancamentoService, 'criar').mockReturnValue(
      throwError(() => ({ error: { message: 'Saldo insuficiente.' } })),
    );

    const fixture = TestBed.createComponent(LancamentoFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.form.setValue({
      tipo: 'SAIDA_CAIXA',
      descricao: 'Compra teste',
      valorTotal: 100,
      formaPagamento: 'PIX',
      dataLancamento: '2026-04-01',
      quantidadeParcelas: 1,
      categoriaId: '',
      clienteId: '',
      fornecedorId: '',
    });

    comp.salvar();

    expect(comp.erro()).toBe('Saldo insuficiente.');
    expect(comp.salvando()).toBe(false);
  });

  it('cancelar navega para /lancamentos', () => {
    const fixture = TestBed.createComponent(LancamentoFormComponent);
    fixture.detectChanges();
    fixture.componentInstance.cancelar();
    expect(router.navigate).toHaveBeenCalledWith(['/lancamentos']);
  });
});
