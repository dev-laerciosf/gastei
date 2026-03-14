"use client";

import { useState } from "react";
import { Trash2, Pencil, Plus, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CategoryForm } from "@/components/category-form";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteCategory } from "@/lib/actions/categories";
import { useDeleteAction } from "@/hooks/use-delete-action";
import type { Category } from "@/types";

export function CategoriesList({ categories }: { categories: Category[] }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const { deleteId, setDeleteId, deleting, handleDelete } = useDeleteAction(deleteCategory);

  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");
  const incomeCategories = categories.filter((c) => c.type === "INCOME");

  function handleEdit(category: Category) {
    setEditing(category);
    setFormOpen(true);
  }

  function handleNew() {
    setEditing(null);
    setFormOpen(true);
  }

  function renderCategory(category: Category) {
    return (
      <div key={category.id} className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent/50">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 rounded-full shrink-0" style={{ backgroundColor: category.color }} />
          <span className="font-medium">{category.name}</span>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(category)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(category.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Button onClick={handleNew}>
        <Plus className="mr-2 h-4 w-4" />
        Nova Categoria
      </Button>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-rose-500" />
              <h3 className="text-lg font-semibold">Despesas</h3>
            </div>
            <Badge variant="secondary" className="font-mono tabular-nums">
              {expenseCategories.length}
            </Badge>
          </div>
          {expenseCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950">
                <TrendingDown className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Nenhuma categoria de despesa</p>
            </div>
          ) : (
            <div className="space-y-2">
              {expenseCategories.map(renderCategory)}
            </div>
          )}
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <h3 className="text-lg font-semibold">Receitas</h3>
            </div>
            <Badge variant="secondary" className="font-mono tabular-nums">
              {incomeCategories.length}
            </Badge>
          </div>
          {incomeCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Nenhuma categoria de receita</p>
            </div>
          ) : (
            <div className="space-y-2">
              {incomeCategories.map(renderCategory)}
            </div>
          )}
        </div>
      </div>

      <CategoryForm open={formOpen} onOpenChange={setFormOpen} category={editing} />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir categoria"
        description="Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  );
}
