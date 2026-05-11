"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";

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
      <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
        <LogOut className="h-4 w-4" />
        Salir
      </Button>
    </header>
  );
}
