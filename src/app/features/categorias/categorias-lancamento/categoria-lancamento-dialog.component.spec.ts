import { TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { CategoriaLancamentoDialogComponent } from './categoria-lancamento-dialog.component';
import { CategoriaLancamentoService } from '../../../core/services/categoria-lancamento.service';
import { CategoriaLancamento } from '../../../core/models/categoria-lancamento.model';

const mockCat: CategoriaLancamento = { id: 'cat1', nome: 'Salário', tipo: 'ENTRADA', ativo: true };

const dialogRefMock = { close: vi.fn() };

describe('CategoriaLancamentoDialogComponent — criação', () => {
  let service: CategoriaLancamentoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CategoriaLancamentoDialogComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: dialogRefMock },
      ],
    });
    dialogRefMock.close.mockReset();
    service = TestBed.inject(CategoriaLancamentoService);
  });

  it('form inválido não chama criar', () => {
    const criarSpy = vi.spyOn(service, 'criar');
    const fixture = TestBed.createComponent(CategoriaLancamentoDialogComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.form.patchValue({ nome: '' });
    comp.salvar();

    expect(criarSpy).not.toHaveBeenCalled();
  });

  it('salvar bem-sucedido fecha o dialog com o resultado', () => {
    vi.spyOn(service, 'criar').mockReturnValue(of(mockCat));
    const fixture = TestBed.createComponent(CategoriaLancamentoDialogComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.form.patchValue({ nome: 'Salário', tipo: 'ENTRADA' });
    comp.salvar();

    expect(service.criar).toHaveBeenCalled();
    expect(dialogRefMock.close).toHaveBeenCalledWith(mockCat);
    expect(comp.salvando()).toBe(false);
  });

  it('cancelar fecha o dialog sem dados', () => {
    const fixture = TestBed.createComponent(CategoriaLancamentoDialogComponent);
    fixture.detectChanges();
    fixture.componentInstance.cancelar();
    expect(dialogRefMock.close).toHaveBeenCalledWith();
  });
});

describe('CategoriaLancamentoDialogComponent — edição', () => {
  let service: CategoriaLancamentoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CategoriaLancamentoDialogComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: MAT_DIALOG_DATA, useValue: { categoria: mockCat } },
        { provide: MatDialogRef, useValue: dialogRefMock },
      ],
    });
    dialogRefMock.close.mockReset();
    service = TestBed.inject(CategoriaLancamentoService);
  });

  it('form pré-preenchido com dados da categoria', () => {
    const fixture = TestBed.createComponent(CategoriaLancamentoDialogComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(comp.editando).toBe(true);
    expect(comp.form.value.nome).toBe(mockCat.nome);
    expect(comp.form.value.tipo).toBe(mockCat.tipo);
  });

  it('salvar chama editar e fecha o dialog', () => {
    const catAtualizada = { ...mockCat, nome: 'Salário Editado' };
    vi.spyOn(service, 'editar').mockReturnValue(of(catAtualizada));
    const fixture = TestBed.createComponent(CategoriaLancamentoDialogComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.form.patchValue({ nome: 'Salário Editado' });
    comp.salvar();

    expect(service.editar).toHaveBeenCalledWith(mockCat.id, expect.objectContaining({ nome: 'Salário Editado' }));
    expect(dialogRefMock.close).toHaveBeenCalledWith(catAtualizada);
  });

  it('erro genérico é exibido como mensagem do servidor', () => {
    vi.spyOn(service, 'editar').mockReturnValue(
      throwError(() => ({ error: { message: 'Erro interno.' } })),
    );
    const fixture = TestBed.createComponent(CategoriaLancamentoDialogComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.form.patchValue({ nome: 'Salário Editado' });
    comp.salvar();

    expect(comp.erro()).toBe('Erro interno.');
    expect(dialogRefMock.close).not.toHaveBeenCalled();
  });

  it('cancelar fecha o dialog sem dados', () => {
    const fixture = TestBed.createComponent(CategoriaLancamentoDialogComponent);
    fixture.detectChanges();
    fixture.componentInstance.cancelar();
    expect(dialogRefMock.close).toHaveBeenCalledWith();
  });
});
