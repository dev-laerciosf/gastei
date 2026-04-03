import { CreditCard } from "lucide-react";
import { requireAuth } from "@/lib/auth-guard";
import { getSubscription } from "@/lib/actions/billing";
import { BillingSection } from "@/components/billing-section";

export default async function BillingPage() {
  const [session, subscription] = await Promise.all([
    requireAuth(),
    getSubscription(),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Assinatura</h2>
      </div>
      <BillingSection
        plan={session.user.plan}
        subscription={subscription ? {
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        } : null}
      />
    </div>
  );
}
