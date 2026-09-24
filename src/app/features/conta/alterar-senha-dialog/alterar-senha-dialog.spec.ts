import { TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { AlterarSenhaDialog } from './alterar-senha-dialog';
import { AuthService } from '../../../core/auth/auth.service';

const dialogRefMock = { close: vi.fn() };

describe('AlterarSenhaDialog', () => {
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AlterarSenhaDialog],
      providers: [
        provideAnimationsAsync(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: dialogRefMock },
      ],
    });
    dialogRefMock.close.mockReset();
    authService = TestBed.inject(AuthService);
  });

  function setUser(email: string): void {
    vi.spyOn(authService, 'currentUser').mockReturnValue({
      id: '1',
      nome: 'Usuário',
      email,
      papel: 'ADMIN',
      ativo: true,
    });
  }

  it('não chama alterarSenha quando a nova senha não tem letras e números', () => {
    setUser('user@phonus.com');
    const spy = vi.spyOn(authService, 'alterarSenha');
    const fixture = TestBed.createComponent(AlterarSenhaDialog);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.form.setValue({ senhaAtual: 'atual123', novaSenha: 'somenteletras', confirmarNovaSenha: 'somenteletras' });
    comp.salvar();

    expect(spy).not.toHaveBeenCalled();
    expect(comp.form.controls.novaSenha.hasError('senhaFraca')).toBe(true);
  });

  it('não chama alterarSenha quando a nova senha é igual ao e-mail', () => {
    setUser('user@phonus.com');
    const spy = vi.spyOn(authService, 'alterarSenha');
    const fixture = TestBed.createComponent(AlterarSenhaDialog);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.form.setValue({ senhaAtual: 'atual123', novaSenha: 'user@phonus.com', confirmarNovaSenha: 'user@phonus.com' });
    comp.salvar();

    expect(spy).not.toHaveBeenCalled();
  });

  it('não chama alterarSenha quando as senhas não conferem', () => {
    setUser('user@phonus.com');
    const spy = vi.spyOn(authService, 'alterarSenha');
    const fixture = TestBed.createComponent(AlterarSenhaDialog);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.form.setValue({ senhaAtual: 'atual123', novaSenha: 'novaSenha123', confirmarNovaSenha: 'outraSenha123' });
    comp.salvar();

    expect(spy).not.toHaveBeenCalled();
    expect(comp.form.hasError('senhasDiferentes')).toBe(true);
  });

  it('salvar chama alterarSenha e fecha o dialog com sucesso', () => {
    setUser('user@phonus.com');
    vi.spyOn(authService, 'alterarSenha').mockReturnValue(of(undefined));
    const fixture = TestBed.createComponent(AlterarSenhaDialog);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.form.setValue({ senhaAtual: 'atual123', novaSenha: 'novaSenha123', confirmarNovaSenha: 'novaSenha123' });
    comp.salvar();

    expect(authService.alterarSenha).toHaveBeenCalledWith({ senhaAtual: 'atual123', novaSenha: 'novaSenha123' });
    expect(dialogRefMock.close).toHaveBeenCalledWith(true);
  });

  it('exibe erro da API quando a senha atual está incorreta', () => {
    setUser('user@phonus.com');
    vi.spyOn(authService, 'alterarSenha').mockReturnValue(
      throwError(() => ({ error: { message: 'Senha atual incorreta.' } })),
    );
    const fixture = TestBed.createComponent(AlterarSenhaDialog);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.form.setValue({ senhaAtual: 'errada123', novaSenha: 'novaSenha123', confirmarNovaSenha: 'novaSenha123' });
    comp.salvar();

    expect(comp.erro()).toBe('Senha atual incorreta.');
    expect(dialogRefMock.close).not.toHaveBeenCalled();
  });

  it('cancelar fecha o dialog com false', () => {
    setUser('user@phonus.com');
    const fixture = TestBed.createComponent(AlterarSenhaDialog);
    fixture.detectChanges();
    fixture.componentInstance.cancelar();
    expect(dialogRefMock.close).toHaveBeenCalledWith(false);
  });
});
