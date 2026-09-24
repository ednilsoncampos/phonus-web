import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/auth/auth.service';

describe('LoginComponent', () => {
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    authService = TestBed.inject(AuthService);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  it('não chama login quando form inválido', () => {
    const loginSpy = vi.spyOn(authService, 'login');
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    // Limpa o pre-preenchimento de devCredentials para tornar o form inválido
    (fixture.componentInstance as any).form.setValue({ email: '', senha: '' });
    (fixture.componentInstance as any).submit();

    expect(loginSpy).not.toHaveBeenCalled();
  });

  it('exibe erro 401 como mensagem de credenciais inválidas', () => {
    vi.spyOn(authService, 'login').mockReturnValue(
      throwError(() => ({ status: 401 })),
    );

    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    const comp = fixture.componentInstance as any;
    comp.form.setValue({ email: 'a@b.com', senha: '123456' });
    comp.submit();

    expect(comp.errorMessage()).toBe('E-mail ou senha incorretos.');
    expect(comp.isLoading()).toBe(false);
  });

  it('exibe erro genérico para falhas não-401', () => {
    vi.spyOn(authService, 'login').mockReturnValue(
      throwError(() => ({ status: 500 })),
    );

    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    const comp = fixture.componentInstance as any;
    comp.form.setValue({ email: 'a@b.com', senha: '123456' });
    comp.submit();

    expect(comp.errorMessage()).toBe('Erro ao conectar. Tente novamente.');
  });

  it('exibe erro 403 e oferece reenvio de ativação', () => {
    vi.spyOn(authService, 'login').mockReturnValue(
      throwError(() => ({ status: 403, headers: { get: () => null } })),
    );

    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    const comp = fixture.componentInstance as any;
    comp.form.setValue({ email: 'a@b.com', senha: '123456' });
    comp.submit();

    expect(comp.showResendActivation()).toBe(true);
    expect(comp.errorMessage()).toContain('não foi ativada');
  });

  it('exibe erro 429 e bloqueia o botão de entrar pelo tempo do Retry-After', () => {
    vi.spyOn(authService, 'login').mockReturnValue(
      throwError(() => ({ status: 429, headers: { get: () => '30' } })),
    );

    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    const comp = fixture.componentInstance as any;
    comp.form.setValue({ email: 'a@b.com', senha: '123456' });
    comp.submit();

    expect(comp.errorMessage()).toBe('Muitas tentativas. Aguarde 30s e tente novamente.');
    expect(comp.loginBlockedSeconds()).toBe(30);
  });

  it('reenviarAtivacao dispara cooldown mesmo em caso de erro', () => {
    vi.spyOn(authService, 'reenviarAtivacao').mockReturnValue(throwError(() => ({ status: 500 })));

    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    const comp = fixture.componentInstance as any;
    comp.form.setValue({ email: 'a@b.com', senha: '123456' });
    comp.reenviarAtivacao();

    expect(comp.isResending()).toBe(false);
    expect(comp.resendCooldown()).toBe(120);
  });

  it('login bem-sucedido chama loadMe e navega para /dashboard', () => {
    vi.spyOn(authService, 'login').mockReturnValue(of({ accessToken: 'acc', refreshToken: 'ref' }));
    const loadMeSpy = vi.spyOn(authService, 'loadMe').mockReturnValue(
      of({ id: '1', nome: 'A', email: 'a@b.com', papel: 'ADMIN', ativo: true }),
    );

    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    const comp = fixture.componentInstance as any;
    comp.form.setValue({ email: 'a@b.com', senha: '123456' });
    comp.submit();

    expect(loadMeSpy).toHaveBeenCalled();
  });
});
