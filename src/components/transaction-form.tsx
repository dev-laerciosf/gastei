"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createTransaction, updateTransaction } from "@/lib/actions/transactions";
import { validateTransactionFormData } from "@/lib/validations/shared";
import { toast } from "sonner";
import { TagPicker } from "@/components/tag-picker";
import { SplitSection } from "@/components/split-section";
import type { TransactionType, Category, Tag } from "@/types";

type TransactionFormCategory = Pick<Category, "id" | "name" | "type">;

interface TransactionData {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: string;
  tagIds?: string[];
}

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: TransactionFormCategory[];
  tags: Tag[];
  transaction?: TransactionData | null;
  members?: { id: string; name: string | null }[];
  defaultSplitRatio?: Record<string, number> | null;
}

export function TransactionForm({ open, onOpenChange, categories, tags, transaction, members, defaultSplitRatio }: TransactionFormProps) {
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState(transaction?.type ?? "EXPENSE");
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? "");
  const [tagIds, setTagIds] = useState<string[]>(transaction?.tagIds ?? []);
  const [shares, setShares] = useState<{ userId: string; amount: number }[] | null>(null);
  const [amountCents, setAmountCents] = useState(transaction?.amount ?? 0);
  const isEditing = !!transaction;

  const showSplit = type === "EXPENSE" && (members?.length ?? 0) >= 2;

  useEffect(() => {
    if (open) {
      setType(transaction?.type ?? "EXPENSE");
      setCategoryId(transaction?.categoryId ?? "");
      setTagIds(transaction?.tagIds ?? []);
      setShares(null);
      setAmountCents(transaction?.amount ?? 0);
    }
  }, [open, transaction?.type, transaction?.categoryId, transaction?.tagIds, transaction?.amount]);

  const filteredCategories = categories.filter((c) => c.type === type);

  function handleTypeChange(newType: TransactionType) {
    setType(newType);
    // Clear category if it doesn't belong to the new type
    const currentCat = categories.find((c) => c.id === categoryId);
    if (currentCat && currentCat.type !== newType) {
      setCategoryId("");
    }
    // Clear shares when switching away from EXPENSE
    if (newType !== "EXPENSE") {
      setShares(null);
    }
  }

  const handleSharesChange = useCallback((newShares: { userId: string; amount: number }[] | null) => {
    setShares(newShares);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    formData.set("type", type);
    formData.set("tagIds", JSON.stringify(tagIds));

    if (shares) {
      formData.set("shares", JSON.stringify(shares));
    }

    const validationError = validateTransactionFormData(formData);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setLoading(true);

    const result = isEditing
      ? await updateTransaction(transaction!.id, formData)
      : await createTransaction(formData);

    if (result.error) {
      toast.error(result.error);
      setLoading(false);
    } else {
      toast.success("Transação salva");
      onOpenChange(false);
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar" : "Nova"} Transação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={type === "EXPENSE" ? "default" : "outline"}
              className="flex-1"
              onClick={() => handleTypeChange("EXPENSE")}
            >
              Despesa
            </Button>
            <Button
              type="button"
              variant={type === "INCOME" ? "default" : "outline"}
              className="flex-1"
              onClick={() => handleTypeChange("INCOME")}
            >
              Receita
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input id="description" name="description" defaultValue={transaction?.description} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Valor</Label>
            <CurrencyInput
              id="amount"
              name="amount"
              defaultValueCents={transaction?.amount ?? 0}
              onValueChange={setAmountCents}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoryId">Categoria</Label>
            <Select name="categoryId" value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={transaction?.date ?? new Date().toISOString().split("T")[0]}
              required
            />
          </div>
          <TagPicker tags={tags} selectedTagIds={tagIds} onChange={setTagIds} />
          {showSplit && (
            <SplitSection
              members={members!}
              totalAmount={amountCents}
              defaultRatio={defaultSplitRatio ?? null}
              shares={shares}
              onChange={handleSharesChange}
            />
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
