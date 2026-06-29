'use client';

import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

export default function CrmShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!isMobile) setDrawerOpen(false);
  }, [isMobile]);

  // Mantém o backend (Render free tier) acordado enquanto o app está aberto
  useEffect(() => {
    const ping = () =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`, { method: 'GET' }).catch(() => {});
    const id = setInterval(ping, 10 * 60 * 1000); // a cada 10 minutos
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">

      {/* backdrop mobile */}
      {drawerOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* sidebar */}
      <div
        className={`
          h-full flex-shrink-0
          ${isMobile
            ? `fixed inset-y-0 left-0 z-50 transition-transform duration-200 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`
            : 'relative'
          }
        `}
      >
        <Sidebar onClose={isMobile ? () => setDrawerOpen(false) : undefined} />
      </div>

      {/* conteúdo */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* top bar mobile */}
        {isMobile && (
          <header className="flex items-center gap-3 h-14 px-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shrink-0 z-50 relative">
            <button
              onClick={() => setDrawerOpen((o) => !o)}
              className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Menu size={20} />
            </button>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Superman CRM</p>
          </header>
        )}

        <main className="flex-1 overflow-y-auto overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
