// =====================================================================
//  Configuração central do site — altere aqui os dados do negócio.
// =====================================================================

// ⚠️ TROQUE pelo número real do WhatsApp (formato internacional, só dígitos):
//    55 = Brasil, 11 = DDR, restante = número.
export const WHATSAPP_NUMBER = "5511999999999";

// Mensagem padrão pré-preenchida ao abrir o WhatsApp.
export const WHATSAPP_DEFAULT_MESSAGE =
  "Olá! Gostaria de agendar uma lavagem no Superman Lava a Jato. 🦸";

/** Monta o link wa.me com mensagem opcional. */
export function whatsappLink(message: string = WHATSAPP_DEFAULT_MESSAGE) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const SITE = {
  name: "Superman Lava a Jato",
  shortName: "Superman",
  tagline: "Seu carro merece um tratamento de herói.",
  description:
    "Lava a jato premium com força, rapidez e qualidade de herói. Lavagem simples, completa, enceramento e detalhamento. Agende pelo WhatsApp.",
  phoneDisplay: "(11) 99999-9999",
  email: "contato@supermanlavajato.com.br",
  address: "Av. Exemplo, 1234 — Centro, São Paulo - SP",
  hours: [
    { day: "Segunda a Sexta", time: "08:00 — 18:00" },
    { day: "Sábado", time: "08:00 — 16:00" },
    { day: "Domingo", time: "Fechado" },
  ],
  // Link/embed do Google Maps — troque pela localização real.
  mapsEmbed:
    "https://www.google.com/maps?q=Avenida+Paulista,+São+Paulo&output=embed",
  mapsDirections:
    "https://www.google.com/maps/dir/?api=1&destination=Avenida+Paulista+São+Paulo",
  social: {
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
  },
} as const;
