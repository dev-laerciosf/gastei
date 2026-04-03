"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PLANS } from "@/lib/plans";
import { createCheckoutSession } from "@/lib/actions/billing";
import { toast } from "sonner";
import type { Plan } from "@prisma/client";

const planOrder: Plan[] = ["FREE", "PRO", "PREMIUM"];

const planIcons: Record<Plan, React.ReactNode> = {
  FREE: null,
  PRO: <Sparkles className="h-5 w-5 text-blue-500" />,
  PREMIUM: <Crown className="h-5 w-5 text-amber-500" />,
};

const planColors: Record<Plan, string> = {
  FREE: "",
  PRO: "border-blue-500/50 shadow-blue-500/10 shadow-lg",
  PREMIUM: "border-amber-500/50 shadow-amber-500/10 shadow-lg",
};

export function PricingCards({ currentPlan, isLoggedIn }: { currentPlan: Plan; isLoggedIn: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState<Plan | null>(null);

  async function handleSubscribe(plan: "PRO" | "PREMIUM") {
    if (!isLoggedIn) {
      router.push("/register");
      return;
    }

    setLoading(plan);
    try {
      const result = await createCheckoutSession(plan);
      if (result.error) {
        toast.error(result.error);
      } else if (result.url) {
        window.location.href = result.url;
      }
    } catch {
      toast.error("Erro ao processar. Tente novamente.");
    } finally {
      setLoading(null);
    }
  }

  function formatPrice(cents: number) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  }

  return (
    <div className="mt-12 grid w-full max-w-4xl gap-6 md:grid-cols-3">
      {planOrder.map((planKey) => {
        const plan = PLANS[planKey];
        const isCurrent = currentPlan === planKey;
        const isPopular = planKey === "PRO";

        return (
          <Card key={planKey} className={cn("relative flex flex-col", planColors[planKey])}>
            {isPopular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white">
                Mais popular
              </Badge>
            )}
            <CardHeader>
              <div className="flex items-center gap-2">
                {planIcons[planKey]}
                <CardTitle>{plan.name}</CardTitle>
              </div>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                {plan.price === 0 ? (
                  <span className="text-3xl font-bold">Grátis</span>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{formatPrice(plan.price)}</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <ul className="flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                {planKey === "FREE" ? (
                  <Button variant="outline" className="w-full" disabled={isCurrent} asChild={!isCurrent}>
                    {isCurrent ? (
                      "Plano atual"
                    ) : (
                      <a href={isLoggedIn ? "/dashboard" : "/register"}>
                        {isLoggedIn ? "Voltar ao dashboard" : "Começar grátis"}
                      </a>
                    )}
                  </Button>
                ) : (
                  <Button
                    className={cn("w-full", planKey === "PRO" && "bg-blue-500 hover:bg-blue-600", planKey === "PREMIUM" && "bg-amber-500 hover:bg-amber-600")}
                    disabled={isCurrent || loading !== null}
                    onClick={() => handleSubscribe(planKey)}
                  >
                    {isCurrent
                      ? "Plano atual"
                      : loading === planKey
                        ? "Processando..."
                        : `Assinar ${plan.name}`}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
