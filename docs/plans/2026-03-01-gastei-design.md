# Gastei — Design Document

## Visao Geral

App web de controle financeiro pessoal completo: despesas, receitas e orcamento mensal.
Multiusuario com conceito de "household" para compartilhamento entre membros da familia.

## Stack

- **Framework:** Next.js 15 (App Router, Server Components, Server Actions)
- **UI:** shadcn/ui + Tailwind CSS v4
- **Graficos:** Recharts
- **ORM:** Prisma
- **Auth:** NextAuth.js v5 (Auth.js)
- **Validacao:** Zod
- **Banco:** PostgreSQL (Neon free tier)
- **Deploy:** Vercel

## Modelo de Dados

### User
- id, name, email, password_hash, image
- householdId (FK -> Household)

### Household
- id, name, created_at
- members: User[]

### Category
- id, name, icon, color, type (INCOME | EXPENSE)
- householdId (FK -> Household)

### Transaction
- id, description, amount (centavos), type (INCOME | EXPENSE)
- date, created_at
- categoryId (FK -> Category)
- userId (FK -> User) — quem registrou
- householdId (FK -> Household)

### Budget
- id, month (YYYY-MM), amount (centavos)
- categoryId (FK -> Category)
- householdId (FK -> Household)

### Account (futuro — Open Finance)
- id, name, type (CHECKING | SAVINGS | CREDIT_CARD | CASH)
- balance (centavos)
- householdId (FK -> Household)

**Nota:** Valores monetarios armazenados em centavos (inteiros) para evitar problemas de ponto flutuante.

## Funcionalidades do MVP

1. **Login/Registro** — email/senha + Google OAuth via NextAuth.js
2. **Dashboard** — resumo do mes: total receitas, total despesas, saldo, grafico por categoria
3. **Transacoes** — listagem com filtros (mes, categoria, tipo), busca, botao de nova transacao
4. **Nova Transacao** — formulario: descricao, valor, categoria, data, tipo (receita/despesa)
5. **Categorias** — CRUD de categorias com icone e cor
6. **Orcamento** — definir limite mensal por categoria, visualizar progresso
7. **Household** — gerenciar membros, convidar por email
8. **Configuracoes** — perfil, tema (dark/light)

## Fora do MVP

- Integracao Open Finance
- Contas bancarias (Account)
- Transacoes recorrentes
- Exportacao para CSV/PDF
- PWA / notificacoes push

## Arquitetura

```
gastei/
├── src/
│   ├── app/                    # App Router (Next.js)
│   │   ├── (auth)/             # Grupo: login, register
│   │   ├── (app)/              # Grupo: dashboard, transacoes, etc.
│   │   │   ├── dashboard/
│   │   │   ├── transactions/
│   │   │   ├── categories/
│   │   │   ├── budget/
│   │   │   ├── household/
│   │   │   └── settings/
│   │   ├── api/                # API Routes
│   │   └── layout.tsx
│   ├── components/             # Componentes reutilizaveis
│   │   ├── ui/                 # Componentes base (shadcn/ui)
│   │   └── ...
│   ├── lib/                    # Utilitarios, config
│   │   ├── auth.ts             # Configuracao NextAuth
│   │   ├── prisma.ts           # Cliente Prisma
│   │   └── utils.ts
│   └── types/                  # TypeScript types
├── prisma/
│   └── schema.prisma
├── public/
├── package.json
└── next.config.ts
```

## Decisoes Arquiteturais

- **Multi-tenancy:** Schema compartilhado com isolamento por `householdId`
- **Auth:** NextAuth.js v5 — controle total, gratuito, maduro
- **Valores:** Centavos (int) para evitar float issues
- **Entrada de dados:** Manual no MVP, Open Finance no futuro
