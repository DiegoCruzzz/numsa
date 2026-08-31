"use client";

import { useEffect, useState } from "react";
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

const schema = z
  .object({
    creditor: z.string().min(1, "Acreedor requerido"),
    subtype: z.enum(["credit_card", "loan", "other"]).default("other"),
    total_amount: z.coerce.number().positive("Debe ser mayor a 0"),
    remaining_amount: z.coerce.number().min(0),
    monthly_payment: z.coerce.number().min(0),
    interest_rate: z.coerce.number().min(0).max(999.99, "Máximo 999.99%").default(0),
    due_date: z.string().optional(),
    credit_limit: z.coerce.number().min(0).optional(),
    cutoff_day: z.coerce.number().int().min(1).max(31).optional(),
    payment_due_day: z.coerce.number().int().min(1).max(31).optional(),
    status: z.enum(["active", "paid", "negotiating"]).default("active"),
  })
  .superRefine((data, ctx) => {
    if (data.subtype === "credit_card") {
      if (!data.credit_limit) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["credit_limit"], message: "Requerido para tarjetas de crédito" });
      }
      if (!data.payment_due_day) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["payment_due_day"], message: "Requerido para tarjetas de crédito" });
      }
    }
  });

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

const subtypeLabel = { credit_card: "Tarjeta de crédito", loan: "Préstamo", other: "Otro" };

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: DebtOut | null;
}

export function DebtForm({ open, onClose, editing }: Props) {
  const createMutation = useCreateDebt();
  const updateMutation = useUpdateDebt();
  const { toast } = useToast();
  const [selectedSubtype, setSelectedSubtype] = useState<FormValues["subtype"]>(editing?.subtype ?? "other");

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
          subtype: editing.subtype,
          total_amount: editing.total_amount,
          remaining_amount: editing.remaining_amount,
          monthly_payment: editing.monthly_payment,
          interest_rate: editing.interest_rate,
          due_date: editing.due_date ?? undefined,
          credit_limit: editing.credit_limit ?? undefined,
          cutoff_day: editing.cutoff_day ?? undefined,
          payment_due_day: editing.payment_due_day ?? undefined,
          status: editing.status as FormValues["status"],
        }
      : { subtype: "other", interest_rate: 0, status: "active" },
  });

  useEffect(() => {
    if (!open) return;
    reset(
      editing
        ? {
            creditor: editing.creditor,
            subtype: editing.subtype,
            total_amount: editing.total_amount,
            remaining_amount: editing.remaining_amount,
            monthly_payment: editing.monthly_payment,
            interest_rate: editing.interest_rate,
            due_date: editing.due_date ?? undefined,
            credit_limit: editing.credit_limit ?? undefined,
            cutoff_day: editing.cutoff_day ?? undefined,
            payment_due_day: editing.payment_due_day ?? undefined,
            status: editing.status as FormValues["status"],
          }
        : { subtype: "other", interest_rate: 0, status: "active" }
    );
    setSelectedSubtype(editing?.subtype ?? "other");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  async function onSubmit(values: FormValues) {
    try {
      const payload = { ...values, due_date: values.due_date || null };
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, ...payload });
        toast({ title: "Crédito actualizado" });
      } else {
        await createMutation.mutateAsync(payload);
        toast({ title: "Crédito creado" });
      }
      reset();
      onClose();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: getErrorMessage(err, "No se pudo guardar el crédito.") });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editar crédito" : "Nuevo crédito"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Acreedor</Label>
              <Input placeholder="Ej: Banco BBVA" {...register("creditor")} />
              {errors.creditor && <p className="text-xs text-destructive">{errors.creditor.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={selectedSubtype}
                onValueChange={(v) => {
                  setValue("subtype", v as FormValues["subtype"]);
                  setSelectedSubtype(v as FormValues["subtype"]);
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit_card">{subtypeLabel.credit_card}</SelectItem>
                  <SelectItem value="loan">{subtypeLabel.loan}</SelectItem>
                  <SelectItem value="other">{subtypeLabel.other}</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              {errors.remaining_amount && <p className="text-xs text-destructive">{errors.remaining_amount.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pago mensual</Label>
              <Input type="number" step="0.01" {...register("monthly_payment")} />
              {errors.monthly_payment && <p className="text-xs text-destructive">{errors.monthly_payment.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Tasa de interés anual (%)</Label>
              <Input type="number" step="0.01" max="999.99" placeholder="Ej: 2.5" {...register("interest_rate")} />
              {errors.interest_rate && <p className="text-xs text-destructive">{errors.interest_rate.message}</p>}
            </div>
          </div>

          {selectedSubtype === "credit_card" ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Límite de crédito</Label>
                <Input type="number" step="0.01" {...register("credit_limit")} />
                {errors.credit_limit && <p className="text-xs text-destructive">{errors.credit_limit.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Día de corte</Label>
                <Input type="number" min="1" max="31" placeholder="Ej: 5" {...register("cutoff_day")} />
                {errors.cutoff_day && <p className="text-xs text-destructive">{errors.cutoff_day.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Día de pago</Label>
                <Input type="number" min="1" max="31" placeholder="Ej: 20" {...register("payment_due_day")} />
                {errors.payment_due_day && <p className="text-xs text-destructive">{errors.payment_due_day.message}</p>}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Fecha límite</Label>
              <Input type="date" {...register("due_date")} />
            </div>
          )}

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
