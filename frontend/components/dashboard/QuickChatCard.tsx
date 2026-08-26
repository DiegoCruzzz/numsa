"use client";

import { useState } from "react";
import Link from "next/link";
import { Send, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSendChatMessage } from "@/lib/hooks/useChat";
import { useToast } from "@/lib/hooks/useToast";
import { getErrorMessage } from "@/lib/errors";

export function QuickChatCard() {
  const [input, setInput] = useState("");
  const [lastReply, setLastReply] = useState<string | null>(null);
  const sendMessage = useSendChatMessage();
  const { toast } = useToast();

  async function handleSend() {
    const message = input.trim();
    if (!message || sendMessage.isPending) return;
    setInput("");
    setLastReply(null);
    try {
      const res = await sendMessage.mutateAsync({ message });
      setLastReply(res.reply);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error al enviar",
        description: getErrorMessage(err, "Intenta de nuevo en un momento."),
      });
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Registra rápido</CardTitle>
        <Link href="/chat" className="text-xs text-primary hover:underline flex items-center gap-1">
          Ver chat completo <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ej: gasté 150 en comida"
            disabled={sendMessage.isPending}
          />
          <Button onClick={handleSend} disabled={sendMessage.isPending || !input.trim()} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {sendMessage.isPending && <p className="text-xs text-muted-foreground">Procesando…</p>}
        {lastReply && <p className="text-xs text-muted-foreground border-t pt-2">{lastReply}</p>}
      </CardContent>
    </Card>
  );
}
