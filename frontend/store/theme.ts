"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/api";

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

export function applyThemeToDom(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function applyAccentToDom(hex: string): void {
  if (typeof document === "undefined") return;
  const hsl = ACCENT_COLORS[hex] ?? ACCENT_COLORS[DEFAULT_ACCENT];
  document.documentElement.style.setProperty("--primary", hsl);
  document.documentElement.style.setProperty("--ring", hsl);
  document.documentElement.style.setProperty("--accent-color", hex);
}

interface ThemeState {
  theme: Theme;
  accentColor: string;
  setTheme: (theme: Theme, persistToBackend?: boolean) => void;
  setAccentColor: (hex: string) => void;
  syncFromUser: (theme: Theme, accentColor: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "light",
      accentColor: DEFAULT_ACCENT,

      setTheme: (theme, persistToBackend = true) => {
        applyThemeToDom(theme);
        set({ theme });
        if (persistToBackend) {
          api.patch("/auth/preferences", { theme }).catch(() => {});
        }
      },

      setAccentColor: (hex) => {
        applyAccentToDom(hex);
        set({ accentColor: hex });
        api.patch("/auth/preferences", { accent_color: hex }).catch(() => {});
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
