import { whatsappLink } from "@/lib/site";
import { WhatsAppIcon } from "./icons";

/** Botão flutuante fixo de WhatsApp — visível em todas as páginas. */
export function WhatsAppButton() {
  return (
    <a
      href={whatsappLink()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Agendar pelo WhatsApp"
      className="animate-pulse-ring fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/40 transition-transform duration-200 hover:scale-110 focus-visible:scale-110 sm:h-16 sm:w-16"
    >
      <WhatsAppIcon className="h-7 w-7 sm:h-8 sm:w-8" />
      <span className="sr-only">Conversar no WhatsApp</span>
    </a>
  );
}
