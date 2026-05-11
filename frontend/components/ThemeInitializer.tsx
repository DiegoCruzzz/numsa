"use client";

import { useEffect } from "react";
import { useThemeStore, applyThemeToDom, applyAccentToDom, type Theme } from "@/store/theme";
import { useAuthStore } from "@/store/auth";

export function ThemeInitializer() {
  const { theme, accentColor, syncFromUser } = useThemeStore();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user?.theme && user?.accent_color) {
      syncFromUser(user.theme as Theme, user.accent_color);
    } else {
      applyThemeToDom(theme);
      applyAccentToDom(accentColor);
    }
  // Solo en mount — sincroniza desde el usuario persistido o aplica lo guardado en tema store
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
