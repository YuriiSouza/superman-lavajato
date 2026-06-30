import Link from "next/link";
import Image from "next/image";

/** Marca do Superman Lava a Jato. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Superman Lava a Jato — página inicial"
      className={`group inline-flex items-center ${className}`}
    >
      <span className="flex items-center">
        <Image
          src="/logo.png"
          alt="Superman Estética Automotiva e Lava-Jato"
          width={440}
          height={160}
          className="h-14 w-auto object-contain lg:h-20"
          priority
        />
      </span>
    </Link>
  );
}
