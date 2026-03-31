# Arquitetura — Phonus Web (Angular)

**Criado em:** 2026-03-28
**Framework:** Angular 18+ com standalone components
**Design System:** Angular Material 18

---

## Scaffold inicial

```bash
npm install -g @angular/cli
ng new phonus-web --routing --style=scss --standalone
cd phonus-web
ng add @angular/material   # escolher tema custom
```

Configurações recomendadas no `ng new`:
- Routing: **yes**
- Style: **SCSS**
- SSR: **no** (painel admin não precisa de SSR)

---

## Estrutura de pastas

```
src/
  app/
    core/                          # singleton — importado apenas em AppModule/AppComponent
      auth/
        auth.service.ts            # login, logout, refresh, perfil
        auth.guard.ts              # redireciona para /login se não autenticado
        role.guard.ts              # redireciona se papel insuficiente
        jwt.interceptor.ts         # adiciona Authorization: Bearer em toda requisição
        token-refresh.interceptor.ts  # intercepta 401 → tenta refresh → retry
        token.service.ts           # get/set/remove tokens (localStorage ou cookie)
      api/
        api.service.ts             # HttpClient wrapper com baseUrl e error handling
      models/                      # interfaces TypeScript — espelham os DTOs do backend
        usuario.model.ts
        produto.model.ts
        lancamento.model.ts
        parcela.model.ts
        conta.model.ts
        estoque.model.ts
        dashboard.model.ts
        relatorio.model.ts
        # etc.
      services/
        usuario.service.ts
        produto.service.ts
        categoria-produto.service.ts
        categoria-lancamento.service.ts
        cliente.service.ts
        fornecedor.service.ts
        estoque.service.ts
        termos.service.ts
        relatorio.service.ts
        dashboard.service.ts
    shared/                        # componentes/pipes/diretivas reutilizáveis
      components/
        confirm-dialog/
        currency-display/
        status-badge/
        page-header/
        empty-state/
        loading-spinner/
      pipes/
        currency-brl.pipe.ts       # formata centavos → R$ 1.234,56
        date-br.pipe.ts            # formata yyyy-MM-dd → dd/MM/yyyy
    layout/
      shell/
        shell.component.ts         # topbar + sidebar + <router-outlet>
      sidebar/
        sidebar.component.ts       # nav links filtrados por papel
      topbar/
        topbar.component.ts        # nome do usuário + logout
    features/
      auth/
        login/
        forgot-password/
        change-password/
      dashboard/
      usuarios/
        usuarios-list/
        usuario-detail/
        convidar-usuario-dialog/
      produtos/
        produtos-list/
        produto-form/
        produto-detail/
      estoque/
        estoque-list/
        ajuste-estoque-dialog/
      categorias/
        categorias-produto/
        categorias-lancamento/
      clientes/
        clientes-list/
        cliente-form/
      fornecedores/
        fornecedores-list/
        fornecedor-form/
      termos/
        termos-list/
        termos-form/
      relatorios/
        margem/
  environments/
    environment.ts                 # dev: http://localhost:8080/api/v1
    environment.staging.ts
    environment.prod.ts
  styles/
    _variables.scss                # paleta Phonus
    _material-theme.scss           # tema Angular Material
  styles.scss
```

---

## Roteamento

```typescript
// app.routes.ts
export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'esqueceu-senha', component: ForgotPasswordComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      {
        path: 'usuarios',
        canActivate: [RoleGuard],
        data: { roles: ['SUPER_ROOT', 'ROOT', 'ADMIN'] },
        children: [
          { path: '', component: UsuariosListComponent },
          { path: ':id', component: UsuarioDetailComponent },
        ]
      },
      { path: 'produtos', loadChildren: () => import('./features/produtos/produtos.routes') },
      { path: 'estoque', loadChildren: () => import('./features/estoque/estoque.routes') },
      { path: 'categorias', loadChildren: () => import('./features/categorias/categorias.routes') },
      { path: 'clientes', loadChildren: () => import('./features/clientes/clientes.routes') },
      { path: 'fornecedores', loadChildren: () => import('./features/fornecedores/fornecedores.routes') },
      {
        path: 'termos',
        canActivate: [RoleGuard],
        data: { roles: ['SUPER_ROOT', 'ROOT'] },
        component: TermosListComponent
      },
      {
        path: 'relatorios/margem',
        canActivate: [RoleGuard],
        data: { roles: ['SUPER_ROOT', 'ROOT', 'ADMIN'] },
        component: RelatorioMargemComponent
      },
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
```

---

## AuthGuard e RoleGuard

```typescript
// auth.guard.ts
export const AuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn() ? true : router.createUrlTree(['/login']);
};

// role.guard.ts
export const RoleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const roles: string[] = route.data['roles'] ?? [];
  const papel = auth.currentUser()?.papel;
  return roles.includes(papel ?? '') ? true : router.createUrlTree(['/dashboard']);
};
```

---

## Interceptors

### JwtInterceptor

```typescript
// jwt.interceptor.ts
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(TokenService).getAccessToken();
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
```

### TokenRefreshInterceptor

```typescript
// token-refresh.interceptor.ts
// Intercepta 401 → chama POST /auth/refresh → repete a requisição original
// Se refresh falhar → logout → navega para /login
export const tokenRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/')) {
        return inject(AuthService).refresh().pipe(
          switchMap(() => next(req.clone({
            setHeaders: { Authorization: `Bearer ${inject(TokenService).getAccessToken()}` }
          }))),
          catchError(() => {
            inject(AuthService).logout();
            return throwError(() => error);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
```

---

## AuthService

```typescript
// auth.service.ts
@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<Usuario | null>(null);

  currentUser = this._user.asReadonly();
  isLoggedIn = computed(() => this._user() !== null);

  login(email: string, senha: string): Observable<void> {
    return this.http.post<AuthResponse>('/auth/login', { email, senha }).pipe(
      tap(res => {
        this.tokenService.save(res.accessToken, res.refreshToken);
        // carrega perfil do usuário
      }),
      switchMap(() => this.loadMe())
    );
  }

  loadMe(): Observable<void> {
    return this.http.get<Usuario>('/auth/me').pipe(
      tap(user => this._user.set(user))
    );
  }

  refresh(): Observable<void> { /* POST /auth/refresh */ }
  logout(): void { /* limpa tokens + _user + navega para /login */ }
}
```

---

## Tema Angular Material (paleta Phonus)

```scss
// _material-theme.scss
@use '@angular/material' as mat;

$phonus-primary: mat.define-palette((
  50:  #e8f8ef,
  100: #d1fadf,
  200: #a3f5bf,
  300: #6deba0,
  400: #3dd97e,
  500: #16b364,   // PhonusPrimary
  600: #0e9550,
  700: #077a3e,
  800: #065f46,   // PhonusPrimaryDark
  900: #044030,
  contrast: (
    500: white,
    600: white,
    700: white,
    800: white,
  )
), 500, 800, 100);

$phonus-warn: mat.define-palette(mat.$red-palette, 600);  // #F04438

$phonus-theme: mat.define-light-theme((
  color: (
    primary: $phonus-primary,
    accent:  $phonus-primary,
    warn:    $phonus-warn,
  ),
  typography: mat.define-typography-config(),
  density: 0
));

@include mat.all-component-themes($phonus-theme);

// Variáveis globais
:root {
  --phonus-primary:      #16B364;
  --phonus-primary-light:#D1FADF;
  --phonus-primary-dark: #065F46;
  --phonus-background:   #F7F9FC;
  --phonus-surface:      #FFFFFF;
  --phonus-border:       #E4E7EC;
  --phonus-text:         #101828;
  --phonus-text-secondary: #667085;
  --phonus-entrada:      #16B364;
  --phonus-saida:        #F04438;
}

body {
  background-color: var(--phonus-background);
}
```

---

## Modelos TypeScript (interfaces)

Espelham os DTOs do backend. Todos os campos `Long` (centavos) chegam como `number` no TypeScript.

```typescript
// usuario.model.ts
export type Papel = 'SUPER_ROOT' | 'ROOT' | 'ADMIN' | 'OPERADOR';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  ativo: boolean;
  createdAt?: string;
}

// produto.model.ts
export interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  categoriaId?: string;
  precoVenda: number;       // centavos
  precoCusto?: number;      // centavos
  quantidadeEstoque: number;
  estoqueMinimo: number;
  abaixoDoMinimo: boolean;
  unidadeMedida: string;
  codigoBarras?: string;
  ncm?: string;
  cest?: string;
  ativo: boolean;
  criadoPor?: string;
  createdAt?: string;
  updatedAt?: string;
}

// estoque.model.ts
export type OrigemMovimentacao = 'VENDA' | 'COMPRA' | 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO';

export interface MovimentacaoEstoque {
  id: string;
  produtoId: string;
  tipo: OrigemMovimentacao;
  quantidade: number;
  origem: OrigemMovimentacao;
  lancamentoItemId?: string;
  observacao?: string;
  criadoPor?: string;
  createdAt?: string;
}

// dashboard.model.ts
export interface DashboardData {
  saldoCaixa: number;
  totalAReceber: number;
  totalAPagar: number;
  produtosAbaixoDoMinimo: number;
  contasVencidas: number;
}
```

---

## Pipe utilitário — centavos para BRL

```typescript
// currency-brl.pipe.ts
@Pipe({ name: 'currencyBrl', standalone: true })
export class CurrencyBrlPipe implements PipeTransform {
  transform(centavos: number): string {
    return (centavos / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }
}

// uso no template:
// {{ produto.precoVenda | currencyBrl }}   →  R$ 12,50
```

---

## Padrão de serviço HTTP

```typescript
// produto.service.ts
@Injectable({ providedIn: 'root' })
export class ProdutoService {
  private api = inject(ApiService);

  listar(params?: { categoriaId?: string; ativos?: boolean; abaixoDoMinimo?: boolean }) {
    return this.api.get<Produto[]>('/produtos', params);
  }
  buscar(id: string)           { return this.api.get<Produto>(`/produtos/${id}`); }
  criar(body: CriarProdutoDto) { return this.api.post<Produto>('/produtos', body); }
  atualizar(id: string, body: AtualizarProdutoDto) {
    return this.api.put<Produto>(`/produtos/${id}`, body);
  }
  desativar(id: string)        { return this.api.patch<void>(`/produtos/${id}/desativar`); }
}
```

---

## Padrão de componente CRUD (lista)

```typescript
// produtos-list.component.ts
@Component({
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatChipsModule, RouterLink, CurrencyBrlPipe, ...],
  template: `...`
})
export class ProdutosListComponent {
  private service = inject(ProdutoService);

  produtos = signal<Produto[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);

  filtroAtivos = signal(true);
  filtroAbaixoDoMinimo = signal(false);

  ngOnInit() { this.carregar(); }

  carregar() {
    this.isLoading.set(true);
    this.service.listar({
      ativos: this.filtroAtivos(),
      abaixoDoMinimo: this.filtroAbaixoDoMinimo()
    }).subscribe({
      next: (data) => { this.produtos.set(data); this.isLoading.set(false); },
      error: (err)  => { this.error.set(err.message); this.isLoading.set(false); }
    });
  }
}
```

---

## Checklist de setup inicial

```
[ ] ng new phonus-web --routing --style=scss --standalone
[ ] ng add @angular/material
[ ] Configurar _material-theme.scss com paleta Phonus
[ ] Criar environments (dev, staging, prod) com BASE_URL
[ ] Implementar TokenService (localStorage)
[ ] Implementar AuthService com signal()
[ ] Implementar JwtInterceptor + TokenRefreshInterceptor
[ ] Implementar AuthGuard + RoleGuard
[ ] Implementar ShellComponent (topbar + sidebar + router-outlet)
[ ] Implementar ApiService (wrapper HttpClient + error handling)
[ ] Criar modelos TypeScript (interfaces)
[ ] Implementar CurrencyBrlPipe + DateBrPipe
[ ] Configurar rotas principais com lazy loading
```
