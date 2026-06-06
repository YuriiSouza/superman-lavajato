import type { Metadata } from "next";
import { SectionHeading } from "@/components/SectionHeading";
import { BookingForm } from "@/components/BookingForm";
import { SERVICES, ADDONS } from "@/lib/services";
import { whatsappLink } from "@/lib/site";
import { CheckIcon, ClockIcon, WhatsAppIcon, BoltIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Serviços e Preços",
  description:
    "Conheça os pacotes do Superman Lava a Jato: lavagem simples, completa, enceramento premium e detalhamento. Veja preços e agende pelo WhatsApp.",
};

export default function ServicosPage() {
  return (
    <>
      {/* Cabeçalho da página */}
      <section className="relative isolate overflow-hidden border-b border-white/10 bg-ink-900 pt-28 pb-16 sm:pt-32">
        <div
          aria-hidden
          className="absolute -right-24 -top-10 -z-10 h-80 w-80 rounded-full bg-kawasaki-600/15 blur-3xl"
        />
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-kawasaki-500/40 bg-kawasaki-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-kawasaki-300">
            <BoltIcon className="h-4 w-4" />
            Preços e pacotes
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Escolha o pacote ideal para o seu carro
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-zinc-300">
            Transparência total: veja o que está incluso em cada serviço e
            agende em segundos pelo WhatsApp.
          </p>
        </div>
      </section>

      {/* Tabela / cards de preços */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-4 lg:gap-5">
            {SERVICES.map((s) => (
              <article
                key={s.slug}
                className={`relative flex flex-col rounded-3xl border p-7 transition-transform duration-300 hover:-translate-y-1 ${
                  s.highlight
                    ? "border-kawasaki-500 bg-gradient-to-b from-kawasaki-500/10 to-transparent lg:scale-[1.03]"
                    : "border-white/10 bg-ink-900"
                }`}
              >
                {s.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-kawasaki-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-ink-950">
                    Mais escolhido
                  </span>
                )}
                <h2 className="text-lg font-bold text-white">{s.name}</h2>
                <p className="mt-1.5 text-sm text-zinc-400">{s.tagline}</p>

                <div className="mt-5 flex items-end gap-1">
                  <span className="text-3xl font-extrabold text-white">
                    {s.price}
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
                  <ClockIcon className="h-4 w-4" />
                  Duração {s.duration}
                </p>

                <ul className="mt-6 flex-1 space-y-3 border-t border-white/10 pt-6">
                  {s.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-300">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-kawasaki-500" />
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href={whatsappLink(
                    `Olá! Quero agendar o pacote *${s.name}* (${s.price}) no Superman Lava a Jato. 🦸`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-7 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-colors ${
                    s.highlight
                      ? "bg-kawasaki-500 text-ink-950 hover:bg-kawasaki-400"
                      : "border border-kawasaki-500 text-kawasaki-400 hover:bg-kawasaki-500 hover:text-ink-950"
                  }`}
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  Agendar
                </a>
              </article>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-zinc-500">
            * Valores de referência para veículos de pequeno e médio porte. SUVs,
            caminhonetes e carros muito sujos podem ter acréscimo. Consulte-nos.
          </p>
        </div>
      </section>

      {/* Opcionais */}
      <section className="border-y border-white/10 bg-ink-900 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Serviços opcionais"
            title="Turbine o seu pacote"
            description="Combine qualquer opcional com o seu pacote para um resultado ainda mais completo."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ADDONS.map((a) => (
              <div
                key={a.name}
                className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-ink-950 px-5 py-4 transition-colors hover:border-kawasaki-500/40"
              >
                <span className="flex items-center gap-3 text-sm text-zinc-200">
                  <CheckIcon className="h-4 w-4 shrink-0 text-kawasaki-500" />
                  {a.name}
                </span>
                <span className="shrink-0 text-sm font-semibold text-kawasaki-400">
                  {a.price}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agendamento */}
      <section id="agendar" className="scroll-mt-24 py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-start gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <div className="lg:sticky lg:top-28">
            <SectionHeading
              eyebrow="Agendamento"
              title="Reserve o seu horário"
              description="Preencha o formulário e finalizamos a confirmação pelo WhatsApp — rápido e sem complicação. Prefere falar direto? Use o botão abaixo."
            />
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-7 py-3.5 text-base font-semibold text-white transition-transform hover:scale-[1.02]"
            >
              <WhatsAppIcon className="h-5 w-5" />
              Agendar direto no WhatsApp
            </a>

            <dl className="mt-10 space-y-4 border-t border-white/10 pt-8 text-sm">
              <div className="flex items-center gap-3 text-zinc-300">
                <CheckIcon className="h-5 w-5 text-kawasaki-500" />
                Confirmação rápida no mesmo dia
              </div>
              <div className="flex items-center gap-3 text-zinc-300">
                <CheckIcon className="h-5 w-5 text-kawasaki-500" />
                Sem taxa de agendamento
              </div>
              <div className="flex items-center gap-3 text-zinc-300">
                <CheckIcon className="h-5 w-5 text-kawasaki-500" />
                Atendimento ágil, do jeito Superman
              </div>
            </dl>
          </div>

          <BookingForm />
        </div>
      </section>
    </>
  );
}
