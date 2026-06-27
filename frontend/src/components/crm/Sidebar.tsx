'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard, Users, ClipboardList, MessageCircle,
  UsersRound, DollarSign, BarChart2, LogOut,
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
];

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside className="w-52 min-h-screen bg-white border-r border-gray-200 flex flex-col py-4">
      <div className="px-4 pb-4 border-b border-gray-100 mb-2">
        <p className="text-sm font-semibold text-gray-900">Superman CRM</p>
        <p className="text-xs text-gray-400">Lava-Jato</p>
      </div>

      <nav className="flex-1 overflow-y-auto">
        {nav.map((section) => (
          <div key={section.label}>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 px-4 pt-4 pb-1">{section.label}</p>
            {section.items.map((item) => {
              const active = path === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors border-r-2 ${
                    active
                      ? 'bg-blue-50 text-blue-600 font-medium border-blue-500'
                      : 'text-gray-600 hover:bg-gray-50 border-transparent'
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

      <div className="px-4 pt-4 border-t border-gray-100">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors w-full"
        >
          <LogOut size={15} />
          Sair
        </button>
      </div>
    </aside>
  );
}
