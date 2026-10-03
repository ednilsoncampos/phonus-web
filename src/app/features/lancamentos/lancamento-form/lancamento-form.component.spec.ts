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

    // itens são opcionais: o formulário começa sem nenhum
    expect(comp.itemGroups()).toHaveLength(0);
    comp.adicionarItem();
    expect(comp.itemGroups()).toHaveLength(1);
  });

  it('avança do passo 1 sem itens', () => {
    const fixture = TestBed.createComponent(LancamentoFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.avancar();

    expect(comp.passo()).toBe(2);
  });

  it('não avança do passo 1 com item sem produto', () => {
    const fixture = TestBed.createComponent(LancamentoFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.adicionarItem();
    comp.avancar();

    expect(comp.passo()).toBe(1);
  });

  it('exige descrição para avançar do passo 2 quando não há itens', () => {
    const fixture = TestBed.createComponent(LancamentoFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.avancar();
    comp.form.controls.descricao.setValue('   ');
    comp.avancar();
    expect(comp.passo()).toBe(2);

    comp.form.controls.descricao.setValue('Aluguel');
    comp.avancar();
    expect(comp.passo()).toBe(3);
  });

  it('não exige descrição quando há itens', () => {
    const fixture = TestBed.createComponent(LancamentoFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.adicionarItem();
    expect(comp.form.controls.descricao.valid).toBe(true);
    comp.removerItem(0);
    expect(comp.form.controls.descricao.valid).toBe(false);
  });

  it('salvar sem itens envia a descrição informada e omite itens', () => {
    const criarSpy = vi.spyOn(lancamentoService, 'criar').mockReturnValue(
      of({ id: 'l1', usuarioId: 'u1', tipo: 'SAIDA_CAIXA', descricao: 'Aluguel', valorTotal: 100, formaPagamento: 'PIX', origem: 'TEXTO', dataLancamento: '2026-04-01', parcelas: [], itens: [] }),
    );
    const fixture = TestBed.createComponent(LancamentoFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.form.patchValue({ descricao: ' Aluguel ', valorTotal: 1500 });
    comp.salvar();

    const body = criarSpy.mock.calls[0][0];
    expect(body.descricao).toBe('Aluguel');
    expect(body.valorTotal).toBe(150000);
    expect(body.itens).toBeUndefined();
  });

  it('salvar com itens e descrição em branco usa os nomes dos produtos', () => {
    const criarSpy = vi.spyOn(lancamentoService, 'criar').mockReturnValue(
      of({ id: 'l1', usuarioId: 'u1', tipo: 'SAIDA_CAIXA', descricao: 'Produto A', valorTotal: 100, formaPagamento: 'PIX', origem: 'TEXTO', dataLancamento: '2026-04-01', parcelas: [], itens: [] }),
    );
    const fixture = TestBed.createComponent(LancamentoFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.produtos.set([
      { id: 'p1', nome: 'Produto A', precoVenda: 2500, quantidadeEstoque: 10, estoqueMinimo: 1, abaixoDoMinimo: false, unidadeMedida: 'UN', ativo: true, criadoPor: 'u1' },
    ]);
    comp.adicionarItem();
    comp.itemGroups()[0].patchValue({ produtoId: 'p1' });
    comp.form.patchValue({ valorTotal: 25 });
    comp.salvar();

    const body = criarSpy.mock.calls[0][0];
    expect(body.descricao).toBe('Produto A');
    expect(body.itens).toHaveLength(1);
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

  describe('total sugerido', () => {
    const produto = { id: 'p1', nome: 'Produto A', precoVenda: 2500, precoCusto: 1000, quantidadeEstoque: 10, estoqueMinimo: 1, abaixoDoMinimo: false, unidadeMedida: 'UN' as const, ativo: true, criadoPor: 'u1' };

    function comItem(qtd: number, desconto = 0) {
      const fixture = TestBed.createComponent(LancamentoFormComponent);
      fixture.detectChanges();
      const comp = fixture.componentInstance;
      comp.produtos.set([produto]);
      comp.adicionarItem();
      comp.itemGroups()[0].patchValue({ produtoId: 'p1', quantidade: qtd, desconto });
      return comp;
    }

    it('em saída usa o custo do produto', () => {
      const comp = comItem(3);
      comp.form.controls.tipo.setValue('SAIDA_CAIXA');
      expect(comp.form.controls.valorTotal.value).toBe(30);
    });

    it('em entrada usa o preço de venda e recalcula ao trocar o tipo', () => {
      const comp = comItem(3);
      comp.form.controls.tipo.setValue('ENTRADA_CAIXA');
      expect(comp.form.controls.valorTotal.value).toBe(75);
      comp.form.controls.tipo.setValue('SAIDA_CAIXA');
      expect(comp.form.controls.valorTotal.value).toBe(30);
    });

    it('aplica o desconto por unidade, não sobre a linha', () => {
      const comp = comItem(2, 3);
      comp.form.controls.tipo.setValue('ENTRADA_CAIXA');
      expect(comp.form.controls.valorTotal.value).toBe(44);
    });

    it('desconto maior que o preço zera o valor da unidade, sem ficar negativo', () => {
      const comp = comItem(2, 99);
      comp.form.controls.tipo.setValue('ENTRADA_CAIXA');
      expect(comp.form.controls.valorTotal.value).toBe(0);
    });

    it('trocar o tipo sem itens não apaga o total digitado', () => {
      const fixture = TestBed.createComponent(LancamentoFormComponent);
      fixture.detectChanges();
      const comp = fixture.componentInstance;
      comp.form.controls.valorTotal.setValue(150);
      comp.form.controls.tipo.setValue('ENTRADA_CAIXA');
      expect(comp.form.controls.valorTotal.value).toBe(150);
    });
  });

  it('forma a prazo com parcelas inválidas não chama criar', () => {
    const criarSpy = vi.spyOn(lancamentoService, 'criar');
    const fixture = TestBed.createComponent(LancamentoFormComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.form.patchValue({ descricao: 'Compra', valorTotal: 100, formaPagamento: 'CREDITO', quantidadeParcelas: 0 });
    comp.salvar();

    expect(criarSpy).not.toHaveBeenCalled();
    expect(comp.form.controls.quantidadeParcelas.touched).toBe(true);
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
