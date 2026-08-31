"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Banknote, CreditCard, Wallet, PiggyBank, ArrowLeftRight, Archive, ArchiveRestore, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountForm } from "@/components/accounts/AccountForm";
import { useAccounts, useDeleteAccount, useUpdateAccount, useApplyInterest } from "@/lib/hooks/useAccounts";
import { useToast } from "@/lib/hooks/useToast";
import { getErrorMessage } from "@/lib/errors";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AccountOut } from "@/types/api";

const typeIcon = {
  cash: Banknote,
  debit: CreditCard,
  savings: PiggyBank,
};
const typeLabel = { cash: "Efectivo", debit: "Débito", savings: "Ahorro" };

export default function AccountsPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AccountOut | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const { data: accounts = [], isLoading } = useAccounts();
  const deleteMutation = useDeleteAccount();
  const updateMutation = useUpdateAccount();
  const applyInterestMutation = useApplyInterest();
  const { toast } = useToast();

  const visibleAccounts = accounts.filter((a) => (showArchived ? true : a.is_active));
  const archivedCount = accounts.filter((a) => !a.is_active).length;

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta cuenta?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: "Cuenta eliminada" });
    } catch (err) {
      toast({ variant: "destructive", title: "Error al eliminar", description: getErrorMessage(err, "Intenta de nuevo.") });
    }
  }

  async function handleToggleActive(account: AccountOut) {
    try {
      await updateMutation.mutateAsync({ id: account.id, is_active: !account.is_active });
      toast({ title: account.is_active ? "Cuenta archivada" : "Cuenta reactivada" });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: getErrorMessage(err, "Intenta de nuevo.") });
    }
  }

  async function handleApplyInterest(account: AccountOut) {
    if (!confirm(`¿Aplicar el interés de este mes a "${account.name}"?`)) return;
    try {
      const res = await applyInterestMutation.mutateAsync(account.id);
      toast({ title: `Se aplicó ${formatCurrency(res.interest_amount, account.currency)} de interés` });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: getErrorMessage(err, "No se pudo aplicar el interés.") });
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

      {archivedCount > 0 && (
        <button
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          onClick={() => setShowArchived((s) => !s)}
        >
          {showArchived ? "Ocultar archivadas" : `Mostrar archivadas (${archivedCount})`}
        </button>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-36 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : visibleAccounts.length === 0 ? (
        <div className="text-center py-16">
          <Wallet className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Sin cuentas aún</p>
          <Button onClick={() => { setEditing(null); setOpen(true); }} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" /> Crear primera cuenta
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleAccounts.map((account) => {
            const Icon = typeIcon[account.type as keyof typeof typeIcon] ?? Wallet;
            return (
              <Card key={account.id} className={cn("group relative", !account.is_active && "opacity-60")}>
                <CardHeader className="pb-2 flex flex-row items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-md bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{account.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {typeLabel[account.type as keyof typeof typeLabel]}
                        {!account.is_active && " · Archivada"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {account.type === "savings" && account.interest_rate ? (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        title="Aplicar interés"
                        onClick={() => handleApplyInterest(account)}
                      >
                        <Sparkles className="h-3 w-3" />
                      </Button>
                    ) : null}
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(account); setOpen(true); }}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      title={account.is_active ? "Archivar" : "Reactivar"}
                      onClick={() => handleToggleActive(account)}
                    >
                      {account.is_active ? <Archive className="h-3 w-3" /> : <ArchiveRestore className="h-3 w-3" />}
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(account.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-2xl font-bold">
                      {formatCurrency(account.balance, account.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {account.currency}
                      {account.type === "savings" && account.interest_rate ? ` · ${account.interest_rate}% anual` : ""}
                    </p>
                  </div>
                  <Link
                    href={`/transactions?account_id=${account.id}`}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ArrowLeftRight className="h-3 w-3" /> Ver transacciones
                  </Link>
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

