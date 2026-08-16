"use client";

import { usePowerChainTheme } from "@/components/providers/theme-provider";

function SunIcon() {
  return <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="3.5"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/></svg>;
}
function MoonIcon() {
  return <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/></svg>;
}

export function ThemeToggle() {
  const { theme, toggleTheme } = usePowerChainTheme();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button type="button" onClick={toggleTheme} className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-[#9eafa7] hover:text-[#264b3b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-[#35584a]/40 dark:hover:bg-[#29483c]/20 dark:hover:text-[#d9e3de]" aria-label={`Switch to ${next} theme`} title={`Switch to ${next} theme`}>
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
