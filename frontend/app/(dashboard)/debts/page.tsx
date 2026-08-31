"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, TrendingDown, HandCoins, CreditCard, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DebtForm } from "@/components/debts/DebtForm";
import { RegisterPaymentDialog } from "@/components/debts/RegisterPaymentDialog";
import { useDebts, useDeleteDebt } from "@/lib/hooks/useDebts";
import { useToast } from "@/lib/hooks/useToast";
import { getErrorMessage } from "@/lib/errors";
import { formatCurrency, formatDate } from "@/lib/format";
import { nextOccurrenceOfDay } from "@/lib/dates";
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
const subtypeLabel: Record<string, string> = {
  credit_card: "Tarjeta de crédito",
  loan: "Préstamo",
  other: "Otro",
};
const subtypeIcon: Record<string, typeof CreditCard> = {
  credit_card: CreditCard,
  loan: Landmark,
  other: TrendingDown,
};

type SortOption = "due_date" | "status" | "remaining";

function effectiveDueDate(debt: DebtOut): Date | null {
  if (debt.subtype === "credit_card" && debt.payment_due_day) {
    return nextOccurrenceOfDay(debt.payment_due_day);
  }
  return debt.due_date ? new Date(`${debt.due_date}T00:00:00`) : null;
}

function sortDebts(debts: DebtOut[], sort: SortOption): DebtOut[] {
  const copy = [...debts];
  switch (sort) {
    case "due_date":
      return copy.sort((a, b) => {
        const dateA = effectiveDueDate(a);
        const dateB = effectiveDueDate(b);
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateA.getTime() - dateB.getTime();
      });
    case "status":
      return copy.sort((a, b) => a.status.localeCompare(b.status));
    case "remaining":
      return copy.sort((a, b) => b.remaining_amount - a.remaining_amount);
    default:
      return copy;
  }
}

export default function DebtsPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DebtOut | null>(null);
  const [paying, setPaying] = useState<DebtOut | null>(null);
  const [sort, setSort] = useState<SortOption>("due_date");
  const { debts, summary } = useDebts();
  const deleteMutation = useDeleteDebt();
  const { toast } = useToast();
  const currency = useAuthStore((s) => s.user?.currency ?? "MXN");

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este crédito?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: "Crédito eliminado" });
    } catch (err) {
      toast({ variant: "destructive", title: "Error al eliminar", description: getErrorMessage(err, "Intenta de nuevo.") });
    }
  }

  const sortedDebts = sortDebts(debts.data ?? [], sort);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Créditos</h1>
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo crédito
        </Button>
      </div>

      {summary.data && summary.data.active_debts > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-muted-foreground">Crédito total activo</p>
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

      {(debts.data ?? []).length > 0 && (
        <div className="flex justify-end">
          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="due_date">Por vencimiento</SelectItem>
              <SelectItem value="status">Por estatus</SelectItem>
              <SelectItem value="remaining">Por saldo restante</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {debts.isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-36 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : sortedDebts.length === 0 ? (
        <div className="text-center py-16">
          <TrendingDown className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Sin créditos registrados</p>
          <Button onClick={() => { setEditing(null); setOpen(true); }} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" /> Agregar crédito
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sortedDebts.map((debt) => {
            const paid = debt.total_amount - debt.remaining_amount;
            const pct = debt.total_amount > 0 ? (paid / debt.total_amount) * 100 : 0;
            const SubtypeIcon = subtypeIcon[debt.subtype] ?? TrendingDown;
            return (
              <Card key={debt.id} className="group">
                <CardHeader className="pb-2 flex flex-row items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-md bg-primary/10">
                      <SubtypeIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{debt.creditor}</CardTitle>
                      <p className="text-xs text-muted-foreground">{subtypeLabel[debt.subtype]}</p>
                      <p className={cn("text-xs font-medium", statusColor[debt.status])}>
                        {statusLabel[debt.status]}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {debt.status === "active" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        title="Registrar pago"
                        onClick={() => setPaying(debt)}
                      >
                        <HandCoins className="h-3 w-3" />
                      </Button>
                    )}
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
                    <span className="text-muted-foreground">
                      {debt.subtype === "credit_card" ? "Límite" : "Total"}
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(debt.subtype === "credit_card" ? debt.credit_limit ?? 0 : debt.total_amount, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {debt.subtype === "credit_card" ? "Debes" : "Restante"}
                    </span>
                    <span className="font-semibold text-destructive">{formatCurrency(debt.remaining_amount, currency)}</span>
                  </div>
                  <div className="space-y-1">
                    <Progress value={pct} className="h-2" />
                    <p className="text-xs text-muted-foreground">{pct.toFixed(1)}% pagado</p>
                  </div>
                  {debt.subtype === "credit_card" ? (
                    <div className="flex justify-between text-xs text-muted-foreground">
                      {debt.cutoff_day && <span>Corte: día {debt.cutoff_day}</span>}
                      {debt.payment_due_day && <span>Pago: día {debt.payment_due_day}</span>}
                    </div>
                  ) : (
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Pago mensual: {formatCurrency(debt.monthly_payment, currency)}</span>
                      {debt.due_date && <span>Vence: {formatDate(debt.due_date)}</span>}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <DebtForm open={open} onClose={() => setOpen(false)} editing={editing} />
      <RegisterPaymentDialog debt={paying} currency={currency} onClose={() => setPaying(null)} />
    </div>
  );
}
