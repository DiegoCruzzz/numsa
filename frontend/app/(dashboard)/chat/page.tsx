"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Bot, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useChatHistory, useSendChatMessage } from "@/lib/hooks/useChat";
import { useToast } from "@/lib/hooks/useToast";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

export default function ChatPage() {
  const [input, setInput] = useState("");
  const { data: history = [], isLoading } = useChatHistory();
  const sendMessage = useSendChatMessage();
  const { toast } = useToast();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, sendMessage.isPending]);

  async function handleSend() {
    const message = input.trim();
    if (!message || sendMessage.isPending) return;
    setInput("");
    try {
      await sendMessage.mutateAsync(message);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error al enviar el mensaje",
        description: getErrorMessage(err, "Intenta de nuevo en un momento."),
      });
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
      <h1 className="text-2xl font-bold">Chat</h1>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center text-muted-foreground">
              <p>
                Cuéntame un gasto o ingreso, o pregúntame sobre tus finanzas.
                <br />
                Ej: &ldquo;gasté 250 en el súper&rdquo; o &ldquo;¿cuánto gasté esta semana?&rdquo;
              </p>
            </div>
          ) : (
            history.map((m) => (
              <div key={m.id} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
                <div
                  className={cn(
                    "h-7 w-7 shrink-0 rounded-full flex items-center justify-center",
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}
                >
                  {m.role === "user" ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div
                  className={cn(
                    "max-w-[75%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap",
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))
          )}
          {sendMessage.isPending && (
            <div className="flex gap-3">
              <div className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center bg-muted">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-lg px-4 py-2 text-sm bg-muted text-muted-foreground">Escribiendo…</div>
            </div>
          )}
          <div ref={bottomRef} />
        </CardContent>

        <div className="border-t p-3 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Escribe un mensaje…"
            disabled={sendMessage.isPending}
          />
          <Button onClick={handleSend} disabled={sendMessage.isPending || !input.trim()} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
