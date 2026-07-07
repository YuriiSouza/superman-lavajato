export type Service = {
  id: string;
  name: string;
  description: string | null;
  price: string | number;
  duration: number;
  features: string[];
  highlight: boolean;
  active: boolean;
};

export async function fetchPublicServices(): Promise<Service[]> {
  const base =
    process.env.API_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3001";
  const res = await fetch(`${base}/services?activeOnly=true`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return [];
  return res.json();
}

export const ADDONS = [
  { name: "Higienização de bancos", price: "R$ 60" },
  { name: "Hidratação de couro", price: "R$ 50" },
  { name: "Polimento técnico", price: "R$ 180" },
  { name: "Vitrificação de pintura", price: "Sob orçamento" },
  { name: "Limpeza de motor", price: "R$ 70" },
  { name: "Cristalização de para-brisa", price: "R$ 45" },
];
