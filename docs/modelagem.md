# MODELAGEM DE DADOS — Phonus FC (SaaS Multi-tenant)

## Visão Geral

Banco de dados PostgreSQL com estratégia **schema-per-tenant**: cada empresa possui seu próprio schema isolado dentro do mesmo banco. Tabelas globais (compartilhadas entre todas as empresas) ficam no schema `public`.

**Objetivos:**
- Multiempresa (multi-tenant) com isolamento real de dados
- Controle financeiro (lançamentos, parcelas, pagamentos)
- Controle de estoque (produtos, movimentações)
- Multiusuário com hierarquia de permissões por empresa
- Assinaturas via Google Play Store

---

## Estratégia de Multi-tenancy

### Schema público (`public`)

Contém tabelas globais da plataforma — compartilhadas entre todas as empresas:

| Tabela              | Descrição                                              |
|---------------------|--------------------------------------------------------|
| `empresa`           | Registro de cada empresa (tenant)                      |
| `usuario_global`    | Mapa de e-mail → empresa (lookup para autenticação)    |
| `planos_assinatura` | Planos disponíveis (FREE, PREMIUM)                     |
| `termos_aceite`     | Versões dos termos de uso da plataforma                |

### Schema do tenant

Cada empresa possui um schema próprio, cujo nome é o UUID da empresa (ex: `"a1b2c3d4-..."`).

Contém todos os dados operacionais daquela empresa:

| Tabela                  | Descrição                                  |
|-------------------------|--------------------------------------------|
| `usuario`               | Usuários da empresa (ROOT, ADMIN, OPERADOR)|
| `token_ativacao`        | Tokens de ativação de conta                |
| `token_reset_senha`     | Tokens de redefinição de senha             |
| `usuario_aceite_termos` | Registro de aceite dos termos por usuário  |
| `assinaturas_usuario`   | Assinaturas Google Play da empresa         |
| `categoria_lancamento`  | Categorias de lançamento financeiro        |
| `lancamento`            | Lançamentos financeiros                    |
| `parcela`               | Parcelas de cada lançamento                |
| `pagamento`             | Registros de pagamento de parcelas         |
| `produto`               | Produtos do estoque                        |
| `movimentacao_estoque`  | Entradas e saídas de estoque               |

> Não há foreign keys entre schemas. Referências cruzadas (ex: `termos_aceite`) são armazenadas como UUID sem FK formal e validadas na camada de aplicação.

---

## Schema `public` — Tabelas Globais

### `empresa`

Representa cada tenant da plataforma.

```sql
CREATE TABLE public.empresa (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    nome            VARCHAR(150) NOT NULL,
    tipo_documento  VARCHAR(4)   NOT NULL CHECK (tipo_documento IN ('CPF', 'CNPJ')),
    documento       VARCHAR(20)  NOT NULL UNIQUE,
    schema_name     VARCHAR(100) NOT NULL UNIQUE,  -- nome do schema PostgreSQL desta empresa
    plano_tier      VARCHAR(50)  NOT NULL DEFAULT 'FREE'
                        CHECK (plano_tier IN ('FREE', 'PREMIUM')),
    status          VARCHAR(20)  NOT NULL DEFAULT 'ATIVO'
                        CHECK (status IN ('ATIVO', 'INATIVO', 'BLOQUEADO')),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

> `schema_name` é o nome do schema PostgreSQL criado para essa empresa. Pode ser o UUID sem hifens (ex: `t_a1b2c3d4e29b41d4a716446655440000`) para garantir validade de identificador SQL.
>
> `plano_tier` é atualizado pelo backend sempre que o status da assinatura muda.

---

### `usuario_global`

Tabela de lookup: mapeia e-mail para empresa. Permite que o backend identifique o tenant de um usuário durante login, reset de senha e ativação, sem varrer todos os schemas.

**Regra:** e-mails são únicos na plataforma inteira. Um mesmo endereço não pode existir em duas empresas.

```sql
CREATE TABLE public.usuario_global (
    email       VARCHAR(150) PRIMARY KEY,
    empresa_id  UUID         NOT NULL REFERENCES public.empresa(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usuario_global_empresa_id ON public.usuario_global(empresa_id);
```

---

### `planos_assinatura`

Planos comerciais disponíveis. Gerenciado pelo time da plataforma.

```sql
CREATE TABLE public.planos_assinatura (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    google_product_id   VARCHAR(150) NOT NULL UNIQUE,
    nome                VARCHAR(255) NOT NULL,
    descricao           VARCHAR(500),
    tier                VARCHAR(50)  NOT NULL CHECK (tier IN ('FREE', 'PREMIUM')),
    periodo_cobranca    VARCHAR(50)  NOT NULL CHECK (periodo_cobranca IN ('MONTHLY', 'YEARLY')),
    preco               BIGINT       NOT NULL,  -- em centavos (ex: R$ 9,99 = 999)
    moeda               VARCHAR(10)  NOT NULL DEFAULT 'BRL',
    ativo               BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

---

### `termos_aceite`

Versões dos termos de uso da plataforma. Apenas uma versão pode estar ativa por vez.

```sql
CREATE TABLE public.termos_aceite (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    versao            VARCHAR(20)  NOT NULL UNIQUE,
    titulo            VARCHAR(255) NOT NULL,
    conteudo          TEXT         NOT NULL,
    declaracao_aceite TEXT         NOT NULL,
    ativo             BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_termos_ativo_unico ON public.termos_aceite(ativo) WHERE ativo = TRUE;
```

---

## Schema do tenant — Tabelas Operacionais

> As definições abaixo são aplicadas via Flyway em cada schema de tenant.
> O schema é criado no momento do onboarding (registro de nova empresa).

### `usuario`

Usuários da empresa. O primeiro usuário criado recebe `papel = ROOT` automaticamente.

```sql
CREATE TABLE usuario (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    nome        VARCHAR(150) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    senha_hash  VARCHAR(255) NOT NULL,
    cidade      VARCHAR(120),
    estado      VARCHAR(80),
    papel       VARCHAR(20)  NOT NULL
                    CHECK (papel IN ('ROOT', 'ADMIN', 'OPERADOR')),
    ativo       BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usuario_email ON usuario(email);
```

**Papéis:**

| Papel      | Descrição                                                                     |
|------------|-------------------------------------------------------------------------------|
| `ROOT`     | Dono da empresa. Gerencia plano, usuários e tem acesso total. Único por tenant.|
| `ADMIN`    | Gestão operacional. Pode gerenciar usuários OPERADOR. Não gerencia cobrança.   |
| `OPERADOR` | Executa operações do dia a dia (lançamentos, estoque). Criado pelo ROOT/ADMIN. |

> Somente ROOT pode criar/promover ADMIN. ROOT e ADMIN podem criar OPERADOR.

---

### `token_ativacao`

```sql
CREATE TABLE token_ativacao (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id  UUID         NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    token       VARCHAR(255) NOT NULL UNIQUE,
    expira_em   TIMESTAMPTZ  NOT NULL,
    usado       BOOLEAN      NOT NULL DEFAULT FALSE,
    usado_em    TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_token_ativacao_token      ON token_ativacao(token);
CREATE INDEX idx_token_ativacao_usuario_id ON token_ativacao(usuario_id, usado);
```

---

### `token_reset_senha`

```sql
CREATE TABLE token_reset_senha (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id  UUID         NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    token       VARCHAR(255) NOT NULL UNIQUE,
    expira_em   TIMESTAMPTZ  NOT NULL,
    usado       BOOLEAN      NOT NULL DEFAULT FALSE,
    usado_em    TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_token_reset_senha_token      ON token_reset_senha(token);
CREATE INDEX idx_token_reset_senha_usuario_id ON token_reset_senha(usuario_id, usado);
```

---

### `usuario_aceite_termos`

Registro de aceite dos termos por cada usuário. `termos_id` referencia `public.termos_aceite` sem FK formal (cross-schema).

```sql
CREATE TABLE usuario_aceite_termos (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id       UUID        NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    termos_id        UUID        NOT NULL,  -- ref. a public.termos_aceite (sem FK formal)
    termos_versao    VARCHAR(20) NOT NULL,  -- snapshot da versão aceita
    declaracao_lida  TEXT        NOT NULL,  -- snapshot do texto exibido ao usuário
    accepted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_usuario_termos UNIQUE (usuario_id, termos_id)
);

CREATE INDEX idx_aceite_usuario_id ON usuario_aceite_termos(usuario_id);
```

---

### `assinaturas_usuario`

Assinatura Google Play vinculada ao ROOT da empresa. Ao processar webhook RTDN, o backend atualiza `public.empresa.plano_tier`.

```sql
CREATE TABLE assinaturas_usuario (
    id                        UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id                UUID         NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    plano_id                  UUID         NOT NULL,  -- ref. a public.planos_assinatura (sem FK formal)
    purchase_token            VARCHAR(500) NOT NULL UNIQUE,
    order_id                  VARCHAR(255),
    status                    VARCHAR(50)  NOT NULL
                                  CHECK (status IN ('PURCHASED', 'PENDING', 'CANCELED', 'EXPIRED')),
    tipo_notificacao          VARCHAR(60),
    inicio_em                 TIMESTAMPTZ,
    expira_em                 TIMESTAMPTZ,
    renovacao_automatica      BOOLEAN      NOT NULL DEFAULT FALSE,
    reconhecida               BOOLEAN      NOT NULL DEFAULT FALSE,
    purchase_token_vinculado  VARCHAR(500),
    cancelado_em              TIMESTAMPTZ,
    created_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assinatura_usuario_id ON assinaturas_usuario(usuario_id);
CREATE INDEX idx_assinatura_status     ON assinaturas_usuario(usuario_id, status);
CREATE INDEX idx_assinatura_token      ON assinaturas_usuario(purchase_token);
```

---

### `categoria_lancamento`

Categorias de lançamento financeiro definidas pela empresa. Permite agrupar e filtrar lançamentos por natureza (Aluguel, Salários, Vendas, Matéria-prima, etc.).

```sql
CREATE TABLE categoria_lancamento (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    nome       VARCHAR(100) NOT NULL UNIQUE,
    tipo       VARCHAR(10)  NOT NULL CHECK (tipo IN ('ENTRADA', 'SAIDA', 'AMBOS')),
    ativo      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categoria_lancamento_tipo  ON categoria_lancamento(tipo);
CREATE INDEX idx_categoria_lancamento_ativo ON categoria_lancamento(ativo) WHERE ativo = TRUE;
```

> `tipo` delimita quais categorias aparecem para o usuário conforme o tipo do lançamento que está sendo criado.

---

### `lancamento`

Evento financeiro — representa qualquer movimentação de dinheiro na empresa, originado por voz ou texto.

`lancamento` é um conceito puramente financeiro e não conhece produtos. Quando uma venda ou compra envolve produto, a `movimentacao_estoque` é gerada pelo backend e referencia o `lancamento` pelo lado dela.

```sql
CREATE TABLE lancamento (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id        UUID         NOT NULL REFERENCES usuario(id),
    tipo              VARCHAR(10)  NOT NULL CHECK (tipo IN ('ENTRADA', 'SAIDA')),
    descricao         TEXT         NOT NULL,
    valor_total       BIGINT       NOT NULL,  -- em centavos
    forma_pagamento   VARCHAR(30)  NOT NULL
                          CHECK (forma_pagamento IN ('PIX', 'DINHEIRO', 'DEBITO', 'CREDITO', 'CHEQUE', 'PROMISSORIA')),
    origem            VARCHAR(10)  NOT NULL CHECK (origem IN ('VOZ', 'TEXTO')),
    data_lancamento   DATE         NOT NULL,
    categoria_id      UUID         REFERENCES categoria_lancamento(id),  -- nullable
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_lancamento_usuario   FOREIGN KEY (usuario_id)   REFERENCES usuario(id),
    CONSTRAINT fk_lancamento_categoria FOREIGN KEY (categoria_id) REFERENCES categoria_lancamento(id)
);

CREATE INDEX idx_lancamento_usuario_id      ON lancamento(usuario_id);
CREATE INDEX idx_lancamento_data_lancamento ON lancamento(data_lancamento);
CREATE INDEX idx_lancamento_tipo            ON lancamento(tipo);
CREATE INDEX idx_lancamento_categoria_id    ON lancamento(categoria_id) WHERE categoria_id IS NOT NULL;
```

---

### `parcela`

```sql
CREATE TABLE parcela (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    lancamento_id    UUID        NOT NULL REFERENCES lancamento(id) ON DELETE CASCADE,
    numero_parcela   INTEGER     NOT NULL,
    total_parcelas   INTEGER     NOT NULL,
    valor_parcela    BIGINT      NOT NULL,  -- em centavos
    data_vencimento  DATE        NOT NULL,
    status           VARCHAR(20) NOT NULL CHECK (status IN ('EM_ABERTO', 'PAGA')),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_parcela_lancamento_id   ON parcela(lancamento_id);
CREATE INDEX idx_parcela_data_vencimento ON parcela(data_vencimento);
CREATE INDEX idx_parcela_status          ON parcela(status);
```

**Regras:**
- Pagamentos à vista (PIX, DINHEIRO, DÉBITO): parcela criada com `status = PAGA`, `pagamento` gerado automaticamente com `origem = AUTOMATICO`.
- Pagamentos a prazo (CRÉDITO, CHEQUE, PROMISSÓRIA): parcelas criadas com `status = EM_ABERTO`.
- Divisão do valor: inteira por parcela; resto adicionado à última parcela.
- Vencimentos: primeira parcela na `data_lancamento`, demais +1 mês cada.

---

### `pagamento`

```sql
CREATE TABLE pagamento (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    parcela_id      UUID        NOT NULL REFERENCES parcela(id) ON DELETE CASCADE,
    tipo_pagamento  VARCHAR(30) NOT NULL
                        CHECK (tipo_pagamento IN ('PIX', 'DINHEIRO', 'DEBITO', 'CREDITO', 'CHEQUE', 'PROMISSORIA')),
    origem          VARCHAR(20) NOT NULL CHECK (origem IN ('AUTOMATICO', 'MANUAL')),
    valor_pago      BIGINT      NOT NULL,  -- em centavos
    data_pagamento  DATE        NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pagamento_parcela_id     ON pagamento(parcela_id);
CREATE INDEX idx_pagamento_data_pagamento ON pagamento(data_pagamento);
```

---

### `lancamento_item`

Itens de um lançamento quando ele envolve produtos. Ausente em lançamentos puramente financeiros (despesas, receitas sem produto).

```sql
CREATE TABLE lancamento_item (
    id                       UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    lancamento_id            UUID           NOT NULL REFERENCES lancamento(id) ON DELETE CASCADE,
    produto_id               UUID           NOT NULL REFERENCES produto(id),
    quantidade               NUMERIC(10,3)  NOT NULL CHECK (quantidade > 0),  -- suporta KG, L, M
    valor_unitario_original  BIGINT         NOT NULL,  -- em centavos: snapshot do preco_venda no momento
    desconto                 BIGINT         NOT NULL DEFAULT 0,  -- em centavos: desconto total no item
    valor_unitario           BIGINT         NOT NULL,  -- em centavos: preço efetivo = original - desconto/quantidade
    custo_unitario           BIGINT,                   -- em centavos: snapshot do preco_custo no momento da venda (nullable: pode ser desconhecido)
    created_at               TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lancamento_item_lancamento_id ON lancamento_item(lancamento_id);
CREATE INDEX idx_lancamento_item_produto_id    ON lancamento_item(produto_id);
```

**Campos de valor:**

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| `valor_unitario_original` | Sim | Snapshot de `produto.preco_venda` no momento da operação |
| `desconto` | Sim | Desconto total concedido no item (em centavos). Permite relatório de descontos. |
| `valor_unitario` | Sim | Preço efetivo cobrado por unidade após desconto. Usado no total do lançamento. |
| `custo_unitario` | Não | Snapshot de `produto.preco_custo` no momento da venda. Nullable: desconhecido se produto nunca foi comprado. Usado no cálculo do CMV. |

> `lancamento.valor_total` = `SUM(item.quantidade × item.valor_unitario)` — validado pelo backend antes de salvar.
>
> Percentuais no domínio Kotlin usam `BigDecimal`:
> - Desconto %: `desconto / (valor_unitario_original * quantidade) * 100`
> - Margem bruta %: `(valor_unitario - custo_unitario) / valor_unitario * 100`

---

### `categoria_produto`

Categorias de produto definidas pela própria empresa. Cada tenant gerencia as suas.

```sql
CREATE TABLE categoria_produto (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    nome       VARCHAR(100) NOT NULL UNIQUE,
    ativo      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categoria_produto_ativo ON categoria_produto(ativo) WHERE ativo = TRUE;
```

---

### `produto`

```sql
CREATE TABLE produto (
    id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    nome                VARCHAR(255)  NOT NULL,
    descricao           TEXT,
    categoria_id        UUID          REFERENCES categoria_produto(id),
    preco_venda         BIGINT        NOT NULL DEFAULT 0,  -- em centavos; padrão na venda
    preco_custo         BIGINT,                            -- em centavos; nullable; atualizado na compra
    quantidade_estoque  NUMERIC(10,3) NOT NULL DEFAULT 0,  -- suporta frações (KG, L, M)
    estoque_minimo      NUMERIC(10,3) NOT NULL DEFAULT 0,  -- alerta quando quantidade_estoque <= estoque_minimo
    unidade_medida      VARCHAR(20)   NOT NULL DEFAULT 'UN'
                            CHECK (unidade_medida IN ('UN', 'KG', 'L', 'M', 'M2', 'CX', 'PCT')),
    codigo_barras       VARCHAR(100),
    ncm                 VARCHAR(8),   -- nullable; Nomenclatura Comum do Mercosul (para NF-e)
    cest                VARCHAR(7),   -- nullable; Código Especificador da Substituição Tributária
    ativo               BOOLEAN       NOT NULL DEFAULT TRUE,
    criado_por          UUID          NOT NULL REFERENCES usuario(id),
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_produto_ativo         ON produto(ativo) WHERE ativo = TRUE;
CREATE INDEX idx_produto_categoria_id  ON produto(categoria_id) WHERE categoria_id IS NOT NULL;
CREATE INDEX idx_produto_codigo_barras ON produto(codigo_barras) WHERE codigo_barras IS NOT NULL;
```

**Campos de preço e estoque:**

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| `preco_venda` | Sim | Preço pré-definido. Usado como `valor_unitario_original` padrão na venda. |
| `preco_custo` | Não | Custo de referência da última compra. Atualizado automaticamente na compra. |
| `quantidade_estoque` | Sim | Saldo atual. `NUMERIC(10,3)` para suportar KG, L, M. |
| `estoque_minimo` | Sim | Ponto de reposição. Query "produtos abaixo do mínimo" usa `quantidade_estoque <= estoque_minimo`. |
| `ncm` / `cest` | Não | Códigos fiscais brasileiros. Nullable agora; obrigatório na integração NF-e (Fase 3). |

**Preços reais por transação** ficam em `lancamento_item`:
- Lançamento ENTRADA (venda): `valor_unitario_original` = snapshot de `preco_venda`
- Lançamento SAIDA (compra): `valor_unitario` = custo pago → atualiza `preco_custo`

> `quantidade_estoque` e `preco_custo` são atualizados automaticamente pelo backend a cada operação. Nunca devem ser alterados diretamente fora dos use cases de movimentação.

---

### `movimentacao_estoque`

Registro imutável de toda entrada ou saída de estoque.

```sql
CREATE TABLE movimentacao_estoque (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    produto_id          UUID        NOT NULL REFERENCES produto(id),
    tipo                VARCHAR(10) NOT NULL CHECK (tipo IN ('ENTRADA', 'SAIDA')),
    quantidade          NUMERIC(10,3) NOT NULL CHECK (quantidade > 0),  -- suporta KG, L, M
    origem              VARCHAR(20)   NOT NULL
                            CHECK (origem IN ('VENDA', 'COMPRA', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO')),
    lancamento_item_id  UUID,  -- preenchido quando gerado a partir de um item de lançamento
    observacao          TEXT,
    criado_por          UUID        NOT NULL REFERENCES usuario(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_movimentacao_lancamento_item FOREIGN KEY (lancamento_item_id) REFERENCES lancamento_item(id)
);

CREATE INDEX idx_movimentacao_produto_id          ON movimentacao_estoque(produto_id);
CREATE INDEX idx_movimentacao_lancamento_item_id  ON movimentacao_estoque(lancamento_item_id) WHERE lancamento_item_id IS NOT NULL;
CREATE INDEX idx_movimentacao_created_at          ON movimentacao_estoque(created_at);
```

**Origens:**

| Origem            | Tipo no estoque | `lancamento_item_id` | Descrição                               |
|-------------------|-----------------|----------------------|-----------------------------------------|
| `VENDA`           | SAIDA           | Preenchido           | Produto vendido — lançamento ENTRADA    |
| `COMPRA`          | ENTRADA         | Preenchido           | Produto comprado — lançamento SAIDA     |
| `AJUSTE_POSITIVO` | ENTRADA         | NULL                 | Correção manual: sobra de inventário    |
| `AJUSTE_NEGATIVO` | SAIDA           | NULL                 | Correção manual: perda, vencimento      |

> O tipo da movimentação de estoque é **sempre oposto** ao tipo do lançamento financeiro: venda gera dinheiro entrando (ENTRADA financeira) e produto saindo (SAIDA de estoque).

---

## Relacionamentos

```
public.empresa ──< tenant.usuario
                └─< tenant.assinaturas_usuario (via usuario ROOT)

tenant.usuario ──< tenant.lancamento
                └─< tenant.produto (criado_por)
                └─< tenant.movimentacao_estoque (criado_por)

tenant.categoria_lancamento ──< tenant.lancamento
tenant.categoria_produto    ──< tenant.produto

tenant.lancamento ──< tenant.parcela ──< tenant.pagamento
tenant.lancamento ──< tenant.lancamento_item ──< tenant.movimentacao_estoque
tenant.produto    ──< tenant.lancamento_item
tenant.produto    ──< tenant.movimentacao_estoque
```

`lancamento` e `produto` não se relacionam diretamente. O elo entre evento financeiro e evento de estoque passa por `lancamento_item`, que une os dois domínios.

Lançamentos sem produto (despesas, receitas puras) simplesmente não possuem `lancamento_item`.

---

## Conceitos Financeiros

Não existem tabelas separadas para "Conta a Receber" ou "Conta a Pagar". Esses conceitos são **consultas** sobre as tabelas existentes.

### Conta a Receber

Lançamentos de entrada que ainda não foram totalmente pagos.

```sql
-- Parcelas em aberto de lançamentos de entrada (dinheiro a receber)
SELECT l.id, l.descricao, l.valor_total, p.valor_parcela, p.data_vencimento
FROM lancamento l
JOIN parcela p ON p.lancamento_id = l.id
WHERE l.tipo = 'ENTRADA'
  AND p.status = 'EM_ABERTO';
```

### Conta a Pagar

Lançamentos de saída que ainda não foram totalmente pagos.

```sql
-- Parcelas em aberto de lançamentos de saída (dinheiro a pagar)
SELECT l.id, l.descricao, l.valor_total, p.valor_parcela, p.data_vencimento
FROM lancamento l
JOIN parcela p ON p.lancamento_id = l.id
WHERE l.tipo = 'SAIDA'
  AND p.status = 'EM_ABERTO';
```

A operação de "baixar" uma conta a receber ou pagar é o `BaixarParcelaUseCase` — registra o `pagamento` e marca a `parcela` como `PAGA`.

### Três visões financeiras

| Visão              | O que representa                        | Fonte de dados                      |
|--------------------|-----------------------------------------|-------------------------------------|
| **Fluxo de caixa** | Só o que efetivamente entrou/saiu       | `pagamento`                         |
| **A receber/pagar**| Compromissos futuros em aberto          | `lancamento + parcela (EM_ABERTO)`  |
| **Competência**    | Tudo lançado, pago ou não               | `lancamento`                        |

---

## Autenticação e JWT

### Fluxo de login

1. Backend recebe e-mail → consulta `public.usuario_global` → obtém `empresa_id` → deriva `schema_name`
2. Busca `usuario` no schema do tenant pelo e-mail → valida senha
3. Gera JWT com as claims abaixo

### Payload do JWT

```json
{
  "sub": "email@empresa.com",
  "userId": "uuid-do-usuario",
  "empresaId": "uuid-da-empresa",
  "papel": "ROOT",
  "iat": 1234567890,
  "exp": 1234571490
}
```

> `empresaId` e `papel` no JWT evitam round-trips ao banco em cada requisição. O backend deriva o `schema_name` a partir do `empresaId` sem consulta adicional.

---

## Onboarding — Criação de Tenant

Sequência executada pelo backend durante o registro de nova empresa:

1. Validar documento (CPF/CNPJ) — único na plataforma
2. Validar e-mail — único na plataforma (`public.usuario_global`)
3. Criar registro em `public.empresa`
4. Criar schema do tenant: `CREATE SCHEMA "<schema_name>"`
5. Aplicar migrations Flyway no schema do tenant
6. Inserir `usuario` (papel `ROOT`, `ativo = false`) no schema do tenant
7. Inserir entrada em `public.usuario_global`
8. Gerar `token_ativacao` no schema do tenant
9. Enviar e-mail de ativação

> Os passos 3–8 devem ser executados em uma única transação. Se qualquer etapa falhar, o schema criado deve ser removido via `DROP SCHEMA "<schema_name>" CASCADE`.

---

## Auditoria

Campos obrigatórios em todas as tabelas operacionais:

| Campo        | Tipo        | Obrigatório |
|--------------|-------------|-------------|
| `created_at` | TIMESTAMPTZ | Sim         |
| `updated_at` | TIMESTAMPTZ | Sim (quando aplicável) |
| `criado_por` | UUID (FK)   | Sim (tabelas de negócio) |

`movimentacao_estoque` é imutável por design — sem `updated_at`.

---

## Evolução Futura

### Cliente e Fornecedor (Fase 2)

Tabelas a serem adicionadas no schema do tenant:

```
cliente    (id, nome, telefone, documento, email, created_at)
fornecedor (id, nome, contato, documento, email, created_at)
```

`lancamento` ganhará colunas opcionais `cliente_id` e `fornecedor_id`.

### Inventário Formal (Fase 2)

Agrupa ajustes de uma contagem física em um único evento rastreável, substituindo ajustes avulsos.

```sql
CREATE TABLE inventario (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    realizado_em DATE        NOT NULL,
    status       VARCHAR(20) NOT NULL CHECK (status IN ('EM_ANDAMENTO', 'FINALIZADO')),
    observacao   TEXT,
    criado_por   UUID        NOT NULL REFERENCES usuario(id),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

`movimentacao_estoque` ganhará `inventario_id UUID` nullable — as correções de um inventário ficam agrupadas sob o mesmo evento.

---

### Schema dedicado para tenants grandes (Fase 3)

Tenants com alto volume podem ser migrados para um banco PostgreSQL próprio. A lógica de roteamento no backend abstrai isso via `DataSource` dinâmico por `empresaId`.

### Row Level Security (complementar)

Pode ser habilitado no schema `public` como segunda camada de defesa:

```sql
ALTER TABLE public.usuario_global ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON public.usuario_global
USING (empresa_id = current_setting('app.empresa_id')::uuid);
```

O backend executa `SET app.empresa_id = '<id>'` ao início de cada request após autenticação.
