import { TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { AjusteEstoqueDialogComponent } from './ajuste-estoque-dialog.component';
import { EstoqueService } from '../../../core/services/estoque.service';
import { MovimentacaoEstoque } from '../../../core/models/estoque.model';
import { Produto } from '../../../core/models/produto.model';

const mockProduto: Produto = {
  id: 'p1',
  nome: 'Arroz',
  precoVenda: 500,
  quantidadeEstoque: 10,
  estoqueMinimo: 2,
  abaixoDoMinimo: false,
  unidadeMedida: 'UN',
  ativo: true,
  criadoPor: 'u1',
};

const mockMovimentacao: MovimentacaoEstoque = {
  id: 'm1',
  produtoId: 'p1',
  tipo: 'ENTRADA',
  quantidade: 5,
  origem: 'AJUSTE_POSITIVO',
  criadoPor: 'u1',
};

const dialogRefMock = { close: vi.fn() };

function setup(produto?: Produto) {
  TestBed.configureTestingModule({
    imports: [AjusteEstoqueDialogComponent],
    providers: [
      provideAnimationsAsync(),
      { provide: MAT_DIALOG_DATA, useValue: { produto, produtos: [mockProduto] } },
      { provide: MatDialogRef, useValue: dialogRefMock },
    ],
  });
  dialogRefMock.close.mockReset();
}

describe('AjusteEstoqueDialogComponent — com produto pré-selecionado', () => {
  let estoqueService: EstoqueService;

  beforeEach(() => {
    setup(mockProduto);
    estoqueService = TestBed.inject(EstoqueService);
  });

  it('não salva quando o formulário está inválido (quantidade vazia)', () => {
    const ajustarSpy = vi.spyOn(estoqueService, 'ajustar');
    const fixture = TestBed.createComponent(AjusteEstoqueDialogComponent);
    fixture.detectChanges();

    fixture.componentInstance.salvar();

    expect(ajustarSpy).not.toHaveBeenCalled();
  });

  it('salvar chama ajustar com os dados corretos e fecha o dialog', () => {
    vi.spyOn(estoqueService, 'ajustar').mockReturnValue(of(mockMovimentacao));
    const fixture = TestBed.createComponent(AjusteEstoqueDialogComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.form.patchValue({ tipo: 'AJUSTE_POSITIVO', quantidade: 5, observacao: 'reposição' });
    comp.salvar();

    expect(estoqueService.ajustar).toHaveBeenCalledWith('p1', {
      tipo: 'AJUSTE_POSITIVO',
      quantidade: 5,
      observacao: 'reposição',
    });
    expect(dialogRefMock.close).toHaveBeenCalledWith(mockMovimentacao);
    expect(comp.salvando()).toBe(false);
  });

  it('salvar exibe mensagem de erro em caso de falha na API', () => {
    vi.spyOn(estoqueService, 'ajustar').mockReturnValue(
      throwError(() => ({ error: { message: 'Estoque insuficiente.' } })),
    );
    const fixture = TestBed.createComponent(AjusteEstoqueDialogComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.form.patchValue({ tipo: 'AJUSTE_NEGATIVO', quantidade: 3 });
    comp.salvar();

    expect(comp.erro()).toBe('Estoque insuficiente.');
    expect(comp.salvando()).toBe(false);
    expect(dialogRefMock.close).not.toHaveBeenCalled();
  });

  it('cancelar fecha o dialog sem dados', () => {
    const fixture = TestBed.createComponent(AjusteEstoqueDialogComponent);
    fixture.detectChanges();
    fixture.componentInstance.cancelar();
    expect(dialogRefMock.close).toHaveBeenCalledWith();
  });
});

describe('AjusteEstoqueDialogComponent — sem produto pré-selecionado', () => {
  let estoqueService: EstoqueService;

  beforeEach(() => {
    setup(undefined);
    estoqueService = TestBed.inject(EstoqueService);
  });

  it('produtoId é obrigatório quando nenhum produto é passado', () => {
    const fixture = TestBed.createComponent(AjusteEstoqueDialogComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    const ajustarSpy = vi.spyOn(estoqueService, 'ajustar');
    comp.form.patchValue({ quantidade: 5, tipo: 'AJUSTE_POSITIVO', produtoId: '' });
    comp.salvar();

    expect(comp.form.controls.produtoId.invalid).toBe(true);
    expect(ajustarSpy).not.toHaveBeenCalled();
  });

  it('salvar usa o produtoId do formulário quando produto não é pré-selecionado', () => {
    vi.spyOn(estoqueService, 'ajustar').mockReturnValue(of(mockMovimentacao));
    const fixture = TestBed.createComponent(AjusteEstoqueDialogComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.form.patchValue({ produtoId: 'p1', tipo: 'AJUSTE_POSITIVO', quantidade: 2 });
    comp.salvar();

    expect(estoqueService.ajustar).toHaveBeenCalledWith('p1', expect.objectContaining({ quantidade: 2 }));
  });
});
