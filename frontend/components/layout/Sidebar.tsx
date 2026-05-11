"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  CreditCard,
  TrendingDown,
  PieChart,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Resumen" },
  { href: "/transactions", icon: ArrowLeftRight, label: "Transacciones" },
  { href: "/accounts", icon: CreditCard, label: "Cuentas" },
  { href: "/debts", icon: TrendingDown, label: "Deudas" },
  { href: "/budgets", icon: PieChart, label: "Presupuestos" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-60 border-r bg-card flex flex-col">
      <div className="flex items-center gap-2 px-6 py-5 border-b">
        <DollarSign className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold">Numsa</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === href
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
