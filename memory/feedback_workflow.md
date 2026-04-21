---
name: Feedback — Fluxo de trabalho validado
description: Regras de comportamento e preferências de fluxo confirmadas nesta sessão
type: feedback
---

**Regra:** Fazer `git add` ao fim de cada etapa, nunca `git commit`.
**Why:** O usuário prefere revisar e fazer os commits manualmente.
**How to apply:** Ao concluir uma etapa, rodar `git add` nos arquivos relevantes e reportar o status. Nunca criar commits automaticamente.

---

**Regra:** Validar o entendimento com o usuário antes de iniciar cada etapa.
**Why:** O usuário quer controle sobre o que será implementado e a ordem de execução.
**How to apply:** Ao terminar uma etapa, perguntar se pode iniciar a próxima antes de começar.

---

**Regra:** Atualizar `docs/plano-desenvolvimento-web.md` ao fim de cada etapa concluída.
**Why:** O plano serve como rastreamento oficial do progresso do projeto.
**How to apply:** Marcar todos os itens da etapa como `[x]` e adicionar ✅ no título da seção.

---

**Regra:** Sempre rodar `npm run build` ao fim de cada etapa e corrigir erros antes de reportar conclusão.
**Why:** Garantir que o código entregue está compilando antes de o usuário fazer o commit.
**How to apply:** Se o build falhar, corrigir imediatamente na mesma etapa sem reportar como concluída.

---

**Regra:** Componentes de features ainda não implementadas devem ser criados como placeholders mínimos.
**Why:** O roteamento precisa referenciar componentes existentes para o build passar.
**How to apply:** Criar um componente com template mínimo (`<app-page-header title="..." />`) para cada feature futura referenciada nas rotas.
