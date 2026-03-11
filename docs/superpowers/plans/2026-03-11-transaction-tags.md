# Transaction Tags Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add free-form tags (max 2 per transaction) with autocomplete, color, filtering, and dashboard summary.

**Architecture:** New `Tag` model (many-to-many with `Transaction` via `TransactionTag` join table), scoped to household. Tags CRUD via server actions, inline creation with `TagPicker` component using cmdk autocomplete. Dashboard gets a new tag summary card.

**Tech Stack:** Prisma 7 + PostgreSQL, Next.js 16 server actions, Zod v4, shadcn/ui (Command, Popover, Badge), Tailwind CSS v4, Vitest.

**Spec:** `docs/superpowers/specs/2026-03-11-transaction-tags-design.md`

---

## Chunk 1: Data Layer (Schema + Validation + Types + Actions)

### Task 1: Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add Tag and TransactionTag models + relations**

Add to `prisma/schema.prisma` after the `Budget` model:

```prisma
model Tag {
  id        String   @id @default(cuid())
  name      String
  color     String   @default("#6b7280")
  createdAt DateTime @default(now())

  householdId String
  household   Household @relation(fields: [householdId], references: [id], onDelete: Cascade)

  transactions TransactionTag[]

  @@unique([name, householdId])
  @@index([householdId])
  @@map("tags")
}

model TransactionTag {
  transactionId String
  transaction   Transaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)

  tagId String
  tag   Tag @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([transactionId, tagId])
  @@map("transaction_tags")
}
```

Add relation fields to existing models:

In `Household` model, add:
```prisma
tags Tag[]
```

In `Transaction` model, add:
```prisma
tags TransactionTag[]
```

- [ ] **Step 2: Generate migration**

Run: `npx prisma migrate dev --name add_tags`
Expected: Migration created and applied successfully.

- [ ] **Step 3: Verify Prisma client**

Run: `npx prisma generate`
Expected: Prisma Client generated successfully.

- [ ] **Step 4: Commit**

```bash
git add prisma/
git commit -m "[feat]: add Tag and TransactionTag models to schema"
```

---

### Task 2: Validation Schemas

**Files:**
- Create: `src/lib/validations/tag.ts`
- Create: `src/lib/validations/__tests__/tag.test.ts`
- Modify: `src/lib/validations/transaction.ts`
- Modify: `src/lib/validations/__tests__/transaction.test.ts`

- [ ] **Step 1: Write failing tests for tag validation**

Create `src/lib/validations/__tests__/tag.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { tagSchema } from "@/lib/validations/tag";

describe("tagSchema", () => {
  it("accepts valid tag", () => {
    const result = tagSchema.safeParse({ name: "viagem", color: "#ef4444" });
    expect(result.success).toBe(true);
  });

  it("trims and lowercases name", () => {
    const result = tagSchema.safeParse({ name: "  Viagem  ", color: "#ef4444" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("viagem");
    }
  });

  it("rejects empty name", () => {
    const result = tagSchema.safeParse({ name: "", color: "#ef4444" });
    expect(result.success).toBe(false);
  });

  it("rejects name over 30 chars", () => {
    const result = tagSchema.safeParse({ name: "a".repeat(31), color: "#ef4444" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid color", () => {
    const result = tagSchema.safeParse({ name: "viagem", color: "red" });
    expect(result.success).toBe(false);
  });

  it("rejects 3-char hex color", () => {
    const result = tagSchema.safeParse({ name: "viagem", color: "#fff" });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/validations/__tests__/tag.test.ts`
Expected: FAIL — module `@/lib/validations/tag` not found.

- [ ] **Step 3: Implement tag validation**

Create `src/lib/validations/tag.ts`:

```typescript
import { z } from "zod/v4";

export const tagSchema = z.object({
  name: z
    .string()
    .transform((s) => s.trim().toLowerCase())
    .pipe(z.string().min(1, "Nome é obrigatório").max(30, "Nome muito longo")),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida"),
});

export type TagInput = z.infer<typeof tagSchema>;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/validations/__tests__/tag.test.ts`
Expected: All 6 tests PASS.

- [ ] **Step 5: Add tagIds to transaction schema + tests**

Modify `src/lib/validations/transaction.ts` — add `tagIds` field to `transactionSchema`:

```typescript
import { z } from "zod/v4";

export const transactionSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória").max(200),
  amount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Valor deve ser maior que zero"),
  type: z.enum(["INCOME", "EXPENSE"]),
  categoryId: z.string().min(1, "Categoria é obrigatória"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  tagIds: z.array(z.string().min(1)).max(2).optional(),
});

export type TransactionInput = z.infer<typeof transactionSchema>;
```

Add tests to `src/lib/validations/__tests__/transaction.test.ts`:

```typescript
  it("accepts transaction with tagIds", () => {
    const result = transactionSchema.safeParse({
      description: "Almoço",
      amount: "25.50",
      type: "EXPENSE",
      categoryId: "cat-123",
      date: "2026-03-01",
      tagIds: ["tag-1", "tag-2"],
    });
    expect(result.success).toBe(true);
  });

  it("accepts transaction without tagIds", () => {
    const result = transactionSchema.safeParse({
      description: "Almoço",
      amount: "25.50",
      type: "EXPENSE",
      categoryId: "cat-123",
      date: "2026-03-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejects more than 2 tagIds", () => {
    const result = transactionSchema.safeParse({
      description: "Almoço",
      amount: "25.50",
      type: "EXPENSE",
      categoryId: "cat-123",
      date: "2026-03-01",
      tagIds: ["tag-1", "tag-2", "tag-3"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty string tagIds", () => {
    const result = transactionSchema.safeParse({
      description: "Almoço",
      amount: "25.50",
      type: "EXPENSE",
      categoryId: "cat-123",
      date: "2026-03-01",
      tagIds: [""],
    });
    expect(result.success).toBe(false);
  });
```

- [ ] **Step 6: Run all validation tests**

Run: `npx vitest run src/lib/validations/__tests__/`
Expected: All tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/validations/
git commit -m "[feat]: add tag validation schema and tagIds to transaction schema"
```

---

### Task 3: TypeScript Interfaces

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add Tag and TagSummary interfaces**

Add to `src/types/index.ts` after the `HouseholdInvite` interface:

```typescript
export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface TagSummary {
  tagId: string;
  tagName: string;
  tagColor: string;
  totalIncome: number;
  totalExpense: number;
}
```

Also update the `Transaction` interface to include tags:

```typescript
export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  date: string | Date;
  categoryId: string;
  category: Pick<Category, "id" | "name" | "icon" | "color">;
  user: { name: string | null };
  tags?: { tag: Tag }[];
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "[feat]: add Tag and TagSummary type interfaces"
```

---

### Task 4: Tags CRUD Server Actions

**Files:**
- Create: `src/lib/actions/tags.ts`

- [ ] **Step 1: Implement getTags, createTag, updateTag, deleteTag**

Create `src/lib/actions/tags.ts`:

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/actions/tags.ts
git commit -m "[feat]: add tags CRUD server actions"
```

---

### Task 5: Update Transaction Actions for Tags

**Files:**
- Modify: `src/lib/actions/transactions.ts`

- [ ] **Step 1: Update getTransactions to include tags and accept tagId filter**

In `src/lib/actions/transactions.ts`:

Update the `GetTransactionsParams` interface to add `tagId`:

```typescript
interface GetTransactionsParams {
  month?: string;
  categoryId?: string;
  type?: "INCOME" | "EXPENSE";
  search?: string;
  tagId?: string;
  page?: number;
  pageSize?: number;
}
```

Update the `TransactionWithRelations` type:

```typescript
type TransactionWithRelations = Transaction & {
  category: Category;
  user: { name: string | null };
  recurringOccurrence: { id: string } | null;
  tags: { tag: { id: string; name: string; color: string } }[];
};
```

In the `getTransactions` function, add tag filter after the search filter:

```typescript
  if (params.tagId) {
    where.tags = { some: { tagId: params.tagId } };
  }
```

Update the `findMany` include to add tags:

```typescript
    prisma.transaction.findMany({
      where,
      include: {
        category: true,
        user: { select: { name: true } },
        recurringOccurrence: { select: { id: true } },
        tags: { include: { tag: { select: { id: true, name: true, color: true } } } },
      },
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
```

- [ ] **Step 2: Update createTransaction to handle tagIds**

In `createTransaction`, change how parsed data is built to include tagIds:

```typescript
export async function createTransaction(formData: FormData) {
  const session = await requireAuth();
  if (!session.user.householdId) {
    return { error: "Grupo não encontrado" };
  }

  let tagIds: string[] = [];
  try {
    const rawTagIds = formData.get("tagIds");
    if (rawTagIds) tagIds = JSON.parse(rawTagIds as string);
  } catch {
    // ignore malformed tagIds — Zod will catch invalid values
  }

  const parsed = transactionSchema.safeParse({
    description: formData.get("description"),
    amount: formData.get("amount"),
    type: formData.get("type"),
    categoryId: formData.get("categoryId"),
    date: formData.get("date"),
    tagIds,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const category = await prisma.category.findFirst({
    where: { id: parsed.data.categoryId, householdId: session.user.householdId },
  });
  if (!category) {
    return { error: "Categoria não encontrada" };
  }

  // Validate tags belong to household
  if (parsed.data.tagIds && parsed.data.tagIds.length > 0) {
    const validTags = await prisma.tag.count({
      where: { id: { in: parsed.data.tagIds }, householdId: session.user.householdId },
    });
    if (validTags !== parsed.data.tagIds.length) {
      return { error: "Tag não encontrada" };
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          description: parsed.data.description,
          amount: parseCurrency(parsed.data.amount),
          type: parsed.data.type,
          date: new Date(parsed.data.date + "T00:00:00Z"),
          categoryId: parsed.data.categoryId,
          userId: session.user.id,
          householdId: session.user.householdId,
        },
      });

      if (parsed.data.tagIds && parsed.data.tagIds.length > 0) {
        await tx.transactionTag.createMany({
          data: parsed.data.tagIds.map((tagId) => ({
            transactionId: transaction.id,
            tagId,
          })),
        });
      }
    });
  } catch (error) {
    console.error("Failed to create transaction:", error);
    return { error: "Erro ao criar transação. Tente novamente." };
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return { success: true };
}
```

- [ ] **Step 3: Update updateTransaction to handle tagIds**

In `updateTransaction`, use a prisma.$transaction to delete old links and create new ones:

```typescript
export async function updateTransaction(id: string, formData: FormData) {
  const session = await requireAuth();
  if (!session.user.householdId) {
    return { error: "Grupo não encontrado" };
  }

  let tagIds: string[] = [];
  try {
    const rawTagIds = formData.get("tagIds");
    if (rawTagIds) tagIds = JSON.parse(rawTagIds as string);
  } catch {
    // ignore malformed tagIds — Zod will catch invalid values
  }

  const parsed = transactionSchema.safeParse({
    description: formData.get("description"),
    amount: formData.get("amount"),
    type: formData.get("type"),
    categoryId: formData.get("categoryId"),
    date: formData.get("date"),
    tagIds,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const existing = await prisma.transaction.findFirst({
    where: { id, householdId: session.user.householdId },
  });

  if (!existing) {
    return { error: "Transação não encontrada" };
  }

  const category = await prisma.category.findFirst({
    where: { id: parsed.data.categoryId, householdId: session.user.householdId },
  });
  if (!category) {
    return { error: "Categoria não encontrada" };
  }

  // Validate tags belong to household
  if (parsed.data.tagIds && parsed.data.tagIds.length > 0) {
    const validTags = await prisma.tag.count({
      where: { id: { in: parsed.data.tagIds }, householdId: session.user.householdId },
    });
    if (validTags !== parsed.data.tagIds.length) {
      return { error: "Tag não encontrada" };
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { id },
        data: {
          description: parsed.data.description,
          amount: parseCurrency(parsed.data.amount),
          type: parsed.data.type,
          date: new Date(parsed.data.date + "T00:00:00Z"),
          categoryId: parsed.data.categoryId,
        },
      });

      await tx.transactionTag.deleteMany({ where: { transactionId: id } });

      if (parsed.data.tagIds && parsed.data.tagIds.length > 0) {
        await tx.transactionTag.createMany({
          data: parsed.data.tagIds.map((tagId) => ({
            transactionId: id,
            tagId,
          })),
        });
      }
    });
  } catch (error) {
    console.error("Failed to update transaction:", error);
    return { error: "Erro ao atualizar transação. Tente novamente." };
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return { success: true };
}
```

- [ ] **Step 4: Verify build**

Run: `npx next build`
Expected: Build succeeds (or at least no type errors in actions).

- [ ] **Step 5: Commit**

```bash
git add src/lib/actions/transactions.ts
git commit -m "[feat]: add tag support to transaction create/update/get actions"
```

---

### Task 6: Dashboard Tag Summary Action

**Files:**
- Modify: `src/lib/actions/dashboard.ts`

- [ ] **Step 1: Add getTagSummary function**

Add to the end of `src/lib/actions/dashboard.ts`:

```typescript
import type { TagSummary } from "@/types";

export async function getTagSummary(month?: string): Promise<TagSummary[]> {
  const session = await requireAuth();
  if (!session.user.householdId) return [];

  const targetMonth = safeMonth(month);
  const [year, mon] = targetMonth.split("-").map(Number);
  const startDate = new Date(Date.UTC(year, mon - 1, 1));
  const endDate = new Date(Date.UTC(year, mon, 1));

  const results = await prisma.transactionTag.findMany({
    where: {
      transaction: {
        householdId: session.user.householdId,
        date: { gte: startDate, lt: endDate },
      },
    },
    include: {
      tag: { select: { id: true, name: true, color: true } },
      transaction: { select: { amount: true, type: true } },
    },
  });

  const summaryMap = new Map<string, TagSummary>();

  for (const row of results) {
    const existing = summaryMap.get(row.tagId) ?? {
      tagId: row.tag.id,
      tagName: row.tag.name,
      tagColor: row.tag.color,
      totalIncome: 0,
      totalExpense: 0,
    };

    if (row.transaction.type === "INCOME") {
      existing.totalIncome += row.transaction.amount;
    } else {
      existing.totalExpense += row.transaction.amount;
    }

    summaryMap.set(row.tagId, existing);
  }

  return [...summaryMap.values()].sort(
    (a, b) => (b.totalIncome + b.totalExpense) - (a.totalIncome + a.totalExpense)
  );
}
```

Note: the `import { safeMonth }` and `import { prisma }` / `import { requireAuth }` are already at the top of this file. The `TagSummary` import from `@/types` needs to be added to the imports.

- [ ] **Step 2: Commit**

```bash
git add src/lib/actions/dashboard.ts
git commit -m "[feat]: add getTagSummary dashboard action"
```

---

### Task 7: Run all tests

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 2: Commit if any fixups were needed**

---

## Chunk 2: UI Components

### Task 8: TagPicker Component

**Files:**
- Create: `src/components/tag-picker.tsx`

This is the most complex UI component. It uses the existing `Command` (cmdk) and `Popover` components for autocomplete, plus a mini color picker for inline tag creation.

- [ ] **Step 1: Create TagPicker component**

Create `src/components/tag-picker.tsx`:

```tsx
"use client";

import { useState, useRef } from "react";
import { X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { createTag } from "@/lib/actions/tags";
import { toast } from "sonner";
import type { Tag } from "@/types";

const MAX_TAGS = 2;

interface TagPickerProps {
  tags: Tag[];
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
}

export function TagPicker({ tags, selectedTagIds, onChange }: TagPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [newColor, setNewColor] = useState("#6b7280");
  const [allTags, setAllTags] = useState(tags);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const selectedTags = allTags.filter((t) => selectedTagIds.includes(t.id));
  const isFull = selectedTagIds.length >= MAX_TAGS;

  const filtered = allTags.filter(
    (t) => t.name.includes(search.toLowerCase()) && !selectedTagIds.includes(t.id)
  );

  const exactMatch = allTags.some((t) => t.name === search.trim().toLowerCase());

  function handleSelect(tagId: string) {
    onChange([...selectedTagIds, tagId]);
    setSearch("");
    setOpen(false);
  }

  function handleRemove(tagId: string) {
    onChange(selectedTagIds.filter((id) => id !== tagId));
  }

  async function handleCreate() {
    const name = search.trim();
    if (!name) return;

    setCreating(true);
    const formData = new FormData();
    formData.set("name", name);
    formData.set("color", newColor);

    const result = await createTag(formData);

    if (result.error) {
      toast.error(result.error);
    } else if (result.tag) {
      setAllTags((prev) => [...prev, result.tag!]);
      onChange([...selectedTagIds, result.tag.id]);
      setSearch("");
      setOpen(false);
    }
    setCreating(false);
    setNewColor("#6b7280");
  }

  return (
    <div className="space-y-2">
      <Label>Tags</Label>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedTags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="gap-1 pr-1"
              style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
            >
              {tag.name}
              <button
                type="button"
                onClick={() => handleRemove(tag.id)}
                className="rounded-full p-0.5 hover:bg-black/10"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {!isFull && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs text-muted-foreground"
            >
              <Plus className="mr-1 h-3 w-3" />
              Adicionar tag
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Buscar ou criar tag..."
                value={search}
                onValueChange={setSearch}
              />
              <CommandList>
                <CommandEmpty>
                  {search.trim() && !exactMatch ? (
                    <div className="p-2 space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Criar &quot;{search.trim().toLowerCase()}&quot;
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          ref={colorInputRef}
                          type="color"
                          value={newColor}
                          onChange={(e) => setNewColor(e.target.value)}
                          className="h-7 w-7 cursor-pointer rounded border-0 p-0"
                        />
                        <Button
                          type="button"
                          size="sm"
                          className="h-7 flex-1 text-xs"
                          onClick={handleCreate}
                          disabled={creating}
                        >
                          {creating ? "Criando..." : "Criar"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground p-2">Nenhuma tag encontrada</p>
                  )}
                </CommandEmpty>
                <CommandGroup>
                  {filtered.map((tag) => (
                    <CommandItem key={tag.id} value={tag.name} onSelect={() => handleSelect(tag.id)}>
                      <div
                        className="mr-2 h-3 w-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </CommandItem>
                  ))}
                  {search.trim() && !exactMatch && filtered.length > 0 && (
                    <CommandItem onSelect={handleCreate}>
                      <Plus className="mr-2 h-3 w-3" />
                      Criar &quot;{search.trim().toLowerCase()}&quot;
                    </CommandItem>
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}

      {isFull && (
        <p className="text-xs text-muted-foreground">Máximo de {MAX_TAGS} tags</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build compiles**

Run: `npx next build`
Expected: No type errors for tag-picker.tsx.

- [ ] **Step 3: Commit**

```bash
git add src/components/tag-picker.tsx
git commit -m "[feat]: add TagPicker component with autocomplete and inline creation"
```

---

### Task 9: Integrate TagPicker into Transaction Form

**Files:**
- Modify: `src/components/transaction-form.tsx`

- [ ] **Step 1: Add tags state, pass TagPicker, and serialize tagIds in formData**

Changes to `src/components/transaction-form.tsx`:

1. Import TagPicker and Tag type:
```typescript
import { TagPicker } from "@/components/tag-picker";
import type { TransactionType, Category, Tag } from "@/types";
```

2. Update `TransactionData` interface to include tags:
```typescript
interface TransactionData {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: string;
  tagIds?: string[];
}
```

3. Update `TransactionFormProps` to receive available tags:
```typescript
interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: TransactionFormCategory[];
  tags: Tag[];
  transaction?: TransactionData | null;
}
```

4. Add tagIds state in the component:
```typescript
const [tagIds, setTagIds] = useState<string[]>(transaction?.tagIds ?? []);
```

5. In the `useEffect` that resets state on `open`, also reset tagIds:
```typescript
  useEffect(() => {
    if (open) {
      setType(transaction?.type ?? "EXPENSE");
      setCategoryId(transaction?.categoryId ?? "");
      setTagIds(transaction?.tagIds ?? []);
    }
  }, [open, transaction?.type, transaction?.categoryId, transaction?.tagIds]);
```

6. In `handleSubmit`, add tagIds to formData before calling the action:
```typescript
    formData.set("tagIds", JSON.stringify(tagIds));
```

7. Add TagPicker between the date field and the submit button:
```tsx
          <TagPicker tags={tags} selectedTagIds={tagIds} onChange={setTagIds} />
```

- [ ] **Step 2: Update TransactionsList to pass tags to form**

In `src/components/transactions-list.tsx`:

1. Add `Tag` to the imports:
```typescript
import type { TransactionType, Tag } from "@/types";
```

2. Update `Transaction` interface to include tags:
```typescript
interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  date: Date;
  category: { id: string; name: string; color: string; type: TransactionType };
  user: { name: string | null };
  recurringOccurrence?: { id: string } | null;
  tags: { tag: { id: string; name: string; color: string } }[];
}
```

3. Add `tags` to `TransactionsListProps`:
```typescript
interface TransactionsListProps {
  transactions: Transaction[];
  categories: Pick<import("@/types").Category, "id" | "name" | "type">[];
  tags: Tag[];
  page: number;
  totalPages: number;
  totalIncome: number;
  totalExpense: number;
}
```

4. Destructure `tags` in the function signature:
```typescript
export function TransactionsList({ transactions, categories, tags, page, totalPages, totalIncome, totalExpense }: TransactionsListProps) {
```

5. Update the `TransactionForm` usage to pass tags and tagIds when editing:
```tsx
      <TransactionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        categories={categories}
        tags={tags}
        transaction={
          editing
            ? {
                id: editing.id,
                description: editing.description,
                amount: editing.amount,
                type: editing.type,
                categoryId: editing.category.id,
                date: new Date(editing.date).toISOString().split("T")[0],
                tagIds: editing.tags.map((t) => t.tag.id),
              }
            : null
        }
      />
```

- [ ] **Step 3: Update TransactionsPage to fetch and pass tags**

In `src/app/(app)/transactions/page.tsx`:

1. Import `getTags`:
```typescript
import { getTags } from "@/lib/actions/tags";
```

2. Add `tagId` to searchParams:
```typescript
interface Props {
  searchParams: Promise<{ month?: string; categoryId?: string; type?: string; search?: string; tagId?: string; page?: string }>;
}
```

3. Fetch tags alongside transactions and categories, and pass `tagId` filter:
```typescript
  const [result, categories, tags] = await Promise.all([
    getTransactions({
      month: currentMonth,
      categoryId: params.categoryId,
      type,
      search: params.search,
      tagId: params.tagId,
      page,
    }),
    getCategories(),
    getTags(),
  ]);
```

4. Pass `tags` to `TransactionsList`:
```tsx
      <TransactionsList
        transactions={result.transactions}
        categories={categories}
        tags={tags}
        page={result.page}
        totalPages={result.totalPages}
        totalIncome={result.totalIncome}
        totalExpense={result.totalExpense}
      />
```

- [ ] **Step 4: Verify build**

Run: `npx next build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/components/transaction-form.tsx src/components/transactions-list.tsx src/app/\(app\)/transactions/page.tsx
git commit -m "[feat]: integrate TagPicker into transaction form and pass tags through"
```

---

### Task 10: Tag Badges in Transaction List

**Files:**
- Modify: `src/components/transactions-list.tsx`

- [ ] **Step 1: Add tag badges next to the Recorrente badge**

In `src/components/transactions-list.tsx`, inside the transaction item's description area (the `div` that shows description and Recorrente badge), add tag badges after the `recurringOccurrence` badge:

```tsx
                <div className="flex items-center gap-2">
                  <p className="font-medium">{tx.description}</p>
                  {tx.recurringOccurrence && (
                    <Badge variant="secondary" className="gap-1 text-[10px] px-1.5 py-0">
                      <Repeat className="h-3 w-3" />
                      Recorrente
                    </Badge>
                  )}
                  {tx.tags.map(({ tag }) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                      style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/transactions-list.tsx
git commit -m "[feat]: display tag badges in transactions list"
```

---

### Task 11: Tag Filter in Transactions Page

**Files:**
- Modify: `src/components/transactions-list.tsx`

- [ ] **Step 1: Add tag filter combobox alongside existing filters**

In `src/components/transactions-list.tsx`, add a tag filter Select above the transactions list, next to the "Nova Transação" button area:

1. Import `useRouter` and `useSearchParams`:
```typescript
import { useRouter, useSearchParams } from "next/navigation";
```

2. Import `Select` components:
```typescript
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
```

3. Add router/params in the component:
```typescript
  const router = useRouter();
  const searchParams = useSearchParams();
```

4. Add a handler for tag filter:
```typescript
  function handleTagFilter(tagId: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (tagId === "all") {
      params.delete("tagId");
    } else {
      params.set("tagId", tagId);
    }
    params.delete("page");
    router.push(`/transactions?${params.toString()}`);
  }
```

5. Add the filter Select next to the "Nova Transação" button:
```tsx
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button onClick={handleNew}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Transação
          </Button>
          {tags.length > 0 && (
            <Select
              value={searchParams.get("tagId") ?? "all"}
              onValueChange={handleTagFilter}
            >
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Filtrar por tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as tags</SelectItem>
                {tags.map((tag) => (
                  <SelectItem key={tag.id} value={tag.id}>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />
                      {tag.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
```

This replaces the existing button-only `<div>`.

- [ ] **Step 2: Verify build**

Run: `npx next build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/transactions-list.tsx
git commit -m "[feat]: add tag filter combobox to transactions page"
```

---

### Task 12: Tag Management Component (Settings)


**Files:**
- Create: `src/components/tag-management.tsx`
- Modify: `src/app/(app)/settings/page.tsx`

- [ ] **Step 1: Create TagManagement component**

Create `src/components/tag-management.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { updateTag, deleteTag } from "@/lib/actions/tags";
import { useDeleteAction } from "@/hooks/use-delete-action";
import { toast } from "sonner";
import type { Tag } from "@/types";

export function TagManagement({ tags }: { tags: Tag[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [saving, setSaving] = useState(false);
  const { deleteId, setDeleteId, deleting, handleDelete } = useDeleteAction(deleteTag);

  function startEdit(tag: Tag) {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit() {
    if (!editingId) return;
    setSaving(true);

    const formData = new FormData();
    formData.set("name", editName);
    formData.set("color", editColor);

    const result = await updateTag(editingId, formData);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Tag atualizada");
      setEditingId(null);
    }
    setSaving(false);
  }

  if (tags.length === 0) {
    return (
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Tags</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhuma tag criada. Tags são criadas ao adicionar transações.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Tags</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {tags.map((tag) => (
            <div key={tag.id} className="flex items-center justify-between rounded-md border p-3">
              {editingId === tag.id ? (
                <div className="flex flex-1 items-center gap-2">
                  <input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="h-7 w-7 cursor-pointer rounded border-0 p-0"
                  />
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-8 flex-1"
                  />
                  <Button variant="ghost" size="icon" onClick={saveEdit} disabled={saving}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={cancelEdit}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: tag.color }} />
                    <span className="text-sm">{tag.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(tag)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(tag.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </CardContent>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir tag"
        description="Tem certeza que deseja excluir esta tag? Ela será removida de todas as transações."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </Card>
  );
}
```

- [ ] **Step 2: Update settings page to fetch tags and render TagManagement**

Modify `src/app/(app)/settings/page.tsx`:

```tsx
import { requireAuth } from "@/lib/auth-guard";
import { getTags } from "@/lib/actions/tags";
import { SettingsForm } from "@/components/settings-form";
import { TagManagement } from "@/components/tag-management";

export default async function SettingsPage() {
  const [session, tags] = await Promise.all([
    requireAuth(),
    getTags(),
  ]);

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">Configurações</h2>
      <SettingsForm user={{ name: session.user.name ?? "", email: session.user.email ?? "" }} />
      <TagManagement tags={tags} />
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npx next build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/tag-management.tsx src/app/\(app\)/settings/page.tsx
git commit -m "[feat]: add tag management component to settings page"
```

---

### Task 13: Dashboard Tag Summary Card

**Files:**
- Create: `src/components/dashboard/tag-summary.tsx`
- Modify: `src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Create TagSummary component**

Create `src/components/dashboard/tag-summary.tsx`:

```tsx
import { Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/money";
import type { TagSummary as TagSummaryType } from "@/types";

export function TagSummary({ data }: { data: TagSummaryType[] }) {
  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Gastos por Tag
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((item) => (
            <div key={item.tagId} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.tagColor }} />
                <span className="text-sm font-medium">{item.tagName}</span>
              </div>
              <div className="flex gap-4 text-sm font-mono tabular-nums">
                {item.totalIncome > 0 && (
                  <span className="text-emerald-600">+ {formatCurrency(item.totalIncome)}</span>
                )}
                {item.totalExpense > 0 && (
                  <span className="text-rose-600">- {formatCurrency(item.totalExpense)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Integrate TagSummary into dashboard page**

Modify `src/app/(app)/dashboard/page.tsx`:

1. Add imports:
```typescript
import { getMonthlySummary, getRecentTransactions, getTagSummary } from "@/lib/actions/dashboard";
import { TagSummary } from "@/components/dashboard/tag-summary";
```

2. Fetch tag summary alongside other data:
```typescript
  const [summary, recentTransactions, insights, tagSummary] = await Promise.all([
    getMonthlySummary(),
    getRecentTransactions(),
    getInsights(),
    getTagSummary(),
  ]);
```

3. Add TagSummary card after the 2-column grid (before the closing `</>` of the non-empty branch):
```tsx
          <div className="grid gap-6 md:grid-cols-2">
            <CategoryChart data={summary.byCategory} />
            <RecentTransactions transactions={recentTransactions} />
          </div>
          <TagSummary data={tagSummary} />
```

- [ ] **Step 3: Verify build**

Run: `npx next build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/tag-summary.tsx src/app/\(app\)/dashboard/page.tsx
git commit -m "[feat]: add tag summary card to dashboard"
```

---

### Task 14: Final Verification

- [ ] **Step 1: Run all tests**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 2: Full build verification**

Run: `npx next build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Manual smoke test checklist**

Open the app and verify:
1. Settings page shows "Tags" card (empty state)
2. Create a new transaction → TagPicker visible, can create a tag inline with color
3. Tag appears as badge in transactions list
4. Edit the transaction → tags pre-selected
5. Create another transaction with the same tag → autocomplete suggests it
6. Dashboard → TagSummary card shows if tagged transactions exist
7. Settings → tag list shows created tags, can edit name/color, can delete
8. Transactions page → tagId filter works via URL param

- [ ] **Step 4: Final commit if needed**

```bash
git add -A
git commit -m "[chore]: final adjustments for transaction tags feature"
```
