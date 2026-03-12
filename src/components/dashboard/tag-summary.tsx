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
