export type SiteSettings = {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  phone: string;
  phoneDisplay: string;
  email: string;
  address: string;
  hours: { day: string; time: string }[];
  mapsEmbed: string;
  mapsDirections: string;
  instagram: string;
  facebook: string;
};

export const SITE_DEFAULTS: SiteSettings = {
  name: "Superman Lava a Jato",
  shortName: "Superman",
  tagline: "Seu carro merece um tratamento de herói.",
  description:
    "Lava a jato premium com força, rapidez e qualidade de herói. Lavagem simples, completa, enceramento e detalhamento. Agende pelo WhatsApp.",
  phone: "5562981891074",
  phoneDisplay: "(62) 98189-1074",
  email: "supermanlavajato@gmail.com",
  address: "R. José Neto Paranhos, 633 — Jundiaí, Anápolis - GO",
  hours: [
    { day: "Segunda a Sexta", time: "08:00 — 18:00" },
    { day: "Sábado", time: "08:00 — 17:00" },
    { day: "Domingo", time: "Fechado" },
  ],
  mapsEmbed:
    "https://www.google.com/maps?q=R.+José+Neto+Paranhos,+633,+Jundiaí,+Anápolis,+GO&output=embed",
  mapsDirections:
    "https://www.google.com/maps/dir/?api=1&destination=R.+José+Neto+Paranhos,+633,+Anápolis,+GO",
  instagram: "https://instagram.com/supermanlavajato",
  facebook: "https://facebook.com/supermanlavajato",
};

export async function fetchSiteSettings(): Promise<SiteSettings> {
  const base =
    process.env.API_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3001";
  try {
    const res = await fetch(`${base}/settings/company_info`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return SITE_DEFAULTS;
    const data = await res.json();
    if (!data.value) return SITE_DEFAULTS;
    return { ...SITE_DEFAULTS, ...JSON.parse(data.value) };
  } catch {
    return SITE_DEFAULTS;
  }
}

export function whatsappLink(phone: string, message?: string) {
  const msg =
    message ??
    "Olá! Gostaria de agendar uma lavagem no Superman Lava a Jato. 🦸";
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}
