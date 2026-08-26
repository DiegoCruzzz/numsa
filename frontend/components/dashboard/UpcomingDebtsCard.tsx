"use client";

import { differenceInCalendarDays } from "date-fns";
import { CalendarClock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/format";
import type { DebtOut } from "@/types/api";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";

interface Props {
  debts: DebtOut[];
  isLoading: boolean;
}

export function UpcomingDebtsCard({ debts, isLoading }: Props) {
  const currency = useAuthStore((s) => s.user?.currency ?? "MXN");
  const upcoming = debts
    .filter((d): d is DebtOut & { due_date: string } => d.status === "active" && Boolean(d.due_date))
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 4);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Próximos pagos</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-8 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Sin pagos programados</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((d) => {
              const days = differenceInCalendarDays(new Date(d.due_date + "T00:00:00"), new Date());
              return (
                <div key={d.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{d.creditor}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(d.due_date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(d.monthly_payment, currency)}</p>
                    <p
                      className={cn(
                        "text-xs",
                        days < 0 ? "text-destructive" : days <= 3 ? "text-amber-500" : "text-muted-foreground"
                      )}
                    >
                      {days < 0 ? `Vencido hace ${Math.abs(days)}d` : days === 0 ? "Hoy" : `en ${days}d`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
