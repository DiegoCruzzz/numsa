"use client";

import { TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/format";
import type { DebtSummary } from "@/types/api";
import { useAuthStore } from "@/store/auth";

interface Props {
  summary: DebtSummary | undefined;
  isLoading: boolean;
}

export function DebtProgressCard({ summary, isLoading }: Props) {
  const currency = useAuthStore((s) => s.user?.currency ?? "MXN");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Deuda total</CardTitle>
        <TrendingDown className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            <div className="h-4 w-full bg-muted animate-pulse rounded" />
          </div>
        ) : summary && summary.active_debts > 0 ? (
          <>
            <p className="text-3xl font-bold text-destructive">
              {formatCurrency(summary.total_debt, currency)}
            </p>
            <div className="space-y-1">
              <Progress value={summary.global_progress_pct} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{summary.global_progress_pct.toFixed(1)}% pagado</span>
                <span>{formatCurrency(summary.total_paid, currency)} pagado</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{summary.active_debts} deuda(s) activa(s)</p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Sin deudas activas 🎉</p>
        )}
      </CardContent>
    </Card>
  );
}
