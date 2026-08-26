"use client";

import { AlertTriangle } from "lucide-react";
import type { BudgetStatus } from "@/types/api";
import { cn } from "@/lib/utils";

interface Props {
  budgets: BudgetStatus[];
}

export function BudgetAlertBanner({ budgets }: Props) {
  const alerts = budgets.filter((b) => b.used_pct >= 80);
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((b) => (
        <div
          key={b.id}
          className={cn(
            "flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
            b.used_pct >= 100
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-amber-500/30 bg-amber-500/10 text-amber-600"
          )}
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            {b.used_pct >= 100
              ? `Ya superaste tu presupuesto de ${b.category_name} (${b.used_pct.toFixed(0)}%)`
              : `Vas en ${b.used_pct.toFixed(0)}% de tu presupuesto de ${b.category_name}`}
          </span>
        </div>
      ))}
    </div>
  );
}
