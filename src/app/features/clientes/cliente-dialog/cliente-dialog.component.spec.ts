import { TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { ClienteDialogComponent } from './cliente-dialog.component';
import { ClienteService } from '../../../core/services/cliente.service';
import { Cliente } from '../../../core/models/cliente.model';

const mockCliente: Cliente = {
  id: 'c1',
  nome: 'João Silva',
  documento: '123.456.789-00',
  email: 'joao@email.com',
  telefone: '(11) 99999-9999',
  ativo: true,
};

const dialogRefMock = { close: vi.fn() };

describe('ClienteDialogComponent — criação', () => {
  let service: ClienteService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ClienteDialogComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: dialogRefMock },
      ],
    });
    dialogRefMock.close.mockReset();
    service = TestBed.inject(ClienteService);
  });

  it('form inválido não chama criar', () => {
    const criarSpy = vi.spyOn(service, 'criar');
    const fixture = TestBed.createComponent(ClienteDialogComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.form.patchValue({ nome: '' });
    comp.salvar();

    expect(criarSpy).not.toHaveBeenCalled();
  });

  it('salvar chama criar e fecha o dialog com o resultado', () => {
    vi.spyOn(service, 'criar').mockReturnValue(of(mockCliente));
    const fixture = TestBed.createComponent(ClienteDialogComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.form.patchValue({ nome: 'João Silva' });
    comp.salvar();

    expect(service.criar).toHaveBeenCalled();
    expect(dialogRefMock.close).toHaveBeenCalledWith(mockCliente);
    expect(comp.salvando()).toBe(false);
  });

  it('cancelar fecha o dialog sem dados', () => {
    const fixture = TestBed.createComponent(ClienteDialogComponent);
    fixture.detectChanges();
    fixture.componentInstance.cancelar();
    expect(dialogRefMock.close).toHaveBeenCalledWith();
  });
});

describe('ClienteDialogComponent — edição', () => {
  let service: ClienteService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ClienteDialogComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: MAT_DIALOG_DATA, useValue: { cliente: mockCliente } },
        { provide: MatDialogRef, useValue: dialogRefMock },
      ],
    });
    dialogRefMock.close.mockReset();
    service = TestBed.inject(ClienteService);
  });

  it('form pré-preenchido com dados do cliente', () => {
    const fixture = TestBed.createComponent(ClienteDialogComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(comp.editando).toBe(true);
    expect(comp.form.value.nome).toBe(mockCliente.nome);
    expect(comp.form.value.email).toBe(mockCliente.email);
  });

  it('salvar chama atualizar e fecha o dialog', () => {
    const clienteAtualizado = { ...mockCliente, nome: 'João Editado' };
    vi.spyOn(service, 'atualizar').mockReturnValue(of(clienteAtualizado));
    const fixture = TestBed.createComponent(ClienteDialogComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.form.patchValue({ nome: 'João Editado' });
    comp.salvar();

    expect(service.atualizar).toHaveBeenCalledWith(mockCliente.id, expect.objectContaining({ nome: 'João Editado' }));
    expect(dialogRefMock.close).toHaveBeenCalledWith(clienteAtualizado);
  });

  it('erro é definido quando a requisição falha', () => {
    vi.spyOn(service, 'atualizar').mockReturnValue(
      throwError(() => ({ error: { message: 'Erro ao atualizar.' } })),
    );
    const fixture = TestBed.createComponent(ClienteDialogComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.form.patchValue({ nome: 'João Editado' });
    comp.salvar();

    expect(comp.erro()).toBe('Erro ao atualizar.');
    expect(dialogRefMock.close).not.toHaveBeenCalled();
  });
});
