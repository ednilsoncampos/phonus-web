import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { of, throwError } from 'rxjs';
import { UsuariosListComponent } from './usuarios-list.component';
import { UsuarioService } from '../../../core/services/usuario.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Papel, Usuario } from '../../../core/models/usuario.model';

const mockUsuario: Usuario = { id: 'u1', nome: 'João', email: 'j@j.com', papel: 'ADMIN', status: 'ATIVO' };

describe('UsuariosListComponent', () => {
  let usuarioService: UsuarioService;
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [UsuariosListComponent],
      providers: [provideRouter([]), provideAnimationsAsync()],
    });
    usuarioService = TestBed.inject(UsuarioService);
    authService = TestBed.inject(AuthService);

    vi.spyOn(usuarioService, 'listar').mockReturnValue(of([mockUsuario]));
    vi.spyOn(authService, 'hasRole').mockReturnValue(true);
    vi.spyOn(authService, 'hasPermissao').mockReturnValue(true);
  });

  it('papelLabel("ADMIN") retorna "Admin"', () => {
    const fixture = TestBed.createComponent(UsuariosListComponent);
    const comp = fixture.componentInstance;
    expect(comp.papelLabel('ADMIN')).toBe('Admin');
  });

  it('papelLabel("OPERADOR") retorna "Operador"', () => {
    const fixture = TestBed.createComponent(UsuariosListComponent);
    const comp = fixture.componentInstance;
    expect(comp.papelLabel('OPERADOR')).toBe('Operador');
  });

  it('papelLabel("ROOT") retorna "Root"', () => {
    const fixture = TestBed.createComponent(UsuariosListComponent);
    const comp = fixture.componentInstance;
    expect(comp.papelLabel('ROOT')).toBe('Root');
  });

  it('papelCss("ADMIN") retorna "badge badge--blue"', () => {
    const fixture = TestBed.createComponent(UsuariosListComponent);
    const comp = fixture.componentInstance;
    expect(comp.papelCss('ADMIN')).toBe('badge badge--blue');
  });

  it('podeDesativar retorna false para SUPER_ROOT, mesmo visto pelo ROOT', () => {
    vi.spyOn(authService, 'papel').mockReturnValue('ROOT');
    vi.spyOn(authService, 'currentUser').mockReturnValue({ id: 'me', nome: 'Eu', email: 'eu@e.com', papel: 'ROOT', status: 'ATIVO' });
    const fixture = TestBed.createComponent(UsuariosListComponent);
    const comp = fixture.componentInstance;
    const superRoot: Usuario = { ...mockUsuario, papel: 'SUPER_ROOT' };
    expect(comp.podeDesativar(superRoot)).toBe(false);
  });

  it('podeDesativar retorna false para o próprio usuário logado', () => {
    vi.spyOn(authService, 'papel').mockReturnValue('ROOT');
    vi.spyOn(authService, 'currentUser').mockReturnValue({ ...mockUsuario, id: 'me', papel: 'ROOT' });
    const fixture = TestBed.createComponent(UsuariosListComponent);
    const comp = fixture.componentInstance;
    expect(comp.podeDesativar({ ...mockUsuario, id: 'me', papel: 'ROOT' })).toBe(false);
  });

  it('podeDesativar retorna false para usuário que já está INATIVO ou CONVIDADO', () => {
    vi.spyOn(authService, 'papel').mockReturnValue('ROOT');
    vi.spyOn(authService, 'currentUser').mockReturnValue({ id: 'me', nome: 'Eu', email: 'eu@e.com', papel: 'ROOT', status: 'ATIVO' });
    const fixture = TestBed.createComponent(UsuariosListComponent);
    const comp = fixture.componentInstance;
    expect(comp.podeDesativar({ ...mockUsuario, status: 'INATIVO' })).toBe(false);
    expect(comp.podeDesativar({ ...mockUsuario, status: 'CONVIDADO' })).toBe(false);
  });

  it('podeDesativar: ROOT pode desativar ADMIN e OPERADOR', () => {
    vi.spyOn(authService, 'papel').mockReturnValue('ROOT');
    vi.spyOn(authService, 'currentUser').mockReturnValue({ id: 'me', nome: 'Eu', email: 'eu@e.com', papel: 'ROOT', status: 'ATIVO' });
    const fixture = TestBed.createComponent(UsuariosListComponent);
    const comp = fixture.componentInstance;
    expect(comp.podeDesativar({ ...mockUsuario, papel: 'ADMIN' })).toBe(true);
    expect(comp.podeDesativar({ ...mockUsuario, papel: 'OPERADOR' })).toBe(true);
  });

  it('podeDesativar: ROOT não pode desativar outro ROOT (backend exige papel inferior)', () => {
    vi.spyOn(authService, 'papel').mockReturnValue('ROOT');
    vi.spyOn(authService, 'currentUser').mockReturnValue({ id: 'me', nome: 'Eu', email: 'eu@e.com', papel: 'ROOT', status: 'ATIVO' });
    const fixture = TestBed.createComponent(UsuariosListComponent);
    const comp = fixture.componentInstance;
    expect(comp.podeDesativar({ ...mockUsuario, papel: 'ROOT' })).toBe(false);
    expect(comp.podeReativar({ ...mockUsuario, papel: 'ROOT', status: 'INATIVO' })).toBe(false);
  });

  it('confirmarDesativar exibe a mensagem do backend quando falha', () => {
    const fixture = TestBed.createComponent(UsuariosListComponent);
    const comp = fixture.componentInstance;
    vi.spyOn((comp as any).dialog, 'open').mockReturnValue({ afterClosed: () => of(true) } as any);
    vi.spyOn(usuarioService, 'desativar').mockReturnValue(
      throwError(() => ({ status: 403, error: { message: 'Só é permitido desativar usuários com papel inferior ao seu' } })),
    );
    const snack = vi.spyOn((comp as any).snackBar, 'open');

    comp.confirmarDesativar(mockUsuario);

    expect(snack).toHaveBeenCalledWith(
      'Só é permitido desativar usuários com papel inferior ao seu',
      'Fechar',
      expect.any(Object),
    );
  });

  it('confirmarReativar exibe a mensagem do backend para qualquer status de erro', () => {
    const fixture = TestBed.createComponent(UsuariosListComponent);
    const comp = fixture.componentInstance;
    vi.spyOn((comp as any).dialog, 'open').mockReturnValue({ afterClosed: () => of(true) } as any);
    vi.spyOn(usuarioService, 'reativar').mockReturnValue(
      throwError(() => ({ status: 404, error: { message: 'Usuário não encontrado' } })),
    );
    const snack = vi.spyOn((comp as any).snackBar, 'open');

    comp.confirmarReativar({ ...mockUsuario, status: 'INATIVO' });

    expect(snack).toHaveBeenCalledWith('Usuário não encontrado', 'Fechar', expect.any(Object));
  });

  it('podeDesativar: ADMIN só pode desativar OPERADOR', () => {
    vi.spyOn(authService, 'papel').mockReturnValue('ADMIN');
    vi.spyOn(authService, 'currentUser').mockReturnValue({ id: 'me', nome: 'Eu', email: 'eu@e.com', papel: 'ADMIN', status: 'ATIVO' });
    const fixture = TestBed.createComponent(UsuariosListComponent);
    const comp = fixture.componentInstance;
    expect(comp.podeDesativar({ ...mockUsuario, papel: 'OPERADOR' })).toBe(true);
    expect(comp.podeDesativar({ ...mockUsuario, papel: 'ADMIN' })).toBe(false);
    expect(comp.podeDesativar({ ...mockUsuario, papel: 'ROOT' })).toBe(false);
  });

  it('podeReativar retorna true só para status INATIVO, respeitando a hierarquia', () => {
    vi.spyOn(authService, 'papel').mockReturnValue('ROOT');
    vi.spyOn(authService, 'currentUser').mockReturnValue({ id: 'me', nome: 'Eu', email: 'eu@e.com', papel: 'ROOT', status: 'ATIVO' });
    const fixture = TestBed.createComponent(UsuariosListComponent);
    const comp = fixture.componentInstance;

    expect(comp.podeReativar({ ...mockUsuario, papel: 'OPERADOR', status: 'INATIVO' })).toBe(true);
    expect(comp.podeReativar({ ...mockUsuario, papel: 'OPERADOR', status: 'ATIVO' })).toBe(false);
    expect(comp.podeReativar({ ...mockUsuario, papel: 'OPERADOR', status: 'CONVIDADO' })).toBe(false);
  });

  it('podeReativar retorna false para SUPER_ROOT mesmo INATIVO', () => {
    vi.spyOn(authService, 'papel').mockReturnValue('ROOT');
    vi.spyOn(authService, 'currentUser').mockReturnValue({ id: 'me', nome: 'Eu', email: 'eu@e.com', papel: 'ROOT', status: 'ATIVO' });
    const fixture = TestBed.createComponent(UsuariosListComponent);
    const comp = fixture.componentInstance;

    expect(comp.podeReativar({ ...mockUsuario, papel: 'SUPER_ROOT', status: 'INATIVO' })).toBe(false);
  });

  it('podeReativar: ADMIN não pode reativar outro ADMIN inativo', () => {
    vi.spyOn(authService, 'papel').mockReturnValue('ADMIN');
    vi.spyOn(authService, 'currentUser').mockReturnValue({ id: 'me', nome: 'Eu', email: 'eu@e.com', papel: 'ADMIN', status: 'ATIVO' });
    const fixture = TestBed.createComponent(UsuariosListComponent);
    const comp = fixture.componentInstance;

    expect(comp.podeReativar({ ...mockUsuario, papel: 'ADMIN', status: 'INATIVO' })).toBe(false);
    expect(comp.podeReativar({ ...mockUsuario, papel: 'OPERADOR', status: 'INATIVO' })).toBe(true);
  });

  it('podeReenviarConvite retorna true só para status CONVIDADO', () => {
    const fixture = TestBed.createComponent(UsuariosListComponent);
    const comp = fixture.componentInstance;

    expect(comp.podeReenviarConvite({ ...mockUsuario, status: 'CONVIDADO' })).toBe(true);
    expect(comp.podeReenviarConvite({ ...mockUsuario, status: 'INATIVO' })).toBe(false);
    expect(comp.podeReenviarConvite({ ...mockUsuario, status: 'ATIVO' })).toBe(false);
  });

  it('confirmarReativar chama usuarioService.reativar e atualiza o status para ATIVO', () => {
    const dialogRefMock = { afterClosed: () => of(true) };
    const fixture = TestBed.createComponent(UsuariosListComponent);
    const comp = fixture.componentInstance;
    comp.usuarios.set([{ ...mockUsuario, status: 'INATIVO' }]);

    vi.spyOn((comp as any).dialog, 'open').mockReturnValue(dialogRefMock as any);
    vi.spyOn(usuarioService, 'reativar').mockReturnValue(of(undefined));

    comp.confirmarReativar({ ...mockUsuario, status: 'INATIVO' });

    expect(usuarioService.reativar).toHaveBeenCalledWith(mockUsuario.id);
    expect(comp.usuarios()[0].status).toBe('ATIVO');
  });

  it('carregar preenche usuarios', () => {
    const fixture = TestBed.createComponent(UsuariosListComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(usuarioService.listar).toHaveBeenCalled();
    expect(comp.usuarios()).toEqual([mockUsuario]);
  });

  it('carregar define erro quando a requisição falha', () => {
    vi.spyOn(usuarioService, 'listar').mockReturnValue(
      throwError(() => new Error('falha')),
    );
    const fixture = TestBed.createComponent(UsuariosListComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(comp.erro()).toBe('Não foi possível carregar os usuários.');
  });
});
