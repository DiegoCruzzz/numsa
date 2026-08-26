import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { AccountOut, TransactionOut, DebtSummary, BudgetStatus } from "@/types/api";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths } from "date-fns";

export type DashboardRange = "week" | "month" | "3months";

export const RANGE_LABELS: Record<DashboardRange, string> = {
  week: "Esta semana",
  month: "Este mes",
  "3months": "Últimos 3 meses",
};

function computeRange(range: DashboardRange, now: Date): { from: Date; to: Date } {
  switch (range) {
    case "week":
      return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) };
    case "3months":
      return { from: startOfMonth(subMonths(now, 2)), to: endOfMonth(now) };
    default:
      return { from: startOfMonth(now), to: endOfMonth(now) };
  }
}

export function useDashboard(range: DashboardRange = "month") {
  const now = new Date();
  const { from, to } = computeRange(range, now);
  const dateFrom = format(from, "yyyy-MM-dd");
  const dateTo = format(to, "yyyy-MM-dd");

  const accounts = useQuery<AccountOut[]>({
    queryKey: ["accounts"],
    queryFn: () => api.get<AccountOut[]>("/accounts").then((r) => r.data),
  });

  const recentTransactions = useQuery<TransactionOut[]>({
    queryKey: ["transactions", { date_from: dateFrom, date_to: dateTo }],
    queryFn: () =>
      api
        .get<TransactionOut[]>("/transactions", { params: { date_from: dateFrom, date_to: dateTo } })
        .then((r) => r.data),
  });

  const debtSummary = useQuery<DebtSummary>({
    queryKey: ["debts", "summary"],
    queryFn: () => api.get<DebtSummary>("/debts/summary").then((r) => r.data),
  });

  const budgetStatus = useQuery<BudgetStatus[]>({
    queryKey: ["budgets", "status"],
    queryFn: () => api.get<BudgetStatus[]>("/budgets/status").then((r) => r.data),
  });

  const trendFrom = format(startOfMonth(subMonths(now, 5)), "yyyy-MM-dd");
  const trendTo = format(endOfMonth(now), "yyyy-MM-dd");
  const monthlyTrend = useQuery<TransactionOut[]>({
    queryKey: ["transactions", { date_from: trendFrom, date_to: trendTo, trend: true }],
    queryFn: () =>
      api
        .get<TransactionOut[]>("/transactions", { params: { date_from: trendFrom, date_to: trendTo } })
        .then((r) => r.data),
  });

  return { accounts, recentTransactions, debtSummary, budgetStatus, monthlyTrend, dateFrom, dateTo };
}
