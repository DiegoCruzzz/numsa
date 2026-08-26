"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCreateTransaction, useUpdateTransaction } from "@/lib/hooks/useTransactions";
import { useAccounts } from "@/lib/hooks/useAccounts";
import { useCategories } from "@/lib/hooks/useCategories";
import { useToast } from "@/lib/hooks/useToast";
import { getErrorMessage } from "@/lib/errors";
import type { TransactionOut } from "@/types/api";
import { format } from "date-fns";

const schema = z.object({
  account_id: z.string().min(1, "Cuenta requerida"),
  category_id: z.string().optional(),
  amount: z.coerce.number().positive("Debe ser mayor a 0"),
  type: z.enum(["income", "expense", "transfer"]),
  description: z.string().optional(),
  date: z.string().min(1, "Fecha requerida"),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: TransactionOut | null;
}

export function TransactionForm({ open, onClose, editing }: Props) {
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
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
      ? {
          account_id: editing.account_id,
          category_id: editing.category_id ?? undefined,
          amount: editing.amount,
          type: editing.type,
          description: editing.description ?? undefined,
          date: editing.date,
        }
      : { date: format(new Date(), "yyyy-MM-dd"), type: "expense" },
  });

  async function onSubmit(values: FormValues) {
    try {
      const payload = {
        ...values,
        category_id: values.category_id || null,
      };
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, ...payload });
        toast({ title: "Transacción actualizada" });
      } else {
        await createMutation.mutateAsync(payload);
        toast({ title: "Transacción creada" });
      }
      reset();
      onClose();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: getErrorMessage(err, "No se pudo guardar la transacción.") });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editar transacción" : "Nueva transacción"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                defaultValue={editing?.type ?? "expense"}
                onValueChange={(v) => setValue("type", v as FormValues["type"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Ingreso</SelectItem>
                  <SelectItem value="expense">Gasto</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Monto</Label>
              <Input type="number" step="0.01" {...register("amount")} />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cuenta</Label>
            <Select
              defaultValue={editing?.account_id}
              onValueChange={(v) => setValue("account_id", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona cuenta" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.account_id && <p className="text-xs text-destructive">{errors.account_id.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Categoría (opcional)</Label>
            <Select
              defaultValue={editing?.category_id ?? undefined}
              onValueChange={(v) => setValue("category_id", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input type="date" {...register("date")} />
              {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input placeholder="Opcional" {...register("description")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
