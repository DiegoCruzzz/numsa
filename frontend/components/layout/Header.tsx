"use client";

import { useRouter } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";
import { useUIStore } from "@/store/ui";
import { ThemeToggle } from "./ThemeToggle";
import { AccentPicker } from "./AccentPicker";

export function Header() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const toggleMobileNav = useUIStore((s) => s.toggleMobileNav);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-4 md:px-6 gap-2">
      <div className="flex items-center gap-3 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden shrink-0"
          onClick={toggleMobileNav}
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <p className="text-sm text-muted-foreground truncate">
          <span className="hidden sm:inline">{greeting}, </span>
          <span className="font-semibold text-foreground">{user?.name ?? "usuario"}</span>
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <ThemeToggle />
        <AccentPicker />
        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 ml-1">
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Salir</span>
        </Button>
      </div>
    </header>
  );
}
