"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { resolveTheme, THEME_STORAGE_KEY, type Theme } from "./theme-script";

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "light",
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    // No F5 o script do <head> já aplicou a classe antes da pintura. Ao entrar
    // no CRM por navegação no cliente (ex.: vindo do /login) o script não roda,
    // então aplicamos aqui também.
    const initial = resolveTheme();
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const toggle = () => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      document.documentElement.classList.toggle("dark", next === "dark");
      localStorage.setItem(THEME_STORAGE_KEY, next);
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
