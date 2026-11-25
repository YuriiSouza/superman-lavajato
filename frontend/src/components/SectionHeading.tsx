import type { ReactNode } from "react";

// Título de seção do site: a própria tipografia condensada carrega a marca,
// sem etiqueta em maiúsculas por cima.
export function SectionHeading({
  title,
  description,
  center = false,
}: {
  title: ReactNode;
  description?: string;
  center?: boolean;
}) {
  return (
    <div className={`max-w-2xl ${center ? "mx-auto text-center" : ""}`}>
      <h2 className="font-display text-4xl font-semibold leading-[1.05] text-white sm:text-5xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base leading-relaxed text-zinc-400">
          {description}
        </p>
      )}
    </div>
  );
}
