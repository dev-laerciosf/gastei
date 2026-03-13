"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

export function useDeleteAction(
  deleteFn: (id: string) => Promise<{ error?: string } | void>
) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, startTransition] = useTransition();

  function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      try {
        const result = await deleteFn(deleteId);
        if (result && "error" in result && result.error) {
          toast.error(result.error);
        } else {
          toast.success("Removido com sucesso");
        }
      } catch {
        toast.error("Erro ao remover");
      } finally {
        setDeleteId(null);
      }
    });
  }

  return { deleteId, setDeleteId, deleting, handleDelete };
}
