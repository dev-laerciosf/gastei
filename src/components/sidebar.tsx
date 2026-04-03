"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LayoutDashboard, ArrowLeftRight, Tag, Target, Repeat, Receipt, Flag, Settings, CreditCard, LogOut, Lock } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UpgradeBanner } from "@/components/upgrade-banner";
import { PLANS } from "@/lib/plans";
import type { Plan } from "@prisma/client";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredFeature?: keyof typeof PLANS.FREE.limits;
};

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transações", icon: ArrowLeftRight },
  { href: "/categories", label: "Categorias", icon: Tag },
  { href: "/budget", label: "Orçamento", icon: Target, requiredFeature: "budgets" },
  { href: "/recurring", label: "Recorrências", icon: Repeat, requiredFeature: "recurring" },
  { href: "/bills", label: "Dívidas", icon: Receipt, requiredFeature: "bills" },
  { href: "/goals", label: "Metas", icon: Flag, requiredFeature: "goals" },
  { href: "/settings/billing", label: "Assinatura", icon: CreditCard },
  { href: "/settings", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const plan: Plan = session?.user?.plan ?? "FREE";

  return (
    <aside className="hidden h-screen w-64 flex-col border-r bg-card lg:flex">
      <div className="flex h-14 items-center border-b px-6">
        <h1 className="text-lg font-semibold">Gastei</h1>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const locked = item.requiredFeature && !PLANS[plan].limits[item.requiredFeature];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                (item.href === "/dashboard" || item.href === "/settings"
                  ? pathname === item.href
                  : pathname.startsWith(item.href))
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {locked && <Lock className="ml-auto h-3 w-3 text-muted-foreground/50" />}
            </Link>
          );
        })}
      </nav>
      <UpgradeBanner plan={plan} />
      <div className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </aside>
  );
}
