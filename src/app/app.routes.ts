import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { permissionGuard } from './core/auth/permission-guard';
import { ShellComponent } from './layout/shell/shell.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent,
      ),
  },
  {
    path: 'esqueceu-senha',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent,
      ),
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        canActivate: [permissionGuard],
        data: { permissao: 'FINANCEIRO_CONSULTAR' },
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'usuarios',
        canActivate: [permissionGuard],
        data: { permissao: 'USUARIOS_GERENCIAR' },
        loadComponent: () =>
          import('./features/usuarios/usuarios-list/usuarios-list.component').then(
            (m) => m.UsuariosListComponent,
          ),
      },
      {
        path: 'usuarios/:id',
        canActivate: [permissionGuard],
        data: { permissao: 'USUARIOS_GERENCIAR' },
        loadComponent: () =>
          import('./features/usuarios/usuario-detail/usuario-detail.component').then(
            (m) => m.UsuarioDetailComponent,
          ),
      },
      {
        path: 'produtos',
        canActivate: [permissionGuard],
        data: { permissao: 'CADASTROS_CONSULTAR' },
        loadComponent: () =>
          import('./features/produtos/produtos-list/produtos-list.component').then(
            (m) => m.ProdutosListComponent,
          ),
      },
      {
        path: 'produtos/novo',
        canActivate: [permissionGuard],
        data: { permissao: 'CADASTROS_GERENCIAR' },
        loadComponent: () =>
          import('./features/produtos/produto-form/produto-form.component').then(
            (m) => m.ProdutoFormComponent,
          ),
      },
      {
        path: 'produtos/:id',
        canActivate: [permissionGuard],
        data: { permissao: 'CADASTROS_CONSULTAR' },
        loadComponent: () =>
          import('./features/produtos/produto-detail/produto-detail.component').then(
            (m) => m.ProdutoDetailComponent,
          ),
      },
      {
        path: 'produtos/:id/editar',
        canActivate: [permissionGuard],
        data: { permissao: 'CADASTROS_GERENCIAR' },
        loadComponent: () =>
          import('./features/produtos/produto-form/produto-form.component').then(
            (m) => m.ProdutoFormComponent,
          ),
      },
      {
        path: 'estoque',
        canActivate: [permissionGuard],
        data: { permissao: 'ESTOQUE_GERENCIAR' },
        loadComponent: () =>
          import('./features/estoque/estoque-list/estoque-list.component').then(
            (m) => m.EstoqueListComponent,
          ),
      },
      {
        path: 'categorias/produto',
        canActivate: [permissionGuard],
        data: { permissao: 'CADASTROS_CONSULTAR' },
        loadComponent: () =>
          import('./features/categorias/categorias-produto/categorias-produto.component').then(
            (m) => m.CategoriasProdutoComponent,
          ),
      },
      {
        path: 'categorias/lancamento',
        canActivate: [permissionGuard],
        data: { permissao: 'CADASTROS_CONSULTAR' },
        loadComponent: () =>
          import('./features/categorias/categorias-lancamento/categorias-lancamento.component').then(
            (m) => m.CategoriasLancamentoComponent,
          ),
      },
      {
        path: 'clientes',
        canActivate: [permissionGuard],
        data: { permissao: 'CADASTROS_CONSULTAR' },
        loadComponent: () =>
          import('./features/clientes/clientes-list/clientes-list.component').then(
            (m) => m.ClientesListComponent,
          ),
      },
      {
        path: 'fornecedores',
        canActivate: [permissionGuard],
        data: { permissao: 'CADASTROS_CONSULTAR' },
        loadComponent: () =>
          import('./features/fornecedores/fornecedores-list/fornecedores-list.component').then(
            (m) => m.FornecedoresListComponent,
          ),
      },
      {
        path: 'termos',
        canActivate: [permissionGuard],
        data: { permissao: 'TERMOS_GERENCIAR' },
        loadComponent: () =>
          import('./features/termos/termos-list/termos-list.component').then(
            (m) => m.TermosListComponent,
          ),
      },
      {
        path: 'lancamentos',
        canActivate: [permissionGuard],
        data: { permissao: 'FINANCEIRO_CONSULTAR' },
        loadComponent: () =>
          import('./features/lancamentos/lancamentos-list/lancamentos-list.component').then(
            (m) => m.LancamentosListComponent,
          ),
      },
      {
        path: 'lancamentos/novo',
        canActivate: [permissionGuard],
        data: { permissao: 'LANCAMENTOS_REGISTRAR' },
        loadComponent: () =>
          import('./features/lancamentos/lancamento-form/lancamento-form.component').then(
            (m) => m.LancamentoFormComponent,
          ),
      },
      {
        path: 'lancamentos/:id',
        canActivate: [permissionGuard],
        data: { permissao: 'FINANCEIRO_CONSULTAR' },
        loadComponent: () =>
          import('./features/lancamentos/lancamento-detail/lancamento-detail').then(
            (m) => m.LancamentoDetail,
          ),
      },
      {
        path: 'relatorios/margem',
        canActivate: [permissionGuard],
        data: { permissao: 'ESTOQUE_GERENCIAR' },
        loadComponent: () =>
          import('./features/relatorios/margem/margem.component').then(
            (m) => m.MargemComponent,
          ),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  {
    path: '403',
    loadComponent: () =>
      import('./features/errors/forbidden/forbidden.component').then(
        (m) => m.ForbiddenComponent,
      ),
  },
  {
    path: '404',
    loadComponent: () =>
      import('./features/errors/not-found/not-found.component').then(
        (m) => m.NotFoundComponent,
      ),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/errors/not-found/not-found.component').then(
        (m) => m.NotFoundComponent,
      ),
  },
];
