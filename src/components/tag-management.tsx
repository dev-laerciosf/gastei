"use client";

import { useState } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { updateTag, deleteTag } from "@/lib/actions/tags";
import { useDeleteAction } from "@/hooks/use-delete-action";
import { toast } from "sonner";
import type { Tag } from "@/types";

export function TagManagement({ tags }: { tags: Tag[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [saving, setSaving] = useState(false);
  const { deleteId, setDeleteId, deleting, handleDelete } = useDeleteAction(deleteTag);

  function startEdit(tag: Tag) {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit() {
    if (!editingId) return;
    setSaving(true);

    const formData = new FormData();
    formData.set("name", editName);
    formData.set("color", editColor);

    const result = await updateTag(editingId, formData);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Tag atualizada");
      setEditingId(null);
    }
    setSaving(false);
  }

  if (tags.length === 0) {
    return (
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Tags</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhuma tag criada. Tags são criadas ao adicionar transações.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Tags</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {tags.map((tag) => (
            <div key={tag.id} className="flex items-center justify-between rounded-md border p-3">
              {editingId === tag.id ? (
                <div className="flex flex-1 items-center gap-2">
                  <input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="h-7 w-7 cursor-pointer rounded border-0 p-0"
                  />
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-8 flex-1"
                  />
                  <Button variant="ghost" size="icon" onClick={saveEdit} disabled={saving}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={cancelEdit}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: tag.color }} />
                    <span className="text-sm">{tag.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(tag)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(tag.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </CardContent>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir tag"
        description="Tem certeza que deseja excluir esta tag? Ela será removida de todas as transações."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </Card>
  );
}
