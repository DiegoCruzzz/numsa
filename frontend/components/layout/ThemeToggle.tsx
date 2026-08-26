"use client";

import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThemeStore } from "@/store/theme";
import { useToast } from "@/lib/hooks/useToast";
import { getErrorMessage } from "@/lib/errors";

interface ThemeToggleProps {
  persistToBackend?: boolean;
}

export function ThemeToggle({ persistToBackend = true }: ThemeToggleProps) {
  const { theme, setTheme } = useThemeStore();
  const { toast } = useToast();

  async function handleToggle() {
    try {
      await setTheme(theme === "dark" ? "light" : "dark", persistToBackend);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "No se pudo guardar el tema",
        description: getErrorMessage(err, "El cambio se ve, pero no se guardó."),
      });
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      onClick={handleToggle}
      className="transition-colors duration-200"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}
