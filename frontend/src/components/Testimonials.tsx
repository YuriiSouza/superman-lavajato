import { SectionHeading } from "./SectionHeading";
import { StarIcon } from "./icons";

const REVIEWS = [
  {
    name: "Carlos Mendes",
    car: "Honda Civic",
    text: "Melhor lava a jato da região! Deixaram meu carro impecável e em tempo recorde. O detalhamento vale cada centavo.",
  },
  {
    name: "Juliana Ferreira",
    car: "Jeep Compass",
    text: "Atendimento nota 10 e acabamento perfeito. Agendei pelo WhatsApp em segundos e fui super bem atendida.",
  },
  {
    name: "Rafael Souza",
    car: "VW Golf",
    text: "O enceramento ficou com brilho de carro novo. Equipe rápida, educada e caprichosa. Virei cliente fiel!",
  },
  {
    name: "Patrícia Lima",
    car: "Toyota Corolla",
    text: "Fiz a higienização interna e ficou impecável, parecia zero km. Recomendo de olhos fechados.",
  },
  {
    name: "Bruno Almeida",
    car: "Hilux SW4",
    text: "Rapidez de verdade e preço justo. Levo todos os carros da família aqui agora.",
  },
  {
    name: "Marina Costa",
    car: "Fiat Pulse",
    text: "Profissionais super atenciosos e resultado incrível. O cheirinho de novo durou dias!",
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
            description="Mais de 5.000 carros lavados e uma nota que fala por si."
          />
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-ink-900 px-5 py-4">
            <div className="text-4xl font-extrabold text-white">4,9</div>
            <div>
              <span className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon key={i} className="h-4 w-4 text-kawasaki-500" />
                ))}
              </span>
              <p className="mt-1 text-xs text-zinc-400">Avaliações do Google</p>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {REVIEWS.map((r) => (
            <figure
              key={r.name}
              className="flex flex-col rounded-2xl border border-white/10 bg-ink-900 p-6 transition-colors hover:border-kawasaki-500/40"
            >
              <span className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon key={i} className="h-4 w-4 text-kawasaki-500" />
                ))}
              </span>
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-zinc-300">
                “{r.text}”
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-white/10 pt-4">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-kawasaki-500/15 text-sm font-bold text-kawasaki-400">
                  {r.name.charAt(0)}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{r.name}</p>
                  <p className="text-xs text-zinc-500">{r.car}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
