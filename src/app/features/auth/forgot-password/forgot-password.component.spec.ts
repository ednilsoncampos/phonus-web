import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ForgotPasswordComponent } from './forgot-password.component';

describe('ForgotPasswordComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent],
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('não chama a API quando form inválido (e-mail vazio)', () => {
    const fixture = TestBed.createComponent(ForgotPasswordComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance as any;

    comp.submit();

    httpMock.expectNone(() => true);
    expect(comp.isLoading()).toBe(false);
  });

  it('não chama a API quando e-mail tem formato inválido', () => {
    const fixture = TestBed.createComponent(ForgotPasswordComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance as any;

    comp.form.setValue({ email: 'nao-e-email' });
    comp.submit();

    httpMock.expectNone(() => true);
  });

  it('chama POST /auth/esqueceu-senha com e-mail válido', () => {
    const fixture = TestBed.createComponent(ForgotPasswordComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance as any;

    comp.form.setValue({ email: 'usuario@teste.com' });
    comp.submit();

    const req = httpMock.expectOne((r) => r.url.endsWith('/auth/esqueceu-senha') && r.method === 'POST');
    expect(req.request.body.email).toBe('usuario@teste.com');
    req.flush({ message: 'Instruções enviadas para o e-mail.' });

    expect(comp.isSuccess()).toBe(true);
    expect(comp.feedbackMessage()).toBe('Instruções enviadas para o e-mail.');
    expect(comp.isLoading()).toBe(false);
  });

  it('exibe mensagem de erro em caso de falha na API', () => {
    const fixture = TestBed.createComponent(ForgotPasswordComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance as any;

    comp.form.setValue({ email: 'usuario@teste.com' });
    comp.submit();

    httpMock
      .expectOne((r) => r.url.endsWith('/auth/esqueceu-senha'))
      .flush(null, { status: 500, statusText: 'Server Error' });

    expect(comp.isSuccess()).toBe(false);
    expect(comp.feedbackMessage()).toBe('Erro ao processar solicitação. Tente novamente.');
    expect(comp.isLoading()).toBe(false);
  });
});
