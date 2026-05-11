import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { BudgetOut, BudgetCreate, BudgetUpdate, BudgetStatus } from "@/types/api";

export function useBudgets() {
  const budgets = useQuery<BudgetOut[]>({
    queryKey: ["budgets"],
    queryFn: async () => {
      const { data } = await api.get<BudgetOut[]>("/budgets");
      return data;
    },
  });
  const status = useQuery<BudgetStatus[]>({
    queryKey: ["budgets", "status"],
    queryFn: async () => {
      const { data } = await api.get<BudgetStatus[]>("/budgets/status");
      return data;
    },
  });
  return { budgets, status };
}

export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: BudgetCreate) =>
      api.post<BudgetOut>("/budgets", payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
  });
}

export function useUpdateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: BudgetUpdate & { id: string }) =>
      api.patch<BudgetOut>(`/budgets/${id}`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/budgets/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
  });
}
