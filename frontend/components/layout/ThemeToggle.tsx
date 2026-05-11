"use client";

import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThemeStore } from "@/store/theme";

interface ThemeToggleProps {
  persistToBackend?: boolean;
}

export function ThemeToggle({ persistToBackend = true }: ThemeToggleProps) {
  const { theme, setTheme } = useThemeStore();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark", persistToBackend)}
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
