# Resultado da execução — vendas, entradas, saídas, lançamentos e cadastros

Execução de `plano-macro-cenarios-vendas-lancamentos-cadastros.md` em **2026-10-02**, pelo navegador (Playwright com
Chrome, sem `curl`), contra o backend local. Os dados de apoio vieram do Postgres do container (somente leitura) e as
chamadas diretas do cenário B8 foram feitas com `fetch` dentro da página do OPERADOR.

**Usuários:** ROOT `ednilsoncampos@gmail.com`, ADMIN `ednilson.campos.dev@gmail.com`, OPERADOR
`camposolution.suporte@gmail.com` (senhas do roteiro de cadastro). ADMIN e OPERADOR foram convidados pelo ROOT na
tela de usuários e ativaram pelo link do convite (formulário de definir senha, como esperado). No primeiro acesso os
dois tiveram de aceitar os termos (diálogo obrigatório "Novos Termos de Uso").

## 1. Resumo

| Bloco | Resultado |
|---|---|
| A. Acesso e permissões | Passou (A1–A5, A4b) |
| B. Cadastros | Passou (B1–B9); B9 revelou categorias de lançamento duplicadas |
| C. Estoque | Passou (C0–C3) |
| D. Entradas | Passou (D1, D2, D4, D5; D3 só com dinheiro) |
| E. Vendas | Passou (E1–E8) |
| F. Saídas | Passou (F1–F5), com um achado em F2 |
| G. Lançamentos e escopo | Passou (G1–G7), com um achado em G6 |
| H. Validações | Passou (H1–H6); **H7 reprovou** (contraste) na primeira execução e passou após a correção (seção 5) |

Nenhum cenário de permissão falhou. Dos 6 achados da seção 3, quatro são só do web (1, 3, 5, 6), um é só do backend (4: categorias de lançamento duplicadas) e um é dos dois (2: total da compra).

## 2. Resultados por cenário

**A. Permissões** (`permissoes[]` do `/auth/me`)
- ROOT: `LANCAMENTOS_REGISTRAR`, `FINANCEIRO_CONSULTAR`, `CADASTROS_CONSULTAR`, `CADASTROS_GERENCIAR`,
  `ESTOQUE_GERENCIAR`, `USUARIOS_GERENCIAR`, `USUARIOS_ALTERAR_PAPEL`, `CONTA_PROPRIA`.
- ADMIN: as mesmas, sem `USUARIOS_ALTERAR_PAPEL`.
- OPERADOR: `LANCAMENTOS_REGISTRAR`, `FINANCEIRO_CONSULTAR`, `CADASTROS_CONSULTAR`, `CONTA_PROPRIA`.
- Nenhum dos três tem `TERMOS_GERENCIAR` (só SUPER_ROOT): `/termos` redireciona ao dashboard nos três.
- Menu: ROOT e ADMIN veem Dashboard, Usuários, Cat. Produto, Produtos, Estoque, Clientes, Fornecedores, Cat. Lançamento,
  Lançamentos e Relatórios; o OPERADOR vê só Dashboard, Cat. Produto, Produtos, Clientes, Fornecedores, Cat. Lançamento e Lançamentos.
- Os três caem em `/dashboard` após o login.
- OPERADOR por URL: `/produtos/novo`, `/estoque`, `/relatorios/margem`, `/usuarios`, `/termos` redirecionam ao dashboard.
  `/clientes/novo` e `/fornecedores/novo` não existem (o cadastro é por diálogo): dão 404.
- Botões de escrita (Novo produto/cliente/fornecedor, Nova categoria, Editar): visíveis para ROOT e ADMIN, ausentes para o OPERADOR.

**B. Cadastros**
- ROOT e ADMIN criaram categorias de produto e de lançamento, produtos, clientes e fornecedores; ROOT editou e desativou produto.
  Produto inativo some da lista de escolha do lançamento.
- OPERADOR consulta tudo (listas e detalhe do produto, sem botões de ação).
- B8, chamadas diretas do OPERADOR: `POST /produtos`, `PATCH /produtos/{id}/desativar`, `POST /clientes`, `POST /fornecedores`,
  `POST /categorias-produto`, `POST /categorias-lancamento` e `PUT /produtos/{id}` retornam **403**; também 403 em
  `GET /estoque/movimentacoes`, `GET /relatorios/margem`, `GET /termos/admin` e `GET /usuarios`.
- B9: CPF repetido dá 409 ("CPF/CNPJ já cadastrado"); CPF `11111111111` passa pela validação do web e o backend responde 422.

**C. Estoque:** entrada de estoque pelo ajuste registra a movimentação; saída acima do saldo é rejeitada com 422
("Estoque insuficiente para realizar a operação"); produto com saldo abaixo do mínimo aparece no filtro "Abaixo do mínimo".

**D–F. Lançamentos registrados** (todos com 201, conferidos na base)
- Sem itens: receita avulsa (PIX), entrada com cliente e categoria (dinheiro), entrada a prazo (crédito, 3 parcelas em aberto),
  despesa com categoria, saída a prazo (promissória, 2 parcelas). O request sai **sem** `itens`.
- Com itens: venda de 1 produto (descrição = nome do produto), venda de 2 produtos (total 75,50), venda com desconto (total 25,00),
  venda a prazo com cliente (2 parcelas), compra com fornecedor (estoque sobe 10).
- E5: venda de 100 unidades com saldo 7 retorna 422 e **não grava** nada; saldo intacto.
- E8: o histórico de movimentações da base bate com cada venda e compra (origem `VENDA`/`COMPRA`/ajustes).
- F4: saída lista só categorias de saída e entrada só as de entrada. F5: trocar o tipo limpa cliente/fornecedor.
- ADMIN e OPERADOR também registraram venda, receita e despesa.

**G. Escopo:** ROOT e ADMIN veem os 19 lançamentos da empresa; o OPERADOR vê apenas os 3 que criou.
Detalhe do próprio lançamento abre (200). Abrir por URL o lançamento de outro autor dá 403 para o OPERADOR e a tela
mostra "Não foi possível carregar o lançamento". ADMIN e ROOT abrem qualquer um. O saldo do dashboard do OPERADOR
(R$ 88,00) é só o que ele lançou; ROOT e ADMIN mostram os mesmos totais da empresa.

**H. Validações:** sem itens e sem descrição não avança; item sem produto não avança ("Selecione um produto");
valor vazio ou zero não salva; sessão inválida no meio do wizard leva ao login (os dados digitados se perdem).
Parcelas = 0 em crédito: ver achado 5.

## 3. Achados

| # | Camada | Gravidade | Resumo |
|---|---|---|---|
| 1 | **Web** | Média | Subtotal do item no detalhe não multiplica pela quantidade; total sugerido trata o desconto como da linha, mas o backend aplica por unidade |
| 2 | **Web + Backend** | Média | Total sugerido da compra usa o preço de venda; backend aceita total diferente da soma dos itens |
| 3 | **Web** | Média | Contraste de cor abaixo do WCAG AA em vários componentes |
| 4 | **Backend** | Baixa | Categorias de **lançamento** com nome repetido são aceitas (as de produto já são únicas) |
| 5 | **Web** | Baixa | Parcelas = 0 só é barrada pelo backend |
| 6 | **Web** | Baixa | Cliente e fornecedor só validam o tamanho do documento; dígitos verificadores só no backend |

### 3.1 Subtotal do item no detalhe do lançamento (web, média)

- **Onde:** `lancamento-detail.html`, coluna `subtotal`: `{{ item.valorUnitario | currencyBrl }}`.
- **O que acontece:** "Subtotal" mostra o preço unitário já com desconto, sem multiplicar pela quantidade. Venda mista:
  Arroz 2 × R$ 28,00 aparece como R$ 28,00 (devia ser R$ 56,00) e Refrigerante 3 × R$ 6,50 como R$ 6,50 (devia ser R$ 19,50).
  O VALOR TOTAL (R$ 75,50) e a base estão certos, então a tela fica inconsistente: os subtotais não somam o total.
- **Por que é web:** o backend devolve `valorUnitario` correto (2800 e 650 centavos) e `quantidade`; o web rotulou o campo errado.
- **Resposta do backend** (leitura de `CriarLancamentoUseCase.kt:148-150`, não executada): o desconto é **por unidade**:
  `valorUnitario = precoOriginal − desconto`. O subtotal certo é `quantidade × valorUnitario`, e a correção é só do web.
- **Correção:** calcular `quantidade × valorUnitario` na coluna.
- **Achado derivado (não executado):** o total sugerido do wizard (`calcularTotal()`) faz `preço × quantidade − desconto`,
  tratando o desconto como da linha. Com o desconto por unidade do backend, a conta correta é `(preço − desconto) × quantidade`.
  Exemplo: 2 × R$ 28,00 com "Desconto (R$)" 3,00 sugere R$ 53,00, e os itens gravados somam R$ 50,00. Com quantidade 1
  (único caso testado) os dois cálculos coincidem, por isso passou despercebido. Também vale deixar claro no campo que o
  desconto é por unidade.

### 3.2 Total sugerido da compra usa o preço de venda (web, média)

- **Onde:** `lancamento-form.component.ts`, `calcularTotal()`: soma `precoVenda × quantidade − desconto` para qualquer tipo.
- **O que acontece:** numa saída (`SAIDA_CAIXA`) com itens, o wizard preenche o total com o preço de venda. Compra de 10
  Refrigerantes (venda R$ 6,50, custo R$ 3,00): sugeriu R$ 65,00. O item é enviado com `valorUnitario` = custo (R$ 3,00), ou
  seja, os itens somam R$ 30,00. Gravou `valor_total` = R$ 65,00 com item de R$ 3,00 × 10.
- **Por que é web:** o `salvar()` já usa o custo para o item quando o tipo é saída; só o total sugerido ignorou o tipo.
- **Parte do backend** (nota do backend, leitura de `CriarLancamentoUseCase.kt`, não executada): é uma **lacuna**, não regra.
  O use case só confere `valorTotal > 0` (:58), grava o valor como veio (:70, :83) e calcula as parcelas em cima dele (:181).
  Não há comentário que indique que a divergência seja intencional.
- **Decisão de produto:** rejeitar com 422 quando `valorTotal` diferir da soma dos itens, ou aceitar. Pode haver motivo para
  aceitar (frete, arredondamento), mas isso não está registrado.
- **Correção no web:** em `SAIDA_CAIXA`, calcular o total sugerido com `precoCusto` (a mesma lógica do `salvar()`), junto com
  a correção do desconto por unidade do item 1.

### 3.3 Contraste de cor, WCAG AA (web, média)

- **Onde (axe, impacto "serious", regra `color-contrast`):**
  - `.page-header__subtitle`: dashboard (7 ocorrências) e detalhe do lançamento (2);
  - `.status-ativo` (badge "Ativo") na lista de produtos (2);
  - `.badge-saida` e demais badges de movimentação no estoque (12);
  - `.wizard-step--active .wizard-step__label` (rótulo do passo ativo) nos 3 passos do wizard de lançamento.
  A lista de lançamentos passou sem violações.
- **Por que importa:** o `CLAUDE.md` do projeto exige passar em todas as checagens do AXE e nos mínimos de contraste do WCAG AA.
- **Por que é web:** são cores de CSS/tema do front. Não rodei o axe nas demais telas (clientes, fornecedores, categorias,
  usuários), então a lista pode estar incompleta.

### 3.4 Categorias de lançamento duplicadas (backend, baixa)

- **O que acontece:** criar duas categorias de lançamento com o mesmo nome é aceito (ficaram "Despesas fixas" ×3 e
  "Vendas balcão" ×2, em parte porque repeti passos do roteiro). O seletor do wizard então mostra opções idênticas.
- **Por que é backend** (nota do backend, leitura de código): `CriarCategoriaLancamentoUseCase` não confere nome e a tabela
  `categoria_lancamento` não tem `UNIQUE`. O web só repassa o POST.
- **Categoria de produto não tem o problema:** `CriarCategoriaProdutoUseCase` usa `existsByNome` e a tabela tem `nome UNIQUE`.
  Os duplicados da execução eram todos de categoria de lançamento.
- **Decisão de produto:** criar a regra. A unicidade provavelmente deve ser por **nome e tipo** juntos, porque a mesma palavra
  pode existir como receita e como despesa. O backend deve responder 409, como já faz com documento de cliente.

### 3.5 Parcelas = 0 em forma a prazo (web, baixa)

- **Onde:** `lancamento-form.component.ts`, `salvar()` confere só forma de pagamento, valor e descrição; o campo
  `quantidadeParcelas` tem `Validators.min(1)` mas não entra na conferência.
- **O que acontece:** com Cartão de Crédito e parcelas = 0, o web **envia o POST**; o backend responde 400 e a tela mostra
  "Mínimo 1 parcela". Nada é gravado, então o efeito é uma ida ao servidor à toa e a mensagem só aparece depois.
- **Por que é web:** o backend validou certo; faltou barrar antes de enviar.

### 3.6 Validação de CPF/CNPJ em cliente e fornecedor (web, baixa)

- **Correção do que escrevi antes:** o web **tem** o validador completo (dígitos verificadores e rejeição de dígitos repetidos)
  em `shared/validators/documento.validator.ts`, mas só o cadastro de empresa o usa (`register.component.ts`).
- **Onde:** `cliente-dialog.component.ts` e `fornecedor-dialog.component.ts` têm um `documentoValidator` próprio que só
  confere se há 11 ou 14 dígitos.
- **O que acontece:** CPF `111.111.111-11` passa no web; o backend responde 422. Documento com 11 dígitos e dígito
  verificador errado seria igual (não testei). Não confirmei se a mensagem do 422 aparece na tela (o diálogo mostra a
  mensagem do backend num banner, como no 409 "CPF/CNPJ já cadastrado"; só não capturei o texto do 422).
- **Por que é web:** a regra do backend está correta; falta reaproveitar o validador compartilhado nos dois diálogos.
  O validador atual de grupo (`documentoValido`) depende de um campo `tipoDocumento`, que esses diálogos não têm, então
  precisaria de uma versão por controle (ou inferir CPF/CNPJ pelo tamanho).

## 4. Observações

- O cenário G3 foi feito com **um** OPERADOR: prova que ele não vê os lançamentos de ROOT e ADMIN, mas não a separação entre
  dois OPERADORES.
- C3, E5 e o 403 do B8 provocam erro de propósito.
- D3 cobriu só dinheiro e PIX à vista; débito/cheque não foram exercitados.
- O estoque mínimo do produto precisa ser maior que zero no formulário (regra do web já conhecida).

## 5. Correções aplicadas e revalidação (2026-10-02, segunda execução)

Depois do plano aprovado, a base de dev foi zerada e refeita (empresa cadastrada pelo `/registro`, ROOT ativado pelo link,
ADMIN e OPERADOR convidados e ativados) e os blocos A–H foram repetidos pelo navegador.

| # | Achado | Correção | Revalidação |
|---|---|---|---|
| 1 | Subtotal sem quantidade | `lancamento-detail`: `subtotal = quantidade × valorUnitario` (valor unitário já com desconto, por unidade) | Venda mista: Arroz 2 × R$ 28,00 = R$ 56,00 e Refrigerante 3 × R$ 6,50 = R$ 19,50, somando o total de R$ 75,50 |
| 1 (derivado) | Total sugerido tratava o desconto como da linha | `calcularTotal()`: `(preço − desconto) × quantidade`; campo renomeado "Desconto por unidade (R$)"; coluna do detalhe "Desconto/un." | Arroz 2 × R$ 28,00 com desconto 3,00: sugeriu R$ 50,00 (antes R$ 53,00) e o backend gravou R$ 50,00 |
| 2 | Total da compra usava o preço de venda | Em saída usa `precoCusto ?? precoVenda`; o total é recalculado ao trocar o tipo (só quando há itens) | Compra de 10 Refrigerantes: sugeriu R$ 30,00 (antes R$ 65,00) |
| 3 | Contraste | `--phonus-text-secondary` `#6b7280` → `#4b5563`; tokens novos `--phonus-primary-text` `#0a7a45` e `--phonus-error-text` `#b91c1c` para texto (status "Ativo", badges do estoque, passo ativo do wizard, links, margem, menu ativo) | axe (WCAG A/AA): **sem violações** em 15 telas autenticadas (dashboard, lista e detalhe de lançamento, 3 passos do wizard, produtos, estoque, clientes, fornecedores, categorias, usuários, Minha conta, margem) e em 5 públicas (login, registro, esqueceu a senha, verifique e-mail, 404) |
| 5 | Parcelas = 0 | `salvar()` confere `quantidadeParcelas` em forma a prazo | Mensagem "Mínimo 1 parcela" e **nenhuma chamada** ao backend |
| 6 | Documento de cliente/fornecedor | Novo `cpfCnpjValido` (por controle, infere CPF/CNPJ pelo tamanho, confere dígitos); mensagem "CPF ou CNPJ inválido" | CPF `111.111.111-11` barrado no web, sem POST |
| 4 | Categoria de lançamento duplicada | **Backend** (fora deste repositório): agora 409 por nome e tipo | "VENDAS BALCÃO" (entrada) → 409 "Já existe uma categoria 'VENDAS BALCÃO' do tipo ENTRADA_CAIXA"; categoria de produto "BEBIDAS" → 409; ambos aparecem no banner do diálogo |

Pendente (decisão de produto, backend): rejeitar `valorTotal` diferente da soma dos itens (hoje só confere `> 0`).

Testes unitários: 335 passam (eram 324); fixtures de cliente e fornecedor passaram a usar CPF e CNPJ válidos. O
`margem.component.spec.ts` já emitia erros não tratados de HTTP antes destas mudanças (confirmado sem elas) e não foi alterado.

Estado da base após a segunda execução: 16 lançamentos de teste, 7 categorias de lançamento (5 padrão + 2), Refrigerante
Lata (saldo 22), Arroz 5kg (saldo 4), Suco Caixa inativo.

## 6. Estado deixado na base de dev (primeira execução)

- Usuários: ROOT, ADMIN e OPERADOR ativos.
- Cadastros: categorias de produto (Bebidas, Alimentos); produtos Refrigerante Lata (saldo 22), Arroz 5kg (saldo 6) e
  Suco Caixa (inativo); clientes Alfa e Beta; fornecedores Gama e Delta; categorias de lançamento duplicadas (achado 4).
- 19 lançamentos de teste, incluindo repetições de "Serviço a prazo" e "Compra a prazo" por reexecução do roteiro
  e os dois "(teste)" de uma validação anterior.
