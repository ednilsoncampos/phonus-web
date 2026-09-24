# Configuração Manual para o Primeiro Deploy — Phonus Web

**Criado em:** 2026-09-24
**Status:** Preparação apenas — deploy ainda não deve ser executado. Ver Etapa 16 de
`docs/plano-desenvolvimento-web.md` (só entra depois da Etapa 15 — Testes de Homologação).

Este documento lista o que precisa ser feito **fora do código** (contas, variáveis, DNS) antes de
rodar o primeiro deploy em produção. Nada aqui exige mudança no repositório.

---

## 1. Backend em produção

- [ ] Confirmar que a API Phonus está publicada em um endereço público (ex.: `https://api.phonus.com.br/api/v1`)
- [ ] Confirmar que o backend libera CORS para o domínio que a Vercel vai gerar
  (ex.: `https://phonus-web.vercel.app` e, se houver, o domínio customizado)
- [ ] Confirmar que o backend está na versão de contrato usada neste plano
  (`docs/swagger-phonus-api-v1.yaml` — mudanças descritas em `docs/melhorias-mobile.md`)

## 2. Conta e projeto na Vercel

- [ ] Criar/usar uma conta na Vercel vinculada ao GitHub (`ednilsoncampos`)
- [ ] Importar o repositório `phonus-web` como novo projeto
- [ ] Framework preset: **Angular** (a Vercel detecta automaticamente pelo `angular.json`)
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist/phonus-web/browser`
- [ ] `vercel.json` já existe no repositório com o rewrite de SPA
  (`{ "routes": [{ "src": "/(.*)", "dest": "/index.html" }] }`) — nada a configurar aqui

## 3. Variáveis de ambiente

| Variável | Onde configurar | Valor |
|---|---|---|
| `NG_APP_API_URL` | Vercel → Project Settings → Environment Variables | URL base da API em produção (ex.: `https://api.phonus.com.br/api/v1`) |

- [ ] Definir `NG_APP_API_URL` no ambiente **Production**
- [ ] Definir `NG_APP_API_URL` no ambiente **Preview** (pode apontar para uma API de homologação, se existir)
- `src/environments/environment.prod.ts` já lê essa variável via `process.env['NG_APP_API_URL']` — não há
  outras chaves ou segredos no build de produção (`devCredentials` é `null`)

## 4. Branch e deploy

- [ ] Confirmar que a branch de produção na Vercel é a `main`
- [ ] Cada push em `main` gera deploy de produção; outras branches/PRs geram Preview Deployments
- [ ] Primeiro deploy: usar um **Preview Deployment** para validar antes de promover para produção

## 5. Domínio (opcional, pode ficar para depois)

- [ ] Se houver domínio próprio (ex.: `app.phonus.com.br`), configurar em Project Settings → Domains
- [ ] Apontar o DNS (registro `CNAME` para `cname.vercel-dns.com`, conforme instrução da própria Vercel)
- [ ] Certificado SSL é emitido automaticamente pela Vercel após a validação do domínio

## 6. Checklist pós-deploy (validação manual)

- [ ] Abrir a URL do deploy e confirmar que a tela de login carrega
- [ ] Testar login com um usuário ROOT real
- [ ] Recarregar (F5) em uma rota interna (ex.: `/produtos`) e confirmar que não dá 404 (valida o rewrite SPA)
- [ ] Confirmar no DevTools que as chamadas de API vão para `NG_APP_API_URL`, não para `localhost`

---

## Pontos em aberto (decidir antes do deploy)

- [ ] Domínio customizado ou usar o subdomínio padrão da Vercel?
- [ ] A API de produção já está no ar, ou o deploy do web vai esperar o backend?
