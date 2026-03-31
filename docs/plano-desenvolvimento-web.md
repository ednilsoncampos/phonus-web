# Plano de Desenvolvimento — Phonus Web (Angular 21)

**Criado em:** 2026-03-30
**Referência:** `docs/arquitetura-web-angular-vfinal.md`
**Contrato API:** `docs/swagger-phonus-api-v1.yaml`

---

## Legenda

- [ ] A fazer
- [x] Concluído
- [~] Em andamento

---

## Etapa 0 — Configuração do Projeto ✅

### 0.1 Estrutura inicial
- [x] Verificar versão Angular (`ng version` → 21.2.5)
- [x] Configurar `tsconfig.json` com `strict: true`
- [x] Criar estrutura de pastas: `core/`, `features/`, `shared/`, `layout/`
- [x] Criar `environments/environment.ts` (dev — `http://localhost:8080/api/v1`)
- [x] Criar `environments/environment.prod.ts` (lê de `process.env['NG_APP_API_URL']`)

### 0.2 Tema Angular Material
- [x] Criar `src/styles/_variables.scss` com variáveis CSS Phonus
- [x] Criar `src/styles/_material-theme.scss` com paleta Phonus (`#16B364`)
- [x] Importar tema em `styles.scss`
- [ ] Validar cores no browser (primary, error, background)

### 0.3 Deploy
- [x] Criar `vercel.json` com redirecionamento SPA
- [ ] Commitar projeto no GitHub
- [ ] Conectar repositório no Vercel
- [ ] Configurar variável `NG_APP_API_URL` no Vercel (Production e Preview)
- [ ] Validar deploy de teste na branch `main`

---

## Etapa 1 — Autenticação e Shell ✅

> Base de todo o painel. Nada mais pode ser implementado sem esta etapa.

### 1.1 Camada de tokens
- [x] Criar `TokenService` — `getAccessToken()`, `getRefreshToken()`, `save()`, `clear()`
- [x] Armazenamento em `localStorage`

### 1.2 Interceptors
- [x] Criar `JwtInterceptor` — injeta `Authorization: Bearer <token>` em toda requisição
- [x] Criar `TokenRefreshInterceptor` — intercepta 401 → `POST /auth/refresh` → retry
- [x] Tratar falha no refresh → logout → `/login`
- [x] Registrar interceptors em `app.config.ts`

### 1.3 AuthService
- [x] Criar `AuthService` com `signal<Usuario | null>`
- [x] Implementar `login()` — `POST /auth/login` → salva tokens → `loadMe()`
- [x] Implementar `loadMe()` — `GET /auth/me` → popula signal
- [x] Implementar `refresh()` — `POST /auth/refresh` → salva novos tokens
- [x] Implementar `logout()` — limpa tokens + signal → navega para `/login`
- [x] Computed: `isLoggedIn`, `papel`, `hasRole()`

### 1.4 Guards
- [x] Criar `authGuard` — redireciona para `/login` se não autenticado
- [x] Criar `roleGuard` — redireciona para `/dashboard` se papel insuficiente

### 1.5 ApiService
- [x] Criar `ApiService` — wrapper `HttpClient` com `baseUrl` do environment
- [x] Métodos: `get()`, `post()`, `put()`, `patch()`, `delete()`

### 1.6 Tela de Login
- [x] Criar `LoginComponent` (`/login`)
- [x] Formulário Reactive: `email` + `senha`
- [x] Validações: required, formato de e-mail
- [x] Tratar erro 401 — exibir mensagem
- [x] Redirecionar para `/dashboard` após login bem-sucedido
- [x] Loading state durante requisição

### 1.7 Tela Esqueceu a Senha
- [x] Criar `ForgotPasswordComponent` (`/esqueceu-senha`)
- [x] `POST /auth/esqueceu-senha` com `{ email }`
- [x] Exibir mensagem de retorno da API

### 1.8 Shell (layout principal)
- [x] Criar `ShellComponent` — topbar + sidebar + `<router-outlet>`
- [x] Criar `TopbarComponent` — nome do usuário + botão Sair
- [x] Criar `SidebarComponent` — links filtrados por `papel`
- [x] Sidebar colapsável com `BreakpointObserver` (CDK)
- [x] Itens do menu visíveis por papel:
  - [x] Dashboard — todos
  - [x] Usuários — ROOT, ADMIN
  - [x] Produtos — ROOT, ADMIN
  - [x] Estoque — ROOT, ADMIN
  - [x] Categorias (submenu) — ROOT, ADMIN
  - [x] Clientes — ROOT, ADMIN
  - [x] Fornecedores — ROOT, ADMIN
  - [x] Termos — ROOT
  - [x] Relatórios — ROOT, ADMIN

### 1.9 Roteamento base
- [x] Configurar `app.routes.ts` com rotas públicas (`/login`, `/esqueceu-senha`)
- [x] Configurar rota raiz com `ShellComponent` + `authGuard`
- [x] Configurar lazy loading para todas as features
- [x] Rota `**` → redireciona para `/dashboard`

### 1.10 Pipes utilitários
- [x] Criar `CurrencyBrlPipe` — centavos → R$ 1.234,56
- [x] Criar `DateBrPipe` — `yyyy-MM-dd` → `dd/MM/yyyy`

### 1.11 Componentes shared
- [x] Criar `ConfirmDialogComponent` — reutilizável para ações destrutivas
- [x] Criar `LoadingSpinnerComponent`
- [x] Criar `EmptyStateComponent`
- [x] Criar `PageHeaderComponent` — título + breadcrumb

---

## Etapa 2 — Dashboard ✅

### 2.1 DashboardService
- [x] Criar `DashboardService` — `GET /dashboard`
- [x] Interface `DashboardData`

### 2.2 DashboardComponent
- [x] Cards KPI: Saldo de Caixa, A Receber, A Pagar, Produtos críticos, Contas vencidas
- [x] Valores monetários com `CurrencyBrlPipe`
- [x] Card "Produtos abaixo do mínimo" → navega para `/produtos?abaixoDoMinimo=true`
- [x] Card "Contas vencidas" → navega para `/contas/receber` (referência futura)
- [x] Atalhos rápidos por papel (ROOT/ADMIN): "Novo produto", "Ajustar estoque"
- [x] Atalho "Convidar usuário" para ROOT/ADMIN
- [x] Loading state e tratamento de erro

---

## Etapa 3 — Gestão de Usuários ✅

### 3.1 UsuarioService
- [x] Criar `UsuarioService`
- [x] `listar()` — `GET /usuarios`
- [x] `buscar(id)` — `GET /usuarios/{id}`
- [x] `convidar(body)` — `POST /usuarios`
- [x] `alterarPapel(id, papel)` — `PATCH /usuarios/{id}/papel`
- [x] `desativar(id)` — `DELETE /usuarios/{id}`
- [x] `buscarEntitlement(usuarioId)` — `GET /usuarios/{usuarioId}/entitlement`

### 3.2 Lista de Usuários (`/usuarios`)
- [x] Tabela com: nome, e-mail, papel, status ativo/inativo
- [x] Badge de papel colorido por nível
- [x] Botão "Convidar usuário" (ROOT/ADMIN)
- [x] Ação "Desativar" com `ConfirmDialogComponent` (não pode desativar SUPER_ROOT)

### 3.3 Convidar Usuário (dialog)
- [x] `ConvidarUsuarioDialogComponent`
- [x] Campos: nome, e-mail, papel
- [x] Papel disponível por quem convida:
  - [x] ROOT → ADMIN ou OPERADOR
  - [x] ADMIN → apenas OPERADOR
- [x] Tratamento de erro (e-mail duplicado, etc.)

### 3.4 Detalhe do Usuário (`/usuarios/:id`)
- [ ] Exibir dados do usuário
- [ ] Alterar papel (apenas ROOT, não permite SUPER_ROOT)
- [ ] Seção Entitlement: `isPremium`, `tier`, `expiraEm`
- [ ] Botão "Desativar usuário" com confirmação

---

## Etapa 4 — Categorias ✅

> Implementar antes de Produtos, pois Produtos depende de Categorias de Produto.

### 4.1 Categorias de Produto (`/categorias/produto`)
- [x] Criar `CategoriaProdutoService` — `listar()`, `criar()`, `editar()`
- [x] Lista com nome e status ativo
- [x] Criar/editar inline ou via dialog
- [x] Toggle ativo/inativo

### 4.2 Categorias de Lançamento (`/categorias/lancamento`)
- [x] Criar `CategoriaLancamentoService` — `listar()`, `criar()`, `editar()`
- [x] Lista com nome, tipo (ENTRADA / SAIDA / AMBOS) e status
- [x] Criar/editar inline ou via dialog
- [x] Toggle ativo/inativo

---

## Etapa 5 — Cadastro de Produtos ✅

### 5.1 ProdutoService
- [x] Criar `ProdutoService`
- [x] `listar(params)` — `GET /produtos?page&size&categoriaId&ativos&abaixoDoMinimo`
- [x] `buscar(id)` — `GET /produtos/{id}`
- [x] `criar(body)` — `POST /produtos`
- [x] `atualizar(id, body)` — `PUT /produtos/{id}`
- [x] `desativar(id)` — `PATCH /produtos/{id}/desativar`

### 5.2 Lista de Produtos (`/produtos`)
- [x] Tabela com: nome, categoria, preço de venda, estoque, status
- [x] `CurrencyBrlPipe` nos preços
- [x] Badge "Abaixo do mínimo" quando `abaixoDoMinimo = true`
- [x] Filtros: categoria, ativos (toggle), abaixo do mínimo (toggle)
- [x] Paginação com `MatPaginator` (`PageResponse<Produto>`, `size=20`)
- [x] Botão "Novo produto"

### 5.3 Formulário de Produto (`/produtos/novo` e `/produtos/:id/editar`)
- [x] Campos: nome, descrição, categoria, preço de venda, preço de custo, estoque mínimo, unidade de medida, código de barras, NCM, CEST
- [x] `categoriaId` — select populado de `CategoriaProdutoService`
- [x] `unidadeMedida` — select com enum (`UN`, `KG`, `L`, `M`, `M2`, `CX`, `PCT`)
- [x] Preços com máscara em Reais (convertendo para centavos no submit)
- [x] Validações: nome required, preço de venda required, estoque mínimo required

### 5.4 Detalhe do Produto (`/produtos/:id`)
- [x] Exibir todos os campos do produto
- [x] Botões: "Editar", "Desativar"
- [x] Atalho para histórico de estoque do produto

---

## Etapa 6 — Controle de Estoque ✅

### 6.1 EstoqueService
- [x] Criar `EstoqueService`
- [x] `listarMovimentacoes(params)` — `GET /estoque/movimentacoes?page&size&produtoId&dataInicio&dataFim&origem`
- [x] `listarPorProduto(id, params)` — `GET /estoque/movimentacoes/produto/{id}?page&size`
- [x] `ajustar(produtoId, body)` — `POST /estoque/ajuste?produtoId={id}`

### 6.2 Histórico Geral (`/estoque`)
- [x] Tabela com: produto, tipo, quantidade, origem, data, observação
- [x] Filtros: produto (autocomplete), período (data início/fim), origem
- [x] Paginação (`PageResponse<MovimentacaoEstoque>`, `size=20`)
- [x] Botão "Ajustar estoque"

### 6.3 Ajuste de Estoque (dialog)
- [x] `AjusteEstoqueDialogComponent`
- [x] Campos: tipo (`AJUSTE_POSITIVO` / `AJUSTE_NEGATIVO`), quantidade, observação
- [x] Produto pré-preenchido quando chamado via detalhe do produto

---

## Etapa 7 — Clientes ✅

### 7.1 ClienteService
- [x] Criar `ClienteService`
- [x] `listar(params)` — `GET /clientes?page&size&ativos`
- [x] `criar(body)` — `POST /clientes`
- [x] `atualizar(id, body)` — `PUT /clientes/{id}`

### 7.2 Lista de Clientes (`/clientes`)
- [x] Tabela com: nome, documento, e-mail, telefone, status
- [x] Paginação (`PageResponse<Cliente>`, `size=20`)
- [x] Filtro por ativos
- [x] Botão "Novo cliente"

### 7.3 Formulário de Cliente
- [x] Campos: nome (required), documento, e-mail, telefone
- [x] Usado tanto para criar quanto para editar (dialog ou página)
- [x] Toggle ativo/inativo no modo edição

---

## Etapa 8 — Fornecedores

### 8.1 FornecedorService
- [ ] Criar `FornecedorService`
- [ ] `listar(params)` — `GET /fornecedores?page&size&ativos`
- [ ] `criar(body)` — `POST /fornecedores`
- [ ] `atualizar(id, body)` — `PUT /fornecedores/{id}`

### 8.2 Lista de Fornecedores (`/fornecedores`)
- [ ] Tabela com: nome, documento, e-mail, telefone, status
- [ ] Paginação (`PageResponse<Fornecedor>`, `size=20`)
- [ ] Filtro por ativos
- [ ] Botão "Novo fornecedor"

### 8.3 Formulário de Fornecedor
- [ ] Campos: nome (required), documento, e-mail, telefone
- [ ] Toggle ativo/inativo no modo edição

---

## Etapa 9 — Termos de Uso *(ROOT)*

### 9.1 TermosService
- [ ] Criar `TermosService`
- [ ] `listarVersoes()` — `GET /termos/admin`
- [ ] `criarVersao(body)` — `POST /termos/admin`
- [ ] `buscarAtual()` — `GET /termos/atual`

### 9.2 Lista de Versões (`/termos`)
- [ ] Tabela: versão, título, data, status ativo
- [ ] Badge "Ativo" na versão corrente
- [ ] Botão "Nova versão"
- [ ] Link "Preview" → abre modal com `GET /termos/atual`

### 9.3 Formulário Nova Versão
- [ ] Campos: versão (max 20), título (max 255), conteúdo (textarea), declaração de aceite (textarea)
- [ ] Aviso: criação desativa versão anterior automaticamente
- [ ] Tratar 409 (versão já existe)

---

## Etapa 10 — Relatório de Margem

### 10.1 RelatorioService
- [ ] Criar `RelatorioService`
- [ ] `buscarMargem()` — `GET /relatorios/margem`

### 10.2 Relatório de Margem (`/relatorios/margem`)
- [ ] Cards de resumo: total de produtos, margem média
- [ ] Tabela: produto, preço de venda, preço de custo, margem %
- [ ] Ordenação por margem decrescente (já vem ordenado da API)
- [ ] Preços com `CurrencyBrlPipe`
- [ ] Indicador visual para margens baixas (ex: < 10%)
- [ ] Nota: exibe apenas produtos com `precoCusto` definido

---

## Etapa 11 — Assinaturas (visualização)

> Implementada como parte do detalhe do usuário na Etapa 3. Verificar se já está coberta.

- [ ] Confirmar que `EntitlementResponse` está exibido em `/usuarios/:id`
- [ ] Campos: `isPremium`, `tier`, `expiraEm`, `diasCortesiaRestantes`, `planoAtual.nome`

---

## Etapa 12 — Testes Unitários

> Ferramentas: **Jest** (test runner) + **Angular Testing Library** ou **TestBed** nativo.
> Cobertura mínima esperada: serviços e guards (lógica de negócio crítica).

### 12.1 Configuração
- [ ] Configurar Jest como test runner (`jest.config.ts`, `jest-preset-angular`)
- [ ] Remover Karma/Jasmine se presente
- [ ] Configurar `setupFilesAfterFramework` com `jest-preset-angular/setup-jest`
- [ ] Validar execução com `npm test`

### 12.2 AuthService
- [ ] `login()` — deve salvar tokens e popular `currentUser` signal
- [ ] `logout()` — deve limpar tokens e resetar signal para `null`
- [ ] `isLoggedIn` — deve ser `false` quando `currentUser` for `null`
- [ ] `hasRole()` — deve retornar `true` / `false` conforme papel do usuário
- [ ] `refresh()` — deve atualizar tokens sem limpar `currentUser`

### 12.3 TokenService
- [ ] `save()` — deve persistir `accessToken` e `refreshToken` no `localStorage`
- [ ] `getAccessToken()` — deve retornar token salvo
- [ ] `clear()` — deve remover ambos os tokens

### 12.4 Guards
- [ ] `authGuard` — deve permitir acesso se `isLoggedIn = true`
- [ ] `authGuard` — deve redirecionar para `/login` se `isLoggedIn = false`
- [ ] `roleGuard` — deve permitir acesso se papel está na lista de `route.data.roles`
- [ ] `roleGuard` — deve redirecionar para `/dashboard` se papel insuficiente
- [ ] `roleGuard` — deve redirecionar se `currentUser` for `null`

### 12.5 Interceptors
- [ ] `JwtInterceptor` — deve adicionar header `Authorization: Bearer <token>` quando token presente
- [ ] `JwtInterceptor` — não deve adicionar header quando token ausente
- [ ] `TokenRefreshInterceptor` — deve chamar `POST /auth/refresh` ao receber 401
- [ ] `TokenRefreshInterceptor` — deve repetir requisição original com novo token após refresh
- [ ] `TokenRefreshInterceptor` — deve chamar `logout()` se refresh falhar

### 12.6 Pipes
- [ ] `CurrencyBrlPipe` — `10050` → `R$ 100,50`
- [ ] `CurrencyBrlPipe` — `null` / `undefined` → `'—'`
- [ ] `DateBrPipe` — `'2026-03-30'` → `'30/03/2026'`
- [ ] `DateBrPipe` — `null` / `undefined` → `'—'`

### 12.7 Serviços de feature
- [ ] `ProdutoService.listar()` — deve montar query params corretamente (`page`, `size`, `categoriaId`, etc.)
- [ ] `EstoqueService.ajustar()` — deve enviar `produtoId` como query param
- [ ] `UsuarioService.convidar()` — deve fazer `POST /usuarios` com body correto
- [ ] `DashboardService.buscar()` — deve chamar `GET /dashboard` e retornar `DashboardData`

### 12.8 Componentes críticos
- [ ] `SidebarComponent` — itens do menu devem ser filtrados corretamente por papel
- [ ] `LoginComponent` — deve desabilitar submit com formulário inválido
- [ ] `LoginComponent` — deve exibir erro ao receber 401
- [ ] `ConfirmDialogComponent` — deve emitir confirmação ao clicar em "Confirmar"
- [ ] `ConfirmDialogComponent` — deve fechar sem emitir ao clicar em "Cancelar"

---

## Etapa 13 — Qualidade e Acessibilidade

### 12.1 Acessibilidade (WCAG AA)
- [ ] Todos os formulários com `aria-label` ou `<label>` associado
- [ ] Foco gerenciado ao abrir/fechar dialogs
- [ ] Contraste de cores validado (mínimo 4.5:1 para texto normal)
- [ ] Navegação por teclado em tabelas e menus
- [ ] Rodar AXE (extensão Chrome) em todas as páginas
- [ ] Corrigir todas as violações AXE

### 12.2 Tratamento de erros global
- [ ] Erros HTTP 400 — exibir mensagem do campo inválido
- [ ] Erros HTTP 403 — redirecionar ou exibir "sem permissão"
- [ ] Erros HTTP 404 — exibir página "não encontrado"
- [ ] Erros HTTP 500 — mensagem genérica amigável
- [ ] Loading states em todas as operações assíncronas

### 12.3 Responsividade
- [ ] Layout funcional em telas ≥ 768px (tablet)
- [ ] Sidebar colapsa automaticamente em telas menores
- [ ] Tabelas com scroll horizontal em telas pequenas

---

## Etapa 14 — Deploy Final

- [ ] Testar build de produção localmente (`npm run build`)
- [ ] Verificar `dist/phonus-web/browser` gerado corretamente
- [ ] Confirmar URL da API de produção no Vercel (Environment Variables)
- [ ] Validar deploy na `main` — abrir painel em produção
- [ ] Testar login com usuário ROOT em produção
- [ ] Validar redirecionamentos SPA (F5 em rotas internas)

---

## Resumo das Etapas

| Etapa | Descrição | Depende de |
|---|---|---|
| 0 | Configuração do projeto | — |
| 1 | Autenticação + Shell | 0 |
| 2 | Dashboard | 1 |
| 3 | Usuários | 1 |
| 4 | Categorias | 1 |
| 5 | Produtos | 1, 4 |
| 6 | Estoque | 1, 5 |
| 7 | Clientes | 1 |
| 8 | Fornecedores | 1 |
| 9 | Termos | 1 |
| 10 | Relatório de Margem | 1, 5 |
| 11 | Assinaturas (view) | 3 |
| 12 | Testes Unitários | 1–11 |
| 13 | Qualidade e Acessibilidade | Todas |
| 14 | Deploy Final | Todas |
