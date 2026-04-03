import { Target } from "lucide-react";
import { getBudgets } from "@/lib/actions/budget";
import { getCategories } from "@/lib/actions/categories";
import { BudgetList } from "@/components/budget-list";
import { MonthPicker } from "@/components/month-picker";
import { requireFeature } from "@/lib/auth-guard";

interface Props {
  searchParams: Promise<{ month?: string }>;
}

export default async function BudgetPage({ searchParams }: Props) {
  await requireFeature("budgets");
  const params = await searchParams;
  const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
  const currentMonth = params.month && monthRegex.test(params.month) ? params.month : new Date().toISOString().slice(0, 7);

  const [budgets, categories] = await Promise.all([
    getBudgets(currentMonth),
    getCategories(),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Orçamento</h2>
        </div>
        <MonthPicker currentMonth={currentMonth} />
      </div>
      <BudgetList budgets={budgets} categories={categories} currentMonth={currentMonth} />
    </div>
  );
}
