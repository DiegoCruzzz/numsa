"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/store/theme";

function buildFaviconUrl(color: string): string {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.fillStyle = color;
  ctx.font = "bold 24px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("$", 16, 17);

  return canvas.toDataURL("image/png");
}

export function DynamicFavicon() {
  const accentColor = useThemeStore((s) => s.accentColor);

  useEffect(() => {
    const url = buildFaviconUrl(accentColor);
    if (!url) return;

    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = url;
  }, [accentColor]);

  return null;
}
