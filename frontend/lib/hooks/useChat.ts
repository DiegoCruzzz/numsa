import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ChatMessageOut, ChatResponse } from "@/types/api";

export function useChatHistory() {
  return useQuery<ChatMessageOut[]>({
    queryKey: ["chat-history"],
    queryFn: async () => {
      const { data } = await api.get<ChatMessageOut[]>("/chat/history");
      return data;
    },
  });
}

export function useSendChatMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => api.post<ChatResponse>("/chat", { message }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat-history"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}
