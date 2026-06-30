import Link from "next/link";
import { SectionHeading } from "./SectionHeading";
import { ArrowRightIcon, CheckIcon, BoltIcon } from "./icons";
import { fetchPublicServices } from "@/lib/services";

function formatPrice(price: string | number): string {
  const n = Number(price);
  return `a partir de R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;
}

export async function ServicesPreview() {
  const services = await fetchPublicServices();

  return (
    <section id="servicos" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Nossos serviços"
          title="Pacotes para cada missão"
          description="Do banho rápido ao detalhamento completo, escolha o nível de cuidado que o seu carro merece."
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((item) => (
            <article
              key={item.id}
              className={`group relative flex flex-col rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 ${
                item.highlight
                  ? "border-kawasaki-500/50 bg-kawasaki-500/5"
                  : "border-white/10 bg-ink-900 hover:border-kawasaki-500/40"
              }`}
            >
              {item.highlight && (
                <span className="absolute right-4 top-4 rounded-full bg-kawasaki-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ink-950">
                  Popular
                </span>
              )}
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-kawasaki-500/10 text-kawasaki-400 transition-colors group-hover:bg-kawasaki-500 group-hover:text-ink-950">
                <BoltIcon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-white">
                {item.name}
              </h3>
              {item.description && (
                <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">
                  {item.description}
                </p>
              )}
              <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-kawasaki-400">
                <CheckIcon className="h-4 w-4" />
                {formatPrice(item.price)}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/servicos"
            className="inline-flex items-center gap-2 rounded-full border border-kawasaki-500 px-7 py-3 text-base font-semibold text-kawasaki-400 transition-colors hover:bg-kawasaki-500 hover:text-ink-950"
          >
            Ver todos os preços e pacotes
            <ArrowRightIcon className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
