"use client";

import { useState } from "react";
import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThemeStore, ACCENT_COLORS, hslToHex, hexToHsl } from "@/store/theme";
import { useToast } from "@/lib/hooks/useToast";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

const ACCENT_LIST = Object.keys(ACCENT_COLORS);
const HUE_SATURATION = 75;
const HUE_LIGHTNESS = 45;

function hueFromHex(hex: string): number {
  const [h] = hexToHsl(hex).split(" ");
  return Number(h) || 0;
}

export function AccentPicker() {
  const { accentColor, setAccentColor } = useThemeStore();
  const [open, setOpen] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [previewHue, setPreviewHue] = useState(() => hueFromHex(accentColor));
  const { toast } = useToast();

  async function applyColor(hex: string) {
    try {
      await setAccentColor(hex);
      setOpen(false);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "No se pudo guardar el color",
        description: getErrorMessage(err, "Intenta de nuevo."),
      });
    }
  }

  function handleHuePreview(hue: number) {
    setPreviewHue(hue);
    document.documentElement.style.setProperty(
      "--primary",
      `${hue} ${HUE_SATURATION}% ${HUE_LIGHTNESS}%`
    );
    document.documentElement.style.setProperty(
      "--ring",
      `${hue} ${HUE_SATURATION}% ${HUE_LIGHTNESS}%`
    );
  }

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
          <div className="absolute right-0 top-10 z-50 w-56 rounded-lg border bg-card p-3 shadow-md space-y-3">
            <p className="text-xs font-medium text-muted-foreground">Color de acento</p>
            <div className="grid grid-cols-4 gap-2">
              {ACCENT_LIST.map((hex) => (
                <button
                  key={hex}
                  onClick={() => applyColor(hex)}
                  className={cn(
                    "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
                    accentColor === hex ? "border-foreground scale-110" : "border-transparent"
                  )}
                  style={{ backgroundColor: hex }}
                  aria-label={hex}
                />
              ))}
            </div>

            <button
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
              onClick={() => setAdvanced((a) => !a)}
            >
              {advanced ? "Ocultar avanzado" : "Personalizar tono…"}
            </button>

            {advanced && (
              <div className="space-y-2 pt-1">
                <input
                  type="range"
                  min={0}
                  max={359}
                  value={previewHue}
                  onChange={(e) => handleHuePreview(Number(e.target.value))}
                  onMouseUp={() => applyColor(hslToHex(previewHue, HUE_SATURATION, HUE_LIGHTNESS))}
                  onTouchEnd={() => applyColor(hslToHex(previewHue, HUE_SATURATION, HUE_LIGHTNESS))}
                  className="w-full accent-[color:var(--accent-color)]"
                  style={{
                    background: `linear-gradient(to right, ${Array.from(
                      { length: 12 },
                      (_, i) => hslToHex((i * 360) / 11, HUE_SATURATION, HUE_LIGHTNESS)
                    ).join(", ")})`,
                    height: "8px",
                    borderRadius: "9999px",
                    appearance: "none",
                  }}
                />
                <div
                  className="h-6 w-full rounded-md border"
                  style={{ backgroundColor: hslToHex(previewHue, HUE_SATURATION, HUE_LIGHTNESS) }}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
