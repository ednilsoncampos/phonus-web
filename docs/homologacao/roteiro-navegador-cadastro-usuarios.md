# Roteiro de testes no navegador — cadastro e usuários

Baseado no cenário 28 do backend (`claude-analise/correcoes-e-melhorias-web.txt`), executado **pelo navegador**
(sem `curl`). Complementa `docs/funcionalidades-cadastro-usuarios.md`.

## 1. Pré-requisitos

- Backend em `http://localhost:8080` com a base **zerada** e `SUPER_ROOT_HABILITADO=false`.
- Web em `http://localhost:4200` (`ng serve`; o proxy `proxy.conf.json` envia `/api` para o backend).
- Chrome instalado (usado via Playwright com `channel: 'chrome'`, sem baixar navegador). O Playwright fica
  **fora do projeto** (diretório temporário da sessão: `npm i playwright`).
- Os e-mails abaixo são caixas reais do projeto e únicos na plataforma. O Brevo envia e-mails de verdade.

| Papel | E-mail | Senha |
|---|---|---|
| ROOT | ednilsoncampos@gmail.com | A.123456a |
| ADMIN | ednilson.campos.dev@gmail.com | B.123456b (vira C.123456c só no passo 7 do cenário) |
| OPERADOR | maria.cs.2239@gmail.com | B.123456b |
| OPERADOR 2 | camposolution.suporte@gmail.com | B.123456b |

> Após zerar a base, o ADMIN define **B.123456b** ao ativar o convite. A senha C.123456c só existe depois de
> trocar a senha (passo 7). Na base anterior ele já estava com C.123456c.

## 2. Roteiro

1. **Cadastro da empresa** (`/registro`): CNPJ `12.345.678/0001-95`, e-mail do ROOT, senha A.123456a, aceite dos termos.
   Esperado: vai para `/verifique-email`; ROOT nasce `CONVIDADO`.
2. **Login antes de ativar** (`/login`, ROOT, senha certa): esperado mensagem de conta não ativada e botão de reenviar (403).
3. **Ativar o ROOT** abrindo no navegador o link do e-mail (`GET /api/v1/auth/ativar?token=…&e=<empresaId>`).
   **O link vale 3 minutos.** Reabrir o mesmo link dá 400 (token já usado).
4. **Login do ROOT** e abrir `/usuarios`: 1 usuário (ele mesmo), sem ações na própria linha.
5. **Convidar** ADMIN, OPERADOR e OPERADOR 2 pelo botão "Convidar". Esperado: 3 linhas `Convidado`.
   O link do convite vale 24 horas e abre o formulário de definir senha (B.123456b); senha fraca dá 400 e o convite continua valendo.
6. **Reenvio do convite** pela lista: cooldown de 2 min por conta (o web mostra 120 s).
7. **Detalhe e papel (ROOT):** nome da Maria → `/usuarios/:id`; alterar para Admin e voltar para Operador.
   Seletor mostra só o outro papel; ROOT não vê a ação no próprio detalhe nem no de outro ROOT.
8. **Desativar e reativar** o OPERADOR 2 (ROOT) e um OPERADOR (ADMIN). Desativado: login 401.
9. **Hierarquia (ADMIN):** sem ações sobre ROOT, sobre si mesmo ou outro ADMIN; sem "Alterar papel"; convite só com papel Operador.
10. **Cadastro — erros:** e-mail já cadastrado (409 real); senha com acento acima de 72 bytes; CNPJ inválido (422);
    termos desatualizados (422, recarrega os termos).
11. **Escopo financeiro** (lançamentos) e **troca de senha** (diálogo na topbar): fora do foco deste roteiro; conferir só se houver tempo.

### Como obter o link de ativação sem abrir o e-mail (somente dev/homologação)

Exige acesso ao Postgres local (container `phonus-postgres`). A leitura do token é só consulta ao banco; a ativação
em si é feita **abrindo o link no navegador**.

1. Id da empresa do usuário:
   `SELECT empresa_id FROM public.usuario_global WHERE email = '<email>';`
2. Token pendente (trocar `<empresaIdSemHifens>` pelo id sem hífens):
   ```sql
   SELECT t.token
   FROM "t_<empresaIdSemHifens>".token_ativacao_usuario t
   JOIN "t_<empresaIdSemHifens>".usuario u ON u.id = t.usuario_id
   WHERE u.email = '<email>' AND NOT t.usado AND t.substituido_em IS NULL
   ORDER BY t.criado_em DESC LIMIT 1;
   ```
3. Abrir `http://localhost:8080/api/v1/auth/ativar?token=<token>&e=<empresaId>` no navegador.
   - **Cadastro (ROOT):** a conta ativa na hora; o link vale **3 minutos**, então fazer logo após o cadastro.
     Se expirar, usar o reenvio de ativação (`/verifique-email`) e buscar o token novo.
   - **Convite:** abre o formulário de definir senha, servido pelo backend.
4. O reenvio (`POST /auth/reenviar-ativacao`, pelo botão do web) gera um token novo e o anterior deixa de valer.

Exemplo de consulta pelo container: `docker exec phonus-postgres psql -U <usuario> -d <banco> -c "<SQL>"`
(usuário e banco conforme o `docker-compose` do backend).

A tela de cadastro do web só precisa mostrar "verifique seu e-mail" e o botão de reenviar; a ativação é responsabilidade do backend.

### Cenários de assinatura para validar "Minha conta"

Recriar após zerar a base (schema `t_<empresaId sem hífens>`). **Os `plano_id` mudam a cada reset**: ler de
`public.planos_assinatura` (`google_product_id` = `phonus_premium_monthly` ou `phonus_premium_yearly`).

```sql
-- FREE (cortesia expirada): recua a criação do usuário em 30 dias
UPDATE "<schema>".usuario SET created_at = now() - interval '30 days' WHERE email = 'maria.cs.2239@gmail.com';

-- Assinatura ativa (mensal; para anual troque o plano_id), vence em 30 dias
INSERT INTO "<schema>".assinaturas_usuario
  (usuario_id, plano_id, purchase_token, order_id, status, tipo_notificacao,
   inicio_em, expira_em, renovacao_automatica, reconhecida)
SELECT id, '<plano_id>', 'homologacao-token-admin-mensal', 'GPA.HOMOLOG-0001', 'PURCHASED',
       'SUBSCRIPTION_PURCHASED', now(), now() + interval '30 days', true, true
FROM "<schema>".usuario WHERE email = 'ednilson.campos.dev@gmail.com';
```

Esperado em `/minha-conta`: ROOT e Suporte (cortesia, 21 dias), Maria (Plano gratuito), ADMIN (Premium mensal,
R$ 9,99, válido até daqui a 30 dias; anual: R$ 89,99).

## 3. O que já foi validado (base anterior)

Passos 4, 7, 8, 9 e parte do 10 passaram. O que foi **simulado** (resposta forjada no navegador, não do backend):
422 de CNPJ, 422 de termos e 404 de termos. Na base zerada dá para testar o 422 de CNPJ com um e-mail novo.

## 4. Armadilhas e lições

- **Reaceite de termos:** ao entrar numa conta que não aceitou a versão atual, um diálogo bloqueia a tela até
  clicar em "Li e aceito os termos". Em testes automatizados, aceitar antes de interagir.
- **Link de ativação:** `GET /auth/ativar` é uma página do backend aberta no navegador; precisa do token (e-mail ou
  banco: tabela `token_ativacao_usuario` do schema `t_<empresaId sem hífens>`) e do `e` (id da empresa).
- **Login antes de ativar:** ROOT com senha certa → 403; convidado → 401 (a senha ainda é desconhecida), então o
  botão de reenviar do login não aparece para ele.
- **Formulários só com `FormControl`:** `(ngSubmit)` não dispara sem `FormsModule`/`formGroup` e o navegador recarrega
  a página. O teste no navegador achou isso no formulário de papel (corrigido com `(submit)` + `preventDefault`).
- **Seletores do Playwright:** em `mat-dialog-container` use `getByLabel('Nome')`, `getByLabel('E-mail')` e
  `getByRole('button', { name: 'Convidar' })` dentro do container; o botão do cabeçalho tem o mesmo nome.
- **Estado dos usuários:** testes de papel, desativar e reativar mexem na base. Restaurar ao final (Maria OPERADOR, todos ATIVO).
- **Reenvio de convite:** dentro de 2 min do último e-mail o backend ignora o reenvio (mesma resposta 200, token
  inalterado). Só gera token novo depois do cooldown.
- **Troca de senha:** o diálogo tem botões "Mostrar senha" com `aria-label` parecido; usar `getByLabel('Senha atual', { exact: true })`.
- **Respostas de erro** vêm como `{ timestamp, status, error, message, path, details }`; o web exibe `message`.

## 5. Resultado da rodada com a base zerada (2026-10-01)

Executado no Chrome (Playwright) contra o backend local, sem `curl`; o token de ativação foi lido do Postgres e o link aberto no navegador.

| Etapa | Resultado |
|---|---|
| Cadastro real do ROOT (CNPJ `12.345.678/0001-95`) | ok: vai para `/verifique-email`; ROOT nasce CONVIDADO |
| Login antes de ativar (ROOT) | ok: 403 com mensagem e botão de reenviar |
| Ativação pelo link (3 s após o cadastro); reabrir o link | ok: "Conta Ativada!"; segunda vez 400 |
| Convidar ADMIN, OPERADOR e OPERADOR 2; convite duplicado | ok: 3 Convidado; 409 "E-mail já cadastrado na plataforma" |
| Convidado logando antes de ativar | ok: 401, sem botão de reenviar |
| Senha fraca no formulário do convite; senha forte | ok: 400 e convite segue válido; 200 |
| Login dos 3 convidados | ok |
| ROOT: promover/rebaixar Maria (token antigo vale na hora), desativar/reativar Suporte, detalhe | ok |
| ADMIN: hierarquia, desativar/reativar OPERADOR, sem "Alterar papel", convite só Operador | ok |
| OPERADOR: `/usuarios` bloqueado e sem item no menu | ok |
| Minha conta: cortesia (ROOT e OPERADOR), FREE, assinatura mensal e anual | ok |
| Troca de senha (senha atual errada; B → C; senha antiga 401) | ok |

Não executado: 422 de CNPJ e de termos e 404 de termos com respostas reais do backend (o formulário já bloqueia CNPJ
inválido; o 422 real exigiria e-mail ainda não cadastrado e dados forjados), validados só por simulação; reenvio de convite
com troca de token (exige esperar o cooldown de 2 min); escopo financeiro (passo 6 do cenário 28).
