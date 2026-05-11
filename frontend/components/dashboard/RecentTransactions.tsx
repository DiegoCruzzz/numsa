"use client";

import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/format";
import type { TransactionOut } from "@/types/api";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";

interface Props {
  transactions: TransactionOut[];
  isLoading: boolean;
}

const typeConfig = {
  income: { icon: ArrowUpRight, color: "text-emerald-500", label: "Ingreso" },
  expense: { icon: ArrowDownLeft, color: "text-destructive", label: "Gasto" },
  transfer: { icon: ArrowLeftRight, color: "text-blue-500", label: "Transferencia" },
};

export function RecentTransactions({ transactions, isLoading }: Props) {
  const currency = useAuthStore((s) => s.user?.currency ?? "MXN");
  const recent = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Transacciones recientes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-2 w-16 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-4 w-16 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : recent.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Sin transacciones este mes
          </p>
        ) : (
          <div className="space-y-3">
            {recent.map((tx) => {
              const cfg = typeConfig[tx.type as keyof typeof typeConfig];
              const Icon = cfg.icon;
              return (
                <div key={tx.id} className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-full bg-muted", cfg.color)}>
                    <Icon className="h-3 w-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {tx.description ?? cfg.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
                  </div>
                  <p className={cn("text-sm font-semibold", cfg.color)}>
                    {tx.type === "expense" ? "-" : "+"}
                    {formatCurrency(tx.amount, currency)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
