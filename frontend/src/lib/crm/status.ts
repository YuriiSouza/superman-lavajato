// Status da ordem de serviço — fonte única para rótulos e cores.
//
// As cores formam uma sequência que conta a história do carro no pátio:
// Aguardando (neutro) → Em andamento (água: está sendo lavado) →
// Concluído (verde claro: pronto) → Pago (verde da marca, preenchido: fechado).
// Cancelado sai da sequência (vermelho discreto, riscado).

export const ORDER_STATUSES = [
  "PENDENTE",
  "EM_ANDAMENTO",
  "CONCLUIDO",
  "PAGO",
  "CANCELADO",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDENTE: "Aguardando",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
  PAGO: "Pago",
  CANCELADO: "Cancelado",
};

export const ORDER_STATUS_STYLE: Record<string, string> = {
  PENDENTE:
    "bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-600",
  EM_ANDAMENTO:
    "bg-agua-100 text-agua-800 dark:bg-agua-900/70 dark:text-agua-200",
  CONCLUIDO:
    "bg-kawasaki-100 text-kawasaki-800 dark:bg-kawasaki-900/60 dark:text-kawasaki-300",
  PAGO: "bg-kawasaki-500 text-ink-950",
  CANCELADO:
    "bg-red-50 text-red-700 line-through decoration-red-400/70 dark:bg-red-950/40 dark:text-red-300",
};
