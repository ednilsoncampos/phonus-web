import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';
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
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'usuarios',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ROOT', 'ROOT', 'ADMIN'] },
        loadComponent: () =>
          import('./features/usuarios/usuarios-list/usuarios-list.component').then(
            (m) => m.UsuariosListComponent,
          ),
      },
      {
        path: 'usuarios/:id',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ROOT', 'ROOT', 'ADMIN'] },
        loadComponent: () =>
          import('./features/usuarios/usuario-detail/usuario-detail.component').then(
            (m) => m.UsuarioDetailComponent,
          ),
      },
      {
        path: 'produtos',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ROOT', 'ROOT', 'ADMIN'] },
        loadComponent: () =>
          import('./features/produtos/produtos-list/produtos-list.component').then(
            (m) => m.ProdutosListComponent,
          ),
      },
      {
        path: 'produtos/novo',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ROOT', 'ROOT', 'ADMIN'] },
        loadComponent: () =>
          import('./features/produtos/produto-form/produto-form.component').then(
            (m) => m.ProdutoFormComponent,
          ),
      },
      {
        path: 'produtos/:id',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ROOT', 'ROOT', 'ADMIN'] },
        loadComponent: () =>
          import('./features/produtos/produto-detail/produto-detail.component').then(
            (m) => m.ProdutoDetailComponent,
          ),
      },
      {
        path: 'produtos/:id/editar',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ROOT', 'ROOT', 'ADMIN'] },
        loadComponent: () =>
          import('./features/produtos/produto-form/produto-form.component').then(
            (m) => m.ProdutoFormComponent,
          ),
      },
      {
        path: 'estoque',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ROOT', 'ROOT', 'ADMIN'] },
        loadComponent: () =>
          import('./features/estoque/estoque-list/estoque-list.component').then(
            (m) => m.EstoqueListComponent,
          ),
      },
      {
        path: 'categorias/produto',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ROOT', 'ROOT', 'ADMIN'] },
        loadComponent: () =>
          import('./features/categorias/categorias-produto/categorias-produto.component').then(
            (m) => m.CategoriasProdutoComponent,
          ),
      },
      {
        path: 'categorias/lancamento',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ROOT', 'ROOT', 'ADMIN'] },
        loadComponent: () =>
          import('./features/categorias/categorias-lancamento/categorias-lancamento.component').then(
            (m) => m.CategoriasLancamentoComponent,
          ),
      },
      {
        path: 'clientes',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ROOT', 'ROOT', 'ADMIN'] },
        loadComponent: () =>
          import('./features/clientes/clientes-list/clientes-list.component').then(
            (m) => m.ClientesListComponent,
          ),
      },
      {
        path: 'fornecedores',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ROOT', 'ROOT', 'ADMIN'] },
        loadComponent: () =>
          import('./features/fornecedores/fornecedores-list/fornecedores-list.component').then(
            (m) => m.FornecedoresListComponent,
          ),
      },
      {
        path: 'termos',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ROOT', 'ROOT'] },
        loadComponent: () =>
          import('./features/termos/termos-list/termos-list.component').then(
            (m) => m.TermosListComponent,
          ),
      },
      {
        path: 'relatorios/margem',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ROOT', 'ROOT', 'ADMIN'] },
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
