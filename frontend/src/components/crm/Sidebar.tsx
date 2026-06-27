'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useTheme } from './ThemeProvider';
import {
  LayoutDashboard, Users, ClipboardList, MessageCircle,
  UsersRound, DollarSign, Settings, LogOut, Sun, Moon,
} from 'lucide-react';

const nav = [
  { label: 'Principal', items: [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/clientes', icon: Users, label: 'Clientes' },
    { href: '/admin/ordens', icon: ClipboardList, label: 'Ordens de serviço' },
  ]},
  { label: 'Retenção', items: [
    { href: '/admin/reativacao', icon: MessageCircle, label: 'Reativação' },
    { href: '/admin/segmentos', icon: UsersRound, label: 'Segmentação' },
  ]},
  { label: 'Financeiro', items: [
    { href: '/admin/financeiro', icon: DollarSign, label: 'Caixa do dia' },
  ]},
  { label: 'Sistema', items: [
    { href: '/admin/configuracoes', icon: Settings, label: 'Configurações' },
  ]},
];

export default function Sidebar() {
  const path = usePathname();
  const { theme, toggle } = useTheme();

  return (
    <aside className="w-52 min-h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col py-4">
      <div className="px-4 pb-4 border-b border-gray-100 dark:border-gray-700 mb-2">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Superman CRM</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">Lava-Jato</p>
      </div>

      <nav className="flex-1 overflow-y-auto">
        {nav.map((section) => (
          <div key={section.label}>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 px-4 pt-4 pb-1">
              {section.label}
            </p>
            {section.items.map((item) => {
              const active = path === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors border-r-2 ${
                    active
                      ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-medium border-blue-500'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 border-transparent'
                  }`}
                >
                  <item.icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="px-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-2">
        <button
          onClick={toggle}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors w-full"
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
        </button>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors w-full"
        >
          <LogOut size={15} />
          Sair
        </button>
      </div>
    </aside>
  );
}
