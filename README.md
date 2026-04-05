# Gastei

Aplicativo de finanças pessoais **open source** com suporte a households (famílias/grupos). Controle receitas, despesas, orçamentos e transações recorrentes de forma colaborativa.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Server Actions)
- **Banco:** PostgreSQL + Prisma 7
- **Auth:** NextAuth v5
- **UI:** shadcn/ui + Tailwind CSS v4 + Recharts
- **Validação:** Zod v4
- **Pagamentos:** Stripe (assinaturas e checkout)
- **Testes:** Vitest + Testing Library

## Funcionalidades

- Autenticação com email/senha
- Households — convide membros para gerenciar finanças juntos
- Transações (receitas e despesas) com categorias e paginação
- Transações recorrentes com controle de ocorrências
- Transações parceladas (installments) — suporte a compras no cartão
- Orçamentos mensais por categoria
- Metas de economia (savings goals) com progresso visual
- Controle de dívidas e empréstimos com histórico de pagamentos
- Tags em transações — autocomplete, cor personalizada, filtro e resumo por tag
- Dashboard com resumo mensal, gráfico de categorias, gráfico anual e insights automáticos
- Divisão de despesas entre membros do household (split)
- Planos de assinatura via Stripe (Free / Pro / Premium)
- Landing page com apresentação do produto e pricing
- Navegação mobile com bottom bar
- Tema claro/escuro
- Gerenciamento de tags e categorias

## Roadmap

- [ ] Importação de extrato bancário (CSV/OFX)
- [ ] Relatórios e exportação (PDF/CSV) — evolução mensal, comparativos
- [ ] Contas/carteiras (accounts) — separar por banco, cartão, carteira
- [ ] Notificações e alertas de orçamento (80%/100% do limite)
- [ ] Anexos em transações (comprovantes, notas fiscais)

## Getting Started

```bash
# Instalar dependências
pnpm install

# Configurar banco de dados
cp .env.example .env
npx prisma migrate dev

# Rodar servidor de desenvolvimento
pnpm dev
```

O app roda em [http://localhost:5000](http://localhost:5000).

## Testes

```bash
pnpm test        # watch mode
pnpm test:run    # single run
```
