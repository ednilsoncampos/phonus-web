# Plano de Implementação — Phonus Web (Fase 2)

**Criado em:** 2026-03-28
**Contrato de referência:** `docs/backend/swagger-phonus-api-v1.yaml`
**Contexto:** O app mobile cobre o uso operacional (lançamentos, caixa, parcelas, relatórios). A versão web cobre o uso administrativo — cadastros, ajustes, gestão de usuários e configuração da conta.

---

## Stack

| Ponto | Decisão | Status |
|-------|---------|--------|
| Framework | **Angular 18+** com standalone components | ✅ Decidido |
| Design system | **Angular Material 18** | ✅ Decidido |
| Tema | Paleta Phonus: primary `#16B364`, background `#F7F9FC`, error `#F04438` | ✅ Decidido |
| HTTP | `HttpClient` com interceptors para JWT e refresh | ✅ Decidido |
| Formulários | Reactive Forms (`FormBuilder`, `Validators`) | ✅ Decidido |
| Roteamento | Angular Router com guards (`AuthGuard`, `RoleGuard`) | ✅ Decidido |
| Estado | Services com `BehaviorSubject` / `signal()` — sem NgRx | ✅ Decidido |
| Deploy | A definir | ⏳ Pendente |

---

## Perfis de acesso

> Acesso ao painel web restrito a SUPER_ROOT, ROOT e ADMIN. OPERADOR não acessa o painel web.

| Papel | Permissões no painel web |
|-------|--------------------------|
| `SUPER_ROOT` | Acesso irrestrito a todos os módulos |
| `ROOT` | Gestão de usuários (exceto SUPER_ROOT), todos os cadastros, relatório de margem |
| `ADMIN` | Cadastros (produtos, categorias, clientes, fornecedores, estoque), pode convidar OPERADOR |
| `OPERADOR` | ❌ Sem acesso ao painel web |

---

## Módulos

---

### Módulo 0 — Dashboard *(todos os papéis)*

> Similar ao dashboard mobile (`GET /dashboard`), mas com layout adaptado para tela larga e atalhos para os módulos administrativos.

**Endpoint:** `GET /dashboard`

**Response — DashboardResponse:**
```
saldoCaixa, totalAReceber, totalAPagar, produtosAbaixoDoMinimo, contasVencidas
```

**Layout web:**
- Barra lateral de navegação (sidebar) — acesso aos módulos
- Linha de cards de KPIs: Saldo de Caixa · A Receber · A Pagar · Produtos críticos · Contas vencidas
- Cards clicáveis: "Produtos abaixo do mínimo" → abre `/produtos?abaixoDoMinimo=true`; "Contas vencidas" → abre `/contas/receber` com filtro de vencidas
- Atalhos rápidos por papel:
  - ROOT/ADMIN: "Convidar usuário", "Novo produto", "Ajustar estoque"
  - ADMIN: "Novo produto", "Ajustar estoque"

---

### Módulo 1 — Autenticação

> Reutiliza os endpoints já consumidos pelo mobile.

| # | Tela | Endpoints | Notas |
|---|------|-----------|-------|
| 1.1 | Login | `POST /auth/login` | Salva access + refresh tokens |
| 1.2 | Refresh automático | `POST /auth/refresh` | Interceptor em toda requisição |
| 1.3 | Alterar senha | `PUT /auth/senha` → `{ senhaAtual, novaSenha }` | Tratar 422 (senha incorreta) |
| 1.4 | Esqueceu a senha | `POST /auth/esqueceu-senha` → `{ email }` | Exibir mensagem de retorno |

**Campos de resposta relevantes:**
- `GET /auth/me` → `{ id, nome, email, papel, cidade, estado, createdAt }`

---

### Módulo 2 — Gestão de Usuários *(ROOT/ADMIN)*

| # | Tela | Método | Endpoint | Notas |
|---|------|--------|----------|-------|
| 2.1 | Lista de usuários | GET | `/usuarios` | Exibir papel, status ativo/inativo |
| 2.2 | Convidar usuário | POST | `/usuarios` | ROOT convida ADMIN ou OPERADOR; ADMIN convida apenas OPERADOR |
| 2.3 | Desativar usuário | DELETE | `/usuarios/{id}` | Confirmar antes — irreversível para sessões ativas |
| 2.4 | Alterar papel | PATCH | `/usuarios/{id}/papel` | Apenas ROOT; não permite atribuir SUPER_ROOT |
| 2.5 | Detalhes do usuário | GET | `/usuarios/{id}` | — |

**Request — Convidar usuário (`POST /usuarios`):**
```json
{
  "email": "string (required)",
  "nome": "string (required)",
  "papel": "ADMIN | OPERADOR (required)"
}
```

**Response — UsuarioResponse:**
```
id, nome, email, papel (ROOT|ADMIN|OPERADOR), ativo, createdAt
```

**Regras de negócio:**
- Não é possível desativar usuário `SUPER_ROOT`
- Não é possível atribuir papel `SUPER_ROOT` via API
- Um ADMIN não pode alterar o papel de outro ADMIN ou ROOT

---

### Módulo 3 — Cadastro de Produtos *(ROOT/ADMIN)*

| # | Tela | Método | Endpoint | Notas |
|---|------|--------|----------|-------|
| 3.1 | Lista de produtos | GET | `/produtos?ativos=true&abaixoDoMinimo=false` | Filtros: categoria, status, abaixo do mínimo |
| 3.2 | Criar produto | POST | `/produtos` | — |
| 3.3 | Editar produto | PUT | `/produtos/{id}` | — |
| 3.4 | Detalhe do produto | GET | `/produtos/{id}` | — |
| 3.5 | Desativar produto | PATCH | `/produtos/{id}/desativar` | Não remove do banco |
| 3.6 | Histórico do produto | GET | `/estoque/movimentacoes/produto/{id}` | Atalho na tela de detalhe |

**Request — Criar produto (`POST /produtos`):**
```json
{
  "nome": "string (required, max 255)",
  "descricao": "string",
  "categoriaId": "uuid",
  "precoVenda": "int64 em centavos (required)",
  "precoCusto": "int64 em centavos",
  "estoqueMinimo": "number (required)",
  "unidadeMedida": "string (required)",
  "codigoBarras": "string (max 100)",
  "ncm": "string (max 8)",
  "cest": "string (max 7)"
}
```

**Response — ProdutoResponse:**
```
id, nome, descricao, categoriaId, precoVenda, precoCusto,
quantidadeEstoque, estoqueMinimo, abaixoDoMinimo,
unidadeMedida, codigoBarras, ncm, cest, ativo, criadoPor, createdAt, updatedAt
```

**Filtros da listagem:**
- `categoriaId` (uuid) — filtrar por categoria
- `ativos` (boolean, default: true)
- `abaixoDoMinimo` (boolean, default: false)

---

### Módulo 4 — Controle de Estoque *(ROOT/ADMIN)*

| # | Tela | Método | Endpoint | Notas |
|---|------|--------|----------|-------|
| 4.1 | Ajuste manual | POST | `/estoque/ajuste?produtoId={id}` | Positivo ou negativo |
| 4.2 | Histórico geral | GET | `/estoque/movimentacoes` | Filtros: produto, período, origem |
| 4.3 | Histórico por produto | GET | `/estoque/movimentacoes/produto/{id}` | Acessível via detalhe do produto |

**Request — Ajuste de estoque (`POST /estoque/ajuste?produtoId={id}`):**
```json
{
  "tipo": "AJUSTE_POSITIVO | AJUSTE_NEGATIVO (required)",
  "quantidade": "number (min: 0.001, required)",
  "observacao": "string"
}
```

**Response — MovimentacaoEstoqueResponse:**
```
id, produtoId, tipo, quantidade,
origem (VENDA|COMPRA|AJUSTE_POSITIVO|AJUSTE_NEGATIVO),
lancamentoItemId, observacao, criadoPor, createdAt
```

**Filtros do histórico geral:**
- `produtoId` (uuid)
- `dataInicio` / `dataFim` (yyyy-MM-dd)
- `origem` (VENDA | COMPRA | AJUSTE_POSITIVO | AJUSTE_NEGATIVO)

---

### Módulo 5 — Categorias de Produto *(ROOT/ADMIN)*

| # | Tela | Método | Endpoint |
|---|------|--------|----------|
| 5.1 | Lista de categorias | GET | `/categorias-produto?ativas=true` |
| 5.2 | Criar categoria | POST | `/categorias-produto` |
| 5.3 | Editar categoria | PUT | `/categorias-produto/{id}` |

**Request — Criar (`POST /categorias-produto`):**
```json
{ "nome": "string (required, max 100)" }
```

**Request — Editar (`PUT /categorias-produto/{id}`):**
```json
{ "nome": "string (max 100)", "ativo": "boolean" }
```

**Response — CategoriaProdutoResponse:**
```
id, nome, ativo, createdAt
```

---

### Módulo 6 — Categorias de Lançamento *(ROOT/ADMIN)*

| # | Tela | Método | Endpoint |
|---|------|--------|----------|
| 6.1 | Lista de categorias | GET | `/categorias-lancamento?ativas=true` |
| 6.2 | Criar categoria | POST | `/categorias-lancamento` |
| 6.3 | Editar categoria | PUT | `/categorias-lancamento/{id}` |

**Request — Criar (`POST /categorias-lancamento`):**
```json
{
  "nome": "string (required, max 100)",
  "tipo": "string (required)"
}
```

**Request — Editar (`PUT /categorias-lancamento/{id}`):**
```json
{ "nome": "string (max 100)", "tipo": "string", "ativo": "boolean" }
```

**Response — CategoriaLancamentoResponse:**
```
id, nome, tipo, ativo
```

---

### Módulo 7 — Clientes *(ROOT/ADMIN)*

| # | Tela | Método | Endpoint |
|---|------|--------|----------|
| 7.1 | Lista de clientes | GET | `/clientes?ativos=true` |
| 7.2 | Criar cliente | POST | `/clientes` |
| 7.3 | Editar cliente | PUT | `/clientes/{id}` |

**Request — Criar (`POST /clientes`):**
```json
{
  "nome": "string (required)",
  "documento": "string",
  "email": "string",
  "telefone": "string"
}
```

**Request — Editar (`PUT /clientes/{id}`):**
```json
{ "nome": "string", "documento": "string", "email": "string", "telefone": "string", "ativo": "boolean" }
```

**Response — ClienteResponse:**
```
id, nome, documento, email, telefone, ativo, createdAt
```

---

### Módulo 8 — Fornecedores *(ROOT/ADMIN)*

> Estrutura idêntica ao módulo de Clientes.

| # | Tela | Método | Endpoint |
|---|------|--------|----------|
| 8.1 | Lista de fornecedores | GET | `/fornecedores?ativos=true` |
| 8.2 | Criar fornecedor | POST | `/fornecedores` |
| 8.3 | Editar fornecedor | PUT | `/fornecedores/{id}` |

**Request — Criar (`POST /fornecedores`):**
```json
{
  "nome": "string (required)",
  "documento": "string",
  "email": "string",
  "telefone": "string"
}
```

**Response — FornecedorResponse:**
```
id, nome, documento, email, telefone, ativo, createdAt
```

---

### Módulo 9 — Termos de Uso *(ROOT)*

| # | Tela | Método | Endpoint | Notas |
|---|------|--------|----------|-------|
| 9.1 | Lista de versões | GET | `/termos/admin` | Ordem cronológica decrescente |
| 9.2 | Nova versão | POST | `/termos/admin` | Desativa versão anterior automaticamente. 409 se versão já existe |
| 9.3 | Visualizar termos atuais | GET | `/termos/atual` | Endpoint público — preview |

**Request — Criar versão (`POST /termos/admin`):**
```json
{
  "versao": "string (required, max 20)",
  "titulo": "string (required, max 255)",
  "conteudo": "string (required)",
  "declaracaoAceite": "string (required)"
}
```

**Response — TermosAceiteResponse:**
```
id, versao, titulo, conteudo, declaracaoAceite, ativo, createdAt
```

---

### Módulo 10 — Relatório de Margem *(ROOT/ADMIN)*

| # | Tela | Método | Endpoint | Notas |
|---|------|--------|----------|-------|
| 10.1 | Relatório de margem | GET | `/relatorios/margem` | Apenas produtos com `precoCusto` definido |

**Response — RelatorioMargemResponse:**
```
totalProdutos (int),
margemMedia (number — percentual),
itens: [
  { produtoId, nome, precoVenda, precoCusto, margemPercentual }
]
```

**Regras:**
- Ordenado por `margemPercentual` decrescente
- Fórmula: `(precoVenda - precoCusto) / precoVenda × 100`
- Produtos sem `precoCusto` são excluídos do cálculo

---

### Módulo 11 — Assinaturas *(ROOT/ADMIN — visualização)*

| # | Tela | Método | Endpoint | Notas |
|---|------|--------|----------|-------|
| 11.1 | Entitlement do usuário | GET | `/usuarios/{usuarioId}/entitlement` | Atalho na tela de detalhe do usuário |

> `POST /assinaturas/validar` é acionado pelo app mobile após compra na Google Play — não é função do painel web.

**Response — EntitlementResponse:**
```
usuarioId, isPremium (boolean), tier (FREE|PREMIUM),
planoAtual: { id, nome, ... },
expiraEm, diasCortesiaRestantes
```

---

## Ordem de implementação recomendada

```
Módulo 1 (Auth + Login)
    → Módulo 0 (Dashboard)         ← feedback visual imediato
    → Módulo 2 (Usuários)          ← bloqueante: precisa de usuários para testar
    → Módulo 5 (Cat. Produto)      ← necessário antes de cadastrar Produtos
    → Módulo 6 (Cat. Lançamento)   ← necessário para enriquecer lançamentos
    → Módulo 3 (Produtos)          ← depende de Cat. Produto
    → Módulo 4 (Estoque)           ← depende de Produtos
    → Módulo 7 (Clientes)
    → Módulo 8 (Fornecedores)
    → Módulo 9 (Termos)
    → Módulo 10 (Relatório Margem)
    → Módulo 11 (Assinaturas — view)
```

---

## Estrutura de páginas sugerida

```
/login
/dashboard                    ← KPIs + atalhos (GET /dashboard)
/usuarios                     ← lista + convidar (ROOT/ADMIN)
/usuarios/{id}                ← detalhe + alterar papel + entitlement
/produtos                     ← lista com filtros (ativos, categoria, abaixo do mínimo)
/produtos/novo
/produtos/{id}                ← detalhe + histórico de estoque do produto
/produtos/{id}/editar
/estoque                      ← histórico geral + ajuste manual
/categorias/produto           ← lista + criar + editar inline
/categorias/lancamento        ← lista + criar + editar inline
/clientes                     ← lista + criar + editar
/fornecedores                 ← lista + criar + editar
/termos                       ← versões + nova versão (ROOT)
/relatorios/margem            ← ROOT/ADMIN
```

### Layout geral

```
┌─────────────────────────────────────────────────────┐
│  Phonus                              Nome · Sair     │  ← topbar
├──────────────┬──────────────────────────────────────┤
│  Dashboard   │                                       │
│  Usuários    │          Conteúdo da página           │
│  Produtos    │                                       │
│  Estoque     │                                       │
│  Categorias  │                                       │
│  Clientes    │                                       │
│  Fornecedores│                                       │
│  Termos      │                                       │
│  Relatórios  │                                       │
└──────────────┴──────────────────────────────────────┘
```
- Sidebar colapsável em telas menores
- Itens do menu filtrados por papel (ex: Termos só aparece para ROOT)

---

## Pontos em aberto para decisão

- [ ] **Deploy** — Vercel (SSR via @angular/ssr) / Netlify / VPS / Firebase Hosting?
- [ ] **Paginação** — os endpoints retornam arrays sem paginação hoje; avaliar se será necessário para listas grandes (produtos, histórico de estoque) — pode exigir alteração no backend

## Decisões tomadas

| Ponto | Decisão |
|-------|---------|
| Framework | Angular 18+ com standalone components |
| Design system | Angular Material 18 |
| Tema de cores | Paleta Phonus — primary `#16B364`, background `#F7F9FC` |
| Acesso ao painel | SUPER_ROOT, ROOT e ADMIN apenas (OPERADOR excluído) |
| Dashboard | Similar ao mobile, adaptado para layout wide com sidebar |
| Estado global | Services com `BehaviorSubject` / `signal()` — sem NgRx |
