import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { TransactionOut, TransactionCreate, TransactionUpdate, TransactionFilters } from "@/types/api";

export function useTransactions(filters?: TransactionFilters) {
  return useQuery<TransactionOut[]>({
    queryKey: ["transactions", filters],
    queryFn: async () => {
      const { data } = await api.get<TransactionOut[]>("/transactions", { params: filters });
      return data;
    },
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TransactionCreate) =>
      api.post<TransactionOut>("/transactions", payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: TransactionUpdate & { id: string }) =>
      api.patch<TransactionOut>(`/transactions/${id}`, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/transactions/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}
