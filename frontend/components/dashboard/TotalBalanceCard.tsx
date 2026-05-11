"use client";

import { Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { AccountOut } from "@/types/api";
import { useAuthStore } from "@/store/auth";

interface Props {
  accounts: AccountOut[];
  isLoading: boolean;
}

export function TotalBalanceCard({ accounts, isLoading }: Props) {
  const currency = useAuthStore((s) => s.user?.currency ?? "MXN");
  const total = accounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Balance total</CardTitle>
        <Wallet className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        ) : (
          <p className="text-3xl font-bold">{formatCurrency(total, currency)}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {accounts.length} {accounts.length === 1 ? "cuenta" : "cuentas"} activas
        </p>
      </CardContent>
    </Card>
  );
}
