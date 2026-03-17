import Link from "next/link";
import { Flag, PiggyBank, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils/money";
import type { GoalWithProgress } from "@/lib/actions/goals";

interface GoalsSummaryProps {
  goals: GoalWithProgress[];
}

function progressColor(percentage: number) {
  if (percentage >= 100) return "bg-emerald-500";
  if (percentage >= 80) return "bg-amber-500";
  return "bg-blue-500";
}

export function GoalsSummary({ goals }: GoalsSummaryProps) {
  if (goals.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flag className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Metas</h3>
        </div>
        <Link href="/goals" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          Ver todas <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {goals.map((goal) => {
          const Icon = goal.type === "SAVINGS" ? PiggyBank : Flag;

          return (
            <div key={goal.id} className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium truncate">{goal.name}</span>
              </div>
              <div className="h-2 rounded-full bg-secondary">
                <div
                  className={`h-full rounded-full transition-all ${progressColor(goal.percentage)}`}
                  style={{ width: `${Math.min(goal.percentage, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-mono tabular-nums">{formatCurrency(goal.currentAmount)}</span>
                <span className="text-muted-foreground font-mono tabular-nums">{goal.percentage}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
