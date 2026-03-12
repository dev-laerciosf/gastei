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
      <h2 className="text-xl font-semibold">Configurações</h2>
      <SettingsForm user={{ name: session.user.name ?? "", email: session.user.email ?? "" }} />
      <TagManagement tags={tags} />
    </div>
  );
}
