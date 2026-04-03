import { getRecurringTransactions, getRecurringOccurrences } from "@/lib/actions/recurring";
import { getCategories } from "@/lib/actions/categories";
import { RecurringList } from "@/components/recurring-list";
import { requireFeature } from "@/lib/auth-guard";

export default async function RecurringPage() {
  await requireFeature("recurring");
  const [recurring, occurrences, categories] = await Promise.all([
    getRecurringTransactions(),
    getRecurringOccurrences(),
    getCategories(),
  ]);

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">Recorrências</h2>
      <RecurringList recurring={recurring} occurrences={occurrences} categories={categories} />
    </div>
  );
}
