import type { Plan } from "@prisma/client";

export interface PlanConfig {
  name: string;
  description: string;
  price: number;
  stripePriceId: string | null;
  limits: {
    transactionsPerMonth: number;
    categories: number;
    recurring: boolean;
    budgets: boolean;
    tags: boolean;
    goals: boolean;
    bills: boolean;
    insights: boolean;
    annualReport: boolean;
  };
  features: string[];
}

export const PLANS: Record<Plan, PlanConfig> = {
  FREE: {
    name: "Grátis",
    description: "Para começar a organizar suas finanças",
    price: 0,
    stripePriceId: null,
    limits: {
      transactionsPerMonth: 50,
      categories: 5,
      recurring: false,
      budgets: false,
      tags: false,
      goals: false,
      bills: false,
      insights: false,
      annualReport: false,
    },
    features: [
      "Até 50 transações/mês",
      "Até 5 categorias",
      "Dashboard básico",
    ],
  },
  PRO: {
    name: "Pro",
    description: "Para quem leva suas finanças a sério",
    price: 990,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID ?? "",
    limits: {
      transactionsPerMonth: Infinity,
      categories: Infinity,
      recurring: true,
      budgets: true,
      tags: true,
      goals: true,
      bills: false,
      insights: false,
      annualReport: false,
    },
    features: [
      "Transações ilimitadas",
      "Categorias ilimitadas",
      "Transações recorrentes",
      "Orçamento mensal",
      "Tags personalizadas",
      "Metas de economia",
    ],
  },
  PREMIUM: {
    name: "Premium",
    description: "Controle total das suas finanças",
    price: 1990,
    stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID ?? "",
    limits: {
      transactionsPerMonth: Infinity,
      categories: Infinity,
      recurring: true,
      budgets: true,
      tags: true,
      goals: true,
      bills: true,
      insights: true,
      annualReport: true,
    },
    features: [
      "Tudo do Pro",
      "Divisão de despesas",
      "Insights e análises",
      "Relatório anual",
      "Suporte prioritário",
    ],
  },
};

export function getPlanFromPriceId(priceId: string): Plan {
  if (priceId === PLANS.PRO.stripePriceId) return "PRO";
  if (priceId === PLANS.PREMIUM.stripePriceId) return "PREMIUM";
  return "FREE";
}

export function canAccess(userPlan: Plan, feature: keyof PlanConfig["limits"]): boolean {
  const limit = PLANS[userPlan].limits[feature];
  return typeof limit === "boolean" ? limit : limit > 0;
}

export function getTransactionLimit(plan: Plan): number {
  return PLANS[plan].limits.transactionsPerMonth;
}

export function getCategoryLimit(plan: Plan): number {
  return PLANS[plan].limits.categories;
}
