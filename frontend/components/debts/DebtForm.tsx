"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useCreateDebt, useUpdateDebt } from "@/lib/hooks/useDebts";
import { useToast } from "@/lib/hooks/useToast";
import { getErrorMessage } from "@/lib/errors";
import type { DebtOut } from "@/types/api";

const schema = z.object({
  creditor: z.string().min(1, "Acreedor requerido"),
  total_amount: z.coerce.number().positive("Debe ser mayor a 0"),
  remaining_amount: z.coerce.number().min(0),
  monthly_payment: z.coerce.number().min(0),
  interest_rate: z.coerce.number().min(0).default(0),
  due_date: z.string().optional(),
  status: z.enum(["active", "paid", "negotiating"]).default("active"),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: DebtOut | null;
}

export function DebtForm({ open, onClose, editing }: Props) {
  const createMutation = useCreateDebt();
  const updateMutation = useUpdateDebt();
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
          creditor: editing.creditor,
          total_amount: editing.total_amount,
          remaining_amount: editing.remaining_amount,
          monthly_payment: editing.monthly_payment,
          interest_rate: editing.interest_rate,
          due_date: editing.due_date ?? undefined,
          status: editing.status as FormValues["status"],
        }
      : { interest_rate: 0, status: "active" },
  });

  async function onSubmit(values: FormValues) {
    try {
      const payload = { ...values, due_date: values.due_date || null };
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, ...payload });
        toast({ title: "Deuda actualizada" });
      } else {
        await createMutation.mutateAsync(payload);
        toast({ title: "Deuda creada" });
      }
      reset();
      onClose();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: getErrorMessage(err, "No se pudo guardar la deuda.") });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editar deuda" : "Nueva deuda"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Acreedor</Label>
            <Input placeholder="Ej: Banco BBVA" {...register("creditor")} />
            {errors.creditor && <p className="text-xs text-destructive">{errors.creditor.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Monto total</Label>
              <Input type="number" step="0.01" {...register("total_amount")} />
              {errors.total_amount && <p className="text-xs text-destructive">{errors.total_amount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Monto restante</Label>
              <Input type="number" step="0.01" {...register("remaining_amount")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pago mensual</Label>
              <Input type="number" step="0.01" {...register("monthly_payment")} />
            </div>
            <div className="space-y-2">
              <Label>Tasa interés (%)</Label>
              <Input type="number" step="0.01" {...register("interest_rate")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha límite</Label>
              <Input type="date" {...register("due_date")} />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                defaultValue={editing?.status ?? "active"}
                onValueChange={(v) => setValue("status", v as FormValues["status"])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activa</SelectItem>
                  <SelectItem value="paid">Pagada</SelectItem>
                  <SelectItem value="negotiating">Negociando</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
