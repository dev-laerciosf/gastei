/**
 * Temporary script to create test users with split expenses data.
 * Run: npx tsx scripts/seed-test-data.ts
 * Cleanup: npx tsx scripts/seed-test-data.ts --cleanup
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { TransactionType } from "@prisma/client";

import "dotenv/config";

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

const TEST_EMAILS = ["alice@test.com", "bob@test.com"];

function d(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day));
}

async function cleanup() {
  console.log("Cleaning up test data...");
  const users = await prisma.user.findMany({ where: { email: { in: TEST_EMAILS } } });
  if (users.length === 0) { console.log("No test users found."); return; }

  const householdIds = [...new Set(users.map((u) => u.householdId).filter(Boolean))] as string[];

  for (const hid of householdIds) {
    await prisma.splitShare.deleteMany({ where: { split: { transaction: { householdId: hid } } } });
    await prisma.split.deleteMany({ where: { transaction: { householdId: hid } } });
    await prisma.recurringOccurrence.deleteMany({ where: { recurringTransaction: { householdId: hid } } });
    await prisma.recurringTransaction.deleteMany({ where: { householdId: hid } });
    await prisma.transactionTag.deleteMany({ where: { transaction: { householdId: hid } } });
    await prisma.transaction.deleteMany({ where: { householdId: hid } });
    await prisma.budget.deleteMany({ where: { householdId: hid } });
    await prisma.tag.deleteMany({ where: { householdId: hid } });
    await prisma.category.deleteMany({ where: { householdId: hid } });
    await prisma.householdInvite.deleteMany({ where: { householdId: hid } });
  }

  for (const u of users) await prisma.user.delete({ where: { id: u.id } });
  for (const hid of householdIds) {
    await prisma.household.delete({ where: { id: hid } }).catch(() => {});
  }

  console.log("Done.");
}

async function seed() {
  console.log("Creating test data...\n");

  const passwordHash = await bcrypt.hash("TestPassword123", 12);

  // 1. Register Alice (replicates auth.ts register flow)
  const { alice, aliceHouseholdId } = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { email: "alice@test.com", name: "Alice", passwordHash } });
    const household = await tx.household.create({ data: { name: "Casa de Alice", ownerId: user.id } });
    await tx.user.update({ where: { id: user.id }, data: { householdId: household.id } });
    await tx.category.createMany({ data: DEFAULT_CATEGORIES.map((c) => ({ ...c, householdId: household.id })) });
    return { alice: user, aliceHouseholdId: household.id };
  });
  console.log("✓ Registered Alice (alice@test.com)");

  // 2. Register Bob (same register flow)
  const { bob, bobHouseholdId } = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { email: "bob@test.com", name: "Bob", passwordHash } });
    const household = await tx.household.create({ data: { name: "Casa de Bob", ownerId: user.id } });
    await tx.user.update({ where: { id: user.id }, data: { householdId: household.id } });
    await tx.category.createMany({ data: DEFAULT_CATEGORIES.map((c) => ({ ...c, householdId: household.id })) });
    return { bob: user, bobHouseholdId: household.id };
  });
  console.log("✓ Registered Bob (bob@test.com)");

  // 3. Alice invites Bob → Bob accepts (replicates household.ts invite+accept flow)
  await prisma.$transaction(async (tx) => {
    const invite = await tx.householdInvite.create({
      data: { householdId: aliceHouseholdId, inviterId: alice.id, inviteeId: bob.id, expiresAt: new Date(Date.now() + 7 * 86400000) },
    });
    await tx.user.update({ where: { id: bob.id }, data: { householdId: aliceHouseholdId } });
    await tx.householdInvite.update({ where: { id: invite.id }, data: { status: "ACCEPTED" } });
    // Clean up Bob's now-empty household
    await tx.category.deleteMany({ where: { householdId: bobHouseholdId } });
    await tx.household.delete({ where: { id: bobHouseholdId } });
  });
  console.log("✓ Bob joined Alice's household via invite");

  // Rename household + set default ratio
  const householdId = aliceHouseholdId;
  await prisma.household.update({
    where: { id: householdId },
    data: { name: "Apartamento A&B", defaultSplitRatio: { [alice.id]: 60, [bob.id]: 40 } },
  });
  console.log('✓ Household renamed to "Apartamento A&B" (60/40)\n');

  // 4. Get categories
  const cats = await prisma.category.findMany({ where: { householdId } });
  const cat = (name: string) => cats.find((c) => c.name === name)!;

  // 5. Income (March)
  const incomes = [
    { desc: "Salário Alice", amount: 850000, cat: "Salário", uid: alice.id, date: d(2026, 3, 5) },
    { desc: "Salário Bob", amount: 620000, cat: "Salário", uid: bob.id, date: d(2026, 3, 5) },
    { desc: "Freelance website", amount: 150000, cat: "Freelance", uid: alice.id, date: d(2026, 3, 10) },
    { desc: "Dividendos FIIs", amount: 45000, cat: "Investimentos", uid: bob.id, date: d(2026, 3, 12) },
  ];
  for (const i of incomes) {
    await prisma.transaction.create({ data: { description: i.desc, amount: i.amount, type: "INCOME", date: i.date, categoryId: cat(i.cat).id, userId: i.uid, householdId } });
  }

  // 6. Individual expenses (March)
  const expenses = [
    { desc: "Almoço restaurante", amount: 4500, cat: "Alimentação", uid: alice.id, date: d(2026, 3, 3) },
    { desc: "Uber trabalho", amount: 2800, cat: "Transporte", uid: alice.id, date: d(2026, 3, 4) },
    { desc: "Farmácia", amount: 8900, cat: "Saúde", uid: bob.id, date: d(2026, 3, 6) },
    { desc: "Livro técnico", amount: 7500, cat: "Educação", uid: bob.id, date: d(2026, 3, 7) },
    { desc: "Cinema", amount: 5000, cat: "Lazer", uid: alice.id, date: d(2026, 3, 8) },
    { desc: "Tênis corrida", amount: 35000, cat: "Vestuário", uid: bob.id, date: d(2026, 3, 9) },
    { desc: "Gasolina", amount: 18000, cat: "Transporte", uid: alice.id, date: d(2026, 3, 11) },
    { desc: "Curso online", amount: 9900, cat: "Educação", uid: alice.id, date: d(2026, 3, 13) },
    { desc: "Jantar delivery", amount: 6200, cat: "Alimentação", uid: bob.id, date: d(2026, 3, 14) },
    { desc: "Consulta médica", amount: 25000, cat: "Saúde", uid: alice.id, date: d(2026, 3, 14) },
  ];
  for (const e of expenses) {
    await prisma.transaction.create({ data: { description: e.desc, amount: e.amount, type: "EXPENSE", date: e.date, categoryId: cat(e.cat).id, userId: e.uid, householdId } });
  }

  // 7. Shared expenses with splits (March)
  const shared = [
    { desc: "Aluguel março", amount: 280000, cat: "Moradia", uid: alice.id, date: d(2026, 3, 1), a: 168000, b: 112000 },
    { desc: "Conta de luz", amount: 32000, cat: "Moradia", uid: bob.id, date: d(2026, 3, 2), a: 19200, b: 12800 },
    { desc: "Internet fibra", amount: 12000, cat: "Moradia", uid: alice.id, date: d(2026, 3, 2), a: 6000, b: 6000 },
    { desc: "Supermercado semanal", amount: 45000, cat: "Alimentação", uid: alice.id, date: d(2026, 3, 7), a: 27000, b: 18000 },
    { desc: "Supermercado semanal 2", amount: 38000, cat: "Alimentação", uid: bob.id, date: d(2026, 3, 14), a: 22800, b: 15200 },
    { desc: "Jantar casal", amount: 18000, cat: "Alimentação", uid: bob.id, date: d(2026, 3, 10), a: 9000, b: 9000 },
    { desc: "Produtos limpeza", amount: 8500, cat: "Outros", uid: alice.id, date: d(2026, 3, 8), a: 5100, b: 3400 },
    { desc: "Assinatura streaming", amount: 5500, cat: "Lazer", uid: alice.id, date: d(2026, 3, 5), a: 2750, b: 2750 },
  ];
  for (const s of shared) {
    const tx = await prisma.transaction.create({ data: { description: s.desc, amount: s.amount, type: "EXPENSE", date: s.date, categoryId: cat(s.cat).id, userId: s.uid, householdId } });
    await prisma.split.create({ data: { transactionId: tx.id, shares: { createMany: { data: [{ userId: alice.id, amount: s.a }, { userId: bob.id, amount: s.b }] } } } });
  }

  // 8. February data (for insights)
  const feb = [
    { desc: "Aluguel fevereiro", amount: 280000, cat: "Moradia", uid: alice.id, date: d(2026, 2, 1), type: "EXPENSE" as const },
    { desc: "Supermercado", amount: 52000, cat: "Alimentação", uid: alice.id, date: d(2026, 2, 7), type: "EXPENSE" as const },
    { desc: "Conta de luz", amount: 28000, cat: "Moradia", uid: bob.id, date: d(2026, 2, 3), type: "EXPENSE" as const },
    { desc: "Uber", amount: 3500, cat: "Transporte", uid: alice.id, date: d(2026, 2, 10), type: "EXPENSE" as const },
    { desc: "Farmácia", amount: 4500, cat: "Saúde", uid: bob.id, date: d(2026, 2, 15), type: "EXPENSE" as const },
    { desc: "Cinema", amount: 4000, cat: "Lazer", uid: alice.id, date: d(2026, 2, 20), type: "EXPENSE" as const },
    { desc: "Salário Alice", amount: 850000, cat: "Salário", uid: alice.id, date: d(2026, 2, 5), type: "INCOME" as const },
    { desc: "Salário Bob", amount: 620000, cat: "Salário", uid: bob.id, date: d(2026, 2, 5), type: "INCOME" as const },
  ];
  for (const f of feb) {
    await prisma.transaction.create({ data: { description: f.desc, amount: f.amount, type: f.type, date: f.date, categoryId: cat(f.cat).id, userId: f.uid, householdId } });
  }

  // 9. Settlement (Bob → Alice R$50)
  await prisma.transaction.create({
    data: { description: "Acerto com Alice", amount: 5000, type: "SETTLEMENT", date: d(2026, 3, 12), categoryId: null, userId: bob.id, householdId, settlementFromId: bob.id, settlementToId: alice.id },
  });

  // 10. Tags
  const tags = [
    { name: "Fixo", color: "#6366f1" },
    { name: "Variável", color: "#f59e0b" },
    { name: "Essencial", color: "#10b981" },
    { name: "Supérfluo", color: "#ef4444" },
  ];
  const createdTags = [];
  for (const tag of tags) {
    const t = await prisma.tag.create({ data: { ...tag, householdId } });
    createdTags.push(t);
  }
  const tagByName = (name: string) => createdTags.find((t) => t.name === name)!;

  // Tag some existing transactions
  const allTxs = await prisma.transaction.findMany({
    where: { householdId, type: { not: "SETTLEMENT" } },
    orderBy: { date: "asc" },
  });
  const tagAssignments: { desc: string; tags: string[] }[] = [
    { desc: "Aluguel março", tags: ["Fixo", "Essencial"] },
    { desc: "Conta de luz", tags: ["Fixo", "Essencial"] },
    { desc: "Internet fibra", tags: ["Fixo", "Essencial"] },
    { desc: "Almoço restaurante", tags: ["Variável"] },
    { desc: "Cinema", tags: ["Variável", "Supérfluo"] },
    { desc: "Tênis corrida", tags: ["Supérfluo"] },
    { desc: "Assinatura streaming", tags: ["Fixo", "Supérfluo"] },
    { desc: "Salário Alice", tags: ["Fixo"] },
    { desc: "Salário Bob", tags: ["Fixo"] },
    { desc: "Freelance website", tags: ["Variável"] },
    { desc: "Supermercado semanal", tags: ["Variável", "Essencial"] },
    { desc: "Farmácia", tags: ["Variável", "Essencial"] },
    { desc: "Gasolina", tags: ["Variável", "Essencial"] },
  ];
  for (const a of tagAssignments) {
    const tx = allTxs.find((t) => t.description === a.desc);
    if (!tx) continue;
    await prisma.transactionTag.createMany({
      data: a.tags.map((tagName) => ({ transactionId: tx.id, tagId: tagByName(tagName).id })),
    });
  }

  // 11. Budgets (March)
  const budgets = [
    { cat: "Alimentação", amount: 80000 },
    { cat: "Transporte", amount: 25000 },
    { cat: "Moradia", amount: 350000 },
    { cat: "Saúde", amount: 30000 },
    { cat: "Lazer", amount: 15000 },
    { cat: "Vestuário", amount: 40000 },
    { cat: "Educação", amount: 20000 },
  ];
  for (const b of budgets) {
    await prisma.budget.create({
      data: { month: "2026-03", amount: b.amount, categoryId: cat(b.cat).id, householdId },
    });
  }

  // 12. Recurring transactions
  const recurring = [
    { desc: "Aluguel", amount: 280000, cat: "Moradia", day: 1, uid: alice.id, installments: null },
    { desc: "Internet", amount: 12000, cat: "Moradia", day: 5, uid: alice.id, installments: null },
    { desc: "Streaming", amount: 5500, cat: "Lazer", day: 10, uid: alice.id, installments: null },
    { desc: "Tênis parcelado", amount: 210000, cat: "Vestuário", day: 15, uid: bob.id, installments: 6 },
    { desc: "Curso de inglês", amount: 180000, cat: "Educação", day: 20, uid: alice.id, installments: 12 },
  ];
  for (const r of recurring) {
    const startMonth = "2026-01";
    const endMonth = r.installments
      ? (() => {
          const [y, m] = startMonth.split("-").map(Number);
          const total = y * 12 + (m - 1) + (r.installments - 1);
          return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
        })()
      : null;

    const rec = await prisma.recurringTransaction.create({
      data: {
        description: r.desc,
        amount: r.amount,
        type: "EXPENSE",
        dayOfMonth: r.day,
        startMonth,
        endMonth,
        installments: r.installments,
        categoryId: cat(r.cat).id,
        userId: r.uid,
        householdId,
      },
    });

    // Create occurrences for Jan-Mar 2026
    const months = ["2026-01", "2026-02", "2026-03"];
    const applicableMonths = endMonth
      ? months.filter((m) => m >= startMonth && m <= endMonth)
      : months;

    for (const month of applicableMonths) {
      await prisma.recurringOccurrence.create({
        data: {
          month,
          recurringTransactionId: rec.id,
          paid: month < "2026-03", // Jan and Feb are paid
        },
      });
    }
  }

  console.log(`✓ ${incomes.length} receitas (março)`);
  console.log(`✓ ${expenses.length} despesas individuais (março)`);
  console.log(`✓ ${shared.length} despesas compartilhadas com split (março)`);
  console.log(`✓ ${feb.length} transações (fevereiro)`);
  console.log(`✓ 1 acerto (Bob → Alice R$50)`);
  console.log(`✓ ${tags.length} tags + ${tagAssignments.length} associações`);
  console.log(`✓ ${budgets.length} orçamentos (março)`);
  console.log(`✓ ${recurring.length} recorrências com ocorrências`);
  console.log("\nCredenciais:");
  console.log("  alice@test.com / TestPassword123");
  console.log("  bob@test.com  / TestPassword123");
}

const isCleanup = process.argv.includes("--cleanup");

(isCleanup ? cleanup() : seed())
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
