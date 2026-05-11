import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { CategoryOut, CategoryCreate } from "@/types/api";

export function useCategories() {
  return useQuery<CategoryOut[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await api.get<CategoryOut[]>("/categories");
      return data;
    },
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CategoryCreate) =>
      api.post<CategoryOut>("/categories", payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}
