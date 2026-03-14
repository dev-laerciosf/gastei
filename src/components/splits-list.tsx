"use client";

import { useState } from "react";
import { CheckCircle, Trash2, Scale, ArrowRight, Handshake, Receipt, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { SettlementDialog } from "@/components/settlement-dialog";
import { deleteTransaction } from "@/lib/actions/transactions";
import { useDeleteAction } from "@/hooks/use-delete-action";
import { formatCurrency } from "@/lib/utils/money";
import type { SplitBalance, SplitTransaction, Settlement } from "@/types";

interface SplitsListProps {
  balances: SplitBalance[];
  splits: SplitTransaction[];
  settlements: Settlement[];
  members: { id: string; name: string | null }[];
}

export function SplitsList({ balances, splits, settlements }: SplitsListProps) {
  const [settlementTarget, setSettlementTarget] = useState<SplitBalance | null>(null);
  const { deleteId, setDeleteId, deleting, handleDelete } = useDeleteAction(deleteTransaction);

  const hasContent = splits.length > 0 || settlements.length > 0;
  const hasBalances = balances.length > 0;

  const totalOwed = balances
    .filter((b) => b.amount > 0)
    .reduce((sum, b) => sum + b.amount, 0);
  const totalOwing = balances
    .filter((b) => b.amount < 0)
    .reduce((sum, b) => sum + Math.abs(b.amount), 0);

  return (
    <>
      {/* Balance summary */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Saldos</h3>
        </div>

        {hasBalances ? (
          <>
            {/* Totals overview */}
            <div className="grid gap-3 sm:grid-cols-2">
              {totalOwed > 0 && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/50 dark:bg-rose-950/20">
                  <p className="text-xs font-medium text-rose-600 dark:text-rose-400">Você deve no total</p>
                  <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-rose-700 dark:text-rose-300">
                    {formatCurrency(totalOwed)}
                  </p>
                </div>
              )}
              {totalOwing > 0 && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Te devem no total</p>
                  <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-300">
                    {formatCurrency(totalOwing)}
                  </p>
                </div>
              )}
            </div>

            {/* Per-member balances */}
            <div className="space-y-2">
              {balances.map((balance) => {
                const isDebt = balance.amount > 0;
                return (
                  <div
                    key={balance.memberId}
                    className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full ${
                        isDebt
                          ? "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400"
                          : "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                      }`}>
                        {isDebt ? (
                          <ArrowRight className="h-4 w-4" />
                        ) : (
                          <ArrowRight className="h-4 w-4 rotate-180" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {balance.memberName ?? "Membro"}
                        </p>
                        <p className={`text-xs ${isDebt ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                          {isDebt ? "Você deve" : "Te deve"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-lg font-bold font-mono tabular-nums ${
                        isDebt ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                      }`}>
                        {formatCurrency(Math.abs(balance.amount))}
                      </span>
                      <Button
                        size="sm"
                        variant={isDebt ? "default" : "outline"}
                        onClick={() => setSettlementTarget(balance)}
                      >
                        <Handshake className="mr-1.5 h-3.5 w-3.5" />
                        Acertar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
              <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="mt-3 text-sm font-medium">Tudo certo!</p>
            <p className="mt-1 text-xs text-muted-foreground">Todas as contas estão acertadas</p>
          </div>
        )}
      </section>

      {/* Split transactions */}
      {splits.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Despesas divididas</h3>
            </div>
            <Badge variant="secondary" className="font-mono tabular-nums">
              {splits.length} {splits.length === 1 ? "despesa" : "despesas"}
            </Badge>
          </div>
          <div className="space-y-3">
            {splits.map((split) => (
              <Card key={split.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-start justify-between p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="mt-0.5 h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: split.category.color }}
                      />
                      <div>
                        <p className="font-medium">{split.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(split.date), "dd 'de' MMMM", { locale: ptBR })}
                          {" · "}
                          {split.category.name}
                          {" · "}
                          Pago por <span className="font-medium text-foreground">{split.payer.name ?? "membro"}</span>
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold font-mono tabular-nums text-rose-600 dark:text-rose-400 shrink-0">
                      {formatCurrency(split.amount)}
                    </p>
                  </div>
                  {split.shares.length > 0 && (
                    <div className="border-t bg-muted/30 px-4 py-2.5">
                      <div className="flex flex-wrap gap-x-6 gap-y-1">
                        {split.shares.map((share) => (
                          <div key={share.userId} className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">{share.userName ?? "Membro"}</span>
                            <span className="font-mono tabular-nums font-medium">
                              {formatCurrency(share.amount)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({Math.round((share.amount / split.amount) * 100)}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Settlements */}
      {settlements.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Handshake className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Acertos</h3>
            </div>
            <Badge variant="secondary" className="font-mono tabular-nums">
              {settlements.length} {settlements.length === 1 ? "acerto" : "acertos"}
            </Badge>
          </div>
          <div className="space-y-2">
            {settlements.map((settlement) => (
              <div
                key={settlement.id}
                className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                    <Handshake className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">{settlement.from.name ?? "Membro"}</span>
                      <ArrowRight className="inline mx-1.5 h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{settlement.to.name ?? "membro"}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(settlement.date), "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold font-mono tabular-nums text-blue-600 dark:text-blue-400">
                    {formatCurrency(settlement.amount)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteId(settlement.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!hasContent && !hasBalances && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Scale className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-3 text-sm font-medium">Nenhuma divisão ainda</p>
          <p className="mt-1 text-xs text-muted-foreground max-w-xs">
            Divida despesas com os membros do seu grupo na página de transações
          </p>
        </div>
      )}

      {/* Settlement dialog */}
      {settlementTarget && (
        <SettlementDialog
          open={!!settlementTarget}
          onOpenChange={(open) => !open && setSettlementTarget(null)}
          memberId={settlementTarget.memberId}
          memberName={settlementTarget.memberName}
          maxAmount={Math.abs(settlementTarget.amount)}
          direction={settlementTarget.amount > 0 ? "you-owe" : "they-owe"}
        />
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir acerto"
        description="Tem certeza que deseja excluir este acerto? Os saldos serão recalculados."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  );
}
