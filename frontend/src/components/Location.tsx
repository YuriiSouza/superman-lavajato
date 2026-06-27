import { SectionHeading } from "./SectionHeading";
import { SITE } from "@/lib/site";
import { PinIcon, ClockIcon, PhoneIcon, ArrowRightIcon } from "./icons";

export function Location() {
  return (
    <section
      id="localizacao"
      className="scroll-mt-24 border-t border-white/10 bg-ink-900 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Onde estamos"
          title="Venha nos fazer uma visita"
          description="Estamos prontos para receber você e o seu carro. Use o mapa para chegar com facilidade."
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <iframe
                title="Mapa da localização do Superman Lava a Jato"
                src={SITE.mapsEmbed}
                className="h-[300px] w-full sm:h-[420px]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="space-y-5 rounded-2xl border border-white/10 bg-ink-950 p-7">
              <div className="flex gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-kawasaki-500/10 text-kawasaki-400">
                  <PinIcon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-white">Endereço</h3>
                  <p className="mt-1 text-sm text-zinc-400">{SITE.address}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-kawasaki-500/10 text-kawasaki-400">
                  <ClockIcon className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">
                    Horário de funcionamento
                  </h3>
                  <ul className="mt-2 space-y-1 text-sm text-zinc-400">
                    {SITE.hours.map((h) => (
                      <li key={h.day} className="flex justify-between gap-4">
                        <span>{h.day}</span>
                        <span className="font-medium text-zinc-300">
                          {h.time}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-kawasaki-500/10 text-kawasaki-400">
                  <PhoneIcon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-white">Telefone</h3>
                  <a
                    href={`tel:${SITE.phoneDisplay.replace(/\D/g, "")}`}
                    className="mt-1 block text-sm text-zinc-400 hover:text-kawasaki-400"
                  >
                    {SITE.phoneDisplay}
                  </a>
                </div>
              </div>

              <a
                href={SITE.mapsDirections}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-kawasaki-500 px-6 py-3 text-base font-semibold text-ink-950 transition-colors hover:bg-kawasaki-400"
              >
                Como chegar
                <ArrowRightIcon className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
