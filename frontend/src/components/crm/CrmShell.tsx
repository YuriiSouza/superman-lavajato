"use client";

import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";

// Celular x desktop é decidido só por CSS (breakpoint md = 768px), assim o
// primeiro HTML já sai certo e o menu não aparece aberto antes de o JS carregar.
export default function CrmShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Fecha o drawer se a tela crescer para desktop com ele aberto
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const close = () => mq.matches && setDrawerOpen(false);
    mq.addEventListener("change", close);
    return () => mq.removeEventListener("change", close);
  }, []);

  // Mantém o backend (Render free tier) acordado enquanto o app está aberto
  useEffect(() => {
    const ping = () =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`, {
        method: "GET",
      }).catch(() => {});
    const id = setInterval(ping, 10 * 60 * 1000); // a cada 10 minutos
    return () => clearInterval(id);
  }, []);

  return (
    // tabular-nums: algarismos de largura fixa, para valores em R$ e
    // quantidades ficarem alinhados uns sob os outros
    <div className="flex h-screen overflow-hidden bg-gray-50 tabular-nums dark:bg-gray-950">
      {/* backdrop mobile */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* sidebar: drawer fora da tela no celular, coluna fixa no desktop */}
      <div
        className={`fixed inset-y-0 left-0 z-50 h-full flex-shrink-0 transition-transform duration-200 md:relative md:translate-x-0 md:transition-none ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onClose={() => setDrawerOpen(false)} />
      </div>

      {/* conteúdo */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* top bar mobile */}
        <header className="relative z-30 flex h-14 shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-900 md:hidden">
          <button
            onClick={() => setDrawerOpen((o) => !o)}
            aria-label="Abrir menu"
            aria-expanded={drawerOpen}
            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Menu size={20} />
          </button>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Superman CRM
          </p>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
