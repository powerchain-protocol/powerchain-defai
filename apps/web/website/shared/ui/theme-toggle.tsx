"use client";

import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const saved = window.localStorage.getItem("powerchain-web-theme") as Theme | null;
    const resolved: Theme = saved === "dark" ? "dark" : "light";
    setTheme(resolved);
    document.documentElement.classList.toggle("dark", resolved === "dark");
  }, []);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem("powerchain-web-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  return <button type="button" onClick={toggleTheme} className="web-icon-button" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>{theme === "dark" ? <SunIcon /> : <MoonIcon />}</button>;
}
