import { Settings } from "lucide-react";
import { requireAuth } from "@/lib/auth-guard";
import { getTags } from "@/lib/actions/tags";
import { SettingsForm } from "@/components/settings-form";
import { TagManagement } from "@/components/tag-management";

export default async function SettingsPage() {
  const [session, tags] = await Promise.all([
    requireAuth(),
    getTags(),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Configurações</h2>
      </div>
      <SettingsForm user={{ name: session.user.name ?? "", email: session.user.email ?? "" }} />
      <TagManagement tags={tags} />
    </div>
  );
}
