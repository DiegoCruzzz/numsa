"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/format";
import type { BudgetStatus } from "@/types/api";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";

interface Props {
  budgets: BudgetStatus[];
  isLoading: boolean;
}

export function BudgetStatusList({ budgets, isLoading }: Props) {
  const currency = useAuthStore((s) => s.user?.currency ?? "MXN");

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Presupuestos</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                <div className="h-2 w-full bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : budgets.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Sin presupuestos</p>
        ) : (
          <div className="space-y-4">
            {budgets.map((b) => (
              <div key={b.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{b.category_name}</span>
                  <span
                    className={cn(
                      "text-xs",
                      b.used_pct >= 100
                        ? "text-destructive"
                        : b.used_pct >= 80
                        ? "text-amber-500"
                        : "text-muted-foreground"
                    )}
                  >
                    {formatCurrency(b.spent_amount, currency)} / {formatCurrency(b.limit_amount, currency)}
                  </span>
                </div>
                <Progress
                  value={Math.min(b.used_pct, 100)}
                  className={cn(
                    "h-2",
                    b.used_pct >= 100 ? "[&>div]:bg-destructive" : b.used_pct >= 80 ? "[&>div]:bg-amber-500" : ""
                  )}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
