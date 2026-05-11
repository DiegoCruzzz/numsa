import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { AccountOut, AccountCreate, AccountUpdate } from "@/types/api";

export function useAccounts() {
  return useQuery<AccountOut[]>({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data } = await api.get<AccountOut[]>("/accounts");
      return data;
    },
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AccountCreate) =>
      api.post<AccountOut>("/accounts", payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: AccountUpdate & { id: string }) =>
      api.patch<AccountOut>(`/accounts/${id}`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/accounts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  });
}
