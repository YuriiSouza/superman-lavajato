// Placa do veículo no estilo Mercosul: é como a equipe identifica cada carro
// no pátio, então aparece como uma plaquinha em todas as listas de OS.
export function Plate({
  plate,
  className = "",
}: {
  plate?: string | null;
  className?: string;
}) {
  if (!plate) return null;
  return (
    <span
      className={`inline-flex shrink-0 flex-col overflow-hidden rounded-[3px] border border-gray-400 bg-white align-middle leading-none text-ink-950 dark:border-gray-500 ${className}`}
      title={`Placa ${plate}`}
    >
      {/* faixa azul da placa Mercosul */}
      <span aria-hidden className="h-[3px] bg-agua-700" />
      <span className="px-1.5 pb-[2px] pt-[3px] font-display text-[13px] font-semibold uppercase tracking-[0.06em]">
        {plate}
      </span>
    </span>
  );
}
