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

  it('podeDesativar retorna false para SUPER_ROOT', () => {
    const fixture = TestBed.createComponent(UsuariosListComponent);
    const comp = fixture.componentInstance;
    const superRoot: Usuario = { ...mockUsuario, papel: 'SUPER_ROOT' };
    expect(comp.podeDesativar(superRoot)).toBe(false);
  });

  it('podeDesativar retorna true para outros papéis', () => {
    const fixture = TestBed.createComponent(UsuariosListComponent);
    const comp = fixture.componentInstance;
    expect(comp.podeDesativar(mockUsuario)).toBe(true);
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
