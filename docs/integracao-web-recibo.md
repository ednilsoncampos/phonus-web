# Recibo de venda — resumo para o web (e o app)

Contrato completo: `docs/api-reference-mobile.md` (seções 3 e 18). Decisões: `docs/requisitos/recibo-lancamento.md`.
Base: `/api/v1`. Todas as chamadas abaixo exigem `Authorization: Bearer <accessToken>`.

## O que mudou na API

| Rota | Papel | Para quê |
|---|---|---|
| `GET /lancamentos/{id}/recibo?formato=pdf\|png` | qualquer papel (OPERADOR só o que lançou) | baixa o recibo da venda (**binário**, não JSON) |
| `GET /empresa` | qualquer papel de empresa | nome, tipo e documento, endereço, telefone |
| `PUT /empresa` | só ROOT | altera nome, endereço, telefone (vazio/`null` remove; documento não muda) |
| `POST /auth/registro` | público | agora aceita `endereco` e `telefone` (opcionais) |
| `GET /auth/me` | — | `permissoes` ganhou `EMPRESA_GERENCIAR` (só ROOT) |

## Recibo

- **Só venda** (`tipo = ENTRADA_CAIXA`). Em compra a API devolve `422`; **não mostre o botão** em lançamentos `SAIDA_CAIXA`.
- **Nada é salvo**: cada chamada gera o arquivo na hora a partir do lançamento atual. Baixe uma vez e reutilize (exibir, baixar e compartilhar usam o mesmo arquivo).
- `formato`: `pdf` (padrão) ou `png`; outro valor → `400`.
- Resposta: `application/pdf` ou `image/png`; `Content-Disposition: inline; filename="recibo-<CODIGO>.<ext>"`.
  `<CODIGO>` = 8 primeiros caracteres do id do lançamento, em maiúsculas (é o `#CODIGO` impresso no recibo).
- PNG: 680 px de largura, fundo transparente fora do papel serrilhado. PDF: 1 página de 80 mm.
- Conteúdo: empresa (nome, CNPJ/CPF, endereço, telefone), código, datas, atendente, cliente com **CPF/CNPJ e telefone mascarados**
  (ou "Consumidor"), itens com desconto por unidade, subtotal/descontos/total, pagamento (à vista: "Pago em"; a prazo: parcelas,
  total pago e em aberto), selo `PAGO`/`PARCIAL`/`A PRAZO`, "Sem valor fiscal". Custo do produto nunca aparece.

### Como buscar no navegador

Um `<a href>` ou `window.open` **não leva o `Authorization`**. Use `fetch` e trabalhe com o blob:

```js
async function baixarRecibo(lancamentoId, formato = 'pdf') {
  const resp = await fetch(`${API}/lancamentos/${lancamentoId}/recibo?formato=${formato}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) throw await resp.json();            // ErrorResponse padrão (status, message)
  const blob = await resp.blob();
  const nome = /filename="([^"]+)"/.exec(resp.headers.get('Content-Disposition') ?? '')?.[1]
    ?? `recibo-${lancamentoId.slice(0, 8).toUpperCase()}.${formato}`;
  return { blob, nome };
}
```

- **Exibir:** `URL.createObjectURL(blob)` num `<img>` (PNG) ou `<iframe>`/aba nova (PDF); chame `URL.revokeObjectURL` depois.
- **Baixar:** link temporário com `download = nome`.
- **Compartilhar:** `navigator.share({ files: [new File([blob], nome, { type: blob.type })] })` quando
  `navigator.canShare?.({ files })` for verdadeiro (celular e alguns desktops); senão, ofereça baixar. O compartilhamento é do
  cliente: a API só entrega o arquivo. No app, usar a folha de compartilhamento do sistema com o arquivo salvo em cache.
- **CORS:** `Content-Disposition` e `Retry-After` agora estão expostos (antes o JS não os enxergava).

### Erros que a tela deve tratar

| Status | Quando | Sugestão de tela |
|---|---|---|
| 400 | formato inválido | (bug de código; não deve ocorrer) |
| 401 | token ausente/expirado | fluxo normal de refresh/login |
| 403 | OPERADOR pedindo venda de outro usuário | "Você não tem acesso a este lançamento" |
| 404 | lançamento inexistente ou de outra empresa | "Lançamento não encontrado" |
| 422 | não é venda, ou itens demais para um recibo | "Só vendas têm recibo" / "Venda grande demais para gerar recibo" |
| 429 | mais de **30 recibos/min por usuário** | desabilitar o botão e mostrar o tempo de `Retry-After` (segundos) |

## Empresa (cabeçalho do recibo)

- Tela de dados da empresa: `GET /empresa` para preencher; `PUT /empresa` para salvar (só mostrar edição se `permissoes` tiver `EMPRESA_GERENCIAR`).
- Limites: `nome` obrigatório até 150, `endereco` até 200, `telefone` até 30. Endereço em **uma linha**.
- Se endereço/telefone estiverem vazios, o recibo sai sem essas linhas. Vale sugerir o preenchimento antes do primeiro recibo.
- No cadastro (`POST /auth/registro`) dá para já enviar `endereco` e `telefone`.

## Ainda não existe (não construir ainda)

- Logo da empresa no recibo (a logo do Phonus FC já sai no rodapé). Planejado: `PUT|GET|DELETE /empresa/logo`, só ROOT.
- Recibo de compra, QR Code de verificação, limite de itens por lançamento.

## Para testar o web

Depois de atualizar o backend, **zere o banco local**: a V1 do schema `public` ganhou as colunas `endereco` e `telefone` em
`empresa`, e o Flyway acusa checksum diferente em bancos antigos. Empresas já cadastradas passam a ter os dois campos vazios.
