export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "crm-theme";

// Preferência salva em "crm-theme"; senão, a preferência do sistema operacional.
export function resolveTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {}
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

// Roda de forma síncrona no <head> do layout raiz, antes da primeira pintura,
// para que a classe `dark` já esteja no <html> quando a página aparecer
// (sem flash branco no F5). Só vale para a área do CRM (/admin).
export const THEME_INIT_SCRIPT = `(function(){try{if(!location.pathname.startsWith("/admin"))return;var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.classList.toggle("dark",t==="dark")}catch(e){}})()`;
