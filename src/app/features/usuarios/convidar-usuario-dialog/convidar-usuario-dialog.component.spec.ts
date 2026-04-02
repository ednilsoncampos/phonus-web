import { TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { ConvidarUsuarioDialogComponent } from './convidar-usuario-dialog.component';
import { UsuarioService } from '../../../core/services/usuario.service';
import { Usuario } from '../../../core/models/usuario.model';

const mockUsuario: Usuario = { id: 'u2', nome: 'Novo', email: 'n@n.com', papel: 'OPERADOR', ativo: true };
const dialogRefMock = { close: vi.fn() };

describe('ConvidarUsuarioDialogComponent — papelDoConvidante ADMIN', () => {
  let usuarioService: UsuarioService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ConvidarUsuarioDialogComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: MAT_DIALOG_DATA, useValue: { papelDoConvidante: 'ADMIN' } },
        { provide: MatDialogRef, useValue: dialogRefMock },
      ],
    });
    dialogRefMock.close.mockReset();
    usuarioService = TestBed.inject(UsuarioService);
  });

  it('papeisDisponiveis tem apenas OPERADOR quando convidante é ADMIN', () => {
    const fixture = TestBed.createComponent(ConvidarUsuarioDialogComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(comp.papeisDisponiveis).toHaveLength(1);
    expect(comp.papeisDisponiveis[0].value).toBe('OPERADOR');
  });

  it('salvar chama usuarioService.convidar e fecha dialog com resultado', () => {
    vi.spyOn(usuarioService, 'convidar').mockReturnValue(of(mockUsuario));
    const fixture = TestBed.createComponent(ConvidarUsuarioDialogComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.form.patchValue({ nome: 'Novo', email: 'n@n.com', papel: 'OPERADOR' });
    comp.salvar();

    expect(usuarioService.convidar).toHaveBeenCalled();
    expect(dialogRefMock.close).toHaveBeenCalledWith(mockUsuario);
  });

  it('cancelar fecha o dialog sem dados', () => {
    const fixture = TestBed.createComponent(ConvidarUsuarioDialogComponent);
    fixture.detectChanges();
    fixture.componentInstance.cancelar();
    expect(dialogRefMock.close).toHaveBeenCalledWith();
  });
});

describe('ConvidarUsuarioDialogComponent — papelDoConvidante ROOT', () => {
  let usuarioService: UsuarioService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ConvidarUsuarioDialogComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: MAT_DIALOG_DATA, useValue: { papelDoConvidante: 'ROOT' } },
        { provide: MatDialogRef, useValue: dialogRefMock },
      ],
    });
    dialogRefMock.close.mockReset();
    usuarioService = TestBed.inject(UsuarioService);
  });

  it('papeisDisponiveis tem ADMIN e OPERADOR quando convidante é ROOT', () => {
    const fixture = TestBed.createComponent(ConvidarUsuarioDialogComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(comp.papeisDisponiveis).toHaveLength(2);
    expect(comp.papeisDisponiveis.map((p) => p.value)).toContain('ADMIN');
    expect(comp.papeisDisponiveis.map((p) => p.value)).toContain('OPERADOR');
  });

  it('form inválido não chama convidar', () => {
    const convidarSpy = vi.spyOn(usuarioService, 'convidar');
    const fixture = TestBed.createComponent(ConvidarUsuarioDialogComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.form.patchValue({ nome: '', email: '', papel: 'ADMIN' });
    comp.salvar();

    expect(convidarSpy).not.toHaveBeenCalled();
  });

  it('erro é exibido quando a requisição falha', () => {
    vi.spyOn(usuarioService, 'convidar').mockReturnValue(
      throwError(() => ({ error: { message: 'E-mail já cadastrado.' } })),
    );
    const fixture = TestBed.createComponent(ConvidarUsuarioDialogComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.form.patchValue({ nome: 'Novo', email: 'n@n.com', papel: 'ADMIN' });
    comp.salvar();

    expect(comp.erro()).toBe('E-mail já cadastrado.');
    expect(dialogRefMock.close).not.toHaveBeenCalled();
  });
});
