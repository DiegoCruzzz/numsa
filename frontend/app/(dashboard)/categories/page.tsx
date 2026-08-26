"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryForm } from "@/components/categories/CategoryForm";
import { useCategories, useDeleteCategory } from "@/lib/hooks/useCategories";
import { useToast } from "@/lib/hooks/useToast";
import { getErrorMessage } from "@/lib/errors";
import type { CategoryOut } from "@/types/api";

function CategoryGrid({
  categories,
  onEdit,
  onDelete,
}: {
  categories: CategoryOut[];
  onEdit: (c: CategoryOut) => void;
  onDelete: (id: string) => void;
}) {
  if (categories.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">Sin categorías en esta sección</p>;
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {categories.map((c) => (
        <Card key={c.id} className="group">
          <CardContent className="p-3 flex items-center gap-3">
            <div
              className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-lg"
              style={{ backgroundColor: (c.color ?? "#95A5A6") + "33" }}
            >
              {c.icon || "🏷️"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{c.name}</p>
              {c.is_default && <p className="text-[10px] text-muted-foreground">Predeterminada</p>}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onEdit(c)}>
                <Pencil className="h-3 w-3" />
              </Button>
              <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => onDelete(c.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function CategoriesPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryOut | null>(null);
  const { data: categories = [], isLoading } = useCategories();
  const deleteMutation = useDeleteCategory();
  const { toast } = useToast();

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta categoría? Las transacciones que la usan quedarán sin categoría.")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: "Categoría eliminada" });
    } catch (err) {
      toast({ variant: "destructive", title: "Error al eliminar", description: getErrorMessage(err, "Intenta de nuevo.") });
    }
  }

  const expense = categories.filter((c) => !c.is_income);
  const income = categories.filter((c) => c.is_income);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categorías</h1>
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Nueva categoría
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16">
          <Tag className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Sin categorías aún</p>
          <Button onClick={() => { setEditing(null); setOpen(true); }} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" /> Crear primera categoría
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Gastos</h2>
            <CategoryGrid categories={expense} onEdit={(c) => { setEditing(c); setOpen(true); }} onDelete={handleDelete} />
          </div>
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Ingresos</h2>
            <CategoryGrid categories={income} onEdit={(c) => { setEditing(c); setOpen(true); }} onDelete={handleDelete} />
          </div>
        </div>
      )}

      <CategoryForm open={open} onClose={() => setOpen(false)} editing={editing} />
    </div>
  );
}
