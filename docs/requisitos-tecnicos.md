# ⚙️ PROMPT — CRIAÇÃO DO PROJETO WEB (PHONUS)

## 🎯 Objetivo

Criar um projeto Angular 21.2.5 para o painel administrativo do sistema Phonus, com foco em:

* Gestão de usuários
* Cadastros administrativos
* Controle de estoque
* Integração com backend REST já existente
* Deploy automatizado via Vercel (CI/CD)

---

## 🧱 Stack

* Angular 21+ (standalone components)
* Angular Material 21 ou proximo desta versao
* TypeScript
* RxJS + Signals (`signal`, `computed`)
* Reactive Forms
* Angular Router (com guards)
* HttpClient + interceptors (JWT + refresh)
* Deploy: Vercel (SPA)

---

## 🚀 Criação do projeto

```bash
npm install -g @angular/cli
ng new phonus-web --standalone --routing --style=scss
cd phonus-web
ng add @angular/material
```

---

## 🎨 Tema (Angular Material)

Configurar tema com:

* Primary: `#16B364`
* Background: `#F7F9FC`
* Error: `#F04438`

Criar arquivo:

```scss
src/styles/theme.scss
```

---

## 📁 Estrutura de pastas

```
src/app/
├── core/
│   ├── interceptors/
│   ├── guards/
│   ├── services/
│   └── models/
│
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── usuarios/
│   ├── produtos/
│   ├── estoque/
│   ├── categorias/
│   ├── clientes/
│   ├── fornecedores/
│   ├── termos/
│   └── relatorios/
│
├── shared/
│   ├── components/
│   ├── pipes/
│   └── utils/
│
├── layout/
│   ├── sidebar/
│   ├── topbar/
│   └── shell/
```

---

## 🔐 Autenticação

### Requisitos:

* JWT (access token)
* Refresh token automático

---

### Interceptor

Criar interceptor para:

* Adicionar header:

```http
Authorization: Bearer <token>
```

* Em caso de 401:

  * chamar `/auth/refresh`
  * repetir requisição original

---

## 🛡️ Guards

### AuthGuard

* bloqueia rotas sem login

### RoleGuard

* valida papel:

  * SUPER_ROOT
  * ROOT
  * ADMIN

---

## 🌐 Configuração de ambiente

### `environment.ts`

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080'
};
```

### `environment.prod.ts`

```ts
export const environment = {
  production: true,
  apiUrl: 'https://api.seudominio.com'
};
```

---

## 📡 Serviços HTTP

Criar base service:

* `AuthService`
* `UsuarioService`
* `ProdutoService`
* `EstoqueService`
* etc.

Todos usando:

```ts
this.http.get(`${environment.apiUrl}/endpoint`)
```

---

## 🧠 Estado

* Usar `BehaviorSubject` ou `signal()`
* NÃO usar NgRx

---

## 🧩 Layout

### Shell principal:

* Sidebar (menu lateral)
* Topbar (usuário + logout)
* Router outlet

---

### Sidebar:

Itens visíveis por papel:

* Dashboard
* Usuários (ROOT/ADMIN)
* Produtos
* Estoque
* Categorias
* Clientes
* Fornecedores
* Termos (ROOT)
* Relatórios

---

## 📄 Rotas

Exemplo:

```ts
{
  path: 'usuarios',
  canActivate: [AuthGuard, RoleGuard],
  data: { roles: ['ROOT', 'ADMIN'] },
  loadComponent: () => import('./features/usuarios/list.component')
}
```

---

## 📱 Responsividade

* Sidebar colapsável
* Layout adaptado para telas menores
* Uso de `BreakpointObserver` (Angular CDK)

---

## 🎯 Boas práticas

* Separar DTO de Model
* Evitar lógica no componente
* Centralizar chamadas HTTP
* Tratar erros globalmente
* Usar loading states

---

# 🚀 DEPLOY — VERCEL (CI/CD)

## 📦 Build

```bash
npm run build
```

Output:

```
dist/phonus-web
```

---

## ⚙️ Configuração Vercel

### Criar arquivo:

```json
vercel.json
```

Conteúdo:

```json
{
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

---

## 🔗 Setup no Vercel

* Importar repositório (GitHub)
* Framework: Other
* Build command:

```bash
npm run build
```

* Output directory:

```
dist/phonus-web
```

---

## 🔄 CI/CD automático

A cada:

```bash
git push
```

O Vercel:

* instala dependências
* executa build
* faz deploy automático

---

## 🌍 Variáveis de ambiente

Configurar no Vercel:

* `NG_APP_API_URL=https://api.seudominio.com`

---

## 🔀 Ambientes

| Branch    | Ambiente           |
| --------- | ------------------ |
| main      | Produção           |
| feature/* | Preview automático |

---

## 🔐 Segurança

* Nunca armazenar token em local inseguro
* Preferir `HttpOnly cookie` (futuro)
* Validar role no backend

---

## ⚠️ Regras importantes

* Aplicação é SPA (sem SSR)
* SEO não é necessário
* Todo acesso depende de autenticação

---

## 🚀 Próximos passos

* Implementar Auth + Login
* Criar Dashboard
* Implementar módulo de usuários
* Seguir ordem de módulos definida

---

## 🎯 Resultado esperado

* Sistema web funcional integrado ao backend
* Deploy automático funcionando
* Estrutura escalável para SaaS
