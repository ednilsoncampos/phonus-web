---
name: Phonus Web — Estado do Projeto
description: Contexto completo do projeto Angular, arquitetura, stack e progresso das etapas de desenvolvimento
type: project
---

## O que é o Phonus

SaaS multi-tenant de gestão empresarial (schema-per-tenant no PostgreSQL).
- **Mobile (Android)**: operação diária — lançamentos por voz, caixa, parcelas
- **Web Admin (Angular)**: administração — cadastros, usuários, estoque, relatórios
- **Backend**: Kotlin/Spring Boot — DigitalOcean

O painel web **não tem** lançamentos, baixa de parcelas nem caixa. Essas funções são exclusivas do mobile.

---

## Stack decidida

| Camada | Tecnologia |
|---|---|
| Framework | Angular 21.2.5 (standalone, padrão v20+) |
| Design System | Angular Material 21 — tema M3 com `mat.$green-palette` |
| Linguagem | TypeScript strict |
| Estado local | `signal()`, `computed()` |
| Formulários | Reactive Forms (`FormBuilder`) |
| HTTP | `HttpClient` + `HttpInterceptorFn` |
| Deploy | Vercel (SPA) — CI/CD via `git push` |
| Estilos | SCSS |

---

## Perfis de acesso ao painel web

| Papel | Acessa? | Permissões |
|---|---|---|
| `SUPER_ROOT` | Sim | Irrestrito |
| `ROOT` | Sim | Tudo exceto gerenciar SUPER_ROOT |
| `ADMIN` | Sim | Cadastros + convidar OPERADOR |
| `OPERADOR` | **Não** | Sem acesso |

---

## Padrões obrigatórios (CLAUDE.md)

- `standalone: true` **NÃO** declarar — é padrão no Angular 21
- `@HostBinding` / `@HostListener` → usar objeto `host:` no decorator
- `ngClass` / `ngStyle` → usar `[class]` / `[style]`
- `mutate()` → usar `update()` ou `set()`
- `@Input()` / `@Output()` → usar `input()` / `output()`
- Constructor injection → usar `inject()`
- `*ngIf`, `*ngFor`, `*ngSwitch` → usar `@if`, `@for`, `@switch`
- `ChangeDetectionStrategy.OnPush` em todos os componentes
- Reactive Forms (nunca template-driven)

---

## Estrutura de pastas criada

```
src/app/
  core/
    auth/         → token.service, auth.service, auth.guard, role.guard,
                    jwt.interceptor, token-refresh.interceptor
    api/          → api.service
    models/       → 10 modelos TypeScript (auth, usuario, produto, estoque, etc.)
    services/     → (a preencher nas etapas 2–11)
  features/
    auth/login/           → LoginComponent ✅
    auth/forgot-password/ → ForgotPasswordComponent ✅
    auth/change-password/ → (etapa futura)
    dashboard/            → placeholder ✅ (implementar etapa 2)
    usuarios/             → placeholder ✅ (implementar etapa 3)
    produtos/             → placeholder ✅ (implementar etapa 5)
    estoque/              → placeholder ✅ (implementar etapa 6)
    categorias/           → placeholder ✅ (implementar etapa 4)
    clientes/             → placeholder ✅ (implementar etapa 7)
    fornecedores/         → placeholder ✅ (implementar etapa 8)
    termos/               → placeholder ✅ (implementar etapa 9)
    relatorios/margem/    → placeholder ✅ (implementar etapa 10)
  shared/
    components/   → ConfirmDialog, LoadingSpinner, EmptyState, PageHeader ✅
    pipes/        → CurrencyBrlPipe, DateBrPipe ✅
  layout/
    shell/        → ShellComponent ✅
    topbar/       → TopbarComponent ✅
    sidebar/      → SidebarComponent ✅
src/environments/
  environment.ts      → apiUrl: http://localhost:8080/api/v1
  environment.prod.ts → apiUrl: process.env['NG_APP_API_URL']
src/styles/
  _variables.scss     → variáveis CSS Phonus (--phonus-primary: #16b364, etc.)
  _material-theme.scss → tema M3 Angular Material
```

---

## Progresso das etapas

| Etapa | Descrição | Status |
|---|---|---|
| 0 | Configuração do projeto | ✅ Concluída |
| 1 | Autenticação + Shell | ✅ Concluída |
| 2 | Dashboard | ⬜ Próxima |
| 3 | Usuários | ⬜ |
| 4 | Categorias | ⬜ |
| 5 | Produtos | ⬜ |
| 6 | Estoque | ⬜ |
| 7 | Clientes | ⬜ |
| 8 | Fornecedores | ⬜ |
| 9 | Termos | ⬜ |
| 10 | Relatório de Margem | ⬜ |
| 11 | Assinaturas (view) | ⬜ |
| 12 | Testes Unitários | ⬜ |
| 13 | Qualidade e Acessibilidade | ⬜ |
| 14 | Deploy Final | ⬜ |

---

## API — endpoints chave

- Backend local: `http://localhost:8080/api/v1`
- Backend prod: `process.env['NG_APP_API_URL']` (configurar no Vercel)
- Auth: `POST /auth/login`, `GET /auth/me`, `POST /auth/refresh`, `POST /auth/esqueceu-senha`
- Paginação: `PageResponse<T>` — `{ content, page, size, totalElements, totalPages, last }`
- Endpoints paginados: produtos, clientes, fornecedores, estoque/movimentacoes
- Endpoints sem paginação (array): usuários, categorias, termos

---

## Decisões técnicas tomadas nesta sessão

- `@types/node` instalado como devDependency → `tsconfig.app.json` com `"types": ["node"]`
- `@angular/animations` instalado explicitamente (necessário para `provideAnimationsAsync`)
- Budget do bundle ajustado para `800kB` warning / `1.5MB` error (Material aumenta o bundle)
- Tema Angular Material usa M3 API (`mat.theme()`) com `mat.$green-palette` — não a API M2 do doc original
- Commits: o usuário faz os commits; eu faço apenas `git add` ao fim de cada etapa
- `vercel.json` criado com `"routes": [{ "src": "/(.*)", "dest": "/index.html" }]`
- Output directory Vercel: `dist/phonus-web/browser`

**Why:** Angular 21 usa Vite-based builder e M3 por padrão — a API M2 (define-palette, define-light-theme) do documento de arquitetura é incompatível com a versão instalada.
**How to apply:** Se precisar referenciar theming, usar sempre `mat.theme()` com paletas predefinidas + CSS custom properties Phonus.
