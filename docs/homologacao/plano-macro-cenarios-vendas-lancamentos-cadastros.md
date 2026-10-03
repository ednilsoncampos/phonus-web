# Plano macro de cenários de teste — vendas, entradas, saídas, lançamentos e cadastros

**Status: aprovado e executado em 2026-10-02.** O resultado, os achados e as correções estão em
`resultado-execucao-vendas-lancamentos-cadastros.md`. Os cenários abaixo permanecem como referência para reexecução
(execução pelo navegador, sem `curl`, no mesmo estilo de `roteiro-navegador-cadastro-usuarios.md`). Na execução o G3
usou um só OPERADOR (comparado ao ADMIN) e o D3 cobriu dinheiro e PIX.

Origem: pedido em `claude-analise/correcoes-e-melhorias-web.txt` e rotas/menu do web (`app.routes.ts`,
`sidebar.component.ts`). Complementa `funcionalidades-cadastro-usuarios.md` (usuários e autenticação já cobertos).

## 1. Regras de negócio que o plano verifica

| Ação | ROOT | ADMIN | OPERADOR |
|---|---|---|---|
| Registrar venda/lançamento (`POST /lancamentos`) | ✅ | ✅ | ✅ |
| Cadastrar ou editar produto, fornecedor, cliente (e categorias; desativar produto) | ✅ | ✅ | ❌ |
| Consultar (GET) produtos, clientes e fornecedores | ✅ | ✅ | ✅ |

- O `LancamentoController` inteiro exige `LANCAMENTOS_REGISTRAR`: os três papéis registram. Isso inclui
  `GET /lancamentos` e `GET /lancamentos/{id}` (lista e detalhe), sempre com escopo restrito ao autor para o OPERADOR.
- O OPERADOR só enxerga os lançamentos que ele mesmo fez (escopo financeiro restrito ao autor).
- POST/PUT de produto, cliente, fornecedor e categorias exigem `CADASTROS_GERENCIAR` (só ROOT e ADMIN).
- O OPERADOR só lê os cadastros, o que basta para escolher produto ou cliente ao registrar uma venda.

**Matriz de permissões do backend** (nota do backend, leitura de `MatrizPermissoes.kt`; confirmada na execução em A1):

| Permissão | ROOT | ADMIN | OPERADOR | Libera |
|---|---|---|---|---|
| `LANCAMENTOS_REGISTRAR` | ✅ | ✅ | ✅ | lançamentos (criar, listar, detalhar), parcelas e baixa, pagamentos |
| `FINANCEIRO_CONSULTAR` | ✅ | ✅ | ✅ | dashboard, caixa, contas a receber/pagar, relatórios de lançamentos/pagamentos/competência (OPERADOR vê só o que lançou) |
| `CADASTROS_CONSULTAR` | ✅ | ✅ | ✅ | consulta de produtos, clientes, fornecedores e categorias |
| `CADASTROS_GERENCIAR` | ✅ | ✅ | ❌ | gravar cadastros e categorias |
| `ESTOQUE_GERENCIAR` | ✅ | ✅ | ❌ | `/estoque/*`, relatório de estoque e de margem (OPERADOR recebe 403) |
| `CONTA_PROPRIA` | ✅ | ✅ | ✅ | Minha conta |
| `TERMOS_GERENCIAR` | ❌ | ❌ | ❌ | `/termos` e `GET/POST /termos/admin`: **só SUPER_ROOT** (papel de plataforma, fora deste plano) |

O aceite de termos não é afetado: `GET /termos/aceite/status` e `POST /termos/aceite` valem para qualquer papel
autenticado e `GET /termos/atual` é público.

**Vocabulário.** O web não tem o conceito "venda" separado: é um lançamento `ENTRADA_CAIXA` com itens (baixa estoque).
Uma compra é `SAIDA_CAIXA` com itens (repõe estoque). Entrada ou saída **sem itens** é receita avulsa/serviço ou
despesa (itens opcionais desde 2026-10-02; sem itens a descrição é obrigatória).

## 2. Pré-requisitos

- Backend em `http://localhost:8080` com base **zerada** e `SUPER_ROOT_HABILITADO=false`; web em `http://localhost:4200`.
- Usuários (mesmo padrão do `roteiro-navegador-cadastro-usuarios.md`, senhas lá):

  | Papel | E-mail |
  |---|---|
  | ROOT | ednilsoncampos@gmail.com |
  | ADMIN | ednilson.campos.dev@gmail.com |
  | OPERADOR | camposolution.suporte@gmail.com |

  **Situação da base em 2026-10-02:** só o ROOT existe e está ativo. ADMIN e OPERADOR ainda **não estão
  cadastrados**: o ROOT precisa convidá-los e eles ativam pelo link do e-mail (fluxo já validado naquele roteiro,
  24 h, define a senha). Se outra base já os tiver ativos, pular a etapa. O Brevo envia e-mails reais.
- **Segundo OPERADOR:** o plano original usava O e O2. Com um só OPERADOR, o G3 compara O com A (ver G3).
- Chrome via Playwright (`channel: 'chrome'`), instalado fora do projeto.
- **Dados-base** (criados pelo ROOT/ADMIN no bloco B e reaproveitados nos demais): 2 categorias de produto, 3 produtos
  (um com estoque mínimo > 0), 2 clientes, 2 fornecedores, categorias de lançamento de entrada e de saída.

## 3. Ordem de execução

`A` (permissões) → `B` (cadastros) → `C` (estoque) → `D`/`E`/`F` (entradas, vendas, saídas) → `G` (lançamentos e escopo) → `H` (validações).
Os blocos D–F dependem dos dados-base de B e C. O bloco G depende de lançamentos criados por mais de um usuário em D–F.

## 4. Cenários

Perfis: **R** = ROOT, **A** = ADMIN, **O** = OPERADOR, **O2** = OPERADOR 2 (opcional, só no G3).

### A. Acesso e permissões por perfil

| # | Cenário | Perfil | Resultado esperado |
|---|---|---|---|
| A1 | Login e captura de `permissoes[]` (`GET /auth/me`, visto na aba de rede) | R, A, O | O deve trazer `LANCAMENTOS_REGISTRAR`, `FINANCEIRO_CONSULTAR`, `CADASTROS_CONSULTAR` e `CONTA_PROPRIA`, sem `CADASTROS_GERENCIAR` nem `ESTOQUE_GERENCIAR`. R e A trazem também as de gestão (a tabela do item 1 é a referência) |
| A2 | Itens do menu lateral por perfil | R, A, O | O vê Dashboard, Cat. Produto, Produtos, Clientes, Fornecedores, Cat. Lançamento e Lançamentos; **não** vê Estoque, Relatórios (margem), Usuários nem Termos. R e A veem Usuários, Estoque e Relatórios. **Nenhum dos três vê "Termos"**: o item só aparece com `TERMOS_GERENCIAR` em `permissoes[]`, exclusiva do SUPER_ROOT |
| A3 | Rota inicial após o login (`landingRoute`) | R, A, O | Os três caem em `/dashboard` (todos têm `FINANCEIRO_CONSULTAR`) |
| A4 | Acesso direto por URL a telas sem permissão (`/produtos/novo`, `/clientes/novo`, `/fornecedores/novo`, `/produtos/:id/editar`, `/estoque`, `/relatorios/margem`, `/usuarios`) | O | Redirecionado (guard) e nenhuma chamada de escrita sai; por chamada direta, `/estoque/*` e relatórios de estoque/margem dão 403 |
| A4b | Acesso direto a `/termos` | R, A, O | Redirecionado (guard); por chamada direta, `GET/POST /termos/admin` retorna 403 |
| A5 | Botões de escrita nas listas (Novo produto/cliente/fornecedor, Editar, Desativar) | O | Ocultos ou desabilitados; para R e A aparecem |

### B. Cadastros (ROOT/ADMIN gravam; OPERADOR só consulta)

| # | Cenário | Perfil | Resultado esperado |
|---|---|---|---|
| B1 | Criar, editar e listar categorias de produto | R, A | Persistem e aparecem na lista; O não grava |
| B2 | Criar, editar e listar categorias de lançamento (entrada e saída) | R, A | Persistem; o formulário de lançamento filtra por tipo |
| B3 | Criar produto (nome, categoria, preço de venda e custo, unidade, estoque mínimo) | R, A | Aparece na lista e no detalhe |
| B4 | Editar produto e desativar produto | R, A | Alterações refletem; inativo some das listas de escolha do lançamento |
| B5 | Criar e editar cliente (validação de documento e telefone) | R, A | Persiste; dado inválido mostra o erro do campo |
| B6 | Criar e editar fornecedor | R, A | Idem |
| B7 | Consulta de produtos, clientes e fornecedores (lista e detalhe) | O | Lê tudo; não há ação de gravar |
| B8 | Tentativa de gravar cadastro por chamada direta (aba de rede/console do navegador) | O | Backend responde 403 em POST/PUT/PATCH de produto, cliente, fornecedor e categorias |
| B9 | Duplicidade (mesmo documento ou nome, conforme regra do backend) | R, A | Erro claro do backend exibido na tela |

### C. Estoque

| # | Cenário | Perfil | Resultado esperado |
|---|---|---|---|
| C0 | Tela `/estoque` e relatório de margem | O | Sem acesso (menu oculto, rota redirecionada, 403 na API) |
| C1 | Entrada inicial de estoque pelo ajuste (`/estoque`) | R, A | Saldo do produto sobe; movimentação aparece no histórico |
| C2 | Produto abaixo do mínimo | R, A | Sinalizado na lista/detalhe de produtos |
| C3 | Ajuste negativo além do saldo | R, A | Rejeitado com mensagem do backend |

### D. Entradas (`ENTRADA_CAIXA`)

| # | Cenário | Perfil | Resultado esperado |
|---|---|---|---|
| D1 | Receita avulsa **sem itens** (serviço, sinal), PIX, valor digitado, descrição informada | R, A, O | Cria (201) sem `itens`; aparece na lista; detalhe sem seção de itens |
| D2 | Entrada com cliente e categoria | R, A | Vínculos aparecem no detalhe |
| D3 | Entrada em dinheiro e em cartão/outra forma à vista | R | Parcela única paga |
| D4 | Entrada a prazo (crédito, cheque, promissória) com N parcelas | R, A | Gera N parcelas com vencimentos e status coerentes |
| D5 | Entrada por O | O | Registra normalmente e vê o próprio lançamento |

### E. Vendas (`ENTRADA_CAIXA` com itens)

| # | Cenário | Perfil | Resultado esperado |
|---|---|---|---|
| E1 | Venda de 1 produto, 1 unidade | R, A, O | Total = preço × qtd; estoque baixa |
| E2 | Venda com vários produtos e quantidades fracionadas onde a unidade permitir | R | Total soma os itens; baixa por item |
| E3 | Venda com desconto por item | R, A | Total desconta; valor total ainda editável no passo de pagamento |
| E4 | Venda a prazo com cliente | R, A | Parcelas geradas; cliente no detalhe |
| E5 | Venda acima do estoque | R, A, O | 422 "Estoque insuficiente" exibido; nada é gravado; saldo intacto |
| E6 | Venda com descrição em branco | R | Descrição = nomes dos produtos |
| E7 | O escolhe produto e cliente para a venda | O | Listas de escolha carregam só com consulta (sem `CADASTROS_GERENCIAR`) |
| E8 | Conferir saldo e histórico em `/estoque` após E1–E5 | R, A | Cada venda aparece como movimentação de saída |

### F. Saídas (`SAIDA_CAIXA`)

| # | Cenário | Perfil | Resultado esperado |
|---|---|---|---|
| F1 | Despesa **sem itens** (aluguel, luz), descrição obrigatória | R, A, O | Cria sem `itens`; aparece como saída |
| F2 | Compra com itens e fornecedor | R, A | Estoque **sobe**; valor unitário enviado = custo do produto |
| F3 | Saída a prazo com parcelas | R, A | Parcelas geradas |
| F4 | Saída com categoria de lançamento do tipo saída | R | Só categorias de saída aparecem na escolha |
| F5 | Trocar o tipo no passo 2 depois de escolher cliente ou fornecedor | R | Cliente é limpo ao ir para saída; fornecedor ao ir para entrada |

### G. Lançamentos: lista, detalhe e escopo por autor

| # | Cenário | Perfil | Resultado esperado |
|---|---|---|---|
| G1 | Lista completa com paginação | R, A | Vê os lançamentos de todos os usuários da empresa |
| G2 | Lista do O | O | Só os lançamentos criados por ele |
| G3 | O não vê os lançamentos criados por A (e R); A vê os de O | O, A | Com um só OPERADOR, prova o escopo do autor em um sentido. Se houver um segundo OPERADOR (O2), conferir também que as listas de O e O2 são disjuntas |
| G4 | Detalhe de lançamento próprio | O | Abre com parcelas e itens (quando houver) |
| G5 | Abrir por URL o id de um lançamento de outro autor | O | Não exibe os dados (403/404 tratado na tela) |
| G6 | Detalhe de lançamento com e sem itens | R | Seção de itens só quando existem |
| G7 | Dashboard (totais) por perfil | R, A, O | O acessa o dashboard e os totais refletem só o que ele lançou; R e A veem a empresa toda |

### H. Validações e bordas

| # | Cenário | Perfil | Resultado esperado |
|---|---|---|---|
| H1 | Sem itens e sem descrição | R | Não avança do passo 2; mensagem de campo obrigatório |
| H2 | Valor total zerado ou vazio | R | Não salva; mensagem no campo |
| H3 | Item sem produto escolhido | R | Não avança do passo 1 |
| H4 | Parcelas inválidas (menor que 1) em forma a prazo | R | Bloqueia |
| H5 | Produto desativado não aparece na venda | R | Fora da lista de escolha |
| H6 | Sessão expirada no meio do wizard | R | Refresh automático; falha leva ao login sem perda silenciosa |
| H7 | Acessibilidade das telas de lançamento (foco, rótulos, contraste) | R | Sem violações AXE nas telas exercitadas |

## 5. Fora do escopo deste plano

- **Interpretação por voz** (`POST /lancamentos/interpretar`): o web não tem tela para isso. Cobrir no app mobile/API.
- **Caixa, contas a receber/pagar, relatórios financeiros e baixa de parcelas** (`FINANCEIRO_CONSULTAR` /
  `LANCAMENTOS_REGISTRAR`): o backend libera ao OPERADOR (com escopo do autor), mas o web não tem essas telas (só
  dashboard, lançamentos e margem). Cobrir pela API ou quando as telas existirem.
- Usuários, convites e termos: já cobertos em `roteiro-navegador-cadastro-usuarios.md`.
- Assinatura/entitlement: só "Minha conta", já validada.

## 6. Pontos a aprovar

1. Executar com a base zerada atual, convidando ADMIN e OPERADOR a partir do ROOT (únicos que faltam)? O G3 fica com um só OPERADOR, ou convidamos um segundo?
2. Quantidade de dados-base (3 produtos, 2 clientes, 2 fornecedores) e a ordem proposta em 3 estão adequadas?
3. Os cenários E5 e C3 geram erro 422 de propósito. Confirmar que o backend deve ser exercitado assim.
