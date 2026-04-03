"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Plan } from "@prisma/client";

export function UpgradeBanner({ plan }: { plan: Plan }) {
  if (plan !== "FREE") return null;

  return (
    <div className="mx-4 mb-4 rounded-lg border border-blue-500/30 bg-blue-500/5 p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Sparkles className="h-4 w-4 text-blue-500" />
        Plano Grátis
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Desbloqueie recursos ilimitados
      </p>
      <Button asChild size="sm" className="mt-2 w-full bg-blue-500 hover:bg-blue-600">
        <Link href="/pricing">Fazer upgrade</Link>
      </Button>
    </div>
  );
}
