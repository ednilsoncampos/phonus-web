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
- [x] Commitar projeto no GitHub
- [x] Conectar repositório no Vercel
- [ ] Configurar variável `NG_APP_API_URL` no Vercel (Production e Preview)
- [x] Validar deploy de teste na branch `main` (web publicado na Vercel e funcionando — confirmado pelo usuário em 2026-09-29)

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

## Etapa 8 — Fornecedores ✅

### 8.1 FornecedorService
- [x] Criar `FornecedorService`
- [x] `listar(params)` — `GET /fornecedores?page&size&ativos`
- [x] `criar(body)` — `POST /fornecedores`
- [x] `atualizar(id, body)` — `PUT /fornecedores/{id}`

### 8.2 Lista de Fornecedores (`/fornecedores`)
- [x] Tabela com: nome, documento, e-mail, telefone, status
- [x] Paginação (`PageResponse<Fornecedor>`, `size=20`)
- [x] Filtro por ativos
- [x] Botão "Novo fornecedor"

### 8.3 Formulário de Fornecedor
- [x] Campos: nome (required), documento, e-mail, telefone
- [x] Toggle ativo/inativo no modo edição

---

## Etapa 9 — Termos de Uso *(ROOT)* ✅

### 9.1 TermosService
- [x] Criar `TermosService`
- [x] `listarVersoes()` — `GET /termos/admin`
- [x] `criarVersao(body)` — `POST /termos/admin`
- [x] `buscarAtual()` — `GET /termos/atual`

### 9.2 Lista de Versões (`/termos`)
- [x] Tabela: versão, título, data, status ativo
- [x] Badge "Ativo" na versão corrente
- [x] Botão "Nova versão"
- [x] Link "Preview" → abre modal com `GET /termos/atual`

### 9.3 Formulário Nova Versão
- [x] Campos: versão (max 20), título (max 255), conteúdo (textarea), declaração de aceite (textarea)
- [x] Aviso: criação desativa versão anterior automaticamente
- [x] Tratar 409 (versão já existe)

---

## Etapa 10 — Relatório de Margem ✅

### 10.1 RelatorioService
- [x] Criar `RelatorioService`
- [x] `buscarMargem()` — `GET /relatorios/margem`

### 10.2 Relatório de Margem (`/relatorios/margem`)
- [x] Cards de resumo: total de produtos, margem média
- [x] Tabela: produto, preço de venda, preço de custo, margem %
- [x] Ordenação por margem decrescente (já vem ordenado da API)
- [x] Preços com `CurrencyBrlPipe`
- [x] Indicador visual para margens baixas (ex: < 10%)
- [x] Nota: exibe apenas produtos com `precoCusto` definido

---

## Etapa 11 — Assinaturas (visualização)

> Implementada como parte do detalhe do usuário na Etapa 3. Verificar se já está coberta.

- [ ] Confirmar que `EntitlementResponse` está exibido em `/usuarios/:id`
- [ ] Campos: `isPremium`, `tier`, `expiraEm`, `diasCortesiaRestantes`, `planoAtual.nome`

---

## Etapa 12 — Testes Unitários ✅

> Ferramentas: **Vitest** + **TestBed** nativo. 16 arquivos, 62 testes — todos passando.

### 12.1 Configuração
- [x] Adicionar `tsConfig: "tsconfig.spec.json"` ao `angular.json` test options
- [x] Validar execução com `npm test`

### 12.2 AuthService
- [x] `login()` — salva tokens via TokenService
- [x] `logout()` — limpa tokens e reseta currentUser
- [x] `isLoggedIn` — false sem usuário, true após loadMe
- [x] `hasRole()` — retorna true/false conforme papel
- [x] `refresh()` — atualiza tokens

### 12.3 TokenService
- [x] `save()` — persiste no localStorage
- [x] `getAccessToken()` — retorna token salvo
- [x] `clear()` — remove ambos os tokens

### 12.4 Guards
- [x] `authGuard` — permite acesso se isLoggedIn = true
- [x] `authGuard` — redireciona para /login se isLoggedIn = false
- [x] `roleGuard` — permite acesso se papel na lista de roles
- [x] `roleGuard` — redireciona para /dashboard se papel insuficiente
- [x] `roleGuard` — redireciona se currentUser for null

### 12.5 Interceptors
- [x] `jwtInterceptor` — adiciona header Authorization quando token presente
- [x] `jwtInterceptor` — não adiciona header quando token ausente
- [x] `tokenRefreshInterceptor` — não intercepta rotas /auth/
- [x] `tokenRefreshInterceptor` — propaga erros não-401
- [x] `tokenRefreshInterceptor` — faz logout e propaga erro quando 401 sem refresh token
- [x] `tokenRefreshInterceptor` — faz logout quando refresh falha

### 12.6 Pipes
- [x] `CurrencyBrlPipe` — centavos → R$ formatado
- [x] `CurrencyBrlPipe` — null/undefined → '—'
- [x] `DateBrPipe` — 'yyyy-MM-dd' → 'dd/MM/yyyy'
- [x] `DateBrPipe` — null/undefined/'' → '—'

### 12.7 Serviços de feature
- [x] `ProdutoService.listar()` — query params corretos
- [x] `EstoqueService.ajustar()` — produtoId no path via query string
- [x] `UsuarioService.convidar()` — POST /usuarios com body correto
- [x] `DashboardService.carregar()` — GET /dashboard retorna DashboardData

### 12.8 Componentes críticos
- [x] `SidebarComponent` — menu filtrado por papel (OPERADOR, ADMIN, ROOT, null)
- [x] `LoginComponent` — submit bloqueado com form inválido
- [x] `LoginComponent` — exibe erro 401 e erro genérico
- [x] `ConfirmDialogComponent` — confirm fecha com true
- [x] `ConfirmDialogComponent` — cancel fecha com false

---

## Etapa 13 — Qualidade e Acessibilidade ✅

### 13.1 Acessibilidade (WCAG AA)
- [x] Todos os formulários com `aria-label` ou `<label>` associado (Angular Material gerencia via `mat-label`)
- [x] Foco gerenciado ao abrir/fechar dialogs (Angular Material CDK nativo)
- [x] Contraste de cores validado — `--phonus-text` (#101828) sobre branco passa 4.5:1
- [x] Navegação por teclado em tabelas e menus — Angular Material nativo
- [x] `lang="pt-BR"` adicionado ao `index.html`
- [x] Skip link "Pular para o conteúdo principal" no `ShellComponent`
- [x] `id="main-content"` e `tabindex="-1"` no `<main>` do shell
- [ ] Rodar AXE (extensão Chrome) em todas as páginas — validação manual pós-deploy
- [ ] Corrigir violações AXE remanescentes — dependente de execução no browser

### 13.2 Tratamento de erros global
- [x] Criar `ErrorNotificationService` — wrapper de `MatSnackBar` com estilo de erro
- [x] Criar `HttpErrorInterceptor` — trata 400, 403, 404, 500+ com snackbar e mensagens da API
- [x] Registrar `httpErrorInterceptor` em `app.config.ts` (após tokenRefreshInterceptor)
- [x] Erros HTTP 400 — snackbar com `error.error?.message` ou mensagem genérica
- [x] Erros HTTP 403 — snackbar "Você não tem permissão para realizar esta ação."
- [x] Erros HTTP 404 — snackbar "Recurso não encontrado." (GETs pontuais)
- [x] Erros HTTP 500+ — snackbar "Erro interno no servidor. Tente novamente mais tarde."
- [x] Criar `NotFoundComponent` (`/404`) — exibido para rotas desconhecidas (`**`)
- [x] Criar `ForbiddenComponent` (`/403`) — página de acesso negado
- [x] Rota `**` agora exibe `NotFoundComponent` em vez de redirecionar para `/dashboard`
- [x] Loading states em todas as operações assíncronas — já implementado nos componentes

### 13.3 Responsividade
- [x] Layout funcional em telas ≥ 768px — confirmado via `BreakpointObserver`
- [x] Sidebar colapsa automaticamente em telas menores (`Breakpoints.XSmall`, `Breakpoints.Small`)
- [x] Shell: `margin-left: 0` em mobile para sidebar colapsada
- [x] Tabelas com scroll horizontal — `overflow-x: auto` em todos os `table-wrap` (7 componentes)
- [x] Formulários: `.form-row` colapsa para `1fr` em ≤ 768px via `styles.scss` global

---

## Etapa 14 — Correções de Contrato (Homologação Backend)

> Ajustes identificados ao comparar o painel web com `docs/melhorias-mobile.md` e
> `claude-analise/correcoes-e-melhorias-web.txt` (mudanças de contrato feitas para homologação).
> `/auth/ativar` e `/auth/reset-password` são páginas HTML servidas pelo próprio backend —
> **não exigem tela Angular**. Os itens abaixo são os que de fato dependem do painel web.

### 14.1 Login — tratamento de 403 e 429 ✅
- [x] Tratar erro `403` no login (conta não ativada): exibir mensagem e botão "Reenviar e-mail de ativação"
- [x] Botão de reenvio chama `AuthService.reenviarAtivacao(email)` (já existe no service)
- [x] Tratar erro `429` no login: exibir mensagem com tempo de espera lido do header `Retry-After`

### 14.2 Tratamento genérico de 429 ✅
- [x] `httpErrorInterceptor`: adicionar caso para `429` (mensagem padrão + respeitar `Retry-After` quando presente)

### 14.3 Reaceite de Termos de Uso ✅
- [x] `TermosService.statusAceite()` — `GET /termos/aceite/status`
- [x] `TermosService.aceitar(termosId)` — `POST /termos/aceite`
- [x] Verificação após login (no `ShellComponent`): se `aceito = false`, exibir os termos vigentes em dialog bloqueante até o aceite
- [x] `ReaceiteTermosDialog` — dialog dedicado (baseado no mesmo padrão do `PreviewTermosDialogComponent`) com ação "Li e aceito os termos"
- [x] Validado manualmente no browser contra o backend local — dialog aparece com `aceito: false` e fecha após aceite, sem bloquear o dashboard depois

### 14.4 Alterar Senha (conta autenticada) ✅
- [x] `AuthService.alterarSenha(senhaAtual, novaSenha)` — `PUT /auth/senha`
- [x] Nova tela/dialog `AlterarSenhaDialog`, acessível pelo menu do usuário na `TopbarComponent`
- [x] Validador reativo: mínimo 8 caracteres, letras e números, diferente do e-mail (mesma regra do backend)
- [x] Tratar `400` (senha atual incorreta / política não atendida)
- [x] Sucesso encerra todas as sessões, inclusive a atual — `TopbarComponent` chama `logout()` após confirmação

### 14.5 Cooldown de reenvio de ativação ✅
- [x] Desabilitar o botão "Reenviar ativação" por 2 minutos após o clique (contagem regressiva)
- [x] Aplicar em `usuarios-list` (já existente) e no novo botão da tela de login (14.1)
- [x] Validado manualmente no browser: botão desabilita e snackbar de sucesso aparece após reenvio

---

## Etapa 15 — Testes de Homologação

### 15.1 Regressão automatizada ✅
- [x] Rodar `npm test` completo — 251 testes / 50 arquivos, todos passando
- [x] Adicionar testes unitários para os itens novos da Etapa 14 (login 403/429, `TermosService`, `AlterarSenhaDialog`, `ReaceiteTermosDialog`, `httpErrorInterceptor`)
- [x] Corrigidos testes que já estavam quebrados antes da Etapa 14 (mismatch de tipos `ENTRADA`/`SAIDA` vs `ENTRADA_CAIXA`/`SAIDA_CAIXA` em categorias de lançamento; testes de listas com dialog desatualizados após migração para reload via paginação server-side; rótulos de forma de pagamento; item inicial do formulário de lançamento; navegação do formulário de produto após salvar)

### 15.2 Roteiro manual
> Base: `docs/homologacao/sequencia-testes.md`. Executar com `ng serve` local e navegador.

- [x] Login com usuário ROOT real contra o backend local — sem erros de console/rede
- [x] Reaceite de termos — validado end-to-end (dialog aparece com `aceito: false`, aceita e libera o dashboard)
- [x] Alterar senha — dialog abre e valida corretamente (não submetido para não invalidar a sessão de uso corrente)
- [x] Reenvio de convite/ativação com cooldown — validado end-to-end em `/usuarios`
- [x] Dashboard não vem mais zerado — confirmado visualmente (saldo de caixa, a pagar, contas vencidas com valores reais)
- [x] Cenário do roteiro: cadastrar usuário ROOT (empresa) → convidar ADMIN → convidar OPERADOR → validar permissões visíveis no menu
  - ROOT (`camposolution.suporte@gmail.com`) cria a empresa via `POST /auth/registro`, ativa pelo link do e-mail (Brevo) e loga no painel
  - Convite de ADMIN e OPERADOR pelo dialog funcionam; e-mail duplicado é bloqueado com `409` e mensagem exibida corretamente no dialog
  - ADMIN vê o menu sem "Termos" e sem opção de convidar ROOT; ao convidar, só aparece a opção "Operador"
  - OPERADOR loga e só vê "Dashboard" no menu; navegação direta a `/usuarios`, `/termos` etc. é bloqueada pelo `roleGuard` (redireciona para `/dashboard`)
  - **Bug encontrado e corrigido:** `UsuariosListComponent.podeDesativar()` não considerava o papel de quem estava logado — um ADMIN via o botão "Desativar" habilitado inclusive para o ROOT e para outro ADMIN (o backend bloqueava com `403`, mas o front não deveria nem oferecer a ação). Corrigido para respeitar a matriz de papéis (ADMIN só desativa OPERADOR; ninguém desativa a si mesmo ou o SUPER_ROOT); testes atualizados
- [ ] Repetir o cenário acima para uma segunda empresa — validar isolamento entre tenants (não executado nesta rodada; ficou só uma empresa de teste)
- [x] Cadastrar produto (com categoria) e ajustar estoque — funcionou; venda com estoque insuficiente retorna `422` com mensagem clara ("Estoque insuficiente para realizar a operação"), tratada na tela
- [x] Lançamentos `ENTRADA_CAIXA`/`SAIDA_CAIXA` — criados com sucesso (venda vinculada a produto e compra), dashboard atualizou o saldo de caixa corretamente (R$ 15 entrada − R$ 10 saída = R$ 5 exibido)
- [x] Filtros por período (`dataInicio`/`dataFim`) na lista de lançamentos — testado com período que inclui os lançamentos (2 resultados) e período que exclui (0 resultados), sem erros de rede
- [ ] Sessão: login com credenciais erradas (401 genérico), conta não ativada (403 + reenvio), várias tentativas seguidas (429) — não executado para não acionar rate limit na conta real de uso
- [ ] Troca de senha — confirmar logout de todas as sessões (não executado no smoke test para não derrubar a sessão em uso)
- [ ] Publicar nova versão dos termos (Módulo Termos) e validar o fluxo de reaceite em outro usuário logado
- [x] Paginação — controle de paginação presente e funcional na lista de lançamentos (`size=20`); não testado com volume > 100 itens

**Resolvido na Etapa 16:** a dúvida sobre o que o OPERADOR deveria acessar no painel web (antes só via Dashboard, por acidente — rota sem guard) foi resolvida adotando o modelo de permissões centralizadas do backend. Ver Etapa 16.

### 15.3 Acessibilidade
- [ ] Rodar AXE (extensão Chrome) em todas as páginas
- [ ] Corrigir violações encontradas

---

## Etapa 16 — Migração para permissões centralizadas (`permissoes[]`)

> Contexto: o backend centralizou as regras de "quem pode fazer o quê" numa matriz única
> (papel × recurso) e passou a expor isso via `GET /auth/me` → campo `permissoes: string[]`.
> Antes, o front replicava a mesma tabela manualmente com `papel === 'ROOT' || papel === 'ADMIN'`
> espalhado pelo código — sem garantia de sincronia com o backend. Ver
> `claude-analise/correcoes-e-melhorias-web.txt` para o resumo original da mudança.
>
> Os 10 recursos possíveis: `LANCAMENTOS_REGISTRAR`, `FINANCEIRO_CONSULTAR`,
> `CADASTROS_CONSULTAR`, `CADASTROS_GERENCIAR`, `ESTOQUE_GERENCIAR`, `USUARIOS_GERENCIAR`,
> `USUARIOS_ALTERAR_PAPEL`, `TERMOS_GERENCIAR`, `CONTA_PROPRIA`, `ASSINATURA_ENTITLEMENT_QUALQUER`.
>
> **Achado confirmado em `GET /auth/me` real (2026-09-24):** `TERMOS_GERENCIAR` é exclusivo do
> SUPER_ROOT — nem ROOT nem ADMIN têm essa permissão (`POST /termos/admin` retorna `403` pra
> ambos). Isso é uma mudança de comportamento em relação ao texto antigo do plano ("Termos —
> ROOT"), confirmada e assumida por decisão do usuário: "só o super root cria termos".

### 17.1 Modelo e infraestrutura ✅
- [x] `Permissao` (union type com os 10 valores) e `Usuario.permissoes?: Permissao[]` em `usuario.model.ts`
- [x] `AuthService.permissoes` (computed) e `AuthService.hasPermissao(...)` 
- [x] `landing-route.ts` — resolve a primeira rota acessível por prioridade de permissão (usada como destino padrão e como fallback do guard)
- [x] `permission-guard.ts` (substituiu `role.guard.ts`) — `data: { permissao: Permissao }` por rota, redireciona via `landingRoute()` quando nega

### 17.2 Rotas e menu ✅
- [x] `app.routes.ts` — cada rota mapeada pro recurso certo (`dashboard`→`FINANCEIRO_CONSULTAR`, `usuarios`→`USUARIOS_GERENCIAR`, `produtos`/`clientes`/`fornecedores`/`categorias/*`→`CADASTROS_CONSULTAR` (leitura) ou `CADASTROS_GERENCIAR` (escrita, em `/novo` e `/editar`), `estoque`→`ESTOQUE_GERENCIAR`, `termos`→`TERMOS_GERENCIAR`, `lancamentos`→`FINANCEIRO_CONSULTAR`, `lancamentos/novo`→`LANCAMENTOS_REGISTRAR`, `relatorios/margem`→`ESTOQUE_GERENCIAR`)
- [x] `dashboard` passou a ter guard (antes não tinha nenhum — só funcionava aberto a todos por acidente)
- [x] `SidebarComponent` — `NavItem.permissao` no lugar de `roles: Papel[]`

### 17.3 Esconder ações de escrita para quem só tem `CADASTROS_CONSULTAR` ✅
- [x] `produtos-list`, `produto-detail`, `clientes-list`, `fornecedores-list`, `categorias-produto`, `categorias-lancamento` — botões "Novo"/"Editar"/"Desativar" só aparecem com `CADASTROS_GERENCIAR`; "Histórico de estoque" só com `ESTOQUE_GERENCIAR`
- [x] `dashboard` — atalhos rápidos separados por permissão específica (`CADASTROS_GERENCIAR`, `ESTOQUE_GERENCIAR`, `USUARIOS_GERENCIAR`) em vez de um flag único
- [x] `usuarios-list.podeConvidar` — trocado de `hasRole(...)` pra `hasPermissao('USUARIOS_GERENCIAR')`
- [x] `usuarios-list.podeDesativar` **não** virou permissão — continua sendo hierarquia entre papéis (ADMIN só desativa OPERADOR, ninguém desativa a si mesmo ou o SUPER_ROOT), que é uma regra ortogonal à lista de recursos

### 17.4 Validação ✅
- [x] Testes unitários atualizados/criados (`permission-guard.spec.ts`, `sidebar.component.spec.ts`, `dashboard.component.spec.ts`) — suíte completa: 255 testes / 50 arquivos
- [x] Validado no navegador com as 3 contas reais (ROOT, ADMIN, OPERADOR — ver Etapa 15): menu, guard de rota e botões de escrita batendo exatamente com o `permissoes[]` retornado por cada uma
- [ ] SUPER_ROOT não testado no navegador (sem a senha da conta seed) — comportamento assumido a partir do texto do perfil ("não participa do dia a dia operacional"), não confirmado via `GET /auth/me` real

### Resultado prático para o OPERADOR
Antes só via Dashboard (por acidente). Agora vê, de forma intencional: **Dashboard** (escopado ao que ele lançou), **Lançamentos** (listar + criar), e leitura de **Produtos, Clientes, Fornecedores, Cat. Produto, Cat. Lançamento** (sem botões de criar/editar). Continua sem acesso a Estoque, Usuários, Termos e Relatórios de margem.

---

## Etapa 17 — Deploy Final

> Preparação documentada em `docs/deploy-configuracao-manual.md`. Execução fica para depois das Etapas 15 e 16.

- [ ] Revisar `docs/deploy-configuracao-manual.md` e configurar o que for necessário externamente
- [ ] Testar build de produção localmente (`npm run build`)
- [ ] Verificar `dist/phonus-web/browser` gerado corretamente
- [ ] Confirmar URL da API de produção no Vercel (Environment Variables)
- [ ] Validar deploy na `main` — abrir painel em produção
- [ ] Testar login com usuário ROOT em produção
- [ ] Validar redirecionamentos SPA (F5 em rotas internas)

---

## Etapa 18 — Cadastro de empresa pelo web (opção B)

> Decisão (2026-09-29): levar ao web só o formulário de cadastro e a tela "Verifique seu e-mail". A ativação da conta e o
> reset de senha continuam nas páginas HTML do backend. Detalhes de contrato e decisões em
> `docs/plano-implementacao-web.md` (Módulo 1, itens 1.5 a 1.8). Origem: `claude-analise/correcoes-e-melhorias-web.txt`.

### 18.1 Implementação ✅
- [x] `AuthService.registrar(RegistroRequest)` → `POST /auth/registro`; modelo `RegistroRequest` em `auth.model.ts`
- [x] `shared/validators/documento.validator.ts` — CPF/CNPJ pelos dígitos verificadores e validador de grupo que acompanha o `tipoDocumento`
- [x] `RegisterComponent` (`/registro`) — busca `GET /termos/atual`, exige aceite, envia `termosId`; reaproveita `senha.validator.ts` (`senhaForteValidator`, `senhaDiferenteDeEmailValidator`, `senhasConferemValidator`); tratamento de `409`/`400`/`429`
- [x] `VerifyEmailComponent` (`/verifique-email`) — e-mail vem do `navigation state`; sem ele, pede o e-mail; reenvio via `POST /auth/reenviar-ativacao` com contagem de 120 s
- [x] Rotas públicas `registro` e `verifique-email` + link "Criar conta" no login
- [x] Payload sem `cidade`/`estado` (não existem no `OnboardingRequest` do swagger)

### 18.2 Validação ✅
- [x] Testes unitários (validadores, `RegisterComponent`, `VerifyEmailComponent`, `AuthService.registrar`) — suíte completa: 291 testes / 53 arquivos
- [x] Build de produção sem warnings
- [x] Navegador (Playwright/Edge): cadastro real, `/verifique-email`, login `403` antes da ativação, ativação, login e dashboard do ROOT; ver `docs/homologacao/sequencia-testes.md` (2026-09-29)
- [x] axe (WCAG A/AA) sem violações nas duas telas
- [x] Documento duplicado confirmado em dev: `409` `CPF/CNPJ já cadastrado`

### 18.3 Pendências
- [ ] CORS: incluir a origem do web (staging/prod) em `CORS_ALLOWED_ORIGINS` no backend
- [ ] Rate limit e/ou captcha em `/auth/registro` (endpoint público que cria schema) — não documentado no swagger
- [ ] Atualizar o swagger com o `409` de documento duplicado
- [ ] Módulo 12 "Primeiros passos do ROOT" — adiado
- [ ] Migrar ativação/reset para o web — futuro, exige o backend apontar os links do e-mail para o web
- [ ] Termos exibidos em markdown cru (`##`, `**`) — igual ao preview já existente; renderizar markdown é melhoria opcional
- [ ] Contraste dos links "Esqueceu a senha?" e "Criar conta" no login (verde `#0d9f5a` sobre branco, ~3,4:1) — pré-existente, não corrigido

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
| 14 | Correções de Contrato (Homologação) | 1, 9 |
| 15 | Testes de Homologação | 14 |
| 16 | Permissões centralizadas (`permissoes[]`) | 3, 5, 7, 8, 9 |
| 17 | Deploy Final | 15, 16 |
| 18 | Cadastro de empresa pelo web (opção B) | 1, 9, 14 |
