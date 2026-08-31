"use client";

import { differenceInCalendarDays } from "date-fns";
import { CalendarClock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/format";
import { nextOccurrenceOfDay } from "@/lib/dates";
import type { DebtOut } from "@/types/api";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";

interface Props {
  debts: DebtOut[];
  isLoading: boolean;
}

interface UpcomingDebt extends DebtOut {
  effectiveDate: Date;
}

export function UpcomingDebtsCard({ debts, isLoading }: Props) {
  const currency = useAuthStore((s) => s.user?.currency ?? "MXN");
  const upcoming: UpcomingDebt[] = debts
    .filter((d) => d.status === "active")
    .map((d) => {
      const effectiveDate =
        d.subtype === "credit_card" && d.payment_due_day
          ? nextOccurrenceOfDay(d.payment_due_day)
          : d.due_date
          ? new Date(`${d.due_date}T00:00:00`)
          : null;
      return effectiveDate ? { ...d, effectiveDate } : null;
    })
    .filter((d): d is UpcomingDebt => d !== null)
    .sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime())
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
              const days = differenceInCalendarDays(d.effectiveDate, new Date());
              const amount = d.subtype === "credit_card" ? d.remaining_amount : d.monthly_payment;
              return (
                <div key={d.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{d.creditor}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(d.effectiveDate.toISOString().slice(0, 10))}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(amount, currency)}</p>
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
