# Plano de Desenvolvimento Mobile — Phonus FC

## Stack Recomendada

| Camada | Tecnologia |
|--------|-----------|
| Linguagem | Kotlin |
| UI | Jetpack Compose |
| Navegação | Navigation Compose |
| DI | Hilt |
| HTTP | Retrofit + OkHttp |
| Auth local | DataStore (JWT persistido) |
| DB local | Room (cache offline) |
| Voz | Android SpeechRecognizer (nativo) |
| Pagamentos | Google Play Billing Library 7+ |
| Push | Firebase Cloud Messaging (FCM) |
| Testes | JUnit 5 + Turbine + MockK |

---

## Etapas de Desenvolvimento

### Etapa 1 — MVP: Voz + Caixa `(~3 semanas)`
Funcionalidade central do app — razão de existir do produto.

- [ ] Setup do projeto (Hilt, Retrofit, DataStore, Navigation)
- [ ] Telas de Login e Registro
- [ ] Ativação de conta por e-mail (fluxo já existe no backend)
- [ ] Tela principal: fluxo de caixa (GET `/caixa`)
- [ ] Registro de lançamento por **voz** (SpeechRecognizer → texto → POST `/lancamentos`)
- [ ] Registro de lançamento por texto (formulário manual)
- [ ] Listagem e detalhe de lançamentos
- [ ] Logout + renovação de token (refresh automático)

---

### Etapa 2 — Financeiro Completo `(~2 semanas)`

- [ ] Contas a Receber (GET `/contas-a-receber`)
- [ ] Contas a Pagar (GET `/contas-a-pagar`)
- [ ] Registro de pagamento de parcela (POST `/pagamentos`)
- [ ] Filtros por período, status e tipo
- [ ] Tela de parcelas de um lançamento

---

### Etapa 3 — Estoque `(~2 semanas)`

- [ ] Listagem de produtos (GET `/produtos`)
- [ ] Criar / editar produto
- [ ] Categorias de produto
- [ ] Ajuste de estoque manual
- [ ] Relatório de estoque (produtos abaixo do mínimo)
- [ ] Relatório de margem de contribuição

---

### Etapa 4 — Clientes e Fornecedores `(~1 semana)`

- [ ] CRUD de clientes
- [ ] CRUD de fornecedores
- [ ] Vincular lançamento a cliente/fornecedor

---

### Etapa 5 — Gestão de Equipe `(~1 semana)`

- [ ] Listagem de usuários (para admins)
- [ ] Convidar / desativar usuário
- [ ] Troca de senha e perfil próprio

---

### Etapa 6 — Assinatura / Monetização `(~2 semanas)`
**Recomendado implementar cedo** para validar fluxo de billing antes de ter usuários reais.

- [ ] Integração com Google Play Billing Library 7+
- [ ] Tela de planos (Free / Pro / Business)
- [ ] Verificação de assinatura ativa no backend (POST `/assinaturas/validar`)
- [ ] Bloqueio de funcionalidades por plano (feature gates locais)
- [ ] Tratamento de RTDN (renovação, cancelamento, expiração)
- [ ] Tela de gerenciamento de assinatura

---

### Etapa 7 — Qualidade e Produção `(~2 semanas)`

- [ ] Testes unitários (ViewModels, Repositories)
- [ ] Testes de UI com Compose Testing
- [ ] Tratamento global de erros de rede (sem conexão, timeout)
- [ ] Cache offline com Room para lançamentos e produtos
- [ ] Push notifications (FCM) — parcelas vencendo, confirmações
- [ ] Relatórios em PDF / compartilhamento
- [ ] Configurações de perfil e notificações
- [ ] Publicação na Play Store (internal track → closed → open)

---

## Ordem Recomendada

```
Etapa 1 (MVP) → Etapa 6 (Billing) → Etapa 2 → Etapa 3 → Etapa 4 → Etapa 5 → Etapa 7
```

> Billing antes do financeiro completo garante que o fluxo de pagamento esteja validado desde cedo, evitando retrabalho ao inserir feature gates depois.

---

## Arquitetura Mobile

```
ui/           → Screens (Compose) + ViewModels
domain/       → Models, UseCases, Repository interfaces
data/         → RetrofitApi, RoomDao, DataStore, RepositoryImpl
di/           → Hilt modules
```

Seguir Clean Architecture análoga ao backend: ViewModels não conhecem Retrofit diretamente — apenas interfaces de repositório.

---

## Endpoints Principais Consumidos

| Método | Rota | Etapa |
|--------|------|-------|
| POST | `/auth/login` | 1 |
| POST | `/auth/registro` | 1 |
| GET | `/auth/ativar` | 1 |
| POST | `/auth/refresh` | 1 |
| POST | `/lancamentos` | 1 |
| GET | `/caixa` | 1 |
| GET | `/contas-a-receber` | 2 |
| GET | `/contas-a-pagar` | 2 |
| POST | `/pagamentos` | 2 |
| GET/POST | `/produtos` | 3 |
| GET/POST | `/clientes` | 4 |
| GET/POST | `/fornecedores` | 4 |
| POST | `/assinaturas/validar` | 6 |
| POST | `/assinaturas/rtdn` | 6 |
