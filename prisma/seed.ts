import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import "dotenv/config";

// Re-declare DEFAULT_CATEGORIES here to avoid importing from src/
// which would require tsconfig path aliases in the seed context.
// This list must match src/lib/setup-household.ts DEFAULT_CATEGORIES.
import { TransactionType, GoalType } from "@prisma/client";

const DEFAULT_CATEGORIES = [
  { name: "Alimentação", icon: "utensils", color: "#ef4444", type: TransactionType.EXPENSE },
  { name: "Transporte", icon: "car", color: "#f97316", type: TransactionType.EXPENSE },
  { name: "Moradia", icon: "home", color: "#eab308", type: TransactionType.EXPENSE },
  { name: "Saúde", icon: "heart-pulse", color: "#22c55e", type: TransactionType.EXPENSE },
  { name: "Educação", icon: "graduation-cap", color: "#3b82f6", type: TransactionType.EXPENSE },
  { name: "Lazer", icon: "gamepad-2", color: "#8b5cf6", type: TransactionType.EXPENSE },
  { name: "Vestuário", icon: "shirt", color: "#ec4899", type: TransactionType.EXPENSE },
  { name: "Outros", icon: "ellipsis", color: "#6b7280", type: TransactionType.EXPENSE },
  { name: "Salário", icon: "banknote", color: "#10b981", type: TransactionType.INCOME },
  { name: "Freelance", icon: "laptop", color: "#06b6d4", type: TransactionType.INCOME },
  { name: "Investimentos", icon: "trending-up", color: "#14b8a6", type: TransactionType.INCOME },
  { name: "Outros (Receita)", icon: "plus-circle", color: "#6b7280", type: TransactionType.INCOME },
];

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const user = await prisma.user.create({
    data: { email: "seed@example.com", name: "Seed User" },
  });

  const household = await prisma.household.create({
    data: { name: "Minha Casa", ownerId: user.id },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { householdId: household.id },
  });

  for (const cat of DEFAULT_CATEGORIES) {
    await prisma.category.create({
      data: { ...cat, householdId: household.id },
    });
  }

  console.log(`Created household: ${household.id}`);
  console.log(`Created ${DEFAULT_CATEGORIES.length} default categories`);

  const savingsGoal = await prisma.savingsGoal.create({
    data: {
      name: "Trip to Europe",
      type: GoalType.SAVINGS,
      targetAmount: 1500000,
      currentAmount: 450000,
      targetDate: new Date("2026-12-31"),
      icon: "piggy-bank",
      color: "#10b981",
      householdId: household.id,
      userId: user.id,
    },
  });

  await prisma.goalEntry.createMany({
    data: [
      { amount: 200000, note: "First deposit", goalId: savingsGoal.id },
      { amount: 150000, note: "Bonus", goalId: savingsGoal.id },
      { amount: 100000, goalId: savingsGoal.id },
    ],
  });

  const spendingGoal = await prisma.savingsGoal.create({
    data: {
      name: "Reduce delivery",
      type: GoalType.SPENDING,
      targetAmount: 30000,
      currentAmount: 12000,
      icon: "utensils",
      color: "#f97316",
      householdId: household.id,
      userId: user.id,
    },
  });

  await prisma.goalEntry.createMany({
    data: [
      { amount: 5000, note: "Week 1", goalId: spendingGoal.id },
      { amount: 7000, note: "Week 2", goalId: spendingGoal.id },
    ],
  });

  console.log(`Created 2 sample savings goals with entries`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
