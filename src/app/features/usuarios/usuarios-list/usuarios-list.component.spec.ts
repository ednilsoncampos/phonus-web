import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { of, throwError } from 'rxjs';
import { UsuariosListComponent } from './usuarios-list.component';
import { UsuarioService } from '../../../core/services/usuario.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Papel, Usuario } from '../../../core/models/usuario.model';

const mockUsuario: Usuario = { id: 'u1', nome: 'João', email: 'j@j.com', papel: 'ADMIN', ativo: true };

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
    vi.spyOn(authService, 'currentUser').mockReturnValue({ id: 'me', nome: 'Eu', email: 'eu@e.com', papel: 'ROOT', ativo: true });
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

  it('podeDesativar: ROOT pode desativar ADMIN e OPERADOR', () => {
    vi.spyOn(authService, 'papel').mockReturnValue('ROOT');
    vi.spyOn(authService, 'currentUser').mockReturnValue({ id: 'me', nome: 'Eu', email: 'eu@e.com', papel: 'ROOT', ativo: true });
    const fixture = TestBed.createComponent(UsuariosListComponent);
    const comp = fixture.componentInstance;
    expect(comp.podeDesativar({ ...mockUsuario, papel: 'ADMIN' })).toBe(true);
    expect(comp.podeDesativar({ ...mockUsuario, papel: 'OPERADOR' })).toBe(true);
  });

  it('podeDesativar: ADMIN só pode desativar OPERADOR', () => {
    vi.spyOn(authService, 'papel').mockReturnValue('ADMIN');
    vi.spyOn(authService, 'currentUser').mockReturnValue({ id: 'me', nome: 'Eu', email: 'eu@e.com', papel: 'ADMIN', ativo: true });
    const fixture = TestBed.createComponent(UsuariosListComponent);
    const comp = fixture.componentInstance;
    expect(comp.podeDesativar({ ...mockUsuario, papel: 'OPERADOR' })).toBe(true);
    expect(comp.podeDesativar({ ...mockUsuario, papel: 'ADMIN' })).toBe(false);
    expect(comp.podeDesativar({ ...mockUsuario, papel: 'ROOT' })).toBe(false);
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
