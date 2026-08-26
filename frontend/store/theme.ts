"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";

export type Theme = "light" | "dark";

export const ACCENT_COLORS: Record<string, string> = {
  "#16a34a": "142 76% 36%",
  "#2563eb": "221 83% 53%",
  "#dc2626": "0 72% 51%",
  "#9333ea": "271 81% 56%",
  "#ea580c": "21 90% 48%",
  "#0891b2": "192 91% 37%",
  "#ca8a04": "41 96% 40%",
  "#db2777": "333 71% 51%",
};

export const DEFAULT_ACCENT = "#16a34a";

/** Convierte un hex #RRGGBB a "H S% L%" para las variables CSS (formato shadcn/tailwind). */
export function hexToHsl(hex: string): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return ACCENT_COLORS[DEFAULT_ACCENT];
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** Convierte hue (0-360) + saturación/luminosidad fijas a hex, para el slider de color avanzado. */
export function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sNorm * Math.min(lNorm, 1 - lNorm);
  const f = (n: number) => lNorm - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) => Math.round(255 * x).toString(16).padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

export function applyThemeToDom(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function applyAccentToDom(hex: string): void {
  if (typeof document === "undefined") return;
  const hsl = hexToHsl(hex);
  document.documentElement.style.setProperty("--primary", hsl);
  document.documentElement.style.setProperty("--ring", hsl);
  document.documentElement.style.setProperty("--accent-color", hex);
}

interface ThemeState {
  theme: Theme;
  accentColor: string;
  setTheme: (theme: Theme, persistToBackend?: boolean) => Promise<void>;
  setAccentColor: (hex: string) => Promise<void>;
  syncFromUser: (theme: Theme, accentColor: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "light",
      accentColor: DEFAULT_ACCENT,

      setTheme: async (theme, persistToBackend = true) => {
        applyThemeToDom(theme);
        set({ theme });
        if (persistToBackend) {
          await api.patch("/auth/preferences", { theme });
          useAuthStore.getState().updateUser({ theme });
        }
      },

      setAccentColor: async (hex) => {
        applyAccentToDom(hex);
        set({ accentColor: hex });
        await api.patch("/auth/preferences", { accent_color: hex });
        useAuthStore.getState().updateUser({ accent_color: hex });
      },

      syncFromUser: (theme, accentColor) => {
        applyThemeToDom(theme);
        applyAccentToDom(accentColor);
        set({ theme, accentColor });
      },
    }),
    {
      name: "numsa-theme",
      partialize: (state) => ({ theme: state.theme, accentColor: state.accentColor }),
    }
  )
);
