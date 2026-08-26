"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useCreateBudget, useUpdateBudget } from "@/lib/hooks/useBudgets";
import { useCategories } from "@/lib/hooks/useCategories";
import { useToast } from "@/lib/hooks/useToast";
import { getErrorMessage } from "@/lib/errors";
import type { BudgetOut } from "@/types/api";

const schema = z.object({
  category_id: z.string().min(1, "Categoría requerida"),
  limit_amount: z.coerce.number().positive("Debe ser mayor a 0"),
  period: z.enum(["monthly", "weekly"]).default("monthly"),
  start_date: z.string().min(1, "Fecha requerida"),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: BudgetOut | null;
}

export function BudgetForm({ open, onClose, editing }: Props) {
  const { data: categories = [] } = useCategories();
  const createMutation = useCreateBudget();
  const updateMutation = useUpdateBudget();
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
          category_id: editing.category_id,
          limit_amount: editing.limit_amount,
          period: editing.period as FormValues["period"],
          start_date: editing.start_date,
        }
      : { period: "monthly", start_date: format(new Date(), "yyyy-MM-dd") },
  });

  async function onSubmit(values: FormValues) {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, ...values });
        toast({ title: "Presupuesto actualizado" });
      } else {
        await createMutation.mutateAsync(values);
        toast({ title: "Presupuesto creado" });
      }
      reset();
      onClose();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: getErrorMessage(err, "No se pudo guardar el presupuesto.") });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editar presupuesto" : "Nuevo presupuesto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select
              defaultValue={editing?.category_id}
              onValueChange={(v) => setValue("category_id", v)}
            >
              <SelectTrigger><SelectValue placeholder="Selecciona categoría" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category_id && <p className="text-xs text-destructive">{errors.category_id.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Límite</Label>
              <Input type="number" step="0.01" {...register("limit_amount")} />
              {errors.limit_amount && <p className="text-xs text-destructive">{errors.limit_amount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Período</Label>
              <Select
                defaultValue={editing?.period ?? "monthly"}
                onValueChange={(v) => setValue("period", v as FormValues["period"])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensual</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Fecha inicio</Label>
            <Input type="date" {...register("start_date")} />
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
