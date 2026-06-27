"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { whatsappLink } from "@/lib/site";
import { WhatsAppIcon } from "./icons";

const NAV = [
  { label: "Início", href: "/#inicio" },
  { label: "Serviços", href: "/#servicos" },
  { label: "Sobre", href: "/#sobre" },
  { label: "Avaliações", href: "/#avaliacoes" },
  { label: "Localização", href: "/#localizacao" },
  { label: "Preços", href: "/servicos" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Bloqueia scroll do fundo quando o menu mobile está aberto.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-40 transition-colors duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-ink-950/90 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:h-20">
        <Logo />

        <nav
          aria-label="Navegação principal"
          className="hidden items-center gap-7 lg:flex"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-zinc-300 transition-colors hover:text-kawasaki-400"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:block">
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-kawasaki-500 px-5 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-kawasaki-400"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Agendar
          </a>
        </div>

        {/* Botão hambúrguer (mobile) */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          className="grid h-11 w-11 place-items-center rounded-lg text-white transition-colors hover:bg-white/10 lg:hidden"
        >
          <span className="relative block h-5 w-6">
            <span
              className={`absolute left-0 top-0 h-0.5 w-6 bg-current transition-transform duration-300 ${
                open ? "translate-y-2 rotate-45" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-2 h-0.5 w-6 bg-current transition-opacity duration-200 ${
                open ? "opacity-0" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-4 h-0.5 w-6 bg-current transition-transform duration-300 ${
                open ? "-translate-y-2 -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </div>

      {/* Menu mobile */}
      <div
        id="mobile-menu"
        className={`overflow-hidden border-t border-white/10 bg-ink-950/95 backdrop-blur-md transition-[max-height] duration-300 ease-out lg:hidden ${
          open ? "max-h-96" : "max-h-0 border-t-0"
        }`}
      >
        <nav
          aria-label="Navegação mobile"
          className="flex flex-col gap-1 px-4 py-4"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-base font-medium text-zinc-200 transition-colors hover:bg-white/5 hover:text-kawasaki-400"
            >
              {item.label}
            </Link>
          ))}
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-kawasaki-500 px-5 py-3 text-base font-semibold text-ink-950"
          >
            <WhatsAppIcon className="h-5 w-5" />
            Agendar pelo WhatsApp
          </a>
        </nav>
      </div>
    </header>
  );
}
