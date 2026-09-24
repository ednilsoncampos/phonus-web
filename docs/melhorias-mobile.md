# Mudanças na API — resumo para o app mobile

> **Data:** 2026-09-23 · **Público:** time/agente do `phonus-fc-mobile`
> **Contexto:** homologação e correções de segurança do backend (Etapa 11 do plano). O app está
> desatualizado desde 2026-03-30 e **hoje não consegue se cadastrar** na API.
> **Quebras de contrato são esperadas** — nada está em produção ainda.
>
> Detalhe de cada rota: [`api-reference-mobile.md`](api-reference-mobile.md) (já atualizado).

**O que não mudou:** base `/api/v1`; valores monetários em **centavos (Long)**; datas `yyyy-MM-dd`;
formato de erro (`ErrorResponse`).

---

## 1. Bloqueantes — sem isto o app não funciona

### 1.1 Cadastro virou cadastro de empresa
`POST /auth/registro` cria **empresa + usuário dono (ROOT)**. Corpo novo:

```json
{
  "nomeEmpresa": "Padaria do João",
  "tipoDocumento": "CNPJ",            // CNPJ | CPF
  "documento": "11.222.333/0001-81",  // dígito verificador é validado
  "nome": "João da Silva",
  "email": "joao@padaria.com.br",
  "senha": "Senha123",
  "termosId": "uuid"                  // NOVO e obrigatório — id de GET /termos/atual
}
```

- Campos novos: `nomeEmpresa`, `tipoDocumento`, `documento`, `termosId`.
- Erros: `400` campo inválido (inclui `termosId` ausente) · `409` e-mail **ou** CPF/CNPJ já cadastrado ·
  `422` documento inválido **ou** `termosId` que não é mais a versão vigente (recarregar os termos).

### 1.2 Aceite dos termos vai junto com o cadastro
- A tela de cadastro busca `GET /termos/atual`, exibe e envia o `id` como `termosId` no cadastro.
- **Remover** a chamada a `POST /termos/aceite` logo após o cadastro (hoje ela sempre falharia).
- `termosId` é **UUID** (o app usa `Long`).

### 1.3 Tipo de lançamento renomeado
`ENTRADA` → **`ENTRADA_CAIXA`** (venda/receita) · `SAIDA` → **`SAIDA_CAIXA`** (compra/despesa).
Vale para request, response, filtros (`?tipo=`), categorias de lançamento e para o retorno de
`POST /lancamentos/interpretar` (voz).
*(A direção de movimentação de estoque continua `ENTRADA`/`SAIDA` — é outro campo.)*

### 1.4 Senha: nova política
Mínimo **8 caracteres, com letras e números**, diferente do e-mail (máx. 72 bytes). Vale para
cadastro, troca, redefinição e convite. **Validar no app com a mesma regra** — o servidor devolve
`400` com a mensagem.

---

## 2. Autenticação e sessão

| Situação | Antes | Agora | O que o app faz |
|---|---|---|---|
| Senha errada / e-mail sem conta | 500 | **401** "E-mail ou senha inválidos." | Mensagem genérica, sem distinguir os casos |
| Conta não ativada | 403 com qualquer senha | **403** só com a senha **certa** | Oferecer "reenviar e-mail de ativação" |
| Excesso de tentativas | — | **429** + `Retry-After` | Esperar e avisar o usuário |

- **Refresh token só em `/auth/refresh`**; access token só nas demais rotas (cruzar dá `401`).
- **Trocar a senha (`PUT /auth/senha`) ou redefinir por e-mail encerra TODAS as sessões**, inclusive
  a atual. Depois de trocar a senha, levar o usuário ao login.
- Fluxo recomendado para `401`: tentar `/auth/refresh` **uma vez**; se der `401` de novo → tela de login.
- Usuário desativado pelo dono da empresa passa a receber `401` imediatamente.

### Reaceite de termos (versões futuras)
Após o login: `GET /termos/aceite/status` → `{ "termosId", "versao", "aceito" }`. Com `aceito: false`,
exibir os termos e chamar `POST /termos/aceite` com `{ "termosId": "uuid" }` (autenticado).

---

## 3. Papéis e o que cada um vê

A empresa tem **ROOT** (dono), **ADMIN** e **OPERADOR**. O app deve **esconder** o que o papel não pode
fazer (o servidor responde `403` de qualquer forma). O papel está em `GET /auth/me` → `papel`.

| Funcionalidade | ROOT | ADMIN | OPERADOR |
|---|:-:|:-:|:-:|
| Lançar (voz/texto), baixar parcela, pagar | ✅ | ✅ | ✅ |
| Caixa, dashboard, contas, relatórios de lançamentos/pagamentos/competência | empresa toda | empresa toda | **só o que ele lançou** |
| Consultar produtos, clientes, fornecedores, categorias | ✅ | ✅ | ✅ |
| Criar/editar produtos, clientes, fornecedores, categorias | ✅ | ✅ | ❌ |
| Estoque (ajuste, movimentações), relatórios de estoque e margem | ✅ | ✅ | ❌ |
| Listar usuários, convidar | ✅ (ADMIN/OPERADOR) | ✅ (só OPERADOR) | ❌ |
| Alterar papel | ✅ | ❌ | ❌ |
| Desativar usuário | ✅ | ✅ (só OPERADOR) | ❌ |

- Regra geral: ninguém age sobre papel igual ou superior ao seu; ROOT nunca é convidado.
- **Importante para a UI:** para o OPERADOR, dashboard e caixa mostram só os números **dele**.
  Abrir um lançamento de outra pessoa dá `403`.

---

## 4. E-mails (ativação, recuperação de senha)

- `POST /auth/esqueceu-senha` e `POST /auth/reenviar-ativacao` respondem **sempre a mesma mensagem**,
  com ou sem conta. Não mostrar "e-mail enviado com sucesso" como fato — usar
  "se o e-mail estiver cadastrado, você receberá…".
- **Cooldown de 2 minutos por conta**: pedidos repetidos respondem igual, mas não enviam novo e-mail.
  Sugestão: desabilitar o botão "reenviar" com contagem regressiva de 2 min.
- Link antigo (substituído por um reenvio) mostra "Este link foi substituído por um mais recente".
- Cadastro não ativado em **7 dias** é removido — o usuário pode se cadastrar de novo com o mesmo
  e-mail/CPF/CNPJ. Convites não aceitos em 7 dias também expiram.

---

## 5. Outros ajustes de contrato

- **Paginação:** `size` máximo **100** (valores maiores são limitados).
- **Erros do cliente agora são `400`** (antes `500`): JSON malformado, parâmetro obrigatório ausente,
  parâmetro com tipo inválido (ex.: id que não é UUID). Enum inválido traz mensagem própria
  (ex.: "Valor inválido para 'tipo'…").
- **Filtros por período** (`dataInicio`/`dataFim`, `vencimentoDe`/`vencimentoAte`) passaram a
  funcionar — antes davam `500`.
- **Caixa, dashboard, contas e competência** passaram a trazer valores — antes vinham sempre zerados.

---

## 6. Checklist de adaptação do app

```
Bloqueantes
[ ] Tela de cadastro: nomeEmpresa, tipoDocumento (CPF/CNPJ), documento, termosId
[ ] termosId como UUID; remover POST /termos/aceite após o cadastro
[ ] ENTRADA_CAIXA / SAIDA_CAIXA em todos os modelos, filtros e na tela de voz
[ ] Validação de senha: 8+ caracteres, letras e números

Sessão
[ ] 401 no login = credenciais inválidas; 403 = conta não ativada (oferecer reenvio)
[ ] 429: respeitar Retry-After
[ ] 401 nas APIs: um refresh; se falhar, login
[ ] Após trocar a senha: voltar ao login
[ ] Após o login: GET /termos/aceite/status → reaceite se aceito = false

Papéis
[ ] Ler papel de /auth/me e esconder ações não permitidas
[ ] Textos do dashboard/caixa do OPERADOR ("seus lançamentos")

E-mails
[ ] Mensagens genéricas em esqueci-senha / reenviar ativação
[ ] Cooldown de 2 min no botão de reenvio
```

---

## 7. Próximas mudanças previstas (Etapa 12 — assinaturas)

Ainda não implementadas; o app será avisado quando entrarem:
- `POST /assinaturas/validar` deixará de aceitar `packageName` (virá da configuração do servidor).
- Novo catálogo público de planos **sem preço** — o preço exibido deve vir da Play Billing Library
  (`queryProductDetailsAsync`), que reflete o valor real por país.
- Possível adoção de uma assinatura com planos-base (`monthly`/`yearly`) e campo `basePlanId`.
- O app deverá enviar `obfuscatedAccountId` no fluxo de compra, para o servidor conferir o dono da compra.
