"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TransactionOut, CategoryOut } from "@/types/api";
import { formatCurrency } from "@/lib/format";
import { useAuthStore } from "@/store/auth";

interface Props {
  transactions: TransactionOut[];
  categories: CategoryOut[];
  isLoading: boolean;
}

const FALLBACK_COLORS = ["#16a34a", "#2563eb", "#dc2626", "#9333ea", "#ea580c", "#0891b2", "#ca8a04", "#db2777"];

function buildData(transactions: TransactionOut[], categories: CategoryOut[]) {
  const byCategory: Record<string, number> = {};
  for (const tx of transactions) {
    if (tx.type !== "expense" || !tx.category_id) continue;
    byCategory[tx.category_id] = (byCategory[tx.category_id] ?? 0) + tx.amount;
  }
  return Object.entries(byCategory)
    .map(([categoryId, value], i) => {
      const category = categories.find((c) => c.id === categoryId);
      return {
        name: category?.name ?? "Sin categoría",
        value,
        color: category?.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
      };
    })
    .sort((a, b) => b.value - a.value);
}

export function CategoryBreakdownChart({ transactions, categories, isLoading }: Props) {
  const currency = useAuthStore((s) => s.user?.currency ?? "MXN");
  const data = buildData(transactions, categories);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">Gastos por categoría</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-52 bg-muted animate-pulse rounded" />
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">Sin gastos en este periodo</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatCurrency(Number(value), currency)}
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
