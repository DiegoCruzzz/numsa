"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";
import { ThemeToggle } from "./ThemeToggle";
import { AccentPicker } from "./AccentPicker";

export function Header() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6">
      <p className="text-sm text-muted-foreground">
        {greeting},{" "}
        <span className="font-semibold text-foreground">{user?.name ?? "usuario"}</span>
      </p>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <AccentPicker />
        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 ml-1">
          <LogOut className="h-4 w-4" />
          Salir
        </Button>
      </div>
    </header>
  );
}
