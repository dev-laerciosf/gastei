import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/utils/money";

interface SummaryCardsProps {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export function SummaryCards({ totalIncome, totalExpense, balance }: SummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Receitas</p>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
            <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
        <p className="mt-2 text-3xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-300">
          {formatCurrency(totalIncome)}
        </p>
      </div>

      <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 dark:border-rose-900/50 dark:bg-rose-950/20">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-rose-600 dark:text-rose-400">Despesas</p>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/50">
            <TrendingDown className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          </div>
        </div>
        <p className="mt-2 text-3xl font-bold font-mono tabular-nums text-rose-700 dark:text-rose-300">
          {formatCurrency(totalExpense)}
        </p>
      </div>

      <div className={`rounded-lg border p-5 ${
        balance >= 0
          ? "border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/20"
          : "border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/20"
      }`}>
        <div className="flex items-center justify-between">
          <p className={`text-xs font-medium ${
            balance >= 0
              ? "text-blue-600 dark:text-blue-400"
              : "text-rose-600 dark:text-rose-400"
          }`}>Saldo</p>
          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
            balance >= 0
              ? "bg-blue-100 dark:bg-blue-900/50"
              : "bg-rose-100 dark:bg-rose-900/50"
          }`}>
            <Wallet className={`h-4 w-4 ${
              balance >= 0
                ? "text-blue-600 dark:text-blue-400"
                : "text-rose-600 dark:text-rose-400"
            }`} />
          </div>
        </div>
        <p className={`mt-2 text-3xl font-bold font-mono tabular-nums ${
          balance >= 0
            ? "text-blue-700 dark:text-blue-300"
            : "text-rose-700 dark:text-rose-300"
        }`}>
          {balance < 0 ? "- " : ""}{formatCurrency(Math.abs(balance))}
        </p>
      </div>
    </div>
  );
}
