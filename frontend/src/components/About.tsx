import { SectionHeading } from "./SectionHeading";
import { BoltIcon, ShieldIcon, SparkleIcon, CheckIcon } from "./icons";

const DIFFERENTIALS = [
  {
    icon: BoltIcon,
    title: "Rapidez de herói",
    desc: "Equipe ágil e processo otimizado para você não perder tempo.",
  },
  {
    icon: ShieldIcon,
    title: "Produtos premium",
    desc: "Itens que protegem a pintura e respeitam o meio ambiente.",
  },
  {
    icon: SparkleIcon,
    title: "Acabamento impecável",
    desc: "Cuidado nos detalhes que faz toda a diferença no brilho final.",
  },
];

export function About() {
  return (
    <section id="sobre" className="scroll-mt-24 border-y border-white/10 bg-ink-900 py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <div className="relative">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 overflow-hidden rounded-2xl border border-white/10">
              <img
                src="/fotos/estrutura-1.png"
                alt="Estrutura do Superman Lava a Jato em Anápolis"
                className="h-56 w-full object-cover sm:h-72"
                loading="lazy"
              />
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <img
                src="/fotos/estrutura-2.png"
                alt="Área de atendimento coberta"
                className="h-40 w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <img
                src="/fotos/carro-detalhado.jpeg"
                alt="Carro finalizado no Superman Lava a Jato"
                className="h-40 w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
          <div className="absolute -bottom-6 -right-4 hidden rounded-2xl border border-kawasaki-500/30 bg-ink-950 px-6 py-5 shadow-xl sm:block">
            <p className="text-3xl font-extrabold text-kawasaki-500">Premium</p>
            <p className="text-sm text-zinc-400">detalhamento automotivo</p>
          </div>
        </div>

        <div>
          <SectionHeading
            eyebrow="Sobre nós"
            title="Força e qualidade em cada lavagem"
            description="O Superman Lava a Jato nasceu com uma missão simples: tratar cada carro como se fosse único. Combinamos técnica, produtos de alta qualidade e um atendimento que faz você voltar sempre."
          />

          <div className="mt-8 space-y-5">
            {DIFFERENTIALS.map((d) => {
              const Icon = d.icon;
              return (
                <div key={d.title} className="flex gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-kawasaki-500/10 text-kawasaki-400">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-white">{d.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                      {d.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-300">
            {["Sem fila de espera", "Pagamento facilitado", "Garantia de satisfação"].map(
              (item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckIcon className="h-4 w-4 text-kawasaki-500" />
                  {item}
                </li>
              ),
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
