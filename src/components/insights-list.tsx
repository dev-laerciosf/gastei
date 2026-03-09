"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { TrendingUp, TrendingDown, Plus, Ban, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/money";
import type { Insight } from "@/types";

function InsightTypeLabel({ type }: { type: Insight["type"] }) {
  switch (type) {
    case "new":
      return <span className="text-xs text-blue-600 dark:text-blue-400">Nova categoria</span>;
    case "gone":
      return <span className="text-xs text-muted-foreground">Zerou gastos</span>;
    case "increase":
      return <span className="text-xs text-rose-600 dark:text-rose-400">Aumento</span>;
    case "decrease":
      return <span className="text-xs text-emerald-600 dark:text-emerald-400">Redução</span>;
  }
}

function DeltaDisplay({ label, delta, transactionType }: { label: string; delta: number; transactionType: "INCOME" | "EXPENSE" }) {
  const isPositiveChange = transactionType === "INCOME" ? delta > 0 : delta < 0;

  return (
    <div className="text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`text-sm font-semibold font-mono tabular-nums ${
          isPositiveChange ? "text-emerald-600" : "text-rose-600"
        }`}
      >
        {delta > 0 ? "+" : ""}{delta}%
      </p>
    </div>
  );
}

function InsightIcon({ type }: { type: Insight["type"] }) {
  switch (type) {
    case "new":
      return <Plus className="h-4 w-4" />;
    case "gone":
      return <Ban className="h-4 w-4" />;
    case "increase":
      return <TrendingUp className="h-4 w-4" />;
    case "decrease":
      return <TrendingDown className="h-4 w-4" />;
  }
}

interface InsightsListProps {
  insights: Insight[];
  currentMonth: string;
}

export function InsightsList({ insights, currentMonth }: InsightsListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleMonthChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", value);
    router.push(`/insights?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <input
          type="month"
          value={currentMonth}
          onChange={(e) => handleMonthChange(e.target.value)}
          className="rounded-md border bg-background px-3 py-1.5 text-sm"
        />
      </div>

      {insights.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-6">
            <Sparkles className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="mt-6 text-lg font-semibold">Nenhum insight relevante</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Os insights aparecem quando há variações maiores que 20% em relação ao mês anterior ou à média dos últimos 3 meses.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {insights.map((insight) => (
            <Card key={`${insight.categoryId}-${insight.transactionType}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${insight.categoryColor}20`, color: insight.categoryColor }}
                    >
                      <InsightIcon type={insight.type} />
                    </div>
                    <div>
                      <p className="font-medium">{insight.categoryName}</p>
                      <InsightTypeLabel type={insight.type} />
                    </div>
                  </div>
                  <p className="text-lg font-semibold font-mono tabular-nums">
                    {formatCurrency(insight.currentAmount)}
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-3">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Mês anterior</p>
                    <p className="text-sm font-medium font-mono tabular-nums">
                      {formatCurrency(insight.previousAmount)}
                    </p>
                  </div>
                  <DeltaDisplay label="vs. anterior" delta={insight.deltaMonth} transactionType={insight.transactionType} />
                  <DeltaDisplay label="vs. média 3m" delta={insight.deltaTrend} transactionType={insight.transactionType} />
                </div>

                {insight.averageAmount > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground text-center">
                    Média 3 meses: {formatCurrency(insight.averageAmount)}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
