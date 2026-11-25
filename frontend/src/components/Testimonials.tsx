import { StarIcon } from "./icons";

// Avaliações do Google. A primeira é a mais concreta (conta o que o serviço
// faz de diferente) e aparece em destaque; as outras ficam numa lista leve.
const REVIEWS = [
  {
    name: "Hoffmam Rodrigo (Einstein)",
    badge: "Local Guide, 229 avaliações",
    text: "Buscam e entregam o veículo com muito cuidado, o serviço sempre impecável.",
  },
  {
    name: "Andre William Chormiak",
    badge: "Local Guide, 158 avaliações",
    text: "Excelente atendimento, lavagem e cuidado com seu veículo.",
  },
  {
    name: "Kassia Micaely",
    badge: "Local Guide, 66 avaliações",
    text: "São os melhores, indico com o melhor prazer.",
  },
  {
    name: "Wilton Leão",
    badge: "Local Guide, 15 avaliações",
    text: "Ótimo serviço e um excelente atendimento.",
  },
  {
    name: "Victor",
    badge: "Local Guide, 61 avaliações",
    text: "Ótimo atendimento e serviço de qualidade!",
  },
  {
    name: "Ismael Marques",
    badge: "Cliente no Google",
    text: "Excelente serviço, muito cuidadosos com o veículo.",
  },
];

function Stars({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <span className="flex" aria-label="5 de 5 estrelas">
      {Array.from({ length: 5 }).map((_, i) => (
        <StarIcon key={i} className={`${className} text-kawasaki-500`} />
      ))}
    </span>
  );
}

export function Testimonials() {
  const [featured, ...rest] = REVIEWS;

  return (
    <section id="avaliacoes" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
          {/* nota geral */}
          <div>
            <h2 className="font-display text-4xl font-semibold leading-[1.05] text-white sm:text-5xl">
              O que dizem nossos clientes
            </h2>
            <div className="mt-8 flex items-end gap-4">
              <span className="font-display text-8xl font-semibold leading-[0.8] text-white">
                4,9
              </span>
              <div className="pb-1">
                <Stars />
                <p className="mt-1.5 text-sm text-zinc-400">
                  de 5 nas avaliações do Google
                </p>
              </div>
            </div>
          </div>

          {/* depoimento em destaque */}
          <figure className="border-l-2 border-kawasaki-500 pl-6 sm:pl-8">
            <blockquote className="font-display text-3xl font-medium leading-tight text-white sm:text-4xl">
              “{featured.text}”
            </blockquote>
            <figcaption className="mt-6 text-sm">
              <span className="font-semibold text-white">{featured.name}</span>
              <span className="text-zinc-500">, {featured.badge}</span>
            </figcaption>
          </figure>
        </div>

        {/* demais avaliações */}
        <ul className="mt-16 grid gap-x-10 gap-y-8 border-t border-white/10 pt-10 sm:grid-cols-2 lg:grid-cols-5">
          {rest.map((r) => (
            <li key={r.name}>
              <figure>
                <blockquote className="text-[15px] leading-relaxed text-zinc-300">
                  “{r.text}”
                </blockquote>
                <figcaption className="mt-3 text-sm">
                  <p className="font-medium text-white">{r.name}</p>
                  <p className="text-xs text-zinc-500">{r.badge}</p>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
