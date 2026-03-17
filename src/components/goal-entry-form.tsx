"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addGoalEntry } from "@/lib/actions/goals";
import { toast } from "sonner";

interface GoalEntryFormProps {
  goalId: string;
  currentAmount: number;
}

export function GoalEntryForm({ goalId, currentAmount }: GoalEntryFormProps) {
  const [loading, setLoading] = useState(false);
  const [entryType, setEntryType] = useState("deposit");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("goalId", goalId);
    formData.set("type", entryType);

    const amount = formData.get("amount") as string;
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Valor deve ser maior que zero");
      return;
    }

    setLoading(true);
    const result = await addGoalEntry(formData);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(entryType === "deposit" ? "Depósito registrado" : "Retirada registrada");
      form.reset();
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4">
      <div className="flex gap-3">
        <div className="flex-1">
          <Label htmlFor={`amount-${goalId}`} className="sr-only">Valor</Label>
          <CurrencyInput id={`amount-${goalId}`} name="amount" placeholder="Valor" />
        </div>
        <Select value={entryType} onValueChange={setEntryType}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="deposit">Depósito</SelectItem>
            <SelectItem value="withdrawal" disabled={currentAmount <= 0}>Retirada</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <Label htmlFor={`note-${goalId}`} className="sr-only">Nota</Label>
          <Input id={`note-${goalId}`} name="note" placeholder="Nota (opcional)" maxLength={200} />
        </div>
        <Button type="submit" size="sm" disabled={loading}>
          <Plus className="mr-1 h-4 w-4" />
          {loading ? "..." : "Adicionar"}
        </Button>
      </div>
    </form>
  );
}
