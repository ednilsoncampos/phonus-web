import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { of, throwError } from 'rxjs';
import { MinhaConta } from './minha-conta';
import { AuthService } from '../../../core/auth/auth.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { EntitlementResponse, Usuario } from '../../../core/models/usuario.model';

const eu: Usuario = { id: 'me', nome: 'Maria', email: 'm@e.com', papel: 'OPERADOR', status: 'ATIVO' };

const cortesia: EntitlementResponse = {
  usuarioId: 'me',
  isPremium: true,
  tier: 'PREMIUM',
  planoAtual: null,
  expiraEm: '2026-10-22T10:00:00-03:00',
  diasCortesiaRestantes: 21,
};

const assinatura: EntitlementResponse = {
  usuarioId: 'me',
  isPremium: true,
  tier: 'PREMIUM',
  planoAtual: {
    planoId: 'p1',
    googleProductId: 'phonus_premium_monthly',
    nome: 'Phonus Premium Mensal',
    periodoCobranca: 'MONTHLY',
    preco: 999,
    moeda: 'BRL',
  },
  expiraEm: '2026-10-31T10:00:00-03:00',
  diasCortesiaRestantes: 0,
};

const free: EntitlementResponse = {
  usuarioId: 'me',
  isPremium: false,
  tier: 'FREE',
  planoAtual: null,
  expiraEm: null,
  diasCortesiaRestantes: 0,
};

describe('MinhaConta', () => {
  let usuarioService: UsuarioService;

  function criar(resposta: EntitlementResponse) {
    vi.spyOn(usuarioService, 'buscarEntitlement').mockReturnValue(of(resposta));
    const fixture = TestBed.createComponent(MinhaConta);
    fixture.detectChanges();
    return { fixture, texto: (fixture.nativeElement as HTMLElement).textContent ?? '' };
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MinhaConta],
      providers: [provideRouter([]), provideAnimationsAsync()],
    });
    usuarioService = TestBed.inject(UsuarioService);
    vi.spyOn(TestBed.inject(AuthService), 'currentUser').mockReturnValue(eu);
  });

  it('consulta o entitlement do próprio usuário e mostra os dados da conta', () => {
    const { texto } = criar(free);
    expect(usuarioService.buscarEntitlement).toHaveBeenCalledWith('me');
    expect(texto).toContain('Maria');
    expect(texto).toContain('m@e.com');
    expect(texto).toContain('Operador');
  });

  it('cortesia: mostra dias restantes e data de validade', () => {
    const { texto } = criar(cortesia);
    expect(texto).toContain('Período de cortesia');
    expect(texto).toContain('21 dias restantes');
    expect(texto).toContain('válido até 22/10/2026');
  });

  it('cortesia com 1 dia usa o singular', () => {
    const { texto } = criar({ ...cortesia, diasCortesiaRestantes: 1 });
    expect(texto).toContain('1 dia restante');
  });

  it('assinatura ativa: plano, período, preço em reais e validade', () => {
    const { texto } = criar(assinatura);
    expect(texto).toContain('Phonus Premium Mensal');
    expect(texto).toContain('Mensal');
    expect(texto).toMatch(/R\$\s?9,99/);
    expect(texto).toContain('válido até 31/10/2026');
  });

  it('plano anual mostra "Anual"', () => {
    const { texto } = criar({
      ...assinatura,
      planoAtual: { ...assinatura.planoAtual!, periodoCobranca: 'YEARLY', preco: 8999 },
    });
    expect(texto).toContain('Anual');
    expect(texto).toMatch(/R\$\s?89,99/);
  });

  it('FREE: mostra plano gratuito, sem validade', () => {
    const { texto } = criar(free);
    expect(texto).toContain('Plano gratuito');
    expect(texto).not.toContain('válido até');
  });

  it('erro na consulta mostra a mensagem e permite tentar de novo', () => {
    vi.spyOn(usuarioService, 'buscarEntitlement').mockReturnValue(
      throwError(() => ({ error: { message: 'Acesso negado' } })),
    );
    const fixture = TestBed.createComponent(MinhaConta);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Acesso negado');
    expect(el.textContent).toContain('Tentar novamente');
  });
});
