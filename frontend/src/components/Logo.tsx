import Link from "next/link";

/** Marca do Superman Lava a Jato — escudo estilizado + wordmark. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Superman Lava a Jato — página inicial"
      className={`group inline-flex items-center gap-2.5 ${className}`}
    >
      <span className="relative grid h-10 w-9 place-items-center">
        <svg viewBox="0 0 40 44" className="h-full w-full" aria-hidden>
          <path
            d="M20 1 38 7v15c0 11-8 18.5-18 21C10 40.5 2 33 2 22V7L20 1Z"
            className="fill-ink-800 stroke-kawasaki-500"
            strokeWidth="2"
          />
          <path
            d="M13 16h14l-5 4 4 0-9 9 3-7-4 0 6-6Z"
            className="fill-kawasaki-500"
          />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-base font-extrabold tracking-tight text-white">
          SUPERMAN
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-kawasaki-500">
          Lava a Jato
        </span>
      </span>
    </Link>
  );
}
