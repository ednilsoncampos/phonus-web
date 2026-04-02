import { TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { CategoriaProdutoDialogComponent } from './categoria-produto-dialog.component';
import { CategoriaProdutoService } from '../../../core/services/categoria-produto.service';
import { CategoriaProduto } from '../../../core/models/categoria-produto.model';

const mockCategoria: CategoriaProduto = { id: 'cp1', nome: 'Alimentos', ativo: true };

const dialogRefMock = { close: vi.fn() };

describe('CategoriaProdutoDialogComponent — criação', () => {
  let service: CategoriaProdutoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CategoriaProdutoDialogComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: dialogRefMock },
      ],
    });
    dialogRefMock.close.mockReset();
    service = TestBed.inject(CategoriaProdutoService);
  });

  it('form inválido não chama criar', () => {
    const criarSpy = vi.spyOn(service, 'criar');
    const fixture = TestBed.createComponent(CategoriaProdutoDialogComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.form.patchValue({ nome: '' });
    comp.salvar();

    expect(criarSpy).not.toHaveBeenCalled();
  });

  it('salvar fecha o dialog com o resultado', () => {
    vi.spyOn(service, 'criar').mockReturnValue(of(mockCategoria));
    const fixture = TestBed.createComponent(CategoriaProdutoDialogComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.form.patchValue({ nome: 'Alimentos' });
    comp.salvar();

    expect(service.criar).toHaveBeenCalled();
    expect(dialogRefMock.close).toHaveBeenCalledWith(mockCategoria);
    expect(comp.salvando()).toBe(false);
  });

  it('cancelar fecha o dialog sem dados', () => {
    const fixture = TestBed.createComponent(CategoriaProdutoDialogComponent);
    fixture.detectChanges();
    fixture.componentInstance.cancelar();
    expect(dialogRefMock.close).toHaveBeenCalledWith();
  });
});

describe('CategoriaProdutoDialogComponent — edição', () => {
  let service: CategoriaProdutoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CategoriaProdutoDialogComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: MAT_DIALOG_DATA, useValue: { categoria: mockCategoria } },
        { provide: MatDialogRef, useValue: dialogRefMock },
      ],
    });
    dialogRefMock.close.mockReset();
    service = TestBed.inject(CategoriaProdutoService);
  });

  it('form pré-preenchido com dados da categoria', () => {
    const fixture = TestBed.createComponent(CategoriaProdutoDialogComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(comp.editando).toBe(true);
    expect(comp.form.value.nome).toBe(mockCategoria.nome);
  });

  it('salvar chama editar e fecha o dialog', () => {
    const catAtualizada = { ...mockCategoria, nome: 'Alimentos Editado' };
    vi.spyOn(service, 'editar').mockReturnValue(of(catAtualizada));
    const fixture = TestBed.createComponent(CategoriaProdutoDialogComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.form.patchValue({ nome: 'Alimentos Editado' });
    comp.salvar();

    expect(service.editar).toHaveBeenCalledWith(mockCategoria.id, expect.objectContaining({ nome: 'Alimentos Editado' }));
    expect(dialogRefMock.close).toHaveBeenCalledWith(catAtualizada);
  });

  it('erro é exibido quando a requisição falha', () => {
    vi.spyOn(service, 'editar').mockReturnValue(
      throwError(() => ({ error: { message: 'Categoria já existe.' } })),
    );
    const fixture = TestBed.createComponent(CategoriaProdutoDialogComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.form.patchValue({ nome: 'Alimentos Editado' });
    comp.salvar();

    expect(comp.erro()).toBe('Categoria já existe.');
    expect(dialogRefMock.close).not.toHaveBeenCalled();
  });

  it('cancelar fecha o dialog sem dados', () => {
    const fixture = TestBed.createComponent(CategoriaProdutoDialogComponent);
    fixture.detectChanges();
    fixture.componentInstance.cancelar();
    expect(dialogRefMock.close).toHaveBeenCalledWith();
  });
});
