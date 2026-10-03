import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { of, throwError } from 'rxjs';
import { UsuarioDetailComponent } from './usuario-detail.component';
import { UsuarioService } from '../../../core/services/usuario.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Usuario } from '../../../core/models/usuario.model';

const eu: Usuario = { id: 'me', nome: 'Eu', email: 'eu@e.com', papel: 'ROOT', status: 'ATIVO' };
const admin: Usuario = { id: 'a1', nome: 'Admin', email: 'a@e.com', papel: 'ADMIN', status: 'ATIVO' };
const operador: Usuario = { id: 'o1', nome: 'Oper', email: 'o@e.com', papel: 'OPERADOR', status: 'ATIVO' };
const outroRoot: Usuario = { id: 'r2', nome: 'Outro Root', email: 'r@e.com', papel: 'ROOT', status: 'ATIVO' };

describe('UsuarioDetailComponent', () => {
  let usuarioService: UsuarioService;
  let authService: AuthService;

  function criar(id: string, lista: Usuario[] = [eu, admin, operador, outroRoot]) {
    vi.spyOn(usuarioService, 'listar').mockReturnValue(of(lista));
    const fixture = TestBed.createComponent(UsuarioDetailComponent);
    fixture.componentRef.setInput('id', id);
    fixture.detectChanges();
    return { fixture, comp: fixture.componentInstance };
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [UsuarioDetailComponent],
      providers: [provideRouter([]), provideAnimationsAsync()],
    });
    usuarioService = TestBed.inject(UsuarioService);
    authService = TestBed.inject(AuthService);
    vi.spyOn(authService, 'currentUser').mockReturnValue(eu);
    vi.spyOn(authService, 'hasPermissao').mockImplementation((...p) => p.includes('USUARIOS_ALTERAR_PAPEL'));
  });

  it('carrega o usuário a partir da lista pelo id da rota', () => {
    const { comp } = criar('a1');
    expect(comp.usuario()).toEqual(admin);
    expect(comp.carregando()).toBe(false);
  });

  it('id que não está na lista deixa usuario nulo (tela de não encontrado)', () => {
    const { comp } = criar('inexistente');
    expect(comp.usuario()).toBeNull();
  });

  it('mostra erro quando a lista falha', () => {
    vi.spyOn(usuarioService, 'listar').mockReturnValue(
      throwError(() => ({ error: { message: 'Acesso negado' } })),
    );
    const fixture = TestBed.createComponent(UsuarioDetailComponent);
    fixture.componentRef.setInput('id', 'a1');
    fixture.detectChanges();
    expect(fixture.componentInstance.erro()).toBe('Acesso negado');
  });

  it('ROOT pode alterar o papel de ADMIN e OPERADOR', () => {
    expect(criar('a1').comp.podeAlterarPapel()).toBe(true);
    expect(criar('o1').comp.podeAlterarPapel()).toBe(true);
  });

  it('não permite alterar o próprio papel nem o de outro ROOT', () => {
    expect(criar('me').comp.podeAlterarPapel()).toBe(false);
    expect(criar('r2').comp.podeAlterarPapel()).toBe(false);
  });

  it('sem USUARIOS_ALTERAR_PAPEL (ex.: ADMIN) não oferece a ação', () => {
    vi.spyOn(authService, 'hasPermissao').mockReturnValue(false);
    expect(criar('o1').comp.podeAlterarPapel()).toBe(false);
  });

  it('o seletor oferece só ADMIN/OPERADOR, sem o papel atual', () => {
    expect(criar('a1').comp.papeisDisponiveis().map((p) => p.value)).toEqual(['OPERADOR']);
    expect(criar('o1').comp.papeisDisponiveis().map((p) => p.value)).toEqual(['ADMIN']);
  });

  it('salvarPapel chama PATCH e atualiza o papel exibido', () => {
    const { comp } = criar('a1');
    const alterar = vi.spyOn(usuarioService, 'alterarPapel').mockReturnValue(of({ ...admin, papel: 'OPERADOR' }));

    comp.salvarPapel();

    expect(alterar).toHaveBeenCalledWith('a1', { papel: 'OPERADOR' });
    expect(comp.usuario()?.papel).toBe('OPERADOR');
    expect(comp.papeisDisponiveis().map((p) => p.value)).toEqual(['ADMIN']);
  });

  it('salvarPapel exibe a mensagem do backend em caso de erro e mantém o papel', () => {
    const { comp } = criar('a1');
    vi.spyOn(usuarioService, 'alterarPapel').mockReturnValue(
      throwError(() => ({ status: 403, error: { message: 'Acesso negado: permissão insuficiente para este recurso' } })),
    );
    const snack = vi.spyOn((comp as any).snackBar, 'open');

    comp.salvarPapel();

    expect(snack).toHaveBeenCalledWith(
      'Acesso negado: permissão insuficiente para este recurso',
      'Fechar',
      expect.any(Object),
    );
    expect(comp.usuario()?.papel).toBe('ADMIN');
    expect(comp.salvando()).toBe(false);
  });

  it('enviar o formulário (submit) chama alterarPapel sem recarregar a página', () => {
    const { fixture } = criar('a1');
    const alterar = vi.spyOn(usuarioService, 'alterarPapel').mockReturnValue(of({ ...admin, papel: 'OPERADOR' }));

    const form: HTMLFormElement = fixture.nativeElement.querySelector('form[aria-label="Alterar papel"]');
    const evento = new Event('submit', { cancelable: true });
    form.dispatchEvent(evento);

    expect(evento.defaultPrevented).toBe(true);
    expect(alterar).toHaveBeenCalledWith('a1', { papel: 'OPERADOR' });
  });
});
