import Link from "next/link";
import { Logo } from "./Logo";
import type { SiteSettings } from "@/lib/site";
import { whatsappLink } from "@/lib/site";
import {
  PhoneIcon,
  MailIcon,
  PinIcon,
  InstagramIcon,
  FacebookIcon,
  WhatsAppIcon,
} from "./icons";

export function Footer({ site }: { site: SiteSettings }) {
  return (
    <footer className="border-t border-white/10 bg-ink-900">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-zinc-400">
            Força, rapidez e qualidade de herói para o seu carro. Atendimento
            premium do início ao brilho final.
          </p>
          <div className="flex gap-3">
            <a
              href={site.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-zinc-300 transition-colors hover:border-kawasaki-500 hover:text-kawasaki-400"
            >
              <InstagramIcon className="h-5 w-5" />
            </a>
            <a
              href={site.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-zinc-300 transition-colors hover:border-kawasaki-500 hover:text-kawasaki-400"
            >
              <FacebookIcon className="h-5 w-5" />
            </a>
            <a
              href={whatsappLink(site.phone)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-zinc-300 transition-colors hover:border-kawasaki-500 hover:text-kawasaki-400"
            >
              <WhatsAppIcon className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
            Navegação
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm text-zinc-400">
            <li>
              <Link href="/#servicos" className="hover:text-kawasaki-400">
                Serviços
              </Link>
            </li>
            <li>
              <Link href="/#sobre" className="hover:text-kawasaki-400">
                Sobre nós
              </Link>
            </li>
            <li>
              <Link href="/#avaliacoes" className="hover:text-kawasaki-400">
                Avaliações
              </Link>
            </li>
            <li>
              <Link href="/servicos" className="hover:text-kawasaki-400">
                Preços e pacotes
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
            Contato
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-zinc-400">
            <li className="flex items-start gap-2.5">
              <PinIcon className="mt-0.5 h-5 w-5 shrink-0 text-kawasaki-500" />
              <span>{site.address}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <PhoneIcon className="h-5 w-5 shrink-0 text-kawasaki-500" />
              <a href={`tel:${site.phone}`} className="hover:text-kawasaki-400">
                {site.phoneDisplay}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <MailIcon className="h-5 w-5 shrink-0 text-kawasaki-500" />
              <a
                href={`mailto:${site.email}`}
                className="hover:text-kawasaki-400"
              >
                {site.email}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
            Horário
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm text-zinc-400">
            {site.hours.map((h) => (
              <li key={h.day} className="flex justify-between gap-4">
                <span>{h.day}</span>
                <span className="font-medium text-zinc-300">{h.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-zinc-500 sm:flex-row sm:px-6">
          <p>
            © {new Date().getFullYear()} {site.name}. Todos os direitos
            reservados.
          </p>
          <div className="flex gap-5">
            <Link href="/servicos" className="hover:text-zinc-300">
              Política de Privacidade
            </Link>
            <Link href="/servicos" className="hover:text-zinc-300">
              Termos de Uso
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
