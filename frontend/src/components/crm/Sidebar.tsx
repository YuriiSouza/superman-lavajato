"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "./ThemeProvider";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  MessageCircle,
  UsersRound,
  DollarSign,
  Settings,
  LogOut,
  Sun,
  Moon,
  Wrench,
  UserCog,
  ChevronLeft,
  ChevronRight,
  X,
  CalendarDays,
  Package,
  Receipt,
  TrendingUp,
} from "lucide-react";

type Role = "ADMIN" | "CAIXA" | "OPERADOR";

const nav = [
  {
    label: "Principal",
    items: [
      {
        href: "/admin/dashboard",
        icon: LayoutDashboard,
        label: "Dashboard",
        roles: ["ADMIN"] as Role[],
      },
      {
        href: "/admin/clientes",
        icon: Users,
        label: "Clientes",
        roles: ["ADMIN", "CAIXA", "OPERADOR"] as Role[],
      },
      {
        href: "/admin/ordens",
        icon: ClipboardList,
        label: "Ordens de serviço",
        roles: ["ADMIN", "CAIXA", "OPERADOR"] as Role[],
      },
      {
        href: "/admin/agenda",
        icon: CalendarDays,
        label: "Agenda",
        roles: ["ADMIN", "CAIXA", "OPERADOR"] as Role[],
      },
    ],
  },
  {
    label: "Retenção",
    items: [
      {
        href: "/admin/reativacao",
        icon: MessageCircle,
        label: "Reativação",
        roles: ["ADMIN"] as Role[],
      },
      {
        href: "/admin/segmentos",
        icon: UsersRound,
        label: "Segmentação",
        roles: ["ADMIN"] as Role[],
      },
    ],
  },
  {
    label: "Financeiro",
    items: [
      {
        href: "/admin/financeiro",
        icon: DollarSign,
        label: "Caixa do dia",
        roles: ["ADMIN", "CAIXA"] as Role[],
      },
      {
        href: "/admin/resultado",
        icon: TrendingUp,
        label: "Resultado (DRE)",
        roles: ["ADMIN"] as Role[],
      },
      {
        href: "/admin/contas",
        icon: Receipt,
        label: "Contas a pagar",
        roles: ["ADMIN"] as Role[],
      },
      {
        href: "/admin/estoque",
        icon: Package,
        label: "Estoque",
        roles: ["ADMIN"] as Role[],
      },
    ],
  },
  {
    label: "Sistema",
    items: [
      {
        href: "/admin/servicos",
        icon: Wrench,
        label: "Serviços",
        roles: ["ADMIN"] as Role[],
      },
      {
        href: "/admin/usuarios",
        icon: UserCog,
        label: "Usuários",
        roles: ["ADMIN", "CAIXA"] as Role[],
      },
      {
        href: "/admin/configuracoes",
        icon: Settings,
        label: "Configurações",
        roles: ["ADMIN", "CAIXA", "OPERADOR"] as Role[],
      },
    ],
  },
];

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Administrador",
  CAIXA: "Caixa",
  OPERADOR: "Operador",
};

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const path = usePathname();
  const { theme, toggle } = useTheme();
  const { data: session } = useSession();
  const role = ((session?.user as any)?.role as Role) ?? "OPERADOR";
  const [collapsed, setCollapsed] = useState(false);

  function handleNavClick() {
    onClose?.();
  }

  return (
    <aside
      className={`h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col py-4 transition-all duration-200 ${
        collapsed ? "w-14" : "w-56"
      }`}
    >
      {/* cabeçalho */}
      <div
        className={`flex items-center border-b border-gray-100 dark:border-gray-700 mb-2 pb-3 ${
          collapsed ? "justify-center px-0" : "justify-between px-4"
        }`}
      >
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              Superman CRM
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Lava-Jato
            </p>
          </div>
        )}
        {/* fechar drawer — renderizado apenas quando em modo mobile */}
        {onClose && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0 cursor-pointer touch-manipulation"
          >
            <X size={18} />
          </button>
        )}
        {/* collapse toggle — só desktop */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden md:flex p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
          title={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden">
        {nav.map((section) => {
          const visibleItems = section.items.filter((i) =>
            i.roles.includes(role),
          );
          if (!visibleItems.length) return null;
          return (
            <div key={section.label}>
              {!collapsed && (
                <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 px-4 pt-4 pb-1 whitespace-nowrap">
                  {section.label}
                </p>
              )}
              {collapsed && <div className="pt-3" />}
              {visibleItems.map((item) => {
                const active = path === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleNavClick}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-2.5 py-2.5 text-sm transition-colors border-r-2 ${
                      collapsed ? "justify-center px-0" : "px-4"
                    } ${
                      active
                        ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-medium border-blue-500"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 border-transparent"
                    }`}
                  >
                    <item.icon size={16} className="flex-shrink-0" />
                    {!collapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* rodapé */}
      <div
        className={`pt-4 border-t border-gray-100 dark:border-gray-700 space-y-1 ${collapsed ? "px-0" : "px-4"}`}
      >
        {!collapsed && session?.user?.name && (
          <div className="mb-2">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
              {session.user.name}
            </p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">
              {ROLE_LABEL[role]}
            </p>
          </div>
        )}

        <button
          onClick={toggle}
          title={theme === "dark" ? "Modo claro" : "Modo escuro"}
          className={`flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors w-full py-1.5 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          {!collapsed && (theme === "dark" ? "Modo claro" : "Modo escuro")}
        </button>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          title="Sair"
          className={`flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors w-full py-1.5 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut size={15} />
          {!collapsed && "Sair"}
        </button>
      </div>
    </aside>
  );
}
