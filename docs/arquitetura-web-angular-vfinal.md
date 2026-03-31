# Arquitetura Web — Phonus (Angular 21) — Versão Final

**Criado em:** 2026-03-30
**Versão Angular:** 21.2.5
**Contrato de referência:** `docs/swagger-phonus-api-v1.yaml`
**Backend:** Kotlin/Spring Boot — DigitalOcean
**Deploy:** Vercel (SPA)

---

## 1. Contexto do Produto

O Phonus é um SaaS de gestão empresarial **multi-tenant** (schema-per-tenant no PostgreSQL). Cada empresa possui schema isolado no banco.

### Divisão por plataforma

| Plataforma | Foco | Quem usa |
|---|---|---|
| **Mobile (Android)** | Operação diária: lançamentos, caixa, parcelas, estoque | Todos os papéis |
| **Web Admin (Angular)** | Administração: cadastros, usuários, relatórios | ROOT, ADMIN (OPERADOR excluído) |
| **Backend (Kotlin)** | Regras de negócio, multi-tenant, API REST | — |

> O painel web **não possui** lançamentos por voz, baixa de parcelas, nem operação de caixa. Essas funções pertencem ao mobile.

---

## 2. Stack Decidida

| Camada | Tecnologia | Observação |
|---|---|---|
| Framework | Angular 21.2.5 | Standalone components (padrão v20+) |
| Design System | Angular Material 21 | Tema customizado Phonus |
| Linguagem | TypeScript (strict) | |
| Estado local | `signal()`, `computed()` | Sem NgRx |
| Estado assíncrono | `BehaviorSubject` + `async pipe` | Para streams de serviços |
| Formulários | Reactive Forms (`FormBuilder`) | Sem template-driven |
| Roteamento | Angular Router + guards funcionais | `AuthGuard`, `RoleGuard` |
| HTTP | `HttpClient` + `HttpInterceptorFn` | JWT + refresh automático |
| Estilo | SCSS | |
| Imagens estáticas | `NgOptimizedImage` | |
| Deploy | Vercel (SPA) | CI/CD automático via `git push` |

### Padrões obrigatórios (CLAUDE.md)

- **Não** declarar `standalone: true` nos decorators (padrão no Angular 21)
- **Não** usar `@HostBinding` / `@HostListener` — usar objeto `host:` no decorator
- **Não** usar `ngClass` / `ngStyle` — usar bindings `[class]` / `[style]`
- **Não** usar `mutate()` em signals — usar `update()` ou `set()`
- Usar `input()` e `output()` em vez de `@Input()` / `@Output()`
- Usar `inject()` em vez de constructor injection
- Usar `@if`, `@for`, `@switch` (native control flow)
- `ChangeDetectionStrategy.OnPush` em todos os componentes

---

## 3. Perfis de Acesso

| Papel | Acessa o painel web? | Permissões |
|---|---|---|
| `SUPER_ROOT` | Sim | Irrestrito |
| `ROOT` | Sim | Tudo exceto gerenciar `SUPER_ROOT` |
| `ADMIN` | Sim | Cadastros + convidar `OPERADOR` |
| `OPERADOR` | **Não** | Sem acesso |

> O JWT contém `{ userId, empresaId, papel }`. O backend deriva o schema do tenant a partir do `empresaId` sem consulta adicional ao banco.

---

## 4. Módulos do Painel Web

### Módulo 0 — Dashboard *(todos os papéis)*

**Endpoint:** `GET /dashboard`

**Response — `DashboardResponse`:**
```
saldoCaixa (centavos), totalAReceber (centavos),
totalAPagar (centavos), produtosAbaixoDoMinimo (int),
contasVencidas (int)
```

**Layout:**
- Cards KPI: Saldo de Caixa · A Receber · A Pagar · Produtos críticos · Contas vencidas
- Card "Produtos abaixo do mínimo" → navega para `/produtos?abaixoDoMinimo=true`
- Card "Contas vencidas" → navega para `/contas/receber` com filtro de vencidas
- Atalhos rápidos filtrados por papel:
  - ROOT/ADMIN: "Convidar usuário", "Novo produto", "Ajustar estoque"

---

### Módulo 1 — Autenticação

| # | Tela | Método | Endpoint | Notas |
|---|---|---|---|---|
| 1.1 | Login | POST | `/auth/login` | Salva `accessToken` + `refreshToken` |
| 1.2 | Refresh automático | POST | `/auth/refresh` | Interceptor — transparente ao usuário |
| 1.3 | Alterar senha | PUT | `/auth/senha` | `{ senhaAtual, novaSenha }` — tratar 422 |
| 1.4 | Esqueceu a senha | POST | `/auth/esqueceu-senha` | `{ email }` — exibir retorno da API |
| 1.5 | Perfil atual | GET | `/auth/me` | Carregado no bootstrap da sessão |

**`AuthResponse`:** `{ accessToken, refreshToken }`
**`UsuarioResponse`:** `{ id, nome, email, papel, cidade, estado, createdAt }`

---

### Módulo 2 — Gestão de Usuários *(ROOT / ADMIN)*

| # | Tela | Método | Endpoint | Notas |
|---|---|---|---|---|
| 2.1 | Lista de usuários | GET | `/usuarios` | Array (sem paginação) — papel + status ativo |
| 2.2 | Detalhe do usuário | GET | `/usuarios/{id}` | Inclui atalho para entitlement |
| 2.3 | Convidar usuário | POST | `/usuarios` | ROOT → ADMIN ou OPERADOR; ADMIN → só OPERADOR |
| 2.4 | Alterar papel | PATCH | `/usuarios/{id}/papel` | Apenas ROOT; não permite SUPER_ROOT |
| 2.5 | Desativar usuário | DELETE | `/usuarios/{id}` | Confirmar antes — não pode desativar SUPER_ROOT |
| 2.6 | Entitlement | GET | `/usuarios/{usuarioId}/entitlement` | Atalho no detalhe do usuário |

**Request — Convidar (`POST /usuarios`):**
```json
{ "email": "string", "nome": "string", "papel": "ADMIN | OPERADOR" }
```

**`UsuarioResponse`:** `{ id, nome, email, papel, ativo, createdAt }`

**`EntitlementResponse`:** `{ usuarioId, isPremium, tier, planoAtual, expiraEm, diasCortesiaRestantes }`

---

### Módulo 3 — Cadastro de Produtos *(ROOT / ADMIN)*

| # | Tela | Método | Endpoint | Notas |
|---|---|---|---|---|
| 3.1 | Lista de produtos | GET | `/produtos?page=0&size=20` | Paginado — filtros: categoria, ativo, abaixoDoMinimo |
| 3.2 | Detalhe do produto | GET | `/produtos/{id}` | Inclui atalho para histórico de estoque |
| 3.3 | Criar produto | POST | `/produtos` | |
| 3.4 | Editar produto | PUT | `/produtos/{id}` | |
| 3.5 | Desativar produto | PATCH | `/produtos/{id}/desativar` | Não remove do banco |

**Request — Criar (`POST /produtos`):**
```json
{
  "nome": "string (max 255, required)",
  "descricao": "string",
  "categoriaId": "uuid",
  "precoVenda": "int64 centavos (required)",
  "precoCusto": "int64 centavos",
  "estoqueMinimo": "number (required)",
  "unidadeMedida": "UN | KG | L | M | M2 | CX | PCT (required)",
  "codigoBarras": "string (max 100)",
  "ncm": "string (max 8)",
  "cest": "string (max 7)"
}
```

**Filtros da listagem:**
- `categoriaId` (uuid)
- `ativos` (boolean, default: `true`)
- `abaixoDoMinimo` (boolean, default: `false`)

---

### Módulo 4 — Controle de Estoque *(ROOT / ADMIN)*

| # | Tela | Método | Endpoint | Notas |
|---|---|---|---|---|
| 4.1 | Histórico geral | GET | `/estoque/movimentacoes?page=0&size=20` | Paginado — filtros: produto, período, origem |
| 4.2 | Histórico por produto | GET | `/estoque/movimentacoes/produto/{id}?page=0&size=20` | Paginado — acessível via detalhe do produto |
| 4.3 | Ajuste manual | POST | `/estoque/ajuste?produtoId={id}` | Positivo ou negativo |

**Request — Ajuste (`POST /estoque/ajuste?produtoId={id}`):**
```json
{
  "tipo": "AJUSTE_POSITIVO | AJUSTE_NEGATIVO",
  "quantidade": "number (min: 0.001)",
  "observacao": "string"
}
```

**Filtros do histórico:**
- `produtoId` (uuid)
- `dataInicio` / `dataFim` (yyyy-MM-dd)
- `origem` (VENDA | COMPRA | AJUSTE_POSITIVO | AJUSTE_NEGATIVO)

---

### Módulo 5 — Categorias de Produto *(ROOT / ADMIN)*

| # | Tela | Método | Endpoint |
|---|---|---|---|
| 5.1 | Lista | GET | `/categorias-produto?ativas=true` |
| 5.2 | Criar | POST | `/categorias-produto` |
| 5.3 | Editar | PUT | `/categorias-produto/{id}` |

**Criar:** `{ "nome": "string (max 100)" }`
**Editar:** `{ "nome": "string", "ativo": "boolean" }`
**Response:** `{ id, nome, ativo, createdAt }`

> Sem paginação — array simples.

---

### Módulo 6 — Categorias de Lançamento *(ROOT / ADMIN)*

| # | Tela | Método | Endpoint |
|---|---|---|---|
| 6.1 | Lista | GET | `/categorias-lancamento?ativas=true` |
| 6.2 | Criar | POST | `/categorias-lancamento` |
| 6.3 | Editar | PUT | `/categorias-lancamento/{id}` |

**Criar:** `{ "nome": "string (max 100)", "tipo": "ENTRADA | SAIDA | AMBOS" }`
**Editar:** `{ "nome": "string", "tipo": "string", "ativo": "boolean" }`
**Response:** `{ id, nome, tipo, ativo }`

> Sem paginação — array simples.

---

### Módulo 7 — Clientes *(ROOT / ADMIN)*

| # | Tela | Método | Endpoint |
|---|---|---|---|
| 7.1 | Lista | GET | `/clientes?page=0&size=20` |
| 7.2 | Criar | POST | `/clientes` |
| 7.3 | Editar | PUT | `/clientes/{id}` |

**Criar:** `{ "nome": "string", "documento": "string", "email": "string", "telefone": "string" }`
**Response:** `{ id, nome, documento, email, telefone, ativo, createdAt }`

---

### Módulo 8 — Fornecedores *(ROOT / ADMIN)*

| # | Tela | Método | Endpoint |
|---|---|---|---|
| 8.1 | Lista | GET | `/fornecedores?page=0&size=20` |
| 8.2 | Criar | POST | `/fornecedores` |
| 8.3 | Editar | PUT | `/fornecedores/{id}` |

**Criar:** `{ "nome": "string", "documento": "string", "email": "string", "telefone": "string" }`
**Response:** `{ id, nome, documento, email, telefone, ativo, createdAt }`

---

### Módulo 9 — Termos de Uso *(ROOT)*

| # | Tela | Método | Endpoint | Notas |
|---|---|---|---|---|
| 9.1 | Lista de versões | GET | `/termos/admin` | Array — ordem cronológica decrescente |
| 9.2 | Nova versão | POST | `/termos/admin` | Desativa versão anterior automaticamente. 409 se versão já existe |
| 9.3 | Preview da versão atual | GET | `/termos/atual` | Endpoint público |

**Criar:** `{ "versao": "string (max 20)", "titulo": "string (max 255)", "conteudo": "string", "declaracaoAceite": "string" }`
**Response:** `{ id, versao, titulo, conteudo, declaracaoAceite, ativo, createdAt }`

---

### Módulo 10 — Relatório de Margem *(ROOT / ADMIN)*

| # | Tela | Método | Endpoint |
|---|---|---|---|
| 10.1 | Relatório | GET | `/relatorios/margem` |

**Response:**
```
{
  totalProdutos: int,
  margemMedia: number (percentual),
  itens: [{ produtoId, nome, precoVenda, precoCusto, margemPercentual }]
}
```

**Regras:**
- Ordenado por `margemPercentual` decrescente
- Fórmula: `(precoVenda - precoCusto) / precoVenda × 100`
- Produtos sem `precoCusto` são excluídos

---

### Módulo 11 — Assinaturas *(visualização)*

| # | Tela | Método | Endpoint | Notas |
|---|---|---|---|---|
| 11.1 | Entitlement | GET | `/usuarios/{usuarioId}/entitlement` | Acessado via detalhe do usuário (Módulo 2) |

> Validação e compra via Google Play são exclusivas do mobile.

---

## 5. Paginação

Endpoints com volumes potencialmente grandes retornam `PageResponse<T>`:

```typescript
export interface PageResponse<T> {
  content:       T[];
  page:          number;  // página atual (base 0)
  size:          number;  // itens por página
  totalElements: number;  // total de registros
  totalPages:    number;  // total de páginas
  last:          boolean; // é a última página?
}
```

**Parâmetros de query:** `?page=0&size=20` (ambos opcionais, defaults no backend)

**Endpoints paginados:**

| Endpoint | PageResponse<T> |
|---|---|
| `GET /produtos` | `PageResponse<ProdutoResponse>` |
| `GET /clientes` | `PageResponse<ClienteResponse>` |
| `GET /fornecedores` | `PageResponse<FornecedorResponse>` |
| `GET /estoque/movimentacoes` | `PageResponse<MovimentacaoEstoqueResponse>` |
| `GET /estoque/movimentacoes/produto/{id}` | `PageResponse<MovimentacaoEstoqueResponse>` |
| `GET /contas/receber` | `PageResponse<ContaResponse>` |
| `GET /contas/pagar` | `PageResponse<ContaResponse>` |

**Endpoints sem paginação (array simples):**
`GET /usuarios`, `GET /categorias-produto`, `GET /categorias-lancamento`, `GET /termos/admin`, `GET /parcelas`

---

## 6. Estrutura de Pastas

```
src/
  app/
    core/
      auth/
        auth.service.ts           # login, logout, refresh, loadMe
        auth.guard.ts             # redireciona para /login se não autenticado
        role.guard.ts             # redireciona se papel insuficiente
        jwt.interceptor.ts        # adiciona Authorization: Bearer <token>
        token-refresh.interceptor.ts  # intercepta 401 → refresh → retry
        token.service.ts          # get/set/remove tokens (localStorage)
      api/
        api.service.ts            # HttpClient wrapper com baseUrl
      models/
        auth.model.ts
        usuario.model.ts
        produto.model.ts
        categoria-produto.model.ts
        categoria-lancamento.model.ts
        cliente.model.ts
        fornecedor.model.ts
        estoque.model.ts
        termos.model.ts
        dashboard.model.ts
        relatorio.model.ts
        page-response.model.ts    # interface genérica PageResponse<T>
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

    shared/
      components/
        confirm-dialog/
        page-header/
        empty-state/
        loading-spinner/
        status-badge/
        paginator/               # wrapper do MatPaginator
      pipes/
        currency-brl.pipe.ts     # centavos → R$ 1.234,56
        date-br.pipe.ts          # yyyy-MM-dd → dd/MM/yyyy

    layout/
      shell/
        shell.component.ts       # topbar + sidebar + <router-outlet>
      sidebar/
        sidebar.component.ts     # nav links filtrados por papel
      topbar/
        topbar.component.ts      # nome do usuário + logout

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
    environment.ts               # dev: http://localhost:8080/api/v1
    environment.prod.ts          # prod: https://api.phonus.com.br/api/v1

  styles/
    _variables.scss
    _material-theme.scss

  styles.scss
```

---

## 7. Roteamento

```
/login
/esqueceu-senha

/ (ShellComponent — requer AuthGuard)
  /dashboard
  /usuarios                      (ROOT, ADMIN)
  /usuarios/:id
  /produtos
  /produtos/novo
  /produtos/:id
  /produtos/:id/editar
  /estoque
  /categorias/produto
  /categorias/lancamento
  /clientes
  /fornecedores
  /termos                        (ROOT)
  /relatorios/margem
```

### Lazy loading por feature

Cada feature carrega seu próprio `*.routes.ts` via `loadChildren()`. Rotas de auth e shell são eager (necessárias no bootstrap).

---

## 8. Autenticação e Guards

### AuthGuard

Bloqueia qualquer rota protegida se não houver token válido. Redireciona para `/login`.

```typescript
export const authGuard: CanActivateFn = () => {
  const auth  = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn() ? true : router.createUrlTree(['/login']);
};
```

### RoleGuard

Valida o papel do usuário contra os roles declarados em `route.data`. Redireciona para `/dashboard` se insuficiente.

```typescript
export const roleGuard: CanActivateFn = (route) => {
  const auth   = inject(AuthService);
  const router  = inject(Router);
  const roles: string[] = route.data['roles'] ?? [];
  const papel  = auth.currentUser()?.papel;
  return roles.includes(papel ?? '') ? true : router.createUrlTree(['/dashboard']);
};
```

---

## 9. Interceptors

### JwtInterceptor

Injeta `Authorization: Bearer <token>` em toda requisição autenticada.

### TokenRefreshInterceptor

Ao receber 401 (exceto nas rotas `/auth/`):
1. Chama `POST /auth/refresh`
2. Salva novos tokens
3. Repete a requisição original com o novo token
4. Se refresh falhar → logout → navega para `/login`

---

## 10. AuthService

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<Usuario | null>(null);

  readonly currentUser = this._user.asReadonly();
  readonly isLoggedIn  = computed(() => this._user() !== null);
  readonly papel       = computed(() => this._user()?.papel ?? null);

  hasRole(...roles: Papel[]): boolean {
    const p = this._user()?.papel;
    return p != null && roles.includes(p);
  }
}
```

---

## 11. Modelos TypeScript

```typescript
// page-response.model.ts
export interface PageResponse<T> {
  content:       T[];
  page:          number;
  size:          number;
  totalElements: number;
  totalPages:    number;
  last:          boolean;
}

// auth.model.ts
export interface AuthResponse {
  accessToken:  string;
  refreshToken: string;
}

// usuario.model.ts
export type Papel = 'SUPER_ROOT' | 'ROOT' | 'ADMIN' | 'OPERADOR';

export interface Usuario {
  id:        string;
  nome:      string;
  email:     string;
  papel:     Papel;
  ativo:     boolean;
  cidade?:   string;
  estado?:   string;
  createdAt?: string;
}

// produto.model.ts
export type UnidadeMedida = 'UN' | 'KG' | 'L' | 'M' | 'M2' | 'CX' | 'PCT';

export interface Produto {
  id:                string;
  nome:              string;
  descricao?:        string;
  categoriaId?:      string;
  precoVenda:        number;   // centavos
  precoCusto?:       number;   // centavos
  quantidadeEstoque: number;
  estoqueMinimo:     number;
  abaixoDoMinimo:    boolean;
  unidadeMedida:     UnidadeMedida;
  codigoBarras?:     string;
  ncm?:              string;
  cest?:             string;
  ativo:             boolean;
  criadoPor:         string;
  createdAt?:        string;
  updatedAt?:        string;
}

// estoque.model.ts
export type OrigemMovimentacao =
  'VENDA' | 'COMPRA' | 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO';

export interface MovimentacaoEstoque {
  id:                string;
  produtoId:         string;
  tipo:              'ENTRADA' | 'SAIDA';
  quantidade:        number;
  origem:            OrigemMovimentacao;
  lancamentoItemId?: string;
  observacao?:       string;
  criadoPor:         string;
  createdAt?:        string;
}

// dashboard.model.ts
export interface DashboardData {
  saldoCaixa:             number;
  totalAReceber:          number;
  totalAPagar:            number;
  produtosAbaixoDoMinimo: number;
  contasVencidas:         number;
}

// relatorio.model.ts
export interface RelatorioMargemItem {
  produtoId:        string;
  nome:             string;
  precoVenda:       number;
  precoCusto:       number;
  margemPercentual: number;
}

export interface RelatorioMargemResponse {
  totalProdutos: number;
  margemMedia:   number;
  itens:         RelatorioMargemItem[];
}
```

---

## 12. Tema Angular Material — Paleta Phonus

```scss
// _material-theme.scss
@use '@angular/material' as mat;

$phonus-primary: mat.define-palette((
  50:  #e8f8ef,
  100: #d1fadf,
  200: #a3f5bf,
  300: #6deba0,
  400: #3dd97e,
  500: #16b364,
  600: #0e9550,
  700: #077a3e,
  800: #065f46,
  900: #044030,
  contrast: (500: white, 600: white, 700: white, 800: white)
), 500, 800, 100);

$phonus-warn: mat.define-palette(mat.$red-palette, 600);

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

:root {
  --phonus-primary:          #16B364;
  --phonus-primary-light:    #D1FADF;
  --phonus-primary-dark:     #065F46;
  --phonus-background:       #F7F9FC;
  --phonus-surface:          #FFFFFF;
  --phonus-border:           #E4E7EC;
  --phonus-text:             #101828;
  --phonus-text-secondary:   #667085;
  --phonus-error:            #F04438;
}

body { background-color: var(--phonus-background); }
```

---

## 13. Padrão de Serviços HTTP

```typescript
// api.service.ts — wrapper base com baseUrl
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  get<T>(path: string, params?: Record<string, unknown>) {
    return this.http.get<T>(`${this.base}${path}`, { params: params as HttpParams });
  }
  post<T>(path: string, body: unknown)         { return this.http.post<T>(`${this.base}${path}`, body); }
  put<T>(path: string, body: unknown)          { return this.http.put<T>(`${this.base}${path}`, body); }
  patch<T>(path: string, body?: unknown)       { return this.http.patch<T>(`${this.base}${path}`, body ?? null); }
  delete<T>(path: string)                      { return this.http.delete<T>(`${this.base}${path}`); }
}

// produto.service.ts — exemplo de serviço de feature
@Injectable({ providedIn: 'root' })
export class ProdutoService {
  private api = inject(ApiService);

  listar(params?: { categoriaId?: string; ativos?: boolean; abaixoDoMinimo?: boolean; page?: number; size?: number }) {
    return this.api.get<PageResponse<Produto>>('/produtos', params);
  }
  buscar(id: string)                        { return this.api.get<Produto>(`/produtos/${id}`); }
  criar(body: CriarProdutoRequest)          { return this.api.post<Produto>('/produtos', body); }
  atualizar(id: string, body: AtualizarProdutoRequest) {
    return this.api.put<Produto>(`/produtos/${id}`, body);
  }
  desativar(id: string)                     { return this.api.patch<void>(`/produtos/${id}/desativar`); }
}
```

---

## 14. Padrão de Componente com Paginação

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `...`
})
export class ProdutosListComponent {
  private service = inject(ProdutoService);

  isLoading   = signal(false);
  error       = signal<string | null>(null);
  produtos    = signal<Produto[]>([]);
  totalItems  = signal(0);
  page        = signal(0);
  pageSize    = signal(20);

  ngOnInit() { this.carregar(); }

  carregar() {
    this.isLoading.set(true);
    this.service.listar({ page: this.page(), size: this.pageSize() }).subscribe({
      next: (res) => {
        this.produtos.set(res.content);
        this.totalItems.set(res.totalElements);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.message);
        this.isLoading.set(false);
      }
    });
  }

  onPageChange(event: PageEvent) {
    this.page.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.carregar();
  }
}
```

---

## 15. Pipes Utilitários

```typescript
// currency-brl.pipe.ts
@Pipe({ name: 'currencyBrl' })
export class CurrencyBrlPipe implements PipeTransform {
  transform(centavos: number | null | undefined): string {
    if (centavos == null) return '—';
    return (centavos / 100).toLocaleString('pt-BR', {
      style: 'currency', currency: 'BRL'
    });
  }
}
// uso: {{ produto.precoVenda | currencyBrl }} → R$ 12,50

// date-br.pipe.ts
@Pipe({ name: 'dateBr' })
export class DateBrPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '—';
    const [y, m, d] = value.split('-');
    return `${d}/${m}/${y}`;
  }
}
// uso: {{ parcela.dataVencimento | dateBr }} → 31/03/2026
```

---

## 16. Layout Geral

```
┌─────────────────────────────────────────────────────────┐
│  Phonus                                Nome · Sair       │  ← TopbarComponent
├─────────────────┬───────────────────────────────────────┤
│  Dashboard      │                                        │
│  Usuários       │         <router-outlet>                │
│  Produtos       │                                        │
│  Estoque        │                                        │
│  Categorias  ▾  │                                        │
│    Produto      │                                        │
│    Lançamento   │                                        │
│  Clientes       │                                        │
│  Fornecedores   │                                        │
│  Termos         │                                        │  ← só ROOT
│  Relatórios     │                                        │
└─────────────────┴───────────────────────────────────────┘
```

- Sidebar colapsável em telas menores (`BreakpointObserver` do CDK)
- Itens do menu filtrados pelo `papel` do `AuthService.currentUser()`
- `ShellComponent` é o host do `<router-outlet>` principal

---

## 17. Deploy — Vercel (SPA)

### `vercel.json`
```json
{
  "routes": [
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

### Configuração no Vercel

| Campo | Valor |
|---|---|
| Framework | Other |
| Build command | `npm run build` |
| Output directory | `dist/phonus-web/browser` |

### Variável de ambiente — API URL

A URL da API **não deve ser commitada** no repositório. Configure-a no Vercel após conectar o GitHub:

**Vercel Dashboard → Settings → Environment Variables:**

| Nome | Valor | Ambiente |
|---|---|---|
| `NG_APP_API_URL` | `https://api.phonus.com.br/api/v1` | Production |
| `NG_APP_API_URL` | `http://localhost:8080/api/v1` | Preview / Development |

**`environment.ts` (dev):**
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1'
};
```

**`environment.prod.ts` (produção — lê do Vercel):**
```typescript
export const environment = {
  production: true,
  apiUrl: process.env['NG_APP_API_URL'] ?? ''
};
```

> O Vercel injeta `NG_APP_API_URL` no build automaticamente. A URL nunca fica exposta no repositório.

### Ambientes

| Branch | Ambiente |
|---|---|
| `main` | Produção |
| `feature/*` | Preview automático |

> A aplicação é SPA (sem SSR). SEO não é requisito para painel admin.

---

## 18. Ordem de Implementação

```
1. Auth + Login + Guards + Interceptors + Shell
2. Dashboard (GET /dashboard) — feedback visual imediato
3. Usuários (GET/POST /usuarios) — necessário para testes
4. Categorias de Produto — necessário antes de Produtos
5. Categorias de Lançamento
6. Produtos (CRUD + filtros + paginação)
7. Estoque (histórico paginado + ajuste manual)
8. Clientes (CRUD + paginação)
9. Fornecedores (CRUD + paginação)
10. Termos (apenas ROOT)
11. Relatório de Margem
12. Assinaturas — visualização via detalhe do usuário
```

---

## 19. Decisões em Aberto

| Ponto | Status | Observação |
|---|---|---|
| Deploy | Vercel ✅ | CI/CD automático — `vercel.json` necessário |
| Paginação | Implementada no backend ✅ | `PageResponse<T>` customizado |
| `GET /lancamentos` e `GET /pagamentos` | ⚠️ Inconsistência no swagger | Têm `page`/`size` como params mas ainda retornam array — não impacta o web (uso exclusivo do mobile) |
| URL da API em produção | ⏳ A definir | Configurar no Vercel (Settings → Environment Variables) após conectar o repositório GitHub — não commitar no código |
| Tamanho padrão de página | `size=20` | Sugestão baseada nos defaults do backend |

---

## 20. Checklist de Setup Inicial

```
[ ] Criar environments/environment.ts (dev — URL local) e environment.prod.ts (lê de NG_APP_API_URL)
[ ] Após commitar no GitHub: conectar repositório no Vercel e configurar NG_APP_API_URL em Settings → Environment Variables
[ ] Configurar _material-theme.scss com paleta Phonus
[ ] Implementar TokenService (localStorage)
[ ] Implementar AuthService com signal()
[ ] Implementar JwtInterceptor + TokenRefreshInterceptor
[ ] Implementar authGuard + roleGuard
[ ] Implementar ShellComponent (topbar + sidebar + router-outlet)
[ ] Implementar ApiService (HttpClient wrapper)
[ ] Criar modelos TypeScript (interfaces)
[ ] Implementar CurrencyBrlPipe + DateBrPipe
[ ] Configurar rotas com lazy loading
[ ] Criar vercel.json
```
