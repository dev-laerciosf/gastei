"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Trash2, Pencil, Plus, ArrowLeftRight, Repeat, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { TransactionForm } from "@/components/transaction-form";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { TransactionPagination } from "@/components/transaction-pagination";
import { deleteTransaction } from "@/lib/actions/transactions";
import { createSplit, updateSplit, deleteSplit } from "@/lib/actions/splits";
import { useDeleteAction } from "@/hooks/use-delete-action";
import { formatCurrency } from "@/lib/utils/money";
import { toast } from "sonner";
import type { TransactionType, Tag } from "@/types";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  date: Date;
  category: { id: string; name: string; color: string; type: TransactionType } | null;
  user: { name: string | null };
  recurringOccurrence?: { id: string } | null;
  tags: { tag: { id: string; name: string; color: string } }[];
  split?: {
    id: string;
    shares: { userId: string; amount: number; user: { name: string | null } }[];
  } | null;
}

interface TransactionsListProps {
  transactions: Transaction[];
  categories: Pick<import("@/types").Category, "id" | "name" | "type">[];
  tags: Tag[];
  page: number;
  totalPages: number;
  totalIncome: number;
  totalExpense: number;
  members?: { id: string; name: string | null }[];
  defaultSplitRatio?: Record<string, number> | null;
}

interface SplitDialogState {
  transactionId: string;
  transactionAmount: number;
  splitId?: string;
  existingShares?: { userId: string; amount: number }[];
}

export function TransactionsList({
  transactions,
  categories,
  tags,
  page,
  totalPages,
  totalIncome,
  totalExpense,
  members = [],
  defaultSplitRatio,
}: TransactionsListProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const { deleteId, setDeleteId, deleting, handleDelete } = useDeleteAction(deleteTransaction);
  const [splitDialog, setSplitDialog] = useState<SplitDialogState | null>(null);
  const [splitShares, setSplitShares] = useState<Record<string, number>>({});
  const [splitPending, startSplitTransition] = useTransition();
  const [deleteSplitDialog, setDeleteSplitDialog] = useState<string | null>(null);
  const [deletingSplit, startDeleteSplitTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();

  const hasSplitMembers = members.length >= 2;

  function handleEdit(tx: Transaction) {
    setEditing(tx);
    setFormOpen(true);
  }

  function handleNew() {
    setEditing(null);
    setFormOpen(true);
  }

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

  function openSplitDialog(tx: Transaction) {
    const initial: Record<string, number> = {};
    if (tx.split) {
      for (const share of tx.split.shares) {
        initial[share.userId] = share.amount;
      }
    } else {
      // Equal split by default, or use ratio
      if (defaultSplitRatio && Object.keys(defaultSplitRatio).length >= 2) {
        const totalRatio = Object.values(defaultSplitRatio).reduce((a, b) => a + b, 0);
        let remaining = tx.amount;
        const entries = members.filter((m) => defaultSplitRatio[m.id] !== undefined && defaultSplitRatio[m.id] > 0);
        for (let i = 0; i < entries.length; i++) {
          if (i === entries.length - 1) {
            initial[entries[i].id] = remaining;
          } else {
            const amount = Math.round((tx.amount * defaultSplitRatio[entries[i].id]) / totalRatio);
            initial[entries[i].id] = amount;
            remaining -= amount;
          }
        }
      } else {
        const count = members.length;
        const base = Math.floor(tx.amount / count);
        const remainder = tx.amount - base * count;
        members.forEach((m, i) => {
          initial[m.id] = base + (i < remainder ? 1 : 0);
        });
      }
    }

    setSplitShares(initial);
    setSplitDialog({
      transactionId: tx.id,
      transactionAmount: tx.amount,
      splitId: tx.split?.id,
      existingShares: tx.split?.shares.map((s) => ({ userId: s.userId, amount: s.amount })),
    });
  }

  function handleSplitShareChange(userId: string, amount: number) {
    setSplitShares((prev) => ({ ...prev, [userId]: amount }));
  }

  function handleSplitSave() {
    if (!splitDialog) return;

    const sharesArray = members
      .filter((m) => splitShares[m.id] !== undefined && splitShares[m.id] > 0)
      .map((m) => ({ userId: m.id, amount: splitShares[m.id] }));

    const sum = sharesArray.reduce((acc, s) => acc + s.amount, 0);
    if (sum !== splitDialog.transactionAmount) {
      toast.error("A soma das partes deve ser igual ao valor da transação");
      return;
    }

    if (sharesArray.length < 2) {
      toast.error("Mínimo 2 membros para dividir");
      return;
    }

    startSplitTransition(async () => {
      const result = splitDialog.splitId
        ? await updateSplit(splitDialog.splitId, sharesArray)
        : await createSplit(splitDialog.transactionId, sharesArray);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(splitDialog.splitId ? "Divisão atualizada" : "Divisão criada");
        setSplitDialog(null);
      }
    });
  }

  function handleDeleteSplit() {
    if (!deleteSplitDialog) return;
    startDeleteSplitTransition(async () => {
      const result = await deleteSplit(deleteSplitDialog);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Divisão removida");
      }
      setDeleteSplitDialog(null);
    });
  }

  const splitDialogSum = Object.values(splitShares).reduce((acc, v) => acc + v, 0);
  const splitDialogValid = splitDialog ? splitDialogSum === splitDialog.transactionAmount : false;

  return (
    <>
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

      {(totalIncome > 0 || totalExpense > 0) && (
        <div className="flex gap-4 text-sm">
          <span className="text-emerald-600 font-mono tabular-nums">+ {formatCurrency(totalIncome)}</span>
          <span className="text-rose-600 font-mono tabular-nums">- {formatCurrency(totalExpense)}</span>
          <span className={`font-semibold font-mono tabular-nums ${totalIncome - totalExpense >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            = {formatCurrency(Math.abs(totalIncome - totalExpense))}
          </span>
        </div>
      )}

      <div className="space-y-2">
        {transactions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ArrowLeftRight className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">Nenhuma transação encontrada</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={handleNew}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Transação
            </Button>
          </div>
        )}
        {transactions.map((tx) => (
          <div key={tx.id} className="flex items-center justify-between rounded-md border p-4">
            <div className="flex items-center gap-3">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: tx.category?.color ?? "#6b7280" }}
              />
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{tx.description}</p>
                  {tx.recurringOccurrence && (
                    <Badge variant="secondary" className="gap-1 text-[10px] px-1.5 py-0">
                      <Repeat className="h-3 w-3" />
                      Recorrente
                    </Badge>
                  )}
                  {tx.split && (
                    <Badge
                      variant="secondary"
                      className="gap-1 text-[10px] px-1.5 py-0 cursor-pointer"
                      onClick={() => openSplitDialog(tx)}
                    >
                      <Scale className="h-3 w-3" />
                      Dividida
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
                <p className="text-sm text-muted-foreground">
                  {tx.category?.name ?? "Sem categoria"} · {format(new Date(tx.date), "dd MMM yyyy", { locale: ptBR })}
                  {tx.user.name && ` · ${tx.user.name}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`font-semibold font-mono tabular-nums ${tx.type === "INCOME" ? "text-emerald-600" : "text-rose-600"}`}>
                {tx.type === "INCOME" ? "+" : "-"} {formatCurrency(tx.amount)}
              </span>
              {tx.type === "EXPENSE" && hasSplitMembers && !tx.split && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openSplitDialog(tx)}
                  title="Dividir despesa"
                >
                  <Scale className="h-4 w-4" />
                </Button>
              )}
              {tx.type !== "SETTLEMENT" && (
                <>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(tx)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(tx.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <TransactionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        categories={categories}
        tags={tags}
        members={members}
        defaultSplitRatio={defaultSplitRatio}
        transaction={
          editing
            ? {
                id: editing.id,
                description: editing.description,
                amount: editing.amount,
                type: editing.type,
                categoryId: editing.category?.id ?? "",
                date: new Date(editing.date).toISOString().split("T")[0],
                tagIds: editing.tags.map((t) => t.tag.id),
              }
            : null
        }
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir transação"
        description="Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
        loading={deleting}
      />

      {/* Split dialog for adding/editing split on existing transactions */}
      <Dialog open={!!splitDialog} onOpenChange={(open) => !open && setSplitDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {splitDialog?.splitId ? "Editar divisão" : "Dividir despesa"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {splitDialog && (
              <p className="text-sm text-muted-foreground">
                Total: {formatCurrency(splitDialog.transactionAmount)}
              </p>
            )}
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-3">
                <Label className="text-sm min-w-[80px] truncate">
                  {member.name ?? "Sem nome"}
                </Label>
                <CurrencyInput
                  name={`split-dialog-${member.id}`}
                  defaultValueCents={splitShares[member.id] ?? 0}
                  key={`${splitDialog?.transactionId}-${member.id}-${splitShares[member.id] ?? 0}`}
                  className="flex-1"
                  onValueChange={(cents) => handleSplitShareChange(member.id, cents)}
                />
              </div>
            ))}
            {splitDialog && !splitDialogValid && (
              <p className="text-xs text-destructive">
                Soma ({formatCurrency(splitDialogSum)}) diferente do total ({formatCurrency(splitDialog.transactionAmount)})
              </p>
            )}
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleSplitSave}
                disabled={splitPending || !splitDialogValid}
              >
                {splitPending ? "Salvando..." : "Salvar"}
              </Button>
              {splitDialog?.splitId && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    setDeleteSplitDialog(splitDialog.splitId!);
                    setSplitDialog(null);
                  }}
                >
                  Remover
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteSplitDialog}
        onOpenChange={(open) => !open && setDeleteSplitDialog(null)}
        title="Remover divisão"
        description="Tem certeza que deseja remover esta divisão?"
        onConfirm={handleDeleteSplit}
        loading={deletingSplit}
      />

      {totalPages > 1 && <TransactionPagination page={page} totalPages={totalPages} />}
    </>
  );
}
