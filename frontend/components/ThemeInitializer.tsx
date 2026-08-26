"use client";

import { useEffect } from "react";
import { useThemeStore, applyThemeToDom, applyAccentToDom, type Theme } from "@/store/theme";
import { useAuthStore } from "@/store/auth";

export function ThemeInitializer() {
  const theme = useThemeStore((s) => s.theme);
  const accentColor = useThemeStore((s) => s.accentColor);
  const syncFromUser = useThemeStore((s) => s.syncFromUser);
  const user = useAuthStore((s) => s.user);

  // Si las preferencias del usuario (login, u otra pestaña/dispositivo) no coinciden con el
  // store local, sincroniza. Corre cada vez que cambian, no solo al montar — zustand-persist
  // rehidrata de forma asíncrona, así que "user" puede llegar después del primer render.
  useEffect(() => {
    if (user?.theme && user?.accent_color && (user.theme !== theme || user.accent_color !== accentColor)) {
      syncFromUser(user.theme as Theme, user.accent_color);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.theme, user?.accent_color]);

  // Aplica el tema/color actuales al DOM cada vez que cambian — incluye el momento en que
  // zustand-persist termina de rehidratar desde localStorage (no solo el mount inicial).
  useEffect(() => {
    applyThemeToDom(theme);
    applyAccentToDom(accentColor);
  }, [theme, accentColor]);

  return null;
}
