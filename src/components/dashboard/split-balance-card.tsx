import Link from "next/link";
import { Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/money";
import type { SplitBalance } from "@/types";

export function SplitBalanceCard({ balances }: { balances: SplitBalance[] }) {
  if (balances.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-4 w-4" />
          Divisões
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {balances.map((balance) => (
            <div key={balance.memberId} className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {balance.amount > 0
                  ? `Você deve a ${balance.memberName ?? "membro"}`
                  : `${balance.memberName ?? "Membro"} te deve`}
              </span>
              <span
                className={`text-sm font-mono tabular-nums font-semibold ${
                  balance.amount > 0 ? "text-rose-600" : "text-emerald-600"
                }`}
              >
                {formatCurrency(Math.abs(balance.amount))}
              </span>
            </div>
          ))}
        </div>
        <Link
          href="/splits"
          className="mt-4 block text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Ver todas as divisões &rarr;
        </Link>
      </CardContent>
    </Card>
  );
}
