"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { categorySchema } from "@/lib/validations/category";

export async function getCategories() {
  const session = await requireAuth();
  if (!session.user.householdId) return [];

  return prisma.category.findMany({
    where: { householdId: session.user.householdId },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
}

export async function createCategory(formData: FormData) {
  const session = await requireAuth();
  if (!session.user.householdId) {
    return { error: "Household nao encontrado" };
  }

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    icon: formData.get("icon") || "circle",
    color: formData.get("color"),
    type: formData.get("type"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await prisma.category.create({
    data: {
      ...parsed.data,
      householdId: session.user.householdId,
    },
  });

  revalidatePath("/categories");
  return { success: true };
}

export async function updateCategory(id: string, formData: FormData) {
  const session = await requireAuth();
  if (!session.user.householdId) {
    return { error: "Household nao encontrado" };
  }

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    icon: formData.get("icon") || "circle",
    color: formData.get("color"),
    type: formData.get("type"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await prisma.category.update({
    where: { id, householdId: session.user.householdId },
    data: parsed.data,
  });

  revalidatePath("/categories");
  return { success: true };
}

export async function deleteCategory(id: string) {
  const session = await requireAuth();
  if (!session.user.householdId) {
    return { error: "Household nao encontrado" };
  }

  const hasTransactions = await prisma.transaction.count({
    where: { categoryId: id },
  });

  if (hasTransactions > 0) {
    return { error: "Categoria possui transacoes vinculadas" };
  }

  await prisma.category.delete({
    where: { id, householdId: session.user.householdId },
  });

  revalidatePath("/categories");
  return { success: true };
}
