import { Flag } from "lucide-react";
import { getGoalsWithEntries } from "@/lib/actions/goals";
import { requireAuth, requireFeature } from "@/lib/auth-guard";
import { GoalList } from "@/components/goal-list";

export default async function GoalsPage() {
  await requireFeature("goals");
  const session = await requireAuth();
  const goals = await getGoalsWithEntries();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <Flag className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Metas</h2>
      </div>
      <GoalList goals={goals} currentUserId={session.user.id} />
    </div>
  );
}
