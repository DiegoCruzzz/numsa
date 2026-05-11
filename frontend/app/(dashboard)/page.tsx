"use client";

import { useDashboard } from "@/lib/hooks/useDashboard";
import { TotalBalanceCard } from "@/components/dashboard/TotalBalanceCard";
import { DebtProgressCard } from "@/components/dashboard/DebtProgressCard";
import { MonthlyOverviewChart } from "@/components/dashboard/MonthlyOverviewChart";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { BudgetStatusList } from "@/components/dashboard/BudgetStatusList";

export default function DashboardPage() {
  const { accounts, recentTransactions, debtSummary, budgetStatus } = useDashboard();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Resumen</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <TotalBalanceCard
          accounts={accounts.data ?? []}
          isLoading={accounts.isLoading}
        />
        <DebtProgressCard
          summary={debtSummary.data}
          isLoading={debtSummary.isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MonthlyOverviewChart
          transactions={recentTransactions.data ?? []}
          isLoading={recentTransactions.isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecentTransactions
          transactions={recentTransactions.data ?? []}
          isLoading={recentTransactions.isLoading}
        />
        <BudgetStatusList
          budgets={budgetStatus.data ?? []}
          isLoading={budgetStatus.isLoading}
        />
      </div>
    </div>
  );
}
