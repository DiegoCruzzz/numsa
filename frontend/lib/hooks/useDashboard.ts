import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { AccountOut, TransactionOut, DebtSummary, BudgetStatus } from "@/types/api";
import { format, startOfMonth, endOfMonth } from "date-fns";

export function useDashboard() {
  const now = new Date();
  const dateFrom = format(startOfMonth(now), "yyyy-MM-dd");
  const dateTo = format(endOfMonth(now), "yyyy-MM-dd");

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

  return { accounts, recentTransactions, debtSummary, budgetStatus, dateFrom, dateTo };
}
