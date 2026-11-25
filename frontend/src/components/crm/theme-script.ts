// Roda de forma síncrona no HTML, antes da primeira pintura, para que a
// classe `dark` já esteja no <html> quando a página aparecer (sem flash branco).
// Mantém a mesma regra do ThemeProvider: preferência salva em "crm-theme",
// senão a preferência do sistema operacional.
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("crm-theme");if(!t)t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.classList.toggle("dark",t==="dark")}catch(e){}})()`;
