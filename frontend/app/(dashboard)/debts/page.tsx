"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DebtForm } from "@/components/debts/DebtForm";
import { useDebts, useDeleteDebt } from "@/lib/hooks/useDebts";
import { useToast } from "@/lib/hooks/useToast";
import { getErrorMessage } from "@/lib/errors";
import { formatCurrency, formatDate } from "@/lib/format";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";
import type { DebtOut } from "@/types/api";

const statusLabel: Record<string, string> = {
  active: "Activa",
  paid: "Pagada",
  negotiating: "Negociando",
};
const statusColor: Record<string, string> = {
  active: "text-destructive",
  paid: "text-emerald-500",
  negotiating: "text-amber-500",
};

export default function DebtsPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DebtOut | null>(null);
  const { debts, summary } = useDebts();
  const deleteMutation = useDeleteDebt();
  const { toast } = useToast();
  const currency = useAuthStore((s) => s.user?.currency ?? "MXN");

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta deuda?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: "Deuda eliminada" });
    } catch (err) {
      toast({ variant: "destructive", title: "Error al eliminar", description: getErrorMessage(err, "Intenta de nuevo.") });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Deudas</h1>
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Nueva deuda
        </Button>
      </div>

      {summary.data && summary.data.active_debts > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-muted-foreground">Deuda total activa</p>
                <p className="text-2xl font-bold text-destructive">
                  {formatCurrency(summary.data.total_debt, currency)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Pagado</p>
                <p className="text-xl font-semibold text-emerald-500">
                  {formatCurrency(summary.data.total_paid, currency)}
                </p>
              </div>
            </div>
            <Progress value={summary.data.global_progress_pct} className="h-3" />
            <p className="text-xs text-muted-foreground mt-2">
              {summary.data.global_progress_pct.toFixed(1)}% del total pagado
            </p>
          </CardContent>
        </Card>
      )}

      {debts.isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-36 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (debts.data ?? []).length === 0 ? (
        <div className="text-center py-16">
          <TrendingDown className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Sin deudas registradas</p>
          <Button onClick={() => { setEditing(null); setOpen(true); }} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" /> Agregar deuda
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(debts.data ?? []).map((debt) => {
            const paid = debt.total_amount - debt.remaining_amount;
            const pct = debt.total_amount > 0 ? (paid / debt.total_amount) * 100 : 0;
            return (
              <Card key={debt.id} className="group">
                <CardHeader className="pb-2 flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{debt.creditor}</CardTitle>
                    <p className={cn("text-xs font-medium", statusColor[debt.status])}>
                      {statusLabel[debt.status]}
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(debt); setOpen(true); }}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(debt.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-semibold">{formatCurrency(debt.total_amount, currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Restante</span>
                    <span className="font-semibold text-destructive">{formatCurrency(debt.remaining_amount, currency)}</span>
                  </div>
                  <div className="space-y-1">
                    <Progress value={pct} className="h-2" />
                    <p className="text-xs text-muted-foreground">{pct.toFixed(1)}% pagado</p>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Pago mensual: {formatCurrency(debt.monthly_payment, currency)}</span>
                    {debt.due_date && <span>Vence: {formatDate(debt.due_date)}</span>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <DebtForm open={open} onClose={() => setOpen(false)} editing={editing} />
    </div>
  );
}
