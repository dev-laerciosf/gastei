"use client";

import { useState, useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CurrencyInput } from "@/components/ui/currency-input";
import { formatCurrency } from "@/lib/utils/money";

interface SplitSectionProps {
  members: { id: string; name: string | null }[];
  totalAmount: number; // in cents
  defaultRatio: Record<string, number> | null;
  shares: { userId: string; amount: number }[] | null;
  onChange: (shares: { userId: string; amount: number }[] | null) => void;
}

function computeShares(
  members: { id: string; name: string | null }[],
  totalAmount: number,
  ratio: Record<string, number> | null,
): { userId: string; amount: number }[] {
  if (ratio && Object.keys(ratio).length >= 2) {
    const memberIds = members.map((m) => m.id);
    const ratioEntries = memberIds
      .filter((id) => ratio[id] !== undefined && ratio[id] > 0)
      .map((id) => ({ userId: id, ratio: ratio[id] }));

    if (ratioEntries.length >= 2) {
      const totalRatio = ratioEntries.reduce((a, e) => a + e.ratio, 0);
      if (totalRatio > 0) {
        let remaining = totalAmount;
        const shares: { userId: string; amount: number }[] = [];

        for (let i = 0; i < ratioEntries.length; i++) {
          if (i === ratioEntries.length - 1) {
            shares.push({ userId: ratioEntries[i].userId, amount: remaining });
          } else {
            const amount = Math.round((totalAmount * ratioEntries[i].ratio) / totalRatio);
            shares.push({ userId: ratioEntries[i].userId, amount });
            remaining -= amount;
          }
        }

        return shares;
      }
    }
  }

  return equalSplit(members, totalAmount);
}

function equalSplit(
  members: { id: string; name: string | null }[],
  totalAmount: number,
): { userId: string; amount: number }[] {
  const count = members.length;
  if (count === 0) return [];

  const base = Math.floor(totalAmount / count);
  const remainder = totalAmount - base * count;

  return members.map((m, i) => ({
    userId: m.id,
    amount: base + (i < remainder ? 1 : 0),
  }));
}

export function SplitSection({ members, totalAmount, defaultRatio, shares, onChange }: SplitSectionProps) {
  const [enabled, setEnabled] = useState(shares !== null);

  const handleToggle = useCallback(
    (checked: boolean) => {
      setEnabled(checked);
      if (checked) {
        const newShares = computeShares(members, totalAmount, defaultRatio);
        onChange(newShares);
      } else {
        onChange(null);
      }
    },
    [members, totalAmount, defaultRatio, onChange],
  );

  // Re-compute proportionally when totalAmount changes and split is enabled
  useEffect(() => {
    if (!enabled || !shares) return;
    if (totalAmount <= 0) return;

    const currentSum = shares.reduce((acc, s) => acc + s.amount, 0);
    if (currentSum === 0 || currentSum === totalAmount) return;

    let remaining = totalAmount;
    const newShares: { userId: string; amount: number }[] = [];
    for (let i = 0; i < shares.length; i++) {
      if (i === shares.length - 1) {
        newShares.push({ userId: shares[i].userId, amount: remaining });
      } else {
        const amount = Math.round((totalAmount * shares[i].amount) / currentSum);
        newShares.push({ userId: shares[i].userId, amount });
        remaining -= amount;
      }
    }
    onChange(newShares);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalAmount]);

  // Sync enabled state when shares prop changes externally (e.g. dialog reset)
  useEffect(() => {
    setEnabled(shares !== null);
  }, [shares]);

  function handleShareChange(userId: string, newAmount: number) {
    if (!shares) return;
    const updated = shares.map((s) => (s.userId === userId ? { ...s, amount: newAmount } : s));
    onChange(updated);
  }

  const shareSum = shares?.reduce((acc, s) => acc + s.amount, 0) ?? 0;
  const isValid = shareSum === totalAmount;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Switch
          id="split-toggle"
          checked={enabled}
          onCheckedChange={handleToggle}
        />
        <Label htmlFor="split-toggle" className="text-sm font-medium cursor-pointer">
          Dividir despesa
        </Label>
      </div>

      {enabled && shares && (
        <div className="space-y-2 rounded-md border p-3">
          {members.map((member) => {
            const share = shares.find((s) => s.userId === member.id);
            return (
              <div key={member.id} className="flex items-center gap-3">
                <span className="text-sm min-w-[80px] truncate">
                  {member.name ?? "Sem nome"}
                </span>
                <CurrencyInput
                  name={`split-${member.id}`}
                  defaultValueCents={share?.amount ?? 0}
                  key={`${member.id}-${share?.amount ?? 0}`}
                  className="flex-1"
                  onValueChange={(cents) => handleShareChange(member.id, cents)}
                />
              </div>
            );
          })}
          {!isValid && (
            <p className="text-xs text-destructive">
              Soma ({formatCurrency(shareSum)}) diferente do total ({formatCurrency(totalAmount)})
            </p>
          )}
        </div>
      )}
    </div>
  );
}
