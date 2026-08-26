"use client";

import { useState } from "react";
import { useDashboard, RANGE_LABELS, type DashboardRange } from "@/lib/hooks/useDashboard";
import { useCategories } from "@/lib/hooks/useCategories";
import { useDebts } from "@/lib/hooks/useDebts";
import { TotalBalanceCard } from "@/components/dashboard/TotalBalanceCard";
import { DebtProgressCard } from "@/components/dashboard/DebtProgressCard";
import { MonthlyOverviewChart } from "@/components/dashboard/MonthlyOverviewChart";
import { CategoryBreakdownChart } from "@/components/dashboard/CategoryBreakdownChart";
import { SpendingTrendChart } from "@/components/dashboard/SpendingTrendChart";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { BudgetStatusList } from "@/components/dashboard/BudgetStatusList";
import { BudgetAlertBanner } from "@/components/dashboard/BudgetAlertBanner";
import { UpcomingDebtsCard } from "@/components/dashboard/UpcomingDebtsCard";
import { QuickChatCard } from "@/components/dashboard/QuickChatCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function DashboardPage() {
  const [range, setRange] = useState<DashboardRange>("month");
  const { accounts, recentTransactions, debtSummary, budgetStatus, monthlyTrend } = useDashboard(range);
  const { data: categories = [] } = useCategories();
  const { debts } = useDebts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Resumen</h1>
        <Select value={range} onValueChange={(v) => setRange(v as DashboardRange)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(RANGE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <BudgetAlertBanner budgets={budgetStatus.data ?? []} />

      <QuickChatCard />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <TotalBalanceCard accounts={accounts.data ?? []} isLoading={accounts.isLoading} />
        <DebtProgressCard summary={debtSummary.data} isLoading={debtSummary.isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MonthlyOverviewChart
          transactions={recentTransactions.data ?? []}
          isLoading={recentTransactions.isLoading}
          label={RANGE_LABELS[range]}
        />
        <CategoryBreakdownChart
          transactions={recentTransactions.data ?? []}
          categories={categories}
          isLoading={recentTransactions.isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SpendingTrendChart transactions={monthlyTrend.data ?? []} isLoading={monthlyTrend.isLoading} />
        <UpcomingDebtsCard debts={debts.data ?? []} isLoading={debts.isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecentTransactions transactions={recentTransactions.data ?? []} isLoading={recentTransactions.isLoading} />
        <BudgetStatusList budgets={budgetStatus.data ?? []} isLoading={budgetStatus.isLoading} />
      </div>
    </div>
  );
}
