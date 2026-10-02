# Phonus Web — Funcionalidades de Cadastro e Usuários

Visão macro do que o web oferece hoje para **cadastro de empresa**, **autenticação** e **gestão de usuários**.
Baseado no código em `src/app` (rotas em `app.routes.ts`).

## 1. Visão geral do fluxo

```
Cadastro da empresa (/registro)
        │  cria empresa + 1º usuário (ROOT) + aceite dos termos
        ▼
Verificação de e-mail (/verifique-email)
        │  link do e-mail ativa a conta (direto no backend)
        ▼
Login (/login) ──► refresh automático de token ──► área logada
        │
        └─► Gestão de usuários (/usuarios): convidar, reenviar convite, desativar, reativar
                │
                └─► Usuário convidado ativa a conta pelo link do e-mail e faz login
```

## 2. Cadastro de empresa — `/registro` (pública)

Componente: `features/auth/register`.

- **Campos:** nome da empresa, tipo de documento (CNPJ ou CPF), documento, nome do responsável, e-mail, senha e confirmação.
- **Validações no cliente:**
  - documento válido (CNPJ/CPF); enviado só com dígitos;
  - senha de 8 a 72 caracteres, "forte", diferente do e-mail e igual à confirmação.
- **Termos de uso:** carrega a versão vigente (`GET /termos/atual`) e exige o aceite. O `termosId` vai no cadastro. Se os termos não carregarem, há opção de tentar novamente e o envio fica bloqueado.
- **Envio:** `POST /auth/registro`. Em caso de sucesso, redireciona para `/verifique-email` levando o e-mail.
- **Erros tratados no web:** 409 (e-mail ou documento já cadastrado), 400 (dados inválidos), 429 (muitas tentativas). **Não tratado:** 422 (documento inválido; termos diferentes da versão vigente) e 404 (nenhum termo ativo). Veja 8.2, item 4.
- **Resultado no backend:** cria a empresa, seu schema, o primeiro usuário com papel **ROOT** e registra o aceite. Esse é o único caminho que gera um ROOT. O ROOT nasce com status `CONVIDADO` e só vira `ATIVO` ao abrir o link do e-mail (8.3).

## 3. Ativação de conta — `/verifique-email` (pública)

Componente: `features/auth/verify-email`.

- Informa que um e-mail de ativação foi enviado. Se a tela for aberta sem o e-mail (sem passar pelo cadastro), pede que o usuário o digite.
- **Reenvio:** `POST /auth/reenviar-ativacao` com cooldown de 120 s no botão. A mensagem é neutra ("se a conta existir e não estiver ativa…"), igual ao backend.
- A tela avisa que o link "expira em poucos minutos". Na prática o link do ROOT vale 3 minutos; o do convidado, 24 horas.
- A **ativação em si** (`/auth/ativar`) é feita pelo link do e-mail, direto no backend; o web não chama esse endpoint.

## 4. Autenticação

| Funcionalidade | Onde | Endpoint |
|---|---|---|
| Login | `/login` | `POST /auth/login`, depois `GET /auth/me` |
| Refresh automático | `AuthService` (agenda 30 s antes de expirar; falha leva ao logout) | `POST /auth/refresh` |
| Logout | topbar | local (limpa tokens) |
| Esqueci a senha | `/esqueceu-senha` | `POST /auth/esqueceu-senha` |
| Alterar senha | diálogo na topbar (`features/conta/alterar-senha-dialog`) | `PUT /auth/senha` |
| Minha conta | `/minha-conta`, item no menu do usuário (todos os papéis): dados da conta e bloco de assinatura | `GET /usuarios/{meuId}/entitlement` |

Detalhes do login:
- **401:** "e-mail ou senha incorretos".
- **403:** conta não ativada, e mostra a opção de reenviar ativação (cooldown de 120 s).
- **429:** bloqueio temporário, com contagem regressiva a partir do `Retry-After`.
- Após o login, o destino é a primeira rota permitida (`landingRoute`): dashboard, lançamentos, produtos, usuários ou termos, nessa ordem; sem permissão alguma vai para `/403`.

## 5. Gestão de usuários — `/usuarios`

Acesso: permissão `USUARIOS_GERENCIAR`. Componente: `features/usuarios/usuarios-list`.

| Ação | Regra no web | Endpoint |
|---|---|---|
| Listar | tabela com nome, e-mail, papel (badge) e status | `GET /usuarios` |
| Convidar | diálogo com nome, e-mail e papel; ROOT escolhe ADMIN ou OPERADOR, ADMIN só OPERADOR | `POST /usuarios` |
| Reenviar convite | disponível para status `CONVIDADO`; cooldown de 120 s por usuário | `POST /auth/reenviar-ativacao` |
| Desativar | usuário `ATIVO`, com confirmação | `DELETE /usuarios/:id` |
| Reativar | usuário `INATIVO`, com confirmação; trata 422 do backend | `PATCH /usuarios/:id/reativar` |

Regras de quem pode gerir quem (desativar/reativar):
- **Backend:** só é permitido agir sobre usuários de papel **inferior** ao de quem age; ninguém desativa a própria conta; SUPER_ROOT não pode ser desativado nem reativado. Na prática: ROOT gerencia ADMIN e OPERADOR; ADMIN gerencia OPERADOR.
- **Web:** o botão só aparece para alvos ADMIN e OPERADOR quando quem age é ROOT (alinhado ao backend).

O convidado nasce com status `CONVIDADO`, entra no tenant de quem convidou e ativa a conta pelo link do e-mail.

## 6. Papéis, status e permissões

- **Papéis:** `SUPER_ROOT`, `ROOT`, `ADMIN`, `OPERADOR`.
- **Status do usuário:** `ATIVO`, `INATIVO`, `CONVIDADO`.
- **Permissões** vêm do backend em `permissoes[]` (`GET /auth/me`) e controlam rotas (`permissionGuard`), menu e botões:
  `LANCAMENTOS_REGISTRAR`, `FINANCEIRO_CONSULTAR`, `CADASTROS_CONSULTAR`, `CADASTROS_GERENCIAR`, `ESTOQUE_GERENCIAR`, `USUARIOS_GERENCIAR`, `USUARIOS_ALTERAR_PAPEL`, `TERMOS_GERENCIAR`, `CONTA_PROPRIA`.
  A permissão `ASSINATURA_ENTITLEMENT_QUALQUER` foi removida do backend, mas ainda consta no tipo `Permissao` do web (8.2, item 5).
- Rotas protegidas por `authGuard`; sem permissão, o usuário é redirecionado à primeira rota permitida.

## 7. Termos de uso (relacionado ao cadastro)

- **Cadastro:** exige o aceite da versão vigente.
- **Reaceite:** ao entrar na área logada, `statusAceite` é consultado; se houver nova versão, abre o diálogo de reaceite (não pode ser fechado sem aceitar) — `POST /termos/aceite`.
- **Administração:** `/termos` (permissão `TERMOS_GERENCIAR`) lista versões e cria nova — `GET/POST /termos/admin`.

## 8. Divergências com o backend e tela de detalhe

Confrontado com as respostas do backend e com o contrato (`swagger-phonus-api-v1.yaml`).

> **Status (2026-10-01):** os itens 1 a 8 da tabela 8.2 e a tela de detalhe (8.1) foram implementados e validados no navegador contra o backend local. As subseções abaixo descrevem o que foi feito e as regras que o motivaram.

### 8.1 Detalhe do usuário (`/usuarios/:id`)

**Situação antes da implementação**
- A rota está declarada em `app.routes.ts` com `permissionGuard` e a permissão `USUARIOS_GERENCIAR`.
- `UsuarioDetailComponent` apenas renderiza `<app-page-header title="Detalhe do Usuário" />`: sem lógica, estado ou chamada à API.
- Nada navega até a rota. A lista não tem `routerLink` nem clique na linha, então só se chega digitando a URL.
- `UsuarioService.alterarPapel` e `buscarEntitlement` não são usados por nenhuma tela. A permissão `USUARIOS_ALTERAR_PAPEL` existe no model e também não é usada.

**Restrições do backend que limitam a tela**
- `GET /usuarios/{id}` **só devolve o próprio usuário** (mesmo conteúdo de `/auth/me`). Qualquer outro id dá 403, em todos os papéis, inclusive id inexistente ou de outra empresa. Os dados de outros usuários só vêm de `GET /usuarios` (a lista, aberta só a ROOT e ADMIN).
- `GET /usuarios/{id}/entitlement` **só vale para o próprio usuário**. Outro id dá 403, inclusive para ROOT e ADMIN. A permissão `ASSINATURA_ENTITLEMENT_QUALQUER` foi removida e não vem mais em `permissoes[]`.
- Consequência: o detalhe de outro usuário **não pode mostrar assinatura**. Isso contradiz o plano original (`arquitetura-web-angular-vfinal.md`, que previa o atalho para entitlement no detalhe).
- O `UsuarioResponse` não tem `cidade` nem `estado`. Esses campos existem só no model do web e não são usados em nenhum lugar.

**Tela implementada** (`usuario-detail.component`)
1. Na lista, tornar o nome do usuário um link para `/usuarios/:id`.
2. No detalhe, obter o usuário a partir de `GET /usuarios` (lista) filtrando pelo id; mostrar nome, e-mail, papel, status e data de criação. Id não encontrado na lista mostra estado "usuário não encontrado".
3. Ação de alterar papel (`PATCH /usuarios/{id}/papel`), exibida somente se **todas** as condições forem verdadeiras:
   - o usuário logado tem `USUARIOS_ALTERAR_PAPEL` (na prática, só ROOT);
   - o alvo não é o próprio usuário logado;
   - o alvo não é ROOT nem SUPER_ROOT.
4. O seletor oferece só `ADMIN` e `OPERADOR`, sem o papel atual. Restringir o campo de `AlterarPapelRequest` a `'ADMIN' | 'OPERADOR'` no front.
5. O papel novo vale na hora: o token do usuário alterado já passa a valer com o papel novo, sem novo login.
6. Estados de carregando e erro, e testes (`.spec.ts`).
7. Entitlement: fora do detalhe de terceiros. Se for exibido, só na própria conta (ex.: tela "Minha conta"); decisão de produto pendente.

### 8.2 Divergências entre o web e o backend

| # | Onde | Antes | Backend (agora o web segue) |
|---|---|---|---|
| 1 | Lista de usuários: `podeGerenciar` | ROOT vê desativar/reativar em outro ROOT | 403 "só é permitido desativar/reativar usuários com papel inferior ao seu". Botão deve aparecer só para alvos ADMIN e OPERADOR |
| 2 | Desativar: tratamento de erro | falha em silêncio | 403 (própria conta; papel não inferior; permissão), 404 "Usuário não encontrado", 422 "Não é permitido desativar um SUPER_ROOT". Exibir `message` |
| 3 | Reativar: tratamento de erro | só trata 422 | 422 (já ativo; CONVIDADO; SUPER_ROOT; e-mail já em uso em outra empresa), 403, 404. Exibir `message` em todos |
| 4 | Cadastro: tratamento de erro | sem caso para 422; cai na mensagem genérica | 422 "CNPJ inválido" e 422 "Os termos aceitos não correspondem à versão vigente…" (recarregar `/termos/atual` e pedir novo aceite); 404 "Nenhum termo de uso ativo encontrado"; 409 e-mail ou "CPF/CNPJ já cadastrado" |
| 5 | Tipo `Permissao` | inclui `ASSINATURA_ENTITLEMENT_QUALQUER` | permissão removida |
| 6 | Tipo `EntitlementResponse` | `planoAtual: { id, nome }` | `planoAtual: { planoId, nome, googleProductId, periodoCobranca, preco (centavos), moeda }` ou `null`; `expiraEm` pode ser `null` |
| 7 | Tipo `Usuario` | `cidade?` e `estado?` | campos inexistentes no contrato |
| 8 | Cadastro: limite de senha | `maxLength(72)` em caracteres | 72 **bytes** (acento conta 2): senha com acentos pode passar no front e dar 400 |
| 9 | Convite: tratamento de erro | mostra `message` ou texto genérico | 409 "E-mail já cadastrado na plataforma" (vale para qualquer empresa) e 403 de papel já chegam em `message`; sem ajuste necessário |

Conferido e sem divergência: campos do cadastro e do convite; limites (200/150/150, senha 8–72); validador de senha (letra e número, diferente do e-mail) alinhado com a política do backend; cooldown de reenvio de 120 s ao lado do cooldown de 2 min do backend.

**Entitlement:** implementado na tela **Minha conta** (`/minha-conta`), só para o próprio usuário, porque o backend recusa (403) o entitlement de terceiros. Mostra três situações: cortesia ("N dias restantes · válido até dd/mm/aaaa"), assinatura ativa (plano, Mensal/Anual, preço em reais a partir de centavos, "válido até dd/mm/aaaa") e plano gratuito. O DTO não informa se a assinatura renova, então o texto é neutro. `planoAtual` e `expiraEm` podem ser nulos.

**Não coberto:** o item 9 da tabela (sem ajuste necessário).

### 8.3 Comportamentos do backend a ter em mente

- **ROOT nasce `CONVIDADO`** e só vira `ATIVO` ao abrir o link do e-mail, que **vale 3 minutos**. O link do convidado vale 24 horas.
- **Login antes de ativar:** ROOT com senha certa recebe 403 (o web exibe o botão de reenviar); senha errada ou e-mail sem conta recebe 401. Convidado recebe 401 (a senha ainda é desconhecida), então o botão de reenviar do login não aparece para ele; o reenvio é feito pelo admin na lista.
- **`POST /auth/reenviar-ativacao`:** só reenvia convite pendente, responde 200 sempre (sem confirmar se o e-mail existe), cooldown de 2 min por conta.
- **Desativado:** login e token antigo passam a dar 401.
- **Formato de erro:** `{ timestamp, status, error, message, path, details }`. Erros de validação de campo vêm em `message` como `campo: mensagem; campo: mensagem`.
- **Contrato desatualizado:** `swagger-phonus-api-v1.yaml` não tem `GET /usuarios/{id}`, não documenta erros de usuários e ainda lista o papel sem `SUPER_ROOT`. Pedir reexportação ao backend.
- **Entitlement de terceiros:** `GET /usuarios/{outroId}/entitlement` dá 403 para qualquer papel; por isso não aparece no detalhe do usuário.
- **`/auth/ativar`:** não é chamado pelo web (ativação via link do e-mail no backend).

### 8.4 Pendência de produto: lançamento sem itens (decisão em aberto)

Fora do escopo de cadastro e usuários, mas descoberta nos testes de escopo financeiro.

- **Backend:** `itens` é opcional em `LancamentoRequest` (padrão: lista vazia). `CriarLancamentoUseCase` só processa itens
  se a lista não estiver vazia. O lançamento é o "fato econômico" (valor total, descrição, forma de pagamento); parcelas,
  pagamentos e caixa não dependem de produto. O estoque só é movimentado quando há itens (venda baixa, compra repõe),
  e é daí que vem o 422 "Estoque insuficiente".
- **Casos reais sem item:** serviço de autônomo, despesas (aluguel, luz, imposto, salário), receitas avulsas (sinal,
  adiantamento) e venda pelo total do dia. A entrada principal do produto é por voz ("recebi 300 do João"), sem produto.
- **Web hoje:** o wizard de `/lancamentos/novo` (`lancamento-form.component.ts`, método `avancar()`) exige ao menos um
  item com produto no passo 1 ("Adicione pelo menos um produto."). Para testar foi preciso criar categoria, produto
  (estoque mínimo maior que zero) e dar entrada de estoque. Pela tela não dá para registrar serviço, despesa nem receita avulsa.
- **Mudança proposta (não implementada):** tornar o passo 1 opcional (permitir avançar sem itens, mantendo produto,
  quantidade e desconto quando houver); enviar `itens` vazio ou omitido; deixar o valor total sempre editável; conferir
  como a lista e o detalhe do lançamento tratam um lançamento sem itens; atualizar testes do formulário e validar no navegador.
- **A decidir:** se o passo "Itens" some do wizard ou vira opcional; e se o valor total continua preenchido a partir dos itens quando existirem.

## 9. Resumo de endpoints usados

| Endpoint | Uso |
|---|---|
| `POST /auth/registro` | cadastro de empresa |
| `POST /auth/reenviar-ativacao` | reenvio de ativação/convite |
| `POST /auth/login`, `GET /auth/me`, `POST /auth/refresh` | sessão |
| `POST /auth/esqueceu-senha`, `PUT /auth/senha` | recuperação e troca de senha |
| `GET /termos/atual`, `GET /termos/aceite/status`, `POST /termos/aceite` | termos no cadastro e reaceite |
| `GET/POST /termos/admin` | administração de termos |
| `GET /usuarios`, `POST /usuarios` | listar e convidar |
| `DELETE /usuarios/:id`, `PATCH /usuarios/:id/reativar` | desativar e reativar |
| `GET /usuarios/:id` | implementado no service, sem tela; backend só devolve o próprio usuário |
| `PATCH /usuarios/:id/papel` | implementado no service, sem tela (só ROOT) |
| `GET /usuarios/:id/entitlement` | implementado no service, sem tela; backend só atende o próprio usuário |
