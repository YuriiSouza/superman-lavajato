import { SectionHeading } from "./SectionHeading";
import { StarIcon } from "./icons";

const REVIEWS = [
  {
    name: "Hoffmam Rodrigo (Einstein)",
    badge: "Local Guide - 229 avaliacoes",
    text: "Buscam e entregam o veiculo com muito cuidado, o servico sempre impecavel.",
  },
  {
    name: "Andre William Chormiak",
    badge: "Local Guide - 158 avaliacoes",
    text: "Excelente atendimento, lavagem e cuidado com seu veiculo.",
  },
  {
    name: "Kassia Micaely",
    badge: "Local Guide - 66 avaliacoes",
    text: "Sao os melhores, indico com o melhor prazer.",
  },
  {
    name: "Wilton Leao",
    badge: "Local Guide - 15 avaliacoes",
    text: "Otimo servico e um excelente atendimento.",
  },
  {
    name: "Victor",
    badge: "Local Guide - 61 avaliacoes",
    text: "Otimo atendimento e servico de qualidade!",
  },
  {
    name: "Ismael Marques",
    badge: "Cliente Google",
    text: "Excelente servico, muito cuidadosos com o veiculo.",
  },
];

export function Testimonials() {
  return (
    <section id="avaliacoes" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            eyebrow="Prova social"
            title="O que dizem nossos clientes"
            description="Centenas de clientes satisfeitos e uma nota que fala por si."
          />
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-ink-900 px-5 py-4">
            <div className="text-4xl font-extrabold text-white">4,9</div>
            <div>
              <span className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon key={i} className="h-4 w-4 text-kawasaki-500" />
                ))}
              </span>
              <p className="mt-1 text-xs text-zinc-400">Avaliacoes do Google</p>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {REVIEWS.map((r) => (
            <figure
              key={r.name}
              className="flex flex-col rounded-2xl border border-white/10 bg-ink-900 p-6 transition-colors hover:border-kawasaki-500/40"
            >
              <div className="flex items-center justify-between">
                <span className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon key={i} className="h-4 w-4 text-kawasaki-500" />
                  ))}
                </span>
              </div>
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-zinc-300">
                {r.text}
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-white/10 pt-4">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-kawasaki-500/15 text-sm font-bold text-kawasaki-400">
                  {r.name.charAt(0)}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{r.name}</p>
                  <p className="text-xs text-zinc-500">{r.badge}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
