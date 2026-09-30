
1. Onboarding (schema public → provisiona o tenant)

┌─────┬─────────────────────────────┬─────────────────────────────────────────────────────────────────────────┬──────────────────────────────┐
│  #  │           Tabela            │                         Cadastro/Funcionalidade                         │          Depende de          │
├─────┼─────────────────────────────┼─────────────────────────────────────────────────────────────────────────┼──────────────────────────────┤
│ 1   │ termos_aceite               │ (seed já existe) — GET /termos/atual para pegar o termosId vigente      │ —                            │
├─────┼─────────────────────────────┼─────────────────────────────────────────────────────────────────────────┼──────────────────────────────┤
│ 2   │ empresa                     │ POST /auth/registro — cria a empresa e dispara a provisão do schema     │ termos_aceite (via termosId) │
│     │                             │ t_<id>                                                                  │                              │
├─────┼─────────────────────────────┼─────────────────────────────────────────────────────────────────────────┼──────────────────────────────┤
│ 3   │ usuario_global              │ Inserido junto no registro (mapa e-mail → empresa)                      │ empresa                      │
├─────┼─────────────────────────────┼─────────────────────────────────────────────────────────────────────────┼──────────────────────────────┤
│ 4   │ usuario (tenant, papel      │ Inserido junto no registro, no schema recém-criado                      │ empresa (schema              │
│     │ ROOT)                       │                                                                         │ provisionado)                │
├─────┼─────────────────────────────┼─────────────────────────────────────────────────────────────────────────┼──────────────────────────────┤
│ 5   │ token_ativacao_usuario      │ Emitido automaticamente; GET/POST /auth/ativar ativa a conta ROOT       │ usuario                      │
├─────┼─────────────────────────────┼─────────────────────────────────────────────────────────────────────────┼──────────────────────────────┤
│ 6   │ usuario_aceite_termos       │ Gravado junto do registro (aceite do ROOT)                              │ usuario + termos_aceite      │
└─────┴─────────────────────────────┴─────────────────────────────────────────────────────────────────────────┴──────────────────────────────┘

2. Usuários adicionais (mesma empresa)

┌─────┬──────────────────────────┬────────────────────────────────────────────────────┬───────────────────────┐
│  #  │          Tabela          │              Cadastro/Funcionalidade               │      Depende de       │
├─────┼──────────────────────────┼────────────────────────────────────────────────────┼───────────────────────┤
│ 7   │ usuario (ADMIN/OPERADOR) │ POST /usuarios — convite pelo ROOT/ADMIN           │ usuario ROOT já ativo │
├─────┼──────────────────────────┼────────────────────────────────────────────────────┼───────────────────────┤
│ 8   │ token_ativacao_usuario   │ Ativação do convidado (precisa_definir_senha=true) │ usuario               │
└─────┴──────────────────────────┴────────────────────────────────────────────────────┴───────────────────────┘

3. Assinatura (opcional, a qualquer momento após onboarding)

┌─────┬─────────────────────┬────────────────────────────────────────────────┬─────────────────────────────┐
│  #  │       Tabela        │            Cadastro/Funcionalidade             │         Depende de          │
├─────┼─────────────────────┼────────────────────────────────────────────────┼─────────────────────────────┤
│ 9   │ planos_assinatura   │ (seed já existe, gerido pelo SUPER_ROOT)       │ —                           │
├─────┼─────────────────────┼────────────────────────────────────────────────┼─────────────────────────────┤
│ 10  │ assinaturas_usuario │ POST /assinaturas/validar / POST /rtdn/webhook │ usuario + planos_assinatura │
└─────┴─────────────────────┴────────────────────────────────────────────────┴─────────────────────────────┘

4. Cadastros base (tenant — sem dependência entre si, podem ser feitos em qualquer ordem)

┌─────┬──────────────────────┬──────────────────────────────────────────────────────────────┬────────────────────────────────────────────────┐
│  #  │        Tabela        │                   Cadastro/Funcionalidade                    │                   Depende de                   │
├─────┼──────────────────────┼──────────────────────────────────────────────────────────────┼────────────────────────────────────────────────┤
│ 11  │ categoria_lancamento │ (seed já existe) — POST /categorias-lancamento para          │ usuario (autenticação)                         │
│     │                      │ adicionar mais                                               │                                                │
├─────┼──────────────────────┼──────────────────────────────────────────────────────────────┼────────────────────────────────────────────────┤
│ 12  │ categoria_produto    │ POST /categorias-produto                                     │ usuario                                        │
├─────┼──────────────────────┼──────────────────────────────────────────────────────────────┼────────────────────────────────────────────────┤
│ 13  │ cliente              │ POST /clientes                                               │ usuario                                        │
├─────┼──────────────────────┼──────────────────────────────────────────────────────────────┼────────────────────────────────────────────────┤
│ 14  │ fornecedor           │ POST /fornecedores                                           │ usuario                                        │
├─────┼──────────────────────┼──────────────────────────────────────────────────────────────┼────────────────────────────────────────────────┤
│ 15  │ produto              │ POST /produtos                                               │ categoria_produto (opcional) + usuario         │
│     │                      │                                                              │ (criado_por)                                   │
└─────┴──────────────────────┴──────────────────────────────────────────────────────────────┴────────────────────────────────────────────────┘

5. Operação financeira (tenant — ordem obrigatória)

┌─────┬──────────────────────┬────────────────────────────────────────────────────────────────┬──────────────────────────────────────────────┐
│  #  │        Tabela        │                    Cadastro/Funcionalidade                     │                  Depende de                  │
├─────┼──────────────────────┼────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────┤
│ 16  │ lancamento           │ POST /lancamentos (ou /lancamentos/interpretar por voz)        │ usuario + opcional categoria_lancamento,     │
│     │                      │                                                                │ cliente/fornecedor                           │
├─────┼──────────────────────┼────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────┤
│ 17  │ lancamento_item      │ Itens do lançamento (venda/compra)                             │ lancamento + produto                         │
├─────┼──────────────────────┼────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────┤
│ 18  │ movimentacao_estoque │ Gerado automaticamente pelo item (ou POST /estoque/ajuste      │ produto + lancamento_item (opcional) +       │
│     │                      │ manual)                                                        │ usuario                                      │
├─────┼──────────────────────┼────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────┤
│ 19  │ parcela              │ Gerada automaticamente ao criar o lançamento                   │ lancamento                                   │
├─────┼──────────────────────┼────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────┤
│ 20  │ pagamento            │ Automático (à vista) ou POST /pagamentos (baixa manual) /      │ parcela                                      │
│     │                      │ PATCH /parcelas/{id}/baixar                                    │                                              │
└─────┴──────────────────────┴────────────────────────────────────────────────────────────────┴──────────────────────────────────────────────┘

Resumo da cadeia crítica: empresa → usuario (ROOT) → ativação → cadastros base (cliente/fornecedor/produto/categorias, em paralelo) → lancamento → lancamento_item/parcela → movimentacao_estoque/pagamento.

Cenario de teste adicional:
1- Cadastrar um usuaro root(empresa)
2- Enviar convite para usuario admin
3- Enviar convite para usuario operador
4- Validar permissoes dos usuarios admin e operador convidados
5- Repetir os passos 1 a 4 para um novo usuario root, ou seja, nova empresa.
6- Cadastrar um produto em cada empresa

---

## Execução — 2026-09-24 (banco zerado, testes via navegador/Playwright)

**Contas usadas:**
- ROOT (empresa "Camposolution Suporte", CNPJ 11.222.333/0001-81): `camposolution.suporte@gmail.com` / `Senha123`
- ADMIN convidado: `maria.cs.2239@gmail.com` / `T.123456e`
- OPERADOR convidado: `ednilson.campos.dev@gmail.com` / `T.123456e`
- SUPER_ROOT (seed do `DevDataInitializer`, já existia): `ednilsoncampos@gmail.com`

**Passos 1–4 (root → admin → operador → permissões): ✅ concluído**
- Registro do ROOT via `POST /auth/registro` e ativação pelo link real de e-mail (Brevo)
- Convite de ADMIN e OPERADOR pelo dialog no navegador — e-mail duplicado bloqueado com `409`
- ADMIN: menu sem "Termos", só pode convidar OPERADOR
- OPERADOR: menu só com "Dashboard"; `roleGuard` bloqueia navegação direta às demais rotas
- **Bug encontrado e corrigido:** ADMIN via botão "Desativar" habilitado para ROOT/outro ADMIN na lista de usuários (front não checava o próprio papel; backend já bloqueava com 403). Corrigido em `UsuariosListComponent.podeDesativar()`.

**Passo 5 (segunda empresa): não executado**
- `ednilsoncampos@gmail.com` não pode ser reaproveitado (já é SUPER_ROOT, e-mail único → 409). Precisa de um terceiro e-mail real e ativação manual para repetir o cenário com uma segunda empresa e validar isolamento entre tenants.

**Passo 6 (produto por empresa): parcial**
- Produto cadastrado na empresa 1 ("Refrigerante Lata 350ml"), com categoria e ajuste de estoque. Não testado na segunda empresa (não criada).

**Extras testados nesta rodada (fora do roteiro original):**
- Ajuste de estoque (AJUSTE_POSITIVO) e venda com estoque insuficiente → `422` com mensagem tratada na tela
- Lançamento `ENTRADA_CAIXA` e `SAIDA_CAIXA` → dashboard atualizou o saldo de caixa corretamente
- Filtros de data (`dataInicio`/`dataFim`) na lista de lançamentos → resultado correto dentro e fora do período, sem erro 500

**Nota:** o token de `token_ativacao_usuario` fica em texto plano no banco, mas `GET /auth/ativar` exige também o parâmetro `e` (gerado só dentro do link do e-mail) — não dá para montar o link de ativação manualmente a partir do banco; a ativação real precisa do e-mail.
