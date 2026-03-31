# ARQUITETURA E FLUXO DE NEGÓCIO — Phonus FC

## Visão do Produto

SaaS de gestão empresarial operado por comando de voz. O usuário fala um evento de negócio (venda, compra, despesa) e o sistema registra o lançamento financeiro e, quando há produto, movimenta o estoque automaticamente.

**Módulos:**
- Controle financeiro (lançamentos, parcelas, contas a receber/pagar)
- Controle de estoque (produtos, movimentações, categorias)
- Gestão de usuários por empresa (ROOT, ADMIN, OPERADOR)
- Assinaturas via Google Play Store

---

## Camadas do Sistema

```
┌─────────────────────────────────────────┐
│           Mobile (Android)              │  ← operação diária, entrada por voz
├─────────────────────────────────────────┤
│           Web Admin (Angular)           │  ← fase 2: relatórios, configurações
├─────────────────────────────────────────┤
│           Backend (Kotlin/Spring Boot)  │  ← regras de negócio, multi-tenant
├─────────────────────────────────────────┤
│           PostgreSQL                    │  ← schema-per-tenant
└─────────────────────────────────────────┘
```

### Backend — Clean Architecture (Hexagonal)

```
adapter/          → Controllers REST, GlobalExceptionHandler
application/      → Use Cases, DTOs (request/response)
domain/           → Modelos, Enums, Interfaces de repositório, Exceções
infrastructure/   → Config Spring, JPA Entities, Mappers, Security
```

`domain/` é Kotlin puro — zero imports de framework. Todas as dependências apontam para dentro.

### Banco de Dados — Schema-per-tenant

```
PostgreSQL
├── public                  ← tabelas globais da plataforma
│   ├── empresa
│   ├── usuario_global
│   ├── planos_assinatura
│   └── termos_aceite
│
├── <schema_empresa_A>      ← dados operacionais exclusivos da empresa A
│   ├── usuario
│   ├── lancamento
│   ├── lancamento_item
│   ├── parcela
│   ├── pagamento
│   ├── produto
│   ├── categoria_produto
│   └── movimentacao_estoque
│
└── <schema_empresa_B>      ← completamente isolado da empresa A
    └── ...
```

---

## Modelo de Usuários

| Papel      | Quem é                  | O que pode fazer                                                   |
|------------|-------------------------|--------------------------------------------------------------------|
| `ROOT`     | Dono da empresa         | Tudo. Gerencia plano, cria/remove ADMIN e OPERADOR, acesso total.  |
| `ADMIN`    | Gerente / sócio         | Operações + gerencia OPERADOR. Não acessa cobrança/assinatura.     |
| `OPERADOR` | Funcionário / caixa     | Registra lançamentos e movimentações. Não gerencia usuários.       |

**Regras de criação:**
- ROOT é único por empresa — criado automaticamente no onboarding
- Somente ROOT pode criar ou promover ADMIN
- ROOT e ADMIN podem criar OPERADOR
- Nenhum papel pode alterar o próprio papel

---

## Fluxos Principais

### 1. Onboarding — Registro de nova empresa

```
App mobile
  │
  ├─ POST /auth/registro  { nome, email, senha, nomeEmpresa, tipoDoc, documento }
  │
Backend
  ├── 1. Valida documento único em public.empresa
  ├── 2. Valida email único em public.usuario_global
  ├── 3. Cria registro em public.empresa
  ├── 4. Cria schema do tenant: CREATE SCHEMA "<schema_name>"
  ├── 5. Aplica migrations Flyway no schema do tenant
  ├── 6. Insere usuario (papel=ROOT, ativo=false) no schema do tenant
  ├── 7. Insere email em public.usuario_global
  ├── 8. Gera token_ativacao
  └── 9. Envia e-mail de ativação
       │
       └─ [passos 3–8 em única transação; falha → DROP SCHEMA CASCADE]

Usuário clica no link
  │
  └─ GET /auth/ativar?token=...
       └── ativo = true → conta liberada para login
```

---

### 2. Login

```
App mobile
  │
  └─ POST /auth/login  { email, senha }
       │
Backend
  ├── 1. Busca email em public.usuario_global → obtém empresa_id → deriva schema_name
  ├── 2. Busca usuario no schema do tenant → valida senha (BCrypt)
  ├── 3. Verifica ativo = true (conta ativada)
  └── 4. Gera JWT:
          {
            sub: "email",
            userId: "uuid",
            empresaId: "uuid",
            papel: "ROOT | ADMIN | OPERADOR",
            exp: ...
          }
```

A partir do JWT, o backend roteia todas as requisições para o schema correto sem consulta adicional ao banco.

---

### 3. Gestão de usuários (ROOT/ADMIN)

```
ROOT ou ADMIN
  │
  └─ POST /usuarios  { nome, email, papel }
       │
Backend
  ├── 1. Valida permissão: ROOT pode criar ROOT/ADMIN/OPERADOR; ADMIN apenas OPERADOR
  ├── 2. Valida email único em public.usuario_global
  ├── 3. Cria usuario no schema do tenant (ativo=false)
  ├── 4. Insere em public.usuario_global
  ├── 5. Gera token_ativacao
  └── 6. Envia e-mail de convite com link de ativação e criação de senha
```

---

### 4. Lançamento financeiro puro

Despesas e receitas sem produto (aluguel, conta de água, receita de serviço, etc.).

```
Usuário (voz ou texto)
  │
  └─ POST /lancamentos
       { tipo, descricao, valorTotal, formaPagamento, origem, dataLancamento, quantidadeParcelas }
       │
Backend (CriarLancamentoUseCase)
  ├── Cria lancamento
  ├── Gera parcelas:
  │     ├── À vista (PIX, DINHEIRO, DÉBITO):
  │     │     parcela status=PAGA + pagamento origem=AUTOMATICO
  │     └── A prazo (CRÉDITO, CHEQUE, PROMISSÓRIA):
  │           parcela status=EM_ABERTO  ← vira conta a receber ou pagar
  └── [sem lancamento_item, sem movimentacao_estoque]
```

---

### 5. Venda de produto

```
Usuário (voz): "Vendi 3 caixas de produto X por 90 reais no crédito"
  │
  └─ POST /lancamentos
       {
         tipo: "ENTRADA",
         descricao: "Venda produto X",
         valorTotal: 9000,
         formaPagamento: "CREDITO",
         origem: "VOZ",
         dataLancamento: "2026-03-26",
         quantidadeParcelas: 1,
         itens: [
           { produtoId: "uuid", quantidade: 3, valorUnitario: 3000 }
         ]
       }
       │
Backend (CriarLancamentoUseCase) — em única transação:
  ├── 1. Cria lancamento (ENTRADA, R$90)
  ├── 2. Cria lancamento_item (produto X, 3 un, valor_unitario=R$30)
  │         valor_unitario pode diferir do produto.preco_venda (desconto/ajuste)
  ├── 3. Cria parcela (EM_ABERTO → conta a receber)
  ├── 4. Cria movimentacao_estoque:
  │         tipo=SAIDA, origem=VENDA, quantidade=3
  │         lancamento_item_id=<id do item criado>
  └── 5. Atualiza produto.quantidade_estoque -= 3
```

---

### 6. Compra de produto

```
Usuário: "Comprei 10 unidades de produto Y por 200 reais no PIX"
  │
  └─ POST /lancamentos
       {
         tipo: "SAIDA",
         descricao: "Compra produto Y",
         valorTotal: 20000,
         formaPagamento: "PIX",
         origem: "TEXTO",
         itens: [
           { produtoId: "uuid", quantidade: 10, valorUnitario: 2000 }
         ]
       }
       │
Backend — em única transação:
  ├── 1. Cria lancamento (SAIDA, R$200)
  ├── 2. Cria lancamento_item (produto Y, 10 un, valor_unitario=R$20)
  ├── 3. Cria parcela (PAGA) + pagamento (AUTOMATICO) ← PIX é à vista
  ├── 4. Cria movimentacao_estoque:
  │         tipo=ENTRADA, origem=COMPRA, quantidade=10
  ├── 5. Atualiza produto.quantidade_estoque += 10
  └── 6. Atualiza produto.preco_custo = R$20 ← custo da última compra
```

---

### 7. Baixar conta a receber / conta a pagar

```
Usuário
  │
  └─ POST /parcelas/{id}/baixar  { valorPago, dataPagamento }
       │
Backend (BaixarParcelaUseCase)
  ├── 1. Valida que a parcela pertence ao tenant do usuário autenticado
  ├── 2. Valida que parcela.status = EM_ABERTO
  ├── 3. Cria pagamento (origem=MANUAL)
  └── 4. Atualiza parcela.status = PAGA
```

---

### 8. Ajuste de estoque

Correção manual sem transação financeira (sobra/perda de inventário, vencimento de produto).

```
Usuário
  │
  └─ POST /estoque/ajuste
       { produtoId, tipo: "ENTRADA|SAIDA", quantidade, origem: "AJUSTE_POSITIVO|AJUSTE_NEGATIVO", observacao }
       │
Backend (AjustarEstoqueUseCase)
  ├── 1. Cria movimentacao_estoque (lancamento_item_id = null)
  └── 2. Atualiza produto.quantidade_estoque
```

---

### 9. Fluxo de comando de voz

```
Usuário fala no app
  │
App (STT — Speech to Text do SO)
  │
  └─ Texto transcrito → POST /lancamentos/interpretar  { texto: "vendi 3 caixas..." }
       │
Backend (InterpretarTextoUseCase)
  ├── Parser analisa o texto e extrai:
  │     tipo, descricao, valor, formaPagamento, produto (se mencionado), quantidade
  ├── Retorna InterpretarLancamentoResponse (preview para o usuário confirmar)
  │
App exibe preview para confirmação
  │
Usuário confirma
  └─ POST /lancamentos  { dados do preview confirmado }
       └── Segue fluxo normal (item 4, 5 ou 6 acima)
```

O backend nunca salva diretamente da interpretação — o usuário sempre confirma antes de persistir.

---

## Segurança

| Camada | Mecanismo |
|--------|-----------|
| Autenticação | JWT stateless (HMAC-SHA256, mínimo 256 bits) |
| Autorização | `@PreAuthorize` por papel nos controllers |
| Isolamento de dados | Schema separado por tenant |
| Senhas | BCrypt |
| Rate limiting | Filtro por IP nas rotas públicas |
| CORS | Configurável via `CORS_ALLOWED_ORIGINS` |

**Princípios:**
- Backend nunca confia no frontend para definir o tenant — o `empresaId` vem sempre do JWT
- `papel` no JWT é validado em cada requisição
- APK distribuído exclusivamente via Play Store

---

## Monetização

### Plano Individual — Google Play Store

- Assinatura processada via Play Store (faturamento Google)
- Ao comprar, app envia `purchaseToken` ao backend
- Backend valida com Google Play API e ativa `plano_tier = PREMIUM` na empresa
- Webhooks RTDN notificam renovação, cancelamento e expiração
- Vinculado ao usuário ROOT da empresa

### Plano Empresarial — fase futura

- Cobrança gerenciada pelo backend
- Controle por número de usuários e funcionalidades habilitadas

---

## Estratégia de Evolução

### Fase 1 — Mobile + Backend (atual)

- App Android + API Kotlin/Spring Boot
- Controle financeiro completo
- Controle de estoque
- Autenticação com ativação por e-mail
- Assinatura via Play Store
- Multi-tenant com schema-per-tenant

### Fase 2 — Web Admin (Angular)

- Painel web para ROOT/ADMIN
- Relatórios avançados
- Gestão de usuários via browser
- Configurações da empresa

### Fase 3 — Plataforma SaaS Completa

- Integrações externas (NF-e, contabilidade)
- Clientes e fornecedores
- Schema/banco dedicado para tenants de alto volume
- Escalabilidade horizontal do backend
