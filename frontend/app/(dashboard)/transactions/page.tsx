"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { useTransactions, useDeleteTransaction } from "@/lib/hooks/useTransactions";
import { useCategories } from "@/lib/hooks/useCategories";
import { useAccounts } from "@/lib/hooks/useAccounts";
import { useToast } from "@/lib/hooks/useToast";
import { getErrorMessage } from "@/lib/errors";
import { formatCurrency, formatDate } from "@/lib/format";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";
import type { TransactionOut, TransactionFilters } from "@/types/api";

const PAGE_SIZE = 50;

export default function TransactionsPage() {
  return (
    <Suspense>
      <TransactionsPageInner />
    </Suspense>
  );
}

function TransactionsPageInner() {
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TransactionOut | null>(null);
  const [filters, setFilters] = useState<TransactionFilters>({
    account_id: searchParams.get("account_id") ?? undefined,
  });
  const [searchInput, setSearchInput] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const currency = useAuthStore((s) => s.user?.currency ?? "MXN");
  const { toast } = useToast();

  useEffect(() => {
    const handle = setTimeout(() => {
      setFilters((f) => ({ ...f, search: searchInput || undefined }));
      setLimit(PAGE_SIZE);
    }, 300);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const { data: transactions = [], isLoading } = useTransactions({ ...filters, limit });
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();
  const deleteMutation = useDeleteTransaction();

  const categoryById = Object.fromEntries(categories.map((c) => [c.id, c]));
  const accountById = Object.fromEntries(accounts.map((a) => [a.id, a]));

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta transacción?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: "Transacción eliminada" });
    } catch (err) {
      toast({ variant: "destructive", title: "Error al eliminar", description: getErrorMessage(err, "Intenta de nuevo.") });
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
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="w-52 pl-8"
            placeholder="Buscar descripción…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
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
              <SelectItem key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ""}{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.account_id ?? "all"}
          onValueChange={(v) => setFilters((f) => ({ ...f, account_id: v === "all" ? undefined : v }))}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Cuenta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las cuentas</SelectItem>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
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
                .map((tx) => {
                  const category = tx.category_id ? categoryById[tx.category_id] : null;
                  const account = accountById[tx.account_id];
                  return (
                    <div key={tx.id} className="flex items-center gap-4 px-6 py-3 hover:bg-muted/30 transition-colors">
                      <div
                        className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-sm"
                        style={{ backgroundColor: (category?.color ?? "#95A5A6") + "33" }}
                      >
                        {category?.icon ?? "💸"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {tx.description ?? category?.name ?? typeLabel[tx.type]}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(tx.date)}{account ? ` · ${account.name}` : ""}
                        </p>
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
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {!isLoading && transactions.length >= limit && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setLimit((l) => l + PAGE_SIZE)}>
            Cargar más
          </Button>
        </div>
      )}

      <TransactionForm open={open} onClose={() => setOpen(false)} editing={editing} />
    </div>
  );
}
