export type Service = {
  slug: string;
  name: string;
  tagline: string;
  price: string;
  duration: string;
  highlight?: boolean;
  features: string[];
};

export const SERVICES: Service[] = [
  {
    slug: "simples",
    name: "Lavagem Simples",
    tagline: "O básico bem-feito, na velocidade de um herói.",
    price: "R$ 40",
    duration: "~30 min",
    features: [
      "Lavagem externa completa",
      "Limpeza de rodas e pneus",
      "Secagem com microfibra",
      "Aromatizante de cortesia",
    ],
  },
  {
    slug: "completa",
    name: "Lavagem Completa",
    tagline: "Interna e externa para um carro impecável.",
    price: "R$ 80",
    duration: "~1h",
    highlight: true,
    features: [
      "Tudo da Lavagem Simples",
      "Aspiração interna completa",
      "Limpeza de painel e plásticos",
      "Pretinho nos pneus",
      "Limpeza dos vidros por dentro e fora",
    ],
  },
  {
    slug: "enceramento",
    name: "Enceramento Premium",
    tagline: "Brilho de showroom e proteção da pintura.",
    price: "R$ 140",
    duration: "~1h30",
    features: [
      "Tudo da Lavagem Completa",
      "Enceramento com cera de carnaúba",
      "Proteção e brilho prolongado",
      "Realce da cor da pintura",
    ],
  },
  {
    slug: "detalhamento",
    name: "Detalhamento Herói",
    tagline: "O tratamento definitivo, dos detalhes ao brilho.",
    price: "R$ 280",
    duration: "~3h",
    features: [
      "Tudo do Enceramento Premium",
      "Descontaminação da pintura",
      "Hidratação de couro / bancos",
      "Higienização interna profunda",
      "Vitrificação dos vidros",
    ],
  },
];

export const ADDONS = [
  { name: "Higienização de bancos", price: "R$ 60" },
  { name: "Hidratação de couro", price: "R$ 50" },
  { name: "Polimento técnico", price: "R$ 180" },
  { name: "Vitrificação de pintura", price: "Sob orçamento" },
  { name: "Limpeza de motor", price: "R$ 70" },
  { name: "Cristalização de para-brisa", price: "R$ 45" },
];
