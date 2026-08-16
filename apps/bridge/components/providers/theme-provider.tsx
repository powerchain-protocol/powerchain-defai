"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type PowerChainTheme = "light" | "dark";

type ThemeContextValue = {
  theme: PowerChainTheme;
  setTheme: (theme: PowerChainTheme) => void;
  toggleTheme: () => void;
};

const STORAGE_KEY = "powerchain.bridge.theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: PowerChainTheme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#050807" : "#eef1ef");
}

function persistedTheme(): PowerChainTheme | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<PowerChainTheme>("light");

  useEffect(() => {
    const current = persistedTheme() ?? (document.documentElement.classList.contains("dark") ? "dark" : "light");
    setThemeState(current);
    applyTheme(current);

    const syncTheme = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || (event.newValue !== "light" && event.newValue !== "dark")) return;
      setThemeState(event.newValue);
      applyTheme(event.newValue);
    };
    window.addEventListener("storage", syncTheme);
    return () => window.removeEventListener("storage", syncTheme);
  }, []);

  const setTheme = useCallback((next: PowerChainTheme) => {
    setThemeState(next);
    applyTheme(next);
    try { window.localStorage.setItem(STORAGE_KEY, next); } catch { /* storage can be unavailable */ }
  }, []);

  const toggleTheme = useCallback(() => setTheme(theme === "dark" ? "light" : "dark"), [setTheme, theme]);
  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function usePowerChainTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("usePowerChainTheme must be used within ThemeProvider");
  return value;
}
