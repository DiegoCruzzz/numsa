"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Banknote, CreditCard, Wallet, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountForm } from "@/components/accounts/AccountForm";
import { useAccounts, useDeleteAccount } from "@/lib/hooks/useAccounts";
import { useToast } from "@/lib/hooks/useToast";
import { getErrorMessage } from "@/lib/errors";
import { formatCurrency } from "@/lib/format";
import type { AccountOut } from "@/types/api";

const typeIcon = {
  cash: Banknote,
  debit: CreditCard,
  credit: CreditCard,
  savings: PiggyBank,
};
const typeLabel = { cash: "Efectivo", debit: "Débito", credit: "Crédito", savings: "Ahorro" };

export default function AccountsPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AccountOut | null>(null);
  const { data: accounts = [], isLoading } = useAccounts();
  const deleteMutation = useDeleteAccount();
  const { toast } = useToast();

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta cuenta?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: "Cuenta eliminada" });
    } catch (err) {
      toast({ variant: "destructive", title: "Error al eliminar", description: getErrorMessage(err, "Intenta de nuevo.") });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cuentas</h1>
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Nueva cuenta
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-36 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-16">
          <Wallet className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Sin cuentas aún</p>
          <Button onClick={() => { setEditing(null); setOpen(true); }} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" /> Crear primera cuenta
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => {
            const Icon = typeIcon[account.type as keyof typeof typeIcon] ?? Wallet;
            return (
              <Card key={account.id} className="relative group">
                <CardHeader className="pb-2 flex flex-row items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-md bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{account.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {typeLabel[account.type as keyof typeof typeLabel]}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(account); setOpen(true); }}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(account.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {formatCurrency(account.balance, account.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{account.currency}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AccountForm open={open} onClose={() => setOpen(false)} editing={editing} />
    </div>
  );
}
