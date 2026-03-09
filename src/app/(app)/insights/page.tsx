import { Suspense } from "react";
import { getInsights } from "@/lib/actions/insights";
import { InsightsList } from "@/components/insights-list";
import { safeMonth } from "@/lib/utils/date";

interface InsightsPageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function InsightsPage({ searchParams }: InsightsPageProps) {
  const params = await searchParams;
  const month = safeMonth(params.month);
  const insights = await getInsights(month);

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">Insights</h2>
      <Suspense fallback={<div className="text-sm text-muted-foreground">Carregando...</div>}>
        <InsightsList insights={insights} currentMonth={month} />
      </Suspense>
    </div>
  );
}
