"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useCreateAccount, useUpdateAccount } from "@/lib/hooks/useAccounts";
import { useToast } from "@/lib/hooks/useToast";
import type { AccountOut } from "@/types/api";

const schema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  type: z.enum(["cash", "debit", "credit", "savings"]),
  balance: z.coerce.number(),
  currency: z.string().default("MXN"),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: AccountOut | null;
}

export function AccountForm({ open, onClose, editing }: Props) {
  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: editing
      ? { name: editing.name, type: editing.type, balance: editing.balance, currency: editing.currency }
      : { type: "debit", balance: 0, currency: "MXN" },
  });

  async function onSubmit(values: FormValues) {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, ...values });
        toast({ title: "Cuenta actualizada" });
      } else {
        await createMutation.mutateAsync(values);
        toast({ title: "Cuenta creada" });
      }
      reset();
      onClose();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo guardar la cuenta." });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editar cuenta" : "Nueva cuenta"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input placeholder="Ej: Cuenta nómina" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                defaultValue={editing?.type ?? "debit"}
                onValueChange={(v) => setValue("type", v as FormValues["type"])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="debit">Débito</SelectItem>
                  <SelectItem value="credit">Crédito</SelectItem>
                  <SelectItem value="savings">Ahorro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Balance inicial</Label>
              <Input type="number" step="0.01" {...register("balance")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Moneda</Label>
            <Select
              defaultValue={editing?.currency ?? "MXN"}
              onValueChange={(v) => setValue("currency", v)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MXN">MXN</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
