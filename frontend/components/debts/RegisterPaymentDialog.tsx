"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useUpdateDebt } from "@/lib/hooks/useDebts";
import { useToast } from "@/lib/hooks/useToast";
import { getErrorMessage } from "@/lib/errors";
import { formatCurrency } from "@/lib/format";
import type { DebtOut } from "@/types/api";

interface Props {
  debt: DebtOut | null;
  currency: string;
  onClose: () => void;
}

export function RegisterPaymentDialog({ debt, currency, onClose }: Props) {
  const [amount, setAmount] = useState("");
  const updateMutation = useUpdateDebt();
  const { toast } = useToast();

  async function handleSubmit() {
    if (!debt) return;
    const payment = Number(amount);
    if (!payment || payment <= 0) {
      toast({ variant: "destructive", title: "Ingresa un monto válido" });
      return;
    }
    try {
      const newRemaining = Math.max(debt.remaining_amount - payment, 0);
      await updateMutation.mutateAsync({
        id: debt.id,
        remaining_amount: newRemaining,
        ...(newRemaining <= 0 ? { status: "paid" as const } : {}),
      });
      toast({ title: "Pago registrado" });
      setAmount("");
      onClose();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: getErrorMessage(err, "No se pudo registrar el pago.") });
    }
  }

  return (
    <Dialog open={!!debt} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar pago — {debt?.creditor}</DialogTitle>
        </DialogHeader>
        {debt && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Saldo actual: {formatCurrency(debt.remaining_amount, currency)}
            </p>
            <div className="space-y-2">
              <Label>Monto del pago</Label>
              <Input
                type="number"
                step="0.01"
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={String(debt.monthly_payment)}
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Guardando..." : "Registrar pago"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
