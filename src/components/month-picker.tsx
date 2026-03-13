"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";

interface MonthPickerProps {
  currentMonth: string;
}

export function MonthPicker({ currentMonth }: MonthPickerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [year, month] = currentMonth.split("-").map(Number);

  function navigate(offset: number) {
    const total = year * 12 + (month - 1) + offset;
    const newYear = Math.floor(total / 12);
    const newMonth = (total % 12) + 1;
    const newMonthStr = `${newYear}-${String(newMonth).padStart(2, "0")}`;

    const params = new URLSearchParams(searchParams.toString());
    params.set("month", newMonthStr);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-[150px] text-center text-sm font-medium capitalize">
        {format(new Date(year, month - 1), "MMMM yyyy", { locale: ptBR })}
      </span>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(1)}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
