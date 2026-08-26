"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BudgetForm } from "@/components/budgets/BudgetForm";
import { useBudgets, useDeleteBudget } from "@/lib/hooks/useBudgets";
import { useToast } from "@/lib/hooks/useToast";
import { getErrorMessage } from "@/lib/errors";
import { formatCurrency } from "@/lib/format";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";
import type { BudgetOut } from "@/types/api";

export default function BudgetsPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetOut | null>(null);
  const { budgets, status } = useBudgets();
  const deleteMutation = useDeleteBudget();
  const { toast } = useToast();
  const currency = useAuthStore((s) => s.user?.currency ?? "MXN");

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este presupuesto?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: "Presupuesto eliminado" });
    } catch (err) {
      toast({ variant: "destructive", title: "Error al eliminar", description: getErrorMessage(err, "Intenta de nuevo.") });
    }
  }

  function getBudgetById(id: string) {
    return (budgets.data ?? []).find((b) => b.id === id) ?? null;
  }

  const isLoading = status.isLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Presupuestos</h1>
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo presupuesto
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-44 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (status.data ?? []).length === 0 ? (
        <div className="text-center py-16">
          <PieChart className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Sin presupuestos configurados</p>
          <Button onClick={() => { setEditing(null); setOpen(true); }} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" /> Crear presupuesto
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(status.data ?? []).map((b) => (
            <Card key={b.id} className="group">
              <CardHeader className="pb-2 flex flex-row items-start justify-between">
                <CardTitle className="text-base">{b.category_name}</CardTitle>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => { setEditing(getBudgetById(b.id)); setOpen(true); }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive"
                    onClick={() => handleDelete(b.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gastado</span>
                  <span
                    className={cn(
                      "font-semibold",
                      b.used_pct >= 100 ? "text-destructive" : b.used_pct >= 80 ? "text-amber-500" : ""
                    )}
                  >
                    {formatCurrency(b.spent_amount, currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Límite</span>
                  <span className="font-semibold">{formatCurrency(b.limit_amount, currency)}</span>
                </div>
                <div className="space-y-1">
                  <Progress
                    value={Math.min(b.used_pct, 100)}
                    className={cn(
                      "h-2",
                      b.used_pct >= 100
                        ? "[&>div]:bg-destructive"
                        : b.used_pct >= 80
                        ? "[&>div]:bg-amber-500"
                        : ""
                    )}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{b.used_pct.toFixed(1)}% usado</span>
                    <span>Restante: {formatCurrency(b.remaining, currency)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <BudgetForm open={open} onClose={() => setOpen(false)} editing={editing} />
    </div>
  );
}
