import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { DebtOut, DebtCreate, DebtUpdate, DebtSummary } from "@/types/api";

export function useDebts() {
  const debts = useQuery<DebtOut[]>({
    queryKey: ["debts"],
    queryFn: async () => {
      const { data } = await api.get<DebtOut[]>("/debts");
      return data;
    },
  });
  const summary = useQuery<DebtSummary>({
    queryKey: ["debts", "summary"],
    queryFn: async () => {
      const { data } = await api.get<DebtSummary>("/debts/summary");
      return data;
    },
  });
  return { debts, summary };
}

export function useCreateDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: DebtCreate) =>
      api.post<DebtOut>("/debts", payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["debts"] }),
  });
}

export function useUpdateDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: DebtUpdate & { id: string }) =>
      api.patch<DebtOut>(`/debts/${id}`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["debts"] }),
  });
}

export function useDeleteDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/debts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["debts"] }),
  });
}
