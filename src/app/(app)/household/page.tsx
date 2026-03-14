import { Users } from "lucide-react";
import { getHousehold, getSentInvites, getPendingInvites } from "@/lib/actions/household";
import { requireAuth } from "@/lib/auth-guard";
import { HouseholdMembers } from "@/components/household-members";
import { PendingInvites } from "@/components/pending-invites";
import { SplitRatioConfig } from "@/components/split-ratio-config";

export default async function HouseholdPage() {
  const session = await requireAuth();
  const [household, sentInvites, pendingInvites] = await Promise.all([
    getHousehold(),
    getSentInvites(),
    getPendingInvites(),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Grupo</h2>
      </div>

      {pendingInvites.length > 0 && (
        <PendingInvites invites={pendingInvites} />
      )}

      {household ? (
        <HouseholdMembers
          household={household}
          currentUserId={session.user.id}
          sentInvites={sentInvites}
        />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-3 text-sm font-medium">Nenhum grupo encontrado</p>
          <p className="mt-1 text-xs text-muted-foreground max-w-xs">
            Crie um grupo para compartilhar despesas com outros membros
          </p>
        </div>
      )}

      {household && (
        <SplitRatioConfig
          members={household.members}
          currentRatio={household.defaultSplitRatio as Record<string, number> | null}
        />
      )}
    </div>
  );
}
