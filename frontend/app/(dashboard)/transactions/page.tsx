"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { useTransactions, useDeleteTransaction } from "@/lib/hooks/useTransactions";
import { useCategories } from "@/lib/hooks/useCategories";
import { useToast } from "@/lib/hooks/useToast";
import { formatCurrency, formatDate } from "@/lib/format";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";
import type { TransactionOut, TransactionFilters } from "@/types/api";

export default function TransactionsPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TransactionOut | null>(null);
  const [filters, setFilters] = useState<TransactionFilters>({});
  const currency = useAuthStore((s) => s.user?.currency ?? "MXN");
  const { toast } = useToast();

  const { data: transactions = [], isLoading } = useTransactions(filters);
  const { data: categories = [] } = useCategories();
  const deleteMutation = useDeleteTransaction();

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta transacción?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: "Transacción eliminada" });
    } catch {
      toast({ variant: "destructive", title: "Error al eliminar" });
    }
  }

  const typeLabel: Record<string, string> = { income: "Ingreso", expense: "Gasto", transfer: "Transferencia" };
  const typeColor: Record<string, string> = {
    income: "text-emerald-500",
    expense: "text-destructive",
    transfer: "text-blue-500",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transacciones</h1>
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Nueva
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          type="date"
          className="w-40"
          placeholder="Desde"
          onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value || undefined }))}
        />
        <Input
          type="date"
          className="w-40"
          placeholder="Hasta"
          onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value || undefined }))}
        />
        <Select onValueChange={(v) => setFilters((f) => ({ ...f, type: v === "all" ? undefined : (v as TransactionFilters["type"]) }))}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="income">Ingresos</SelectItem>
            <SelectItem value="expense">Gastos</SelectItem>
            <SelectItem value="transfer">Transferencias</SelectItem>
          </SelectContent>
        </Select>
        <Select onValueChange={(v) => setFilters((f) => ({ ...f, category_id: v === "all" ? undefined : v }))}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground mb-4">Sin transacciones</p>
              <Button onClick={() => { setEditing(null); setOpen(true); }} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" /> Agregar primera transacción
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {[...transactions]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((tx) => (
                <div key={tx.id} className="flex items-center gap-4 px-6 py-3 hover:bg-muted/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {tx.description ?? typeLabel[tx.type]}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
                  </div>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full bg-muted", typeColor[tx.type])}>
                    {typeLabel[tx.type]}
                  </span>
                  <p className={cn("text-sm font-semibold w-28 text-right", typeColor[tx.type])}>
                    {tx.type === "expense" ? "-" : "+"}{formatCurrency(tx.amount, currency)}
                  </p>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(tx); setOpen(true); }}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(tx.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TransactionForm open={open} onClose={() => setOpen(false)} editing={editing} />
    </div>
  );
}
