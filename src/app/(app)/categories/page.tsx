import { Tag } from "lucide-react";
import { getCategories } from "@/lib/actions/categories";
import { CategoriesList } from "@/components/categories-list";

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <Tag className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Categorias</h2>
      </div>
      <CategoriesList categories={categories} />
    </div>
  );
}
