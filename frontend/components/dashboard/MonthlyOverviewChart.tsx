"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TransactionOut } from "@/types/api";
import { formatCurrency } from "@/lib/format";
import { useAuthStore } from "@/store/auth";

interface Props {
  transactions: TransactionOut[];
  isLoading: boolean;
}

function buildChartData(transactions: TransactionOut[]) {
  const byDay: Record<string, { ingresos: number; gastos: number }> = {};
  for (const tx of transactions) {
    if (!byDay[tx.date]) byDay[tx.date] = { ingresos: 0, gastos: 0 };
    if (tx.type === "income") byDay[tx.date].ingresos += tx.amount;
    if (tx.type === "expense") byDay[tx.date].gastos += tx.amount;
  }

  const totals = { ingresos: 0, gastos: 0 };
  for (const d of Object.values(byDay)) {
    totals.ingresos += d.ingresos;
    totals.gastos += d.gastos;
  }
  return [{ name: "Este mes", ...totals }];
}

export function MonthlyOverviewChart({ transactions, isLoading }: Props) {
  const currency = useAuthStore((s) => s.user?.currency ?? "MXN");
  const data = buildChartData(transactions);

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Resumen del mes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-40 bg-muted animate-pulse rounded" />
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => formatCurrency(v, currency).replace(/[^\d.,]/g, "")}
              />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value), currency)}
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
              />
              <Legend />
              <Bar dataKey="ingresos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gastos" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
