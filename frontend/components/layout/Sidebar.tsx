"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  TrendingDown,
  PieChart,
  DollarSign,
  MessageCircle,
  Tag,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Resumen" },
  { href: "/chat", icon: MessageCircle, label: "Chat" },
  { href: "/transactions", icon: ArrowLeftRight, label: "Transacciones" },
  { href: "/accounts", icon: Wallet, label: "Cuentas" },
  { href: "/debts", icon: TrendingDown, label: "Créditos" },
  { href: "/budgets", icon: PieChart, label: "Presupuestos" },
  { href: "/categories", icon: Tag, label: "Categorías" },
];

export function Sidebar() {
  const pathname = usePathname();
  const mobileNavOpen = useUIStore((s) => s.mobileNavOpen);
  const closeMobileNav = useUIStore((s) => s.closeMobileNav);

  return (
    <>
      {/* Fondo oscuro detrás del drawer — solo en móvil, cuando está abierto */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={closeMobileNav} aria-hidden />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-card transition-transform duration-200 ease-in-out",
          "w-64 md:w-16 lg:w-60",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex items-center gap-2 px-6 py-5 border-b md:justify-center md:px-2 lg:justify-start lg:px-6">
          <DollarSign className="h-6 w-6 text-primary shrink-0" />
          <span className="text-lg font-bold md:hidden lg:inline">Numsa</span>
          <button
            className="ml-auto md:hidden"
            onClick={closeMobileNav}
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 md:px-2 lg:px-3">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              onClick={closeMobileNav}
              title={label}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                "md:justify-center md:px-2 lg:justify-start lg:px-3",
                pathname === href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="md:hidden lg:inline">{label}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
