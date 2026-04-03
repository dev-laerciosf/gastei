import { Sparkles, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Plan } from "@prisma/client";

const config: Record<Plan, { label: string; className: string; icon: React.ReactNode }> = {
  FREE: {
    label: "Grátis",
    className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700",
    icon: null,
  },
  PRO: {
    label: "Pro",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900",
    icon: <Sparkles className="h-3 w-3" />,
  },
  PREMIUM: {
    label: "Premium",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900",
    icon: <Crown className="h-3 w-3" />,
  },
};

export function PlanBadge({ plan }: { plan: Plan }) {
  const { label, className, icon } = config[plan];
  return (
    <Badge variant="secondary" className={`gap-1 cursor-pointer transition-colors ${className}`}>
      {icon}
      {label}
    </Badge>
  );
}
