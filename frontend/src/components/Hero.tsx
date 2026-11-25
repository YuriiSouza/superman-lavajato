import Link from "next/link";
import { fetchSiteSettings, whatsappLink } from "@/lib/site";
import { WhatsAppIcon, StarIcon } from "./icons";

export async function Hero() {
  const site = await fetchSiteSettings();

  return (
    <section id="inicio" className="relative isolate overflow-hidden">
      {/* Imagem de fundo (carro sendo lavado) */}
      <div className="absolute inset-0 -z-10">
        <img
          src="/fotos/hero.png"
          alt="Carro recebendo lavagem profissional no Superman Lava a Jato"
          className="h-full w-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/80 via-ink-950/70 to-ink-950" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950/90 to-transparent" />
      </div>

      <div className="mx-auto flex min-h-[90vh] max-w-6xl flex-col justify-center px-4 py-24 sm:px-6 lg:min-h-[88vh]">
        {/* O título grande e condensado sobre a foto é o momento marcante do
            site; o resto da página fica mais quieto. */}
        <h1 className="max-w-4xl font-display text-6xl font-semibold leading-[0.95] text-white sm:text-7xl lg:text-8xl">
          Seu carro merece um tratamento de herói.
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-300">
          No {site.name} unimos força, rapidez e um acabamento de showroom.
          Lavagem simples, completa, enceramento e detalhamento — tudo com
          qualidade premium.
        </p>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/agendar"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-kawasaki-500 px-7 py-3.5 text-base font-semibold text-ink-950 shadow-lg shadow-kawasaki-500/20 transition-all hover:bg-kawasaki-400 hover:shadow-kawasaki-500/40"
          >
            Agendar lavagem
          </Link>
          <a
            href={whatsappLink(site.phone)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-base font-semibold text-white backdrop-blur transition-colors hover:border-kawasaki-500 hover:text-kawasaki-400"
          >
            <WhatsAppIcon className="h-5 w-5" />
            Chamar no WhatsApp
          </a>
        </div>

        {/* Selos de confiança */}
        <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4 text-sm text-zinc-300">
          <div className="flex items-center gap-2">
            <span className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon key={i} className="h-4 w-4 text-kawasaki-500" />
              ))}
            </span>
            <span className="font-semibold text-white">4,9</span>
            <span className="text-zinc-400">no Google</span>
          </div>
          <div className="h-4 w-px bg-white/15" />
          <span>
            <span className="font-semibold text-white">+1.000</span> carros
            lavados
          </span>
          <div className="hidden h-4 w-px bg-white/15 sm:block" />
          <span>Atendimento rápido e eficiente</span>
        </div>
      </div>
    </section>
  );
}
