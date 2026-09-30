import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { VerifyEmailComponent } from './verify-email.component';

describe('VerifyEmailComponent', () => {
  let httpMock: HttpTestingController;

  function criar() {
    const fixture = TestBed.createComponent(VerifyEmailComponent);
    fixture.detectChanges();
    return { fixture, comp: fixture.componentInstance as any };
  }

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      imports: [VerifyEmailComponent],
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.useRealTimers();
  });

  it('sem e-mail no state, pede o e-mail e não reenvia com formulário inválido', () => {
    const { comp } = criar();
    expect(comp.email()).toBeNull();

    comp.reenviar();

    httpMock.expectNone(() => true);
    expect(comp.form.controls.email.touched).toBe(true);
  });

  it('sem e-mail no state, reenvia usando o e-mail digitado', () => {
    const { comp } = criar();
    comp.form.controls.email.setValue('joao@padaria.com.br');

    comp.reenviar();

    const req = httpMock.expectOne((r) => r.url.endsWith('/auth/reenviar-ativacao') && r.method === 'POST');
    expect(req.request.body).toEqual({ email: 'joao@padaria.com.br' });
    req.flush({ message: 'ok' });
  });

  it('com e-mail conhecido, reenvia, mostra feedback e inicia a contagem de 2 minutos', () => {
    const { comp } = criar();
    comp.email.set('joao@padaria.com.br');

    comp.reenviar();
    httpMock
      .expectOne((r) => r.url.endsWith('/auth/reenviar-ativacao'))
      .flush({ message: 'ok' });

    expect(comp.feedback()).toContain('novo e-mail de ativação foi enviado');
    expect(comp.cooldown()).toBe(120);

    vi.advanceTimersByTime(5000);
    expect(comp.cooldown()).toBe(115);
  });

  it('não reenvia durante a contagem regressiva', () => {
    const { comp } = criar();
    comp.email.set('joao@padaria.com.br');
    comp.reenviar();
    httpMock.expectOne((r) => r.url.endsWith('/auth/reenviar-ativacao')).flush({});

    comp.reenviar();

    httpMock.expectNone(() => true);
  });

  it('libera o reenvio quando a contagem chega a zero', () => {
    const { comp } = criar();
    comp.email.set('joao@padaria.com.br');
    comp.reenviar();
    httpMock.expectOne((r) => r.url.endsWith('/auth/reenviar-ativacao')).flush({});

    vi.advanceTimersByTime(120_000);

    expect(comp.cooldown()).toBe(0);
  });

  it('informa falha no reenvio e ainda aplica a contagem', () => {
    const { comp } = criar();
    comp.email.set('joao@padaria.com.br');

    comp.reenviar();
    httpMock
      .expectOne((r) => r.url.endsWith('/auth/reenviar-ativacao'))
      .flush(null, { status: 500, statusText: 'Server Error' });

    expect(comp.feedback()).toContain('Não foi possível reenviar');
    expect(comp.cooldown()).toBe(120);
    expect(comp.isResending()).toBe(false);
  });
});
