import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { SidebarComponent } from './sidebar.component';
import { AuthService } from '../../core/auth/auth.service';
import { Permissao } from '../../core/models/usuario.model';

describe('SidebarComponent — visibleItems', () => {
  let authService: AuthService;

  function setup(permissoes: Permissao[]) {
    TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    authService = TestBed.inject(AuthService);
    vi.spyOn(authService, 'permissoes').mockReturnValue(permissoes);
  }

  it('OPERADOR (sem CADASTROS_GERENCIAR/ESTOQUE_GERENCIAR/USUARIOS_GERENCIAR) vê Dashboard, Lançamentos e cadastros de leitura', () => {
    setup(['LANCAMENTOS_REGISTRAR', 'FINANCEIRO_CONSULTAR', 'CADASTROS_CONSULTAR', 'CONTA_PROPRIA']);

    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    const routes: string[] = component.visibleItems().map((i: { route: string }) => i.route);
    expect(routes).toEqual(
      expect.arrayContaining(['/dashboard', '/lancamentos', '/produtos', '/clientes', '/fornecedores', '/categorias/produto', '/categorias/lancamento']),
    );
    expect(routes).not.toContain('/estoque');
    expect(routes).not.toContain('/usuarios');
    expect(routes).not.toContain('/termos');
    expect(routes).not.toContain('/relatorios/margem');
  });

  it('ADMIN vê Dashboard e cadastros, mas não Termos', () => {
    setup([
      'LANCAMENTOS_REGISTRAR', 'FINANCEIRO_CONSULTAR', 'CADASTROS_CONSULTAR',
      'CADASTROS_GERENCIAR', 'ESTOQUE_GERENCIAR', 'USUARIOS_GERENCIAR', 'CONTA_PROPRIA',
    ]);

    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    const routes: string[] = component.visibleItems().map((i: { route: string }) => i.route);
    expect(routes).toContain('/dashboard');
    expect(routes).toContain('/produtos');
    expect(routes).not.toContain('/termos');
  });

  it('sem permissões nenhum item aparece', () => {
    setup([]);

    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    expect(component.visibleItems()).toHaveLength(0);
  });
});
