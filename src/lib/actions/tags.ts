"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { tagSchema } from "@/lib/validations/tag";

export async function getTags() {
  const session = await requireAuth();
  if (!session.user.householdId) return [];

  return prisma.tag.findMany({
    where: { householdId: session.user.householdId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, color: true },
  });
}

export async function createTag(formData: FormData) {
  const session = await requireAuth();
  if (!session.user.householdId) {
    return { error: "Grupo não encontrado" };
  }

  const parsed = tagSchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const existing = await prisma.tag.findUnique({
    where: {
      name_householdId: {
        name: parsed.data.name,
        householdId: session.user.householdId,
      },
    },
    select: { id: true },
  });

  if (existing) {
    return { error: "Já existe uma tag com esse nome" };
  }

  try {
    const tag = await prisma.tag.create({
      data: {
        name: parsed.data.name,
        color: parsed.data.color,
        householdId: session.user.householdId,
      },
      select: { id: true, name: true, color: true },
    });

    revalidatePath("/settings");
    return { success: true, tag };
  } catch (error) {
    console.error("Failed to create tag:", error);
    return { error: "Erro ao criar tag. Tente novamente." };
  }
}

export async function updateTag(id: string, formData: FormData) {
  const session = await requireAuth();
  if (!session.user.householdId) {
    return { error: "Grupo não encontrado" };
  }

  const parsed = tagSchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const existing = await prisma.tag.findFirst({
    where: { id, householdId: session.user.householdId },
  });
  if (!existing) {
    return { error: "Tag não encontrada" };
  }

  try {
    await prisma.tag.update({
      where: { id },
      data: { name: parsed.data.name, color: parsed.data.color },
    });
  } catch (error) {
    console.error("Failed to update tag:", error);
    return { error: "Erro ao atualizar tag. Tente novamente." };
  }

  revalidatePath("/settings");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteTag(id: string) {
  const session = await requireAuth();
  if (!session.user.householdId) {
    return { error: "Grupo não encontrado" };
  }

  const existing = await prisma.tag.findFirst({
    where: { id, householdId: session.user.householdId },
  });
  if (!existing) {
    return { error: "Tag não encontrada" };
  }

  try {
    await prisma.tag.delete({
      where: { id },
    });
  } catch (error) {
    console.error("Failed to delete tag:", error);
    return { error: "Erro ao excluir tag. Tente novamente." };
  }

  revalidatePath("/settings");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return { success: true };
}
