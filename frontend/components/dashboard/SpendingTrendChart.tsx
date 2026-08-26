"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { subMonths, format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TransactionOut } from "@/types/api";
import { formatCurrency } from "@/lib/format";
import { useAuthStore } from "@/store/auth";

interface Props {
  transactions: TransactionOut[];
  isLoading: boolean;
}

function buildTrendData(transactions: TransactionOut[]) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(now, 5 - i);
    return { key: format(d, "yyyy-MM"), name: format(d, "MMM", { locale: es }) };
  });
  const byMonth: Record<string, { ingresos: number; gastos: number }> = {};
  for (const m of months) byMonth[m.key] = { ingresos: 0, gastos: 0 };
  for (const tx of transactions) {
    const key = tx.date.slice(0, 7);
    if (!byMonth[key]) continue;
    if (tx.type === "income") byMonth[key].ingresos += tx.amount;
    if (tx.type === "expense") byMonth[key].gastos += tx.amount;
  }
  return months.map((m) => ({ name: m.name, ...byMonth[m.key] }));
}

export function SpendingTrendChart({ transactions, isLoading }: Props) {
  const currency = useAuthStore((s) => s.user?.currency ?? "MXN");
  const data = buildTrendData(transactions);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">Tendencia (6 meses)</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-52 bg-muted animate-pulse rounded" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
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
              <Bar dataKey="ingresos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="gastos" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
