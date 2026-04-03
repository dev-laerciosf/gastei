"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { Crown, Sparkles, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLANS } from "@/lib/plans";
import { createPortalSession } from "@/lib/actions/billing";
import { toast } from "sonner";
import type { Plan } from "@prisma/client";

interface BillingSectionProps {
  plan: Plan;
  subscription: {
    status: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
}

function BillingSectionInner({ plan, subscription }: BillingSectionProps) {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const planConfig = PLANS[plan];

  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");
  const upgrade = searchParams.get("upgrade");

  async function handleManage() {
    setLoading(true);
    try {
      const result = await createPortalSession();
      if (result.error) {
        toast.error(result.error);
      } else if (result.url) {
        window.location.href = result.url;
      }
    } catch {
      toast.error("Erro ao abrir portal. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const planIcon = plan === "PREMIUM"
    ? <Crown className="h-5 w-5 text-amber-500" />
    : plan === "PRO"
      ? <Sparkles className="h-5 w-5 text-blue-500" />
      : null;

  return (
    <div className="space-y-6">
      {success && (
        <div className="rounded-md bg-green-500/10 p-4 text-sm text-green-600 dark:text-green-400">
          Assinatura ativada com sucesso! Aproveite o plano {planConfig.name}.
        </div>
      )}
      {canceled && (
        <div className="rounded-md bg-yellow-500/10 p-4 text-sm text-yellow-600 dark:text-yellow-400">
          Checkout cancelado. Você pode tentar novamente quando quiser.
        </div>
      )}
      {upgrade && (
        <div className="flex items-start gap-2 rounded-md bg-blue-500/10 p-4 text-sm text-blue-600 dark:text-blue-400">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          Esse recurso requer um plano superior. Escolha um plano abaixo para continuar.
        </div>
      )}

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {planIcon}
            Plano {planConfig.name}
            {subscription?.cancelAtPeriodEnd && (
              <Badge variant="secondary">Cancela ao fim do período</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {plan === "FREE" ? (
              <p>Você está no plano gratuito. Faça upgrade para desbloquear mais recursos.</p>
            ) : (
              <div className="space-y-2">
                <p>
                  {planConfig.price > 0 && (
                    <>
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(planConfig.price / 100)}/mês
                    </>
                  )}
                </p>
                {subscription?.currentPeriodEnd && (
                  <p>
                    Próxima cobrança: {new Date(subscription.currentPeriodEnd).toLocaleDateString("pt-BR")}
                  </p>
                )}
              </div>
            )}
          </div>

          <ul className="space-y-1.5 text-sm">
            {planConfig.features.map((f) => (
              <li key={f} className="text-muted-foreground">• {f}</li>
            ))}
          </ul>

          <div className="flex gap-3">
            {plan === "FREE" ? (
              <Button asChild>
                <Link href="/pricing">Ver planos</Link>
              </Button>
            ) : (
              <Button onClick={handleManage} disabled={loading}>
                {loading ? "Abrindo..." : "Gerenciar assinatura"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {plan === "FREE" && (
        <Card className="max-w-lg border-blue-500/30">
          <CardContent className="flex items-center gap-4 pt-6">
            <Sparkles className="h-8 w-8 shrink-0 text-blue-500" />
            <div>
              <p className="font-medium">Desbloqueie todo o potencial do Gastei</p>
              <p className="text-sm text-muted-foreground">
                Transações ilimitadas, metas, orçamentos e muito mais.
              </p>
            </div>
            <Button asChild className="ml-auto shrink-0 bg-blue-500 hover:bg-blue-600">
              <Link href="/pricing">Upgrade</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function BillingSection(props: BillingSectionProps) {
  return (
    <Suspense>
      <BillingSectionInner {...props} />
    </Suspense>
  );
}
