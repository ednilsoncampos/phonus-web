import { TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { FornecedorDialogComponent } from './fornecedor-dialog.component';
import { FornecedorService } from '../../../core/services/fornecedor.service';
import { Fornecedor } from '../../../core/models/fornecedor.model';

const mockFornecedor: Fornecedor = {
  id: 'f1',
  nome: 'Distribuidora ABC',
  documento: '12.345.678/0001-00',
  email: 'contato@distribuidora.com',
  telefone: '(11) 3333-4444',
  ativo: true,
};

const dialogRefMock = { close: vi.fn() };

describe('FornecedorDialogComponent — criação', () => {
  let service: FornecedorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FornecedorDialogComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: dialogRefMock },
      ],
    });
    dialogRefMock.close.mockReset();
    service = TestBed.inject(FornecedorService);
  });

  it('form inválido não chama criar', () => {
    const criarSpy = vi.spyOn(service, 'criar');
    const fixture = TestBed.createComponent(FornecedorDialogComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.form.patchValue({ nome: '' });
    comp.salvar();

    expect(criarSpy).not.toHaveBeenCalled();
  });

  it('salvar chama criar e fecha o dialog com o resultado', () => {
    vi.spyOn(service, 'criar').mockReturnValue(of(mockFornecedor));
    const fixture = TestBed.createComponent(FornecedorDialogComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.form.patchValue({ nome: 'Distribuidora ABC' });
    comp.salvar();

    expect(service.criar).toHaveBeenCalled();
    expect(dialogRefMock.close).toHaveBeenCalledWith(mockFornecedor);
    expect(comp.salvando()).toBe(false);
  });

  it('cancelar fecha o dialog sem dados', () => {
    const fixture = TestBed.createComponent(FornecedorDialogComponent);
    fixture.detectChanges();
    fixture.componentInstance.cancelar();
    expect(dialogRefMock.close).toHaveBeenCalledWith();
  });
});

describe('FornecedorDialogComponent — edição', () => {
  let service: FornecedorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FornecedorDialogComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: MAT_DIALOG_DATA, useValue: { fornecedor: mockFornecedor } },
        { provide: MatDialogRef, useValue: dialogRefMock },
      ],
    });
    dialogRefMock.close.mockReset();
    service = TestBed.inject(FornecedorService);
  });

  it('form pré-preenchido com dados do fornecedor', () => {
    const fixture = TestBed.createComponent(FornecedorDialogComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(comp.editando).toBe(true);
    expect(comp.form.value.nome).toBe(mockFornecedor.nome);
    expect(comp.form.value.email).toBe(mockFornecedor.email);
  });

  it('salvar chama atualizar e fecha o dialog', () => {
    const fornecedorAtualizado = { ...mockFornecedor, nome: 'Distribuidora Editada' };
    vi.spyOn(service, 'atualizar').mockReturnValue(of(fornecedorAtualizado));
    const fixture = TestBed.createComponent(FornecedorDialogComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.form.patchValue({ nome: 'Distribuidora Editada' });
    comp.salvar();

    expect(service.atualizar).toHaveBeenCalledWith(mockFornecedor.id, expect.objectContaining({ nome: 'Distribuidora Editada' }));
    expect(dialogRefMock.close).toHaveBeenCalledWith(fornecedorAtualizado);
  });

  it('erro é definido quando a requisição falha', () => {
    vi.spyOn(service, 'atualizar').mockReturnValue(
      throwError(() => ({ error: { message: 'Erro ao atualizar.' } })),
    );
    const fixture = TestBed.createComponent(FornecedorDialogComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.form.patchValue({ nome: 'Distribuidora Editada' });
    comp.salvar();

    expect(comp.erro()).toBe('Erro ao atualizar.');
    expect(dialogRefMock.close).not.toHaveBeenCalled();
  });
});
