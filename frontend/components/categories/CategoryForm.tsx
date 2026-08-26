"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useCreateCategory, useUpdateCategory } from "@/lib/hooks/useCategories";
import { useToast } from "@/lib/hooks/useToast";
import { getErrorMessage } from "@/lib/errors";
import type { CategoryOut } from "@/types/api";

const schema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  is_income: z.boolean(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: CategoryOut | null;
}

export function CategoryForm({ open, onClose, editing }: Props) {
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: editing
      ? { name: editing.name, is_income: editing.is_income, icon: editing.icon ?? "", color: editing.color ?? "#95A5A6" }
      : { is_income: false, icon: "", color: "#95A5A6" },
  });

  async function onSubmit(values: FormValues) {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, ...values });
        toast({ title: "Categoría actualizada" });
      } else {
        await createMutation.mutateAsync(values);
        toast({ title: "Categoría creada" });
      }
      reset();
      onClose();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: getErrorMessage(err, "No se pudo guardar la categoría.") });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editar categoría" : "Nueva categoría"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input placeholder="Ej: Mascotas" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select
              defaultValue={editing ? (editing.is_income ? "income" : "expense") : "expense"}
              onValueChange={(v) => setValue("is_income", v === "income")}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Gasto</SelectItem>
                <SelectItem value="income">Ingreso</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ícono (emoji, opcional)</Label>
              <Input placeholder="🐾" {...register("icon")} />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <input
                type="color"
                {...register("color")}
                className="h-9 w-full rounded-md border cursor-pointer bg-transparent"
              />
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
