"use client";

import { useState } from "react";
import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThemeStore, ACCENT_COLORS } from "@/store/theme";
import { cn } from "@/lib/utils";

const ACCENT_LIST = Object.keys(ACCENT_COLORS);

export function AccentPicker() {
  const { accentColor, setAccentColor } = useThemeStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Cambiar color de acento"
        onClick={() => setOpen((o) => !o)}
        className="transition-colors duration-200"
      >
        <Palette className="h-4 w-4" style={{ color: "var(--accent-color)" }} />
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 rounded-lg border bg-card p-3 shadow-md">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Color de acento</p>
            <div className="grid grid-cols-4 gap-2">
              {ACCENT_LIST.map((hex) => (
                <button
                  key={hex}
                  onClick={() => {
                    setAccentColor(hex);
                    setOpen(false);
                  }}
                  className={cn(
                    "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
                    accentColor === hex ? "border-foreground scale-110" : "border-transparent"
                  )}
                  style={{ backgroundColor: hex }}
                  aria-label={hex}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
